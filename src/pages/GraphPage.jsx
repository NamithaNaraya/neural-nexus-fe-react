import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Compass, MoveRight, Radar, SlidersHorizontal, Sparkles, Waypoints } from 'lucide-react';
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
import { GlobalGraphSearch } from './graph/tools/GlobalGraphSearch';
import { GraphToolbarControls } from './graph/tools/GraphToolbarControls';

export default function GraphPage() {
  const { selectedFolderId: folderId } = useGlobalFolder();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [activePanel, setActivePanel] = useState('filters');
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
  const [jumpRequest, setJumpRequest] = useState(null);
  const [pathLoading, setPathLoading] = useState(false);
  const [pathError, setPathError] = useState('');
  const [pathSummary, setPathSummary] = useState(null);
  const [highlightedNodeIds, setHighlightedNodeIds] = useState(new Set());
  const [highlightedLinkIds, setHighlightedLinkIds] = useState(new Set());
  const [resetPinnedSignal, setResetPinnedSignal] = useState(0);
  const [resetViewSignal, setResetViewSignal] = useState(0);
  const [lockDraggedNodes, setLockDraggedNodes] = useState(true);

  const toolOptions = useMemo(
    () => [
      { id: 'filters', label: 'Node Filter', icon: SlidersHorizontal },
      { id: 'traversal', label: 'Path Traversal', icon: Waypoints },
      { id: 'hop', label: 'Hop Finder', icon: Radar },
      { id: 'distance', label: 'Distance Finder', icon: MoveRight },
      { id: 'quality', label: 'Quality', icon: Sparkles },
    ],
    []
  );

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
    setPathSummary(null);
    setHighlightedNodeIds(new Set());
    setHighlightedLinkIds(new Set());
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

  const jumpResults = useMemo(() => {
    const normalized = nodeSearch.trim().toLowerCase();
    if (!normalized) return [];

    return (graphData.nodes || [])
      .filter((node) => {
        const haystack = `${node.name || ''} ${node.type || ''} ${node.description || ''}`.toLowerCase();
        return haystack.includes(normalized);
      })
      .slice(0, 8);
  }, [graphData.nodes, nodeSearch]);

  const activeFilterCount = nodeTypeFilters.size
    + relationshipTypeFilters.size
    + (minDegree > 0 ? 1 : 0)
    + (!showOrphans ? 1 : 0);

  const traversalGraphData = useMemo(
    () => filterGraphForTraversal(graphData, traversalVisibleNodeIds, traversalVisibleLinkIds),
    [graphData, traversalVisibleNodeIds, traversalVisibleLinkIds]
  );

  const traversalPathNodes = useMemo(
    () => traversalPath
      .map((nodeId) => (graphData.nodes || []).find((node) => String(node.id) === String(nodeId)))
      .filter(Boolean),
    [traversalPath, graphData.nodes]
  );

  const handleClearAllFilters = () => {
    setMinDegree(0);
    setShowOrphans(true);
    setNodeTypeFilters(new Set());
    setRelationshipTypeFilters(new Set());
  };

  const handleJumpToNode = (node) => {
    if (!node?.id) return;
    setJumpRequest({ nodeId: node.id, nonce: Date.now() });
  };

  const handleOpenToolPanel = (panel) => {
    setActivePanel(panel);
    setSidebarOpen(true);
  };

  const handleResetView = () => {
    const result = resetTraversal();
    setNodeSearch('');
    setMinDegree(0);
    setShowOrphans(true);
    setNodeTypeFilters(new Set());
    setRelationshipTypeFilters(new Set());
    setTraversalModeActive(false);
    setTraversalPath(result.path);
    setTraversalVisibleNodeIds(result.visibleNodeIds);
    setTraversalVisibleLinkIds(result.visibleLinkIds);
    setPathSummary(null);
    setPathError('');
    setHighlightedNodeIds(new Set());
    setHighlightedLinkIds(new Set());
    setSidebarOpen(false);
    setToolsOpen(false);
    setResetViewSignal((value) => value + 1);
  };

  const handleResetPins = () => {
    setResetPinnedSignal((value) => value + 1);
  };

  const handleFindPath = async (sourceNode, targetNode) => {
    if (!sourceNode?.id || !targetNode?.id) return;
    setPathLoading(true);
    setPathError('');
    try {
      const result = await graphService.findPath(sourceNode.id, targetNode.id);
      if (!result?.path_exists) {
        setPathSummary(null);
        setHighlightedNodeIds(new Set());
        setHighlightedLinkIds(new Set());
        setPathError('No path exists between those nodes in the current graph.');
        return;
      }

      setHighlightedNodeIds(new Set((result.node_ids || []).map(String)));
      setHighlightedLinkIds(new Set((result.link_ids || []).map(String)));
      setPathSummary({
        sourceId: sourceNode.id,
        sourceName: sourceNode.name || sourceNode.id,
        targetId: targetNode.id,
        targetName: targetNode.name || targetNode.id,
        length: Number(result.length || 0),
      });
      setJumpRequest({ nodeId: sourceNode.id, nonce: Date.now() });
    } catch (error) {
      console.error('Failed to find path:', error);
      setPathSummary(null);
      setHighlightedNodeIds(new Set());
      setHighlightedLinkIds(new Set());
      setPathError(error?.response?.data?.detail || error?.message || 'Path finding failed.');
    } finally {
      setPathLoading(false);
    }
  };

  const handleClearPath = () => {
    setPathSummary(null);
    setPathError('');
    setHighlightedNodeIds(new Set());
    setHighlightedLinkIds(new Set());
  };

  const handleOpenHopFinder = (node, depth, relationshipTypesForHop) => {
    if (!node?.id) return;
    setJumpRequest({
      nodeId: node.id,
      depth: depth || 1,
      relationshipTypes: relationshipTypesForHop || [],
      nonce: Date.now(),
    });
    setSidebarOpen(false);
  };

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
    jumpRequest,
    highlightedNodeIds,
    highlightedLinkIds,
    onTraversalToggle: handleTraversalToggle,
    onTraversalNodeClick: handleTraversalNodeClick,
    onTraversalBack: handleTraversalBack,
    onTraversalReset: handleTraversalReset,
    onToggleNodeLabels: () => setShowNodeLabels((value) => !value),
    onToggleRelationshipLabels: () => setShowRelationshipLabels((value) => !value),
    onJumpHandled: () => setJumpRequest(null),
    onStatsChange: setGraphStats,
    addNodeSignal,
    resetPinnedSignal,
    resetViewSignal,
    lockDraggedNodes,
  };

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden">
      <div className="relative z-20 mx-4 mt-1 flex-shrink-0 overflow-visible">
        <Card className="overflow-visible rounded-[26px] border border-border/60 bg-card/95 shadow-[0_12px_32px_rgba(15,23,42,0.08)]">
        <CardContent className="overflow-visible space-y-3 p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 text-xs text-slate-700"
                type="button"
                onClick={() => setToolsOpen((value) => !value)}
                aria-label={toolsOpen ? 'Close tools' : 'Open tools'}
                title={toolsOpen ? 'Close tools' : 'Open tools'}
              >
                <Compass className="h-4 w-4" />
                Tools
              </Button>
              <GraphViewsNavigation sections={knowledgeGraphSections} basePath="/graph" />
            </div>

            <div className="flex min-w-0 flex-1 items-center justify-end gap-2 overflow-visible">
              <GlobalGraphSearch
                value={nodeSearch}
                onChange={setNodeSearch}
                results={jumpResults}
                onClear={() => setNodeSearch('')}
                onJumpToNode={(node) => {
                  handleJumpToNode(node);
                  setNodeSearch('');
                }}
              />
              <button
                type="button"
                onClick={() => setAddNodeSignal((value) => value + 1)}
                className="rounded-full bg-gradient-to-r from-emerald-600 to-amber-700 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-emerald-500/20 transition hover:from-emerald-700 hover:to-amber-800"
              >
                Add Node
              </button>
              <div className="hidden items-center gap-2 rounded-full border border-border/40 bg-background/60 px-3 py-1.5 text-xs text-muted-foreground md:flex">
                <span>{Number(graphStats.nodes || 0).toLocaleString()} nodes</span>
                <span className="text-border">•</span>
                <span>{Number(graphStats.links || 0).toLocaleString()} relationships</span>
              </div>
            </div>
          </div>

          {toolsOpen ? (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-[22px] border border-border/60 bg-card/95 px-3 py-2 animate-in fade-in-0 slide-in-from-top-1 duration-200">
              <div className="flex flex-wrap items-center gap-2">
                {toolOptions.map((tool) => {
                  const Icon = tool.icon;
                  const active = activePanel === tool.id && sidebarOpen;
                  return (
                    <button
                      key={tool.id}
                      type="button"
                      onClick={() => handleOpenToolPanel(tool.id)}
                    className={[
                        'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition',
                        active
                          ? 'border-primary/35 bg-primary/10 text-primary shadow-sm'
                          : 'border-border/60 bg-card text-muted-foreground hover:bg-primary/5 hover:text-foreground',
                      ].join(' ')}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {tool.label}
                      {tool.id === 'filters' && activeFilterCount > 0 ? (
                        <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                          {activeFilterCount}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>

              <GraphToolbarControls
                showNodeLabels={showNodeLabels}
                onToggleNodeLabels={() => setShowNodeLabels((value) => !value)}
                showRelationshipLabels={showRelationshipLabels}
                onToggleRelationshipLabels={() => setShowRelationshipLabels((value) => !value)}
                lockDraggedNodes={lockDraggedNodes}
                onToggleLockDraggedNodes={() => setLockDraggedNodes((value) => !value)}
                onResetPins={handleResetPins}
                onResetView={handleResetView}
              />
            </div>
          ) : null}
        </CardContent>
        </Card>

        <GraphWorkspaceSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          folderId={folderId}
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
          allNodes={graphData.nodes || []}
          onClearAllFilters={handleClearAllFilters}
          onFindPath={handleFindPath}
          onOpenHopFinder={handleOpenHopFinder}
          pathLoading={pathLoading}
          pathError={pathError}
          pathSummary={pathSummary}
          onClearPath={handleClearPath}
          traversalModeActive={traversalModeActive}
          traversalPathNodes={traversalPathNodes}
          onTraversalToggle={handleTraversalToggle}
          onTraversalBack={handleTraversalBack}
          onTraversalReset={handleTraversalReset}
          activePanel={activePanel}
        />
      </div>

      <div className="relative mx-4 mb-3 mt-2 min-h-0 flex-1 overflow-hidden rounded-[28px] border border-border/60 bg-card shadow-[0_16px_38px_rgba(15,23,42,0.08)]">
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
