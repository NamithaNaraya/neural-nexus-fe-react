import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { SlidersHorizontal } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import GraphForcePage from './graph/GraphForcePage';
import GraphForceGraph3DPage from './graph/GraphForceGraph3DPage';
import GraphPropertyTablePage from './graph/GraphPropertyTablePage';
import { GraphViewsNavigation } from './graph/GraphViewsNavigation';
import { GraphWorkspaceSidebar } from './graph/GraphWorkspaceSidebar';
import { knowledgeGraphSections } from './graph/graphViewSections';
import { filterGraphForTraversal, resetTraversal, traverseBack, traverseToNode } from './graph/graphTraversalUtils';
import { semanticSearchNodeIds } from './graph/semanticSearch';
import { graphService } from '../services/graphService';
import { useGlobalFolder } from '../contexts/GlobalFolderContext';

export default function GraphPage() {
  const { selectedFolderId: folderId } = useGlobalFolder();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [nodeSearch, setNodeSearch] = useState('');
  const [minDegree, setMinDegree] = useState(0);
  const [showOrphans, setShowOrphans] = useState(true);
  const [nodeTypeFilters, setNodeTypeFilters] = useState(new Set());
  const [relationshipTypeFilters, setRelationshipTypeFilters] = useState(new Set());
  const [nodeTypeColors, setNodeTypeColors] = useState({});
  const [relationshipTypeColors, setRelationshipTypeColors] = useState({});
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [refreshToken, setRefreshToken] = useState(0);
  const [graphStats, setGraphStats] = useState({ nodes: 0, links: 0 });
  const [addNodeSignal, setAddNodeSignal] = useState(0);
  const [traversalModeActive, setTraversalModeActive] = useState(false);
  const [traversalPath, setTraversalPath] = useState([]);
  const [traversalVisibleNodeIds, setTraversalVisibleNodeIds] = useState(new Set());
  const [traversalVisibleLinkIds, setTraversalVisibleLinkIds] = useState(new Set());
  const [showNodeLabels, setShowNodeLabels] = useState(false);
  const [showRelationshipLabels, setShowRelationshipLabels] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function loadGraphContext() {
      if (!folderId) {
        setGraphData({ nodes: [], links: [] });
        return;
      }

      try {
        const data = await graphService.getFolder(folderId, 10000);
        if (!ignore) setGraphData(data || { nodes: [], links: [] });
      } catch (error) {
        console.error('Failed to load graph context:', error);
        if (!ignore) setGraphData({ nodes: [], links: [] });
      }
    }

    const handleCrud = () => setRefreshToken((value) => value + 1);
    window.addEventListener('nnv2:graph-crud', handleCrud);
    loadGraphContext();

    return () => {
      ignore = true;
      window.removeEventListener('nnv2:graph-crud', handleCrud);
    };
  }, [folderId, refreshToken]);

  useEffect(() => {
    const result = resetTraversal();
    setTraversalModeActive(false);
    setTraversalPath(result.path);
    setTraversalVisibleNodeIds(result.visibleNodeIds);
    setTraversalVisibleLinkIds(result.visibleLinkIds);
  }, [folderId]);

  const nodeTypes = useMemo(
    () => [...new Set((graphData.nodes || []).map((node) => node.type || 'Unknown'))].sort(),
    [graphData.nodes]
  );

  const relationshipTypes = useMemo(
    () => [...new Set((graphData.links || []).map((link) => link.type || 'Unknown'))].sort(),
    [graphData.links]
  );

  const searchResultIds = useMemo(
    () => semanticSearchNodeIds(graphData.nodes || [], nodeSearch),
    [graphData.nodes, nodeSearch]
  );

  const traversalGraphData = useMemo(
    () => filterGraphForTraversal(graphData, traversalVisibleNodeIds, traversalVisibleLinkIds),
    [graphData, traversalVisibleNodeIds, traversalVisibleLinkIds]
  );

  const handleTraversalNodeClick = (node) => {
    const result = traverseToNode(traversalPath, node.id, graphData);
    setTraversalPath(result.path);
    setTraversalVisibleNodeIds(result.visibleNodeIds);
    setTraversalVisibleLinkIds(result.visibleLinkIds);
  };

  const handleTraversalBack = () => {
    const result = traverseBack(traversalPath, graphData);
    setTraversalPath(result.path);
    setTraversalVisibleNodeIds(result.visibleNodeIds);
    setTraversalVisibleLinkIds(result.visibleLinkIds);
  };

  const handleTraversalReset = () => {
    const result = resetTraversal();
    setTraversalPath(result.path);
    setTraversalVisibleNodeIds(result.visibleNodeIds);
    setTraversalVisibleLinkIds(result.visibleLinkIds);
  };

  const handleTraversalToggle = () => {
    setTraversalModeActive((value) => {
      const next = !value;
      const result = resetTraversal();
      setTraversalPath(result.path);
      setTraversalVisibleNodeIds(result.visibleNodeIds);
      setTraversalVisibleLinkIds(result.visibleLinkIds);
      return next;
    });
  };

  const sharedGraphProps = {
    folderId,
    graphData,
    nodeTypeFilters,
    relationshipTypeFilters,
    nodeTypeColors,
    relationshipTypeColors,
    minDegree,
    showOrphans,
    nodeSearch,
    searchResultIds,
    traversalModeActive,
    traversalPath,
    traversalGraphData,
    showNodeLabels,
    showRelationshipLabels,
    onTraversalToggle: handleTraversalToggle,
    onTraversalNodeClick: handleTraversalNodeClick,
    onTraversalBack: handleTraversalBack,
    onTraversalReset: handleTraversalReset,
    onToggleNodeLabels: () => setShowNodeLabels((value) => !value),
    onToggleRelationshipLabels: () => setShowRelationshipLabels((value) => !value),
    onStatsChange: setGraphStats,
    addNodeSignal,
  };

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden">
      <GraphWorkspaceSidebar
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        nodeSearch={nodeSearch}
        setNodeSearch={setNodeSearch}
        minDegree={minDegree}
        setMinDegree={setMinDegree}
        showOrphans={showOrphans}
        setShowOrphans={setShowOrphans}
        nodeTypes={nodeTypes}
        nodeTypeFilters={nodeTypeFilters}
        setNodeTypeFilters={setNodeTypeFilters}
        relationshipTypes={relationshipTypes}
        relationshipTypeFilters={relationshipTypeFilters}
        setRelationshipTypeFilters={setRelationshipTypeFilters}
        nodeTypeColors={nodeTypeColors}
        setNodeTypeColors={setNodeTypeColors}
        relationshipTypeColors={relationshipTypeColors}
        setRelationshipTypeColors={setRelationshipTypeColors}
      />

      <Card className="flex-shrink-0 rounded-b-none border-b-0 border-border/60 bg-card/70 shadow-lg shadow-slate-900/5 backdrop-blur-xl">
        <CardContent className="flex items-center justify-between gap-4 p-4">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 rounded-full border border-border/40 bg-background/70 px-3 text-xs"
              type="button"
              onClick={() => setFiltersOpen((value) => !value)}
              aria-label={filtersOpen ? 'Close filters' : 'Open filters'}
              title={filtersOpen ? 'Close filters' : 'Open filters'}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </Button>
            <GraphViewsNavigation sections={knowledgeGraphSections} basePath="/graph" />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAddNodeSignal((value) => value + 1)}
              className="rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-blue-500/20 transition hover:from-blue-600 hover:to-purple-700"
            >
              Add Node
            </button>
            <div className="hidden items-center gap-2 rounded-full border border-border/40 bg-background/60 px-3 py-1.5 text-xs text-muted-foreground md:flex">
              <span>{Number(graphStats.nodes || 0).toLocaleString()} nodes</span>
              <span className="text-border">•</span>
              <span>{Number(graphStats.links || 0).toLocaleString()} relationships</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="relative min-h-0 flex-1 overflow-hidden rounded-b-2xl border border-t-0 border-border/60 bg-card/50">
        <Routes>
          <Route path="" element={<Navigate to="2d" replace />} />
          <Route
            path="2d"
            element={
              <GraphForcePage
                {...sharedGraphProps}
                displayGraphData={traversalModeActive ? traversalGraphData : null}
              />
            }
          />
          <Route
            path="3d"
            element={
              <GraphForceGraph3DPage
                {...sharedGraphProps}
                displayGraphData={traversalModeActive ? traversalGraphData : null}
              />
            }
          />
          <Route path="table" element={<GraphPropertyTablePage {...sharedGraphProps} />} />
          <Route path="*" element={<Navigate to="2d" replace />} />
        </Routes>
      </div>
    </div>
  );
}
