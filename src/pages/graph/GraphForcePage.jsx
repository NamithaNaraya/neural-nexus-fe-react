import React, { useEffect, useMemo, useRef, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { Loader2 } from 'lucide-react';
import { graphService } from '../../services/graphService';
import { getNodeTypeColor, getRelationshipTypeColor, withAlpha } from './colorSystem';
import { GraphNodeCrudModal } from '../../components/crud';
import { capGraphData } from './graphDisplayData';
import { GraphFocusDrawer } from './GraphFocusDrawer';
import { buildNodeFocusGraph, buildRelationshipFocusGraph } from './graphFocusUtils';
import { annotateParallelLinks, getLinkLabelPlacement } from './rendering/linkLabelLayout';

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
  jumpRequest = null,
  highlightedNodeIds = new Set(),
  highlightedLinkIds = new Set(),
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
  onJumpHandled = null,
  onStatsChange,
  addNodeSignal,
  resetPinnedSignal = 0,
  resetViewSignal = 0,
  lockDraggedNodes = true,
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
  const [expandDepth, setExpandDepth] = useState(1);
  const [expandRelationshipTypes, setExpandRelationshipTypes] = useState([]);
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
            const expanded = await graphService.expandNode(activeNode.id, {
              depth: expandDepth,
              relationshipTypes: expandRelationshipTypes,
              force: forceRefreshRef.current,
            });
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
  }, [folderId, refreshToken, graphData, graphDataOverride, disableRemoteLoad, focusType, activeNode, activeRelationship, expandDepth, expandRelationshipTypes]);

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

    return { nodes: enrichedNodes, links: annotateParallelLinks(links) };
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

  const refreshNodeFocus = async (node) => {
    if (!node?.id) return;
    setFocusLoading(true);
    try {
      const expanded = await graphService.expandNode(node.id, {
        depth: expandDepth,
        relationshipTypes: expandRelationshipTypes,
        force: true,
      });
      setFocusedGraphData(buildNodeFocusGraph(fullGraphData, expanded, node));
      setTimeout(() => graphRef.current?.zoomToFit(420, 180), 80);
    } catch (err) {
      console.error('Failed to refresh focused node:', err);
      setFocusedGraphData(buildNodeFocusGraph(fullGraphData, { nodes: [node], links: [] }, node));
    } finally {
      setFocusLoading(false);
    }
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
    await refreshNodeFocus(node);
  };

  const handleNodeSelectFromDrawer = async (node) => {
    if (!node?.id) return;
    const nextNode = fullGraphData.nodes.find((item) => String(item.id) === String(node.id)) || node;
    await handleNodeClick(nextNode);
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

  const handleNodeDragEnd = (node) => {
    if (!node) return;
    if (lockDraggedNodes) {
      node.fx = node.x;
      node.fy = node.y;
      return;
    }
    node.fx = undefined;
    node.fy = undefined;
  };

  useEffect(() => {
    const current = graphRef.current?.graphData?.();
    current?.nodes?.forEach((node) => {
      node.fx = undefined;
      node.fy = undefined;
    });
    graphRef.current?.d3ReheatSimulation?.();
    setTimeout(() => {
      graphRef.current?.zoomToFit?.(420, 180);
    }, 80);
  }, [resetPinnedSignal, resetViewSignal]);

  useEffect(() => {
    if (!jumpRequest?.nodeId) return;
    const nextNode = fullGraphData.nodes.find((node) => String(node.id) === String(jumpRequest.nodeId));
    if (!nextNode) {
      onJumpHandled?.();
      return;
    }

    if (jumpRequest.depth || (jumpRequest.relationshipTypes && jumpRequest.relationshipTypes.length)) {
      setExpandDepth(jumpRequest.depth || 1);
      setExpandRelationshipTypes(jumpRequest.relationshipTypes || []);
    }

    handleNodeClick(nextNode).finally(() => {
      onJumpHandled?.();
    });
  }, [jumpRequest, fullGraphData, onJumpHandled]);

  const hasPathHighlights = highlightedNodeIds.size > 0 || highlightedLinkIds.size > 0;

  useEffect(() => {
    if (!hasPathHighlights) return;
    setTimeout(() => {
      graphRef.current?.zoomToFit(520, 120);
    }, 120);
  }, [hasPathHighlights, highlightedNodeIds, highlightedLinkIds]);

  const drawNodeCanvasObject = (node, ctx, globalScale) => {
    const baseMetric = Math.max(1, Number(node.size || node.degree || 1));
    const radius = Math.max(8, Math.min(14, 8 + Math.log2(baseMetric + 1) * 1.6));
    const x = node.x || 0;
    const y = node.y || 0;
    const nodeColor = node.color || '#93C5FD';
    const isHighlighted = highlightedNodeIds.has(String(node.id));
    const shouldShowLabel = showNodeLabels || node.id === activeNode?.id || isHighlighted;

    ctx.save();

    ctx.beginPath();
    ctx.fillStyle = withAlpha(nodeColor, isHighlighted ? '3D' : '24');
    ctx.arc(x, y, radius + 5, 0, 2 * Math.PI, false);
    ctx.fill();

    ctx.beginPath();
    ctx.fillStyle = nodeColor;
    ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
    ctx.fill();

    ctx.beginPath();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = withAlpha(nodeColor, isHighlighted ? 'DD' : 'AA');
    ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
    ctx.stroke();

    if (shouldShowLabel) {
      const label = node.name || node.id;
      const fontSize = Math.max(11 / globalScale, 8.5);
      ctx.font = `${fontSize}px Inter, ui-sans-serif, system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = '#1F2937';
      ctx.fillText(label, x, y + radius + 8);
    }

    ctx.restore();
  };

  const drawLinkCanvasObject = (link, ctx, globalScale) => {
    if (!showRelationshipLabels) return;
    if (globalScale < 0.95) return;
    const source = link.source;
    const target = link.target;
    if (!source || !target) return;

    const sourceX = typeof source === 'object' ? source.x : 0;
    const sourceY = typeof source === 'object' ? source.y : 0;
    const targetX = typeof target === 'object' ? target.x : 0;
    const targetY = typeof target === 'object' ? target.y : 0;
    const label = link.type || '';
    if (!label) return;
    const placement = getLinkLabelPlacement(
      link,
      { x: sourceX, y: sourceY },
      { x: targetX, y: targetY },
      1 / Math.max(globalScale, 0.75)
    );
    if (!placement || placement.length < 36) return;
    const fontSize = Math.max(9 / globalScale, 7);

    ctx.font = `${fontSize}px Inter, ui-sans-serif, system-ui, sans-serif`;
    const width = ctx.measureText(label).width + 10 / globalScale;
    const height = fontSize + 6 / globalScale;

    ctx.save();
    ctx.translate(placement.x, placement.y);
    ctx.rotate(placement.angle);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
    ctx.lineWidth = 1 / globalScale;
    ctx.beginPath();
    ctx.roundRect(-width / 2, -height / 2, width, height, 999);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#334155';
    ctx.fillText(label, 0, 0.5);
    ctx.restore();
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-[26px] border border-border/60 bg-background">
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
                nodeColor={(node) => {
                  const isHighlighted = highlightedNodeIds.has(String(node.id));
                  if (!hasPathHighlights) return node.color;
                  return isHighlighted ? node.color : withAlpha(node.color || '#94A3B8', '30');
                }}
                nodeRelSize={7}
                nodeVal={(node) => {
                  const base = Math.max(1, Number(node.size || node.degree || 1));
                  const normalized = 1 + Math.log2(base + 1) * 0.55;
                  return highlightedNodeIds.has(String(node.id)) ? normalized * 1.15 : normalized;
                }}
                nodeLabel={() => ''}
                nodeCanvasObject={drawNodeCanvasObject}
                nodeCanvasObjectMode={() => 'replace'}
                linkColor={(link) => {
                  const isHighlighted = highlightedLinkIds.has(String(link.id));
                  if (!hasPathHighlights) return withAlpha(link.color || '#94A3B8', '55');
                  return isHighlighted ? withAlpha(link.color || '#94A3B8', 'B8') : withAlpha(link.color || '#94A3B8', '20');
                }}
                linkDirectionalParticles={(link) => (highlightedLinkIds.has(String(link.id)) ? 3 : 1)}
                linkDirectionalParticleColor={(link) => link.color}
                linkDirectionalParticleSpeed={0.005}
                linkDirectionalArrowLength={4}
                linkDirectionalArrowRelPos={1}
                linkDirectionalArrowColor={(link) => link.color || '#64748B'}
                linkWidth={(link) => (highlightedLinkIds.has(String(link.id)) ? 2 : (link.type ? 0.85 : 0.7))}
                linkCanvasObject={drawLinkCanvasObject}
                linkCanvasObjectMode={() => (showRelationshipLabels ? 'after' : undefined)}
                onNodeClick={handleNodeClick}
                onNodeDragEnd={handleNodeDragEnd}
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
            onSelectNode={handleNodeSelectFromDrawer}
            relationshipTypeOptions={relationshipTypes}
            expandDepth={expandDepth}
            setExpandDepth={setExpandDepth}
            expandRelationshipTypes={expandRelationshipTypes}
            setExpandRelationshipTypes={setExpandRelationshipTypes}
            onExpandNode={activeNode ? () => refreshNodeFocus(activeNode) : null}
            expandLoading={focusLoading}
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
