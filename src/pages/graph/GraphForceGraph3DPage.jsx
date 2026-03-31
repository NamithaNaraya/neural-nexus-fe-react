import React, { useEffect, useMemo, useRef, useState } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';
import { ChevronLeft, Link2, Loader2, PanelRightOpen, RotateCcw, Type, Waypoints } from 'lucide-react';
import { graphService } from '../../services/graphService';
import { getNodeTypeColor, getRelationshipTypeColor, withAlpha } from './colorSystem';
import { Button } from '../../components/ui/Button';
import { GraphNodeCrudModal } from '../../components/crud';
import { capGraphData } from './graphDisplayData';
import { GraphFocusDrawer } from './GraphFocusDrawer';
import { buildNodeFocusGraph, buildRelationshipFocusGraph } from './graphFocusUtils';

export default function GraphForceGraph3DPage({
  folderId,
  graphData = null,
  nodeTypeFilters,
  relationshipTypeFilters,
  nodeTypeColors,
  relationshipTypeColors,
  minDegree,
  showOrphans,
  nodeSearch,
  searchResultIds = null,
  displayGraphData = null,
  traversalModeActive = false,
  onTraversalToggle = null,
  onTraversalNodeClick = null,
  onTraversalBack = null,
  onTraversalReset = null,
  traversalPath = [],
  showNodeLabels = false,
  showRelationshipLabels = false,
  onToggleNodeLabels = null,
  onToggleRelationshipLabels = null,
  onStatsChange,
  addNodeSignal,
  graphDataOverride = null,
  disableRemoteLoad = false,
  _traversalMode = false,
  _onNodeClick = null,
}) {
  const [fullGraphData, setFullGraphData] = useState({ nodes: [], links: [] });
  const [focusedGraphData, setFocusedGraphData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [focusLoading, setFocusLoading] = useState(false);
  const [error, setError] = useState(null);
  const [crudOpen, setCrudOpen] = useState(false);
  const [crudMode, setCrudMode] = useState('create');
  const [activeNode, setActiveNode] = useState(null);
  const [focusType, setFocusType] = useState('');
  const [focusLabel, setFocusLabel] = useState('');
  const [activeRelationship, setActiveRelationship] = useState(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const forceRefreshRef = useRef(false);
  const graphRef = useRef(null);

  useEffect(() => {
    setFocusedGraphData(null);
    setFocusType('');
    setFocusLabel('');
    setActiveNode(null);
    setActiveRelationship(null);
    setInspectorOpen(false);
  }, [folderId]);

  useEffect(() => {
    const handleCrud = () => {
      forceRefreshRef.current = true;
      setRefreshToken((value) => value + 1);
    };

    window.addEventListener('nnv2:graph-crud', handleCrud);
    async function loadGraph() {
      if (graphData || disableRemoteLoad) {
        setLoading(false);
        setError(null);
        setFullGraphData(graphData || graphDataOverride || { nodes: [], links: [] });
        setFocusedGraphData(null);
        forceRefreshRef.current = false;
        return;
      }

      if (!folderId) {
        setFullGraphData({ nodes: [], links: [] });
        setFocusedGraphData(null);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const data = await graphService.getFolder(folderId, 10000, { force: forceRefreshRef.current });
        setFullGraphData(data);
        if (focusType === 'node' && activeNode?.id) {
          setFocusLoading(true);
          try {
            const expanded = await graphService.expandNode(activeNode.id, { force: forceRefreshRef.current });
            setFocusedGraphData(buildNodeFocusGraph(data, expanded, activeNode));
          } catch (focusError) {
            console.error('Failed to restore focused node:', focusError);
            setFocusedGraphData(buildNodeFocusGraph(data, { nodes: [activeNode], links: [] }, activeNode));
          } finally {
            setFocusLoading(false);
          }
        } else if (focusType === 'relationship' && activeRelationship) {
          setFocusedGraphData(buildRelationshipFocusGraph(data, activeRelationship));
        } else {
          setFocusedGraphData(null);
        }

        setTimeout(() => {
          graphRef.current?.zoomToFit(460, 220);
        }, 220);
      } catch (err) {
        console.error(err);
        setError('Failed to load graph data.');
      } finally {
        forceRefreshRef.current = false;
        setLoading(false);
      }
    }

    loadGraph();
    return () => window.removeEventListener('nnv2:graph-crud', handleCrud);
  }, [folderId, refreshToken, graphData, graphDataOverride, disableRemoteLoad]);

  useEffect(() => {
    if (!addNodeSignal) return;
    setCrudMode('create');
    setActiveNode(null);
    setCrudOpen(true);
    setInspectorOpen(false);
  }, [addNodeSignal]);

  const graphState = focusedGraphData || fullGraphData;
  const activeGraphData = traversalModeActive
    ? displayGraphData || graphData || graphDataOverride || fullGraphData
    : graphState;

  const nodeTypes = useMemo(
    () => [...new Set(activeGraphData.nodes.map((node) => node.type || 'Unknown'))].sort(),
    [activeGraphData.nodes]
  );

  const relationshipTypes = useMemo(
    () => [...new Set(activeGraphData.links.map((link) => link.type || 'Unknown'))].sort(),
    [activeGraphData.links]
  );

  const filteredGraph = useMemo(() => {
    const selectedNodeTypes = nodeTypeFilters.size ? nodeTypeFilters : new Set(nodeTypes);

    const nodes = activeGraphData.nodes.filter((node) => {
      const type = node.type || 'Unknown';
      if (!selectedNodeTypes.has(type)) return false;
      if (!showOrphans && (node.degree ?? 0) === 0) return false;
      if ((node.degree ?? 0) < minDegree) return false;
      if (nodeSearch.trim()) {
        const query = nodeSearch.trim().toLowerCase();
        const inServerResults = searchResultIds instanceof Set && searchResultIds.size > 0
          ? searchResultIds.has(String(node.id))
          : null;
        if (inServerResults !== null) return inServerResults;
        if (!(node.name || '').toLowerCase().includes(query)) return false;
      }
      return true;
    });

    const nodeIds = new Set(nodes.map((node) => node.id));
    const selectedRelTypes = relationshipTypeFilters.size ? relationshipTypeFilters : new Set(relationshipTypes);

    const links = activeGraphData.links
      .filter((link) => {
        const type = link.type || 'Unknown';
        const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
        const targetId = typeof link.target === 'object' ? link.target.id : link.target;

        if (!selectedRelTypes.has(type)) return false;
        if (!nodeIds.has(sourceId) || !nodeIds.has(targetId)) return false;
        return true;
      })
      .map((link) => ({
        ...link,
        color: getRelationshipTypeColor(link.type || 'Unknown', relationshipTypeColors),
      }));

    const enrichedNodes = nodes.map((node) => ({
      ...node,
      color: getNodeTypeColor(node.type || 'Unknown', nodeTypeColors),
    }));

    return { nodes: enrichedNodes, links };
  }, [
    activeGraphData,
    nodeTypes,
    relationshipTypes,
    nodeTypeFilters,
    relationshipTypeFilters,
    nodeTypeColors,
    relationshipTypeColors,
    minDegree,
    showOrphans,
    nodeSearch,
    searchResultIds,
  ]);

  const renderedGraph = useMemo(() => capGraphData(filteredGraph, 5000), [filteredGraph]);
  useEffect(() => {
    onStatsChange?.({
      nodes: filteredGraph.nodes.length,
      links: filteredGraph.links.length,
    });
  }, [filteredGraph.nodes.length, filteredGraph.links.length, onStatsChange]);

  const openNodeEditor = () => {
    if (!activeNode) return;
    setCrudMode('edit');
    setCrudOpen(true);
  };

  const handleNodeClick = async (node) => {
    if (traversalModeActive && onTraversalNodeClick) {
      onTraversalNodeClick(node);
      setActiveNode(node);
      setActiveRelationship(null);
      setFocusType('node');
      setFocusLabel(node.name || node.id);
      setInspectorOpen(true);
      setCrudOpen(false);
      return;
    }

    setActiveNode(node);
    setActiveRelationship(null);
    setFocusType('node');
    setFocusLabel(node.name || node.id);
    setInspectorOpen(true);
    setCrudOpen(false);
    setFocusLoading(true);
    try {
      const expanded = await graphService.expandNode(node.id, { force: true });
      setFocusedGraphData(buildNodeFocusGraph(fullGraphData, expanded, node));
      setTimeout(() => graphRef.current?.zoomToFit(460, 220), 80);
    } catch (err) {
      console.error('Failed to focus node:', err);
      setFocusedGraphData(buildNodeFocusGraph(fullGraphData, { nodes: [node], links: [] }, node));
    } finally {
      setFocusLoading(false);
    }
  };

  const handleRelationshipClick = (link) => {
    setActiveRelationship(link);
    setActiveNode(null);
    setFocusType('relationship');
    setFocusLabel(`${link.type || 'Relationship'} ${link.source?.name || link.source || ''} -> ${link.target?.name || link.target || ''}`);
    setInspectorOpen(true);
    setCrudOpen(false);
    setFocusedGraphData(buildRelationshipFocusGraph(fullGraphData, link));
    setTimeout(() => graphRef.current?.zoomToFit(460, 220), 80);
  };

  const clearFocus = () => {
    setFocusedGraphData(null);
    setFocusType('');
    setFocusLabel('');
    setActiveNode(null);
    setActiveRelationship(null);
    setInspectorOpen(false);
  };

  const createTextSprite = (text, color = '#0f172a', backgroundColor = 'rgba(255,255,255,0.9)') => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return null;

    const fontSize = 48;
    context.font = `bold ${fontSize}px Inter, ui-sans-serif, system-ui, sans-serif`;
    const paddingX = 24;
    const paddingY = 16;
    const metrics = context.measureText(text);
    canvas.width = Math.ceil(metrics.width + paddingX * 2);
    canvas.height = Math.ceil(fontSize + paddingY * 2);

    context.font = `bold ${fontSize}px Inter, ui-sans-serif, system-ui, sans-serif`;
    context.fillStyle = backgroundColor;
    context.strokeStyle = 'rgba(148, 163, 184, 0.45)';
    context.lineWidth = 4;
    context.beginPath();
    context.roundRect(2, 2, canvas.width - 4, canvas.height - 4, 18);
    context.fill();
    context.stroke();
    context.fillStyle = color;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, canvas.width / 2, canvas.height / 2 + 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
    const sprite = new THREE.Sprite(material);
    const scale = Math.max(18, text.length * 1.6);
    sprite.scale.set(canvas.width / 28, canvas.height / 28, 1);
    sprite.userData = { texture, canvas };
    sprite.center.set(0.5, 0.5);
    sprite.scale.multiplyScalar(scale / 18);
    return sprite;
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-[26px] bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.1),transparent_22%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.08),transparent_20%),linear-gradient(180deg,#f8fbff,#eef3f9)] dark:bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.12),transparent_22%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.1),transparent_20%),linear-gradient(180deg,#0f172a,#111827)]">
      <div className="flex items-center justify-between gap-3 border-b border-border/50 px-6 py-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold">3D Graph</h2>
          <p className="text-xs text-muted-foreground">Click a node to inspect it on the right, or a relationship to focus the link.</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {onTraversalToggle ? (
            <Button
              variant={traversalModeActive ? 'outline' : 'ghost'}
              size="sm"
              className="gap-2 rounded-full"
              type="button"
              onClick={onTraversalToggle}
              aria-label="Toggle traversal mode"
              title="Traversal mode"
            >
              <Waypoints className="h-4 w-4" />
              Traversal
            </Button>
          ) : null}
          {traversalModeActive && onTraversalBack ? (
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 rounded-full"
              type="button"
              onClick={onTraversalBack}
              disabled={!traversalPath.length}
              title="Go back one step"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
          ) : null}
          {traversalModeActive && onTraversalReset ? (
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 rounded-full"
              type="button"
              onClick={onTraversalReset}
              disabled={!traversalPath.length}
              title="Reset traversal"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          ) : null}
          {onToggleNodeLabels ? (
            <Button
              variant={showNodeLabels ? 'outline' : 'ghost'}
              size="sm"
              className="gap-2 rounded-full"
              type="button"
              onClick={onToggleNodeLabels}
              aria-label="Toggle node labels"
              title="Show node names"
            >
              <Type className="h-4 w-4" />
              Names
            </Button>
          ) : null}
          {onToggleRelationshipLabels ? (
            <Button
              variant={showRelationshipLabels ? 'outline' : 'ghost'}
              size="sm"
              className="gap-2 rounded-full"
              type="button"
              onClick={onToggleRelationshipLabels}
              aria-label="Toggle relationship labels"
              title="Show relationship names"
            >
              <Link2 className="h-4 w-4" />
              Relations
            </Button>
          ) : null}
          <Button
            variant={inspectorOpen ? 'outline' : 'ghost'}
            size="sm"
            className="gap-2 rounded-full"
            type="button"
            onClick={() => setInspectorOpen((value) => !value)}
            disabled={!focusLabel}
          >
            {inspectorOpen ? <PanelRightOpen className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            {inspectorOpen ? 'Hide details' : 'Show details'}
          </Button>
        </div>
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div className="absolute inset-0">
          {loading || focusLoading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">{focusLoading ? 'Loading neighborhood...' : 'Loading 3D graph...'}</span>
            </div>
          ) : error ? (
            <div className="flex h-full items-center justify-center text-red-500">{error}</div>
          ) : (
            <div className="absolute inset-0">
              <ForceGraph3D
                ref={graphRef}
                graphData={renderedGraph}
                backgroundColor="rgba(0,0,0,0)"
                nodeColor={(node) => node.color}
                nodeOpacity={0.95}
                nodeVal={(node) => Math.max(2, Number(node.size || node.degree || 1) * 1.6)}
                nodeResolution={10}
                nodeLabel={(node) => `${node.name || node.id}${node.type ? ` (${node.type})` : ''}`}
                nodeThreeObject={(node) => {
                  if (!showNodeLabels) return undefined;
                  const sprite = createTextSprite(node.name || node.id, '#0f172a', 'rgba(255,255,255,0.92)');
                  if (sprite) {
                    sprite.scale.setScalar(Math.max(4, Number(node.size || node.degree || 1) * 0.25));
                  }
                  return sprite || undefined;
                }}
                nodeThreeObjectExtend={showNodeLabels}
                linkColor={(link) => withAlpha(link.color || '#94A3B8', '88')}
                linkOpacity={0.32}
                linkWidth={(link) => (link.type ? 1.2 : 0.8)}
                linkDirectionalParticles={1}
                linkDirectionalParticleColor={(link) => link.color}
                linkDirectionalParticleWidth={2}
                linkDirectionalParticleSpeed={0.0045}
                linkThreeObject={(link) => {
                  if (!showRelationshipLabels) return undefined;
                  const sprite = createTextSprite(link.type || '', '#334155', 'rgba(255,255,255,0.78)');
                  return sprite || undefined;
                }}
                linkThreeObjectExtend={showRelationshipLabels}
                linkPositionUpdate={(sprite, { start, end }) => {
                  if (!sprite || !start || !end) return;
                  sprite.position.set(
                    start.x + (end.x - start.x) * 0.5,
                    start.y + (end.y - start.y) * 0.5,
                    start.z + (end.z - start.z) * 0.5
                  );
                }}
                onNodeClick={handleNodeClick}
                onLinkClick={handleRelationshipClick}
                width={undefined}
                height={undefined}
              />
            </div>
          )}
        </div>

        {!_traversalMode && (
          <GraphFocusDrawer
            open={inspectorOpen && Boolean(focusLabel || activeNode || activeRelationship)}
            folderId={folderId}
            focusLabel={focusLabel}
            focusType={focusType}
            focusLoading={focusLoading}
            activeNode={activeNode}
            activeRelationship={activeRelationship}
            links={focusType === 'node' ? (focusedGraphData?.links || renderedGraph.links) : []}
            onClose={() => setInspectorOpen(false)}
            onClear={clearFocus}
            onEdit={activeNode ? openNodeEditor : null}
            onSelectLink={(link) => {
              setActiveRelationship(link);
              setActiveNode(null);
              setFocusType('relationship');
              setFocusLabel(`${link.type || 'Relationship'} ${link.source?.name || link.source || ''} -> ${link.target?.name || link.target || ''}`);
              setFocusedGraphData(buildRelationshipFocusGraph(fullGraphData, link));
              setInspectorOpen(true);
            }}
          />
        )}
      </div>

      {!_traversalMode && (
        <GraphNodeCrudModal
          open={crudOpen}
          mode={crudMode}
          folderId={folderId}
          initialNode={activeNode}
          onClose={() => setCrudOpen(false)}
          onSuccess={() => setRefreshToken((value) => value + 1)}
        />
      )}
    </div>
  );
}
