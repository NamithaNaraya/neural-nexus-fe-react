import React, { useEffect, useMemo, useRef, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { ChevronLeft, Link2, Loader2, PanelRightOpen, RotateCcw, Type, Waypoints } from 'lucide-react';
import { graphService } from '../../services/graphService';
import { getNodeTypeColor, getRelationshipTypeColor, withAlpha } from './colorSystem';
import { Button } from '../../components/ui/Button';
import { GraphNodeCrudModal } from '../../components/crud';
import { capGraphData } from './graphDisplayData';
import { GraphFocusDrawer } from './GraphFocusDrawer';
import { buildNodeFocusGraph, buildRelationshipFocusGraph } from './graphFocusUtils';

export default function GraphForcePage({
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
          graphRef.current?.zoomToFit(420, 180);
        }, 200);
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
      setTimeout(() => graphRef.current?.zoomToFit(420, 180), 80);
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
    setTimeout(() => graphRef.current?.zoomToFit(420, 180), 80);
  };

  const clearFocus = () => {
    setFocusedGraphData(null);
    setFocusType('');
    setFocusLabel('');
    setActiveNode(null);
    setActiveRelationship(null);
    setInspectorOpen(false);
  };

  const drawNodeCanvasObject = (node, ctx, globalScale) => {
    const label = node.name || node.id;
    const shouldShowLabel = showNodeLabels || node.id === activeNode?.id;
    if (!shouldShowLabel || !label) return;

    const fontSize = Math.max(10 / globalScale, 8);
    ctx.font = `${fontSize}px Inter, ui-sans-serif, system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const textWidth = ctx.measureText(label).width;
    const paddingX = 8 / globalScale;
    const paddingY = 4 / globalScale;
    const boxWidth = textWidth + paddingX * 2;
    const boxHeight = fontSize + paddingY * 2;
    const yOffset = (node.val ? Math.max(18, node.val * 1.1) : 18) / globalScale;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1 / globalScale;
    ctx.beginPath();
    ctx.roundRect((node.x || 0) - boxWidth / 2, (node.y || 0) - yOffset - boxHeight / 2, boxWidth, boxHeight, 999);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.fillText(label, node.x || 0, (node.y || 0) - yOffset);
  };

  const drawLinkCanvasObject = (link, ctx, globalScale) => {
    if (!showRelationshipLabels) return;
    const source = link.source;
    const target = link.target;
    if (!source || !target) return;

    const sourceX = typeof source === 'object' ? source.x : 0;
    const sourceY = typeof source === 'object' ? source.y : 0;
    const targetX = typeof target === 'object' ? target.x : 0;
    const targetY = typeof target === 'object' ? target.y : 0;
    const label = link.type || '';
    if (!label) return;

    const x = (sourceX + targetX) / 2;
    const y = (sourceY + targetY) / 2;
    const fontSize = Math.max(9 / globalScale, 7);
    ctx.font = `${fontSize}px Inter, ui-sans-serif, system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const width = ctx.measureText(label).width + 10 / globalScale;
    const height = fontSize + 6 / globalScale;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
    ctx.lineWidth = 1 / globalScale;
    ctx.beginPath();
    ctx.roundRect(x - width / 2, y - height / 2, width, height, 999);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#334155';
    ctx.fillText(label, x, y + 0.5);
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-[26px] bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.08),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.92),rgba(244,247,251,0.92))] dark:bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.12),transparent_26%),linear-gradient(180deg,rgba(15,23,42,0.92),rgba(17,24,39,0.94))]">
      <div className="flex items-center justify-between gap-3 border-b border-border/50 px-6 py-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold">2D Graph</h2>
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
              <span className="ml-2">{focusLoading ? 'Loading neighborhood...' : 'Loading graph data...'}</span>
            </div>
          ) : error ? (
            <div className="flex h-full items-center justify-center text-red-500">{error}</div>
          ) : (
            <div className="absolute inset-0">
              <ForceGraph2D
                ref={graphRef}
                graphData={renderedGraph}
                backgroundColor="rgba(0,0,0,0)"
                nodeColor={(node) => node.color}
                nodeRelSize={7}
                nodeVal={(node) => Math.max(1, Number(node.size || node.degree || 1))}
                nodeLabel={(node) => `${node.name || node.id}${node.type ? ` (${node.type})` : ''}`}
                nodeCanvasObject={drawNodeCanvasObject}
                nodeCanvasObjectMode={() => 'after'}
                linkColor={(link) => withAlpha(link.color || '#94A3B8', '66')}
                linkDirectionalParticles={1}
                linkDirectionalParticleColor={(link) => link.color}
                linkDirectionalParticleSpeed={0.005}
                linkWidth={(link) => (link.type ? 1.4 : 1)}
                linkCanvasObject={drawLinkCanvasObject}
                linkCanvasObjectMode={() => (showRelationshipLabels ? 'after' : undefined)}
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
