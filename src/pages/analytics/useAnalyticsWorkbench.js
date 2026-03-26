import { useEffect, useMemo, useState } from 'react';
import { folderService } from '../../services/folderService';
import { graphService } from '../../services/graphService';
import { analyticsService } from '../../services/analyticsService';
import { weightsService } from '../../services/weightsService';
import { ALGORITHM_CATALOG } from './algorithmCatalog';

export function useAnalyticsWorkbench() {
  const [folders, setFolders] = useState([]);
  const [folderId, setFolderId] = useState('');
  const [folderNodes, setFolderNodes] = useState([]);
  const [graphStats, setGraphStats] = useState({ nodes: 0, links: 0 });
  const [nodeSearch, setNodeSearch] = useState('');
  const [scopeMode, setScopeMode] = useState('folder');
  const [selectedNodes, setSelectedNodes] = useState([]);
  const [selectedAlgorithmId, setSelectedAlgorithmId] = useState(ALGORITHM_CATALOG[0].id);
  const [topK, setTopK] = useState(15);
  const [loadingNodes, setLoadingNodes] = useState(true);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [relationshipProperties, setRelationshipProperties] = useState([]);
  const [weightingEnabled, setWeightingEnabled] = useState(false);
  const [weightFormulaType, setWeightFormulaType] = useState('property');
  const [weightProperty, setWeightProperty] = useState('');
  const [weightNumerator, setWeightNumerator] = useState('');
  const [weightDenominator, setWeightDenominator] = useState('');
  const [weightPrimaryProperty, setWeightPrimaryProperty] = useState('');
  const [weightSecondaryProperty, setWeightSecondaryProperty] = useState('');
  const [weightPrimaryCoefficient, setWeightPrimaryCoefficient] = useState(1);
  const [weightSecondaryCoefficient, setWeightSecondaryCoefficient] = useState(0.5);

  useEffect(() => {
    let ignore = false;

    async function loadFolders() {
      try {
        const data = await folderService.list();
        if (ignore) return;
        const items = Array.isArray(data) ? data : [];
        setFolders(items);
        if (items[0]?.id) setFolderId(String(items[0].id));
      } catch (err) {
        console.error('Failed to load folders:', err);
        if (!ignore) {
          setFolders([]);
          setLoadingNodes(false);
        }
      }
    }

    loadFolders();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadNodes() {
      if (!folderId) {
        setFolderNodes([]);
        setGraphStats({ nodes: 0, links: 0 });
        setRelationshipProperties([]);
        setSelectedNodes([]);
        setLoadingNodes(false);
        return;
      }

      setLoadingNodes(true);
      try {
        const [data, discoveredProperties] = await Promise.all([
          graphService.getFolder(folderId, 500),
          weightsService.discoverProperties(folderId),
        ]);
        if (ignore) return;
        const nodes = Array.isArray(data?.nodes) ? data.nodes : [];
        setFolderNodes(nodes);
        setGraphStats({
          nodes: Number(data?.total_nodes || nodes.length || 0),
          links: Number(data?.total_links || data?.links?.length || 0),
        });
        const relProps = Object.keys(discoveredProperties?.relationship_properties || {});
        setRelationshipProperties(relProps);
        setWeightProperty(relProps[0] || '');
        setWeightNumerator(relProps[0] || '');
        setWeightDenominator(relProps[1] || relProps[0] || '');
        setWeightPrimaryProperty(relProps[0] || '');
        setWeightSecondaryProperty(relProps[1] || relProps[0] || '');
        setSelectedNodes((current) => current.filter((id) => nodes.some((node) => node.id === id)));
      } catch (err) {
        console.error('Failed to load folder nodes:', err);
        if (!ignore) {
          setFolderNodes([]);
          setGraphStats({ nodes: 0, links: 0 });
          setRelationshipProperties([]);
          setSelectedNodes([]);
        }
      } finally {
        if (!ignore) setLoadingNodes(false);
      }
    }

    loadNodes();
    return () => {
      ignore = true;
    };
  }, [folderId]);

  const selectedAlgorithm = useMemo(
    () => ALGORITHM_CATALOG.find((item) => item.id === selectedAlgorithmId) || ALGORITHM_CATALOG[0],
    [selectedAlgorithmId]
  );

  useEffect(() => {
    setTopK(Number(selectedAlgorithm.defaults.top_k || 15));
  }, [selectedAlgorithm]);

  useEffect(() => {
    if (!selectedAlgorithm?.usesWeights) {
      setWeightingEnabled(false);
    }
  }, [selectedAlgorithm]);

  const filteredNodes = useMemo(() => {
    const term = nodeSearch.trim().toLowerCase();
    if (!term) return folderNodes.slice(0, 40);

    return folderNodes
      .filter((node) => JSON.stringify(node).toLowerCase().includes(term))
      .slice(0, 40);
  }, [folderNodes, nodeSearch]);

  const currentFolder = folders.find((folder) => String(folder.id) === String(folderId));

  const effectiveNodeIds = scopeMode === 'selection' && selectedNodes.length > 0
    ? selectedNodes
    : undefined;

  const weightFormula = useMemo(() => {
    if (!weightingEnabled || !selectedAlgorithm?.usesWeights) return null;

    if (weightFormulaType === 'property' && weightProperty) {
      return { type: 'property', property: weightProperty };
    }

    if (weightFormulaType === 'ratio' && weightNumerator && weightDenominator) {
      return {
        type: 'ratio',
        numerator: weightNumerator,
        denominator: weightDenominator,
        label: `${weightNumerator}/${weightDenominator}`,
      };
    }

    if (weightFormulaType === 'weighted_sum' && weightPrimaryProperty) {
      const terms = [
        { property: weightPrimaryProperty, coefficient: Number(weightPrimaryCoefficient) || 1 },
      ];

      if (weightSecondaryProperty) {
        terms.push({ property: weightSecondaryProperty, coefficient: Number(weightSecondaryCoefficient) || 0 });
      }

      return { type: 'weighted_sum', terms };
    }

    return null;
  }, [
    weightingEnabled,
    selectedAlgorithm,
    weightFormulaType,
    weightProperty,
    weightNumerator,
    weightDenominator,
    weightPrimaryProperty,
    weightSecondaryProperty,
    weightPrimaryCoefficient,
    weightSecondaryCoefficient,
  ]);

  async function runAlgorithm() {
    if (!selectedAlgorithm) return;

    setRunning(true);
    setError('');

    try {
      const params = {
        folder_id: folderId || undefined,
        node_ids: effectiveNodeIds,
        ...selectedAlgorithm.defaults,
      };

      if (selectedAlgorithm.defaults.top_k !== undefined) {
        params.top_k = topK;
      }

      if (weightFormula) {
        params.weight_formula = JSON.stringify(weightFormula);
      }

      const data = await analyticsService.runAlgorithm(selectedAlgorithm.endpoint, params);
      setResult(data);
    } catch (err) {
      console.error('Failed to run algorithm:', err);
      setResult(null);
      setError(err.response?.data?.detail || 'Algorithm run failed.');
    } finally {
      setRunning(false);
    }
  }

  function toggleNode(nodeId) {
    setSelectedNodes((current) => (
      current.includes(nodeId)
        ? current.filter((item) => item !== nodeId)
        : [...current, nodeId]
    ));
  }

  function clearSelection() {
    setSelectedNodes([]);
  }

  return {
    folders,
    folderId,
    setFolderId,
    currentFolder,
    folderNodes,
    graphStats,
    filteredNodes,
    nodeSearch,
    setNodeSearch,
    scopeMode,
    setScopeMode,
    selectedNodes,
    toggleNode,
    clearSelection,
    selectedAlgorithm,
    selectedAlgorithmId,
    setSelectedAlgorithmId,
    topK,
    setTopK,
    loadingNodes,
    running,
    result,
    error,
    runAlgorithm,
    relationshipProperties,
    weightingEnabled,
    setWeightingEnabled,
    weightFormulaType,
    setWeightFormulaType,
    weightProperty,
    setWeightProperty,
    weightNumerator,
    setWeightNumerator,
    weightDenominator,
    setWeightDenominator,
    weightPrimaryProperty,
    setWeightPrimaryProperty,
    weightSecondaryProperty,
    setWeightSecondaryProperty,
    weightPrimaryCoefficient,
    setWeightPrimaryCoefficient,
    weightSecondaryCoefficient,
    setWeightSecondaryCoefficient,
    weightFormula,
  };
}
