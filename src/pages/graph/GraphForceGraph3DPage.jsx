import React, { useEffect, useMemo, useRef, useState } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';
import { Loader2 } from 'lucide-react';
import { graphService } from '../../services/graphService';
import { getNodeTypeColor, getRelationshipTypeColor, withAlpha } from './colorSystem';
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
  const [hoveredNodeId, setHoveredNodeId] = useState(null);
  const [draggingNodeId, setDraggingNodeId] = useState(null);
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
  }, [folderId, refreshToken, graphData, graphDataOverride, disableRemoteLoad, focusType, activeNode, activeRelationship, expandDepth, expandRelationshipTypes]);

  useEffect(() => {
    if (!addNodeSignal) return;
    setCrudMode('create');
    setActiveNode(null);
    setCrudOpen(true);
    setInspectorOpen(false);
  }, [addNodeSignal]);

  const activeGraphData = traversalModeActive
    ? displayGraphData || graphData || graphDataOverride || fullGraphData
    : fullGraphData;

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
    setDraggingNodeId(null);
    if (lockDraggedNodes) {
      node.fx = node.x;
      node.fy = node.y;
      node.fz = node.z;
      return;
    }
    node.fx = undefined;
    node.fy = undefined;
    node.fz = undefined;
  };

  useEffect(() => {
    const current = graphRef.current?.graphData?.();
    current?.nodes?.forEach((node) => {
      node.fx = undefined;
      node.fy = undefined;
      node.fz = undefined;
    });
    setTimeout(() => {
      graphRef.current?.zoomToFit?.(460, 220);
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
      graphRef.current?.zoomToFit(560, 140);
    }, 140);
  }, [hasPathHighlights, highlightedNodeIds, highlightedLinkIds]);

  useEffect(() => {
    const graphInstance = graphRef.current;
    if (!graphInstance) return;

    const controls = graphInstance.controls?.();
    if (controls) {
      controls.minDistance = 18;
      controls.maxDistance = 6000;
      controls.zoomSpeed = 1.2;
      controls.panSpeed = 0.9;
    }

    if (!renderedGraph.nodes.length) return;

    graphInstance.d3ReheatSimulation?.();
    const timeout = setTimeout(() => {
      graphInstance.zoomToFit?.(520, 110);
    }, 180);

    return () => clearTimeout(timeout);
  }, [renderedGraph.nodes.length, renderedGraph.links.length, relationshipTypeFilters, nodeTypeFilters, minDegree, showOrphans, nodeSearch]);

  useEffect(() => {
    const domElement = graphRef.current?.renderer?.()?.domElement;
    if (!domElement) return;
    domElement.style.cursor = draggingNodeId ? 'grabbing' : 'grab';
  }, [draggingNodeId, renderedGraph.nodes.length]);

  const createTextSprite = (text, color = '#334155') => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return null;

    const fontSize = 44;
    context.font = `600 ${fontSize}px Inter, ui-sans-serif, system-ui, sans-serif`;
    const paddingX = 20;
    const paddingY = 12;
    const metrics = context.measureText(text);
    canvas.width = Math.ceil(metrics.width + paddingX * 2);
    canvas.height = Math.ceil(fontSize + paddingY * 2);

    context.font = `600 ${fontSize}px Inter, ui-sans-serif, system-ui, sans-serif`;
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
    <div className="flex h-full w-full flex-col overflow-hidden rounded-[26px] border border-border/60 bg-background">
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
                enableNodeDrag
                enableNavigationControls={!hoveredNodeId && !draggingNodeId}
                nodeColor={(node) => {
                  const isHighlighted = highlightedNodeIds.has(String(node.id));
                  if (!hasPathHighlights) return node.color;
                  return isHighlighted ? node.color : '#475569';
                }}
                nodeOpacity={0.95}
                nodeVal={(node) => {
                  const base = Math.max(2, Number(node.size || node.degree || 1) * 1.6);
                  const normalized = 2 + Math.log2(base + 1) * 0.9;
                  return highlightedNodeIds.has(String(node.id)) ? normalized * 1.12 : normalized;
                }}
                nodeResolution={10}
                nodeLabel={() => ''}
                nodeThreeObject={(node) => {
                  if (!showNodeLabels) return undefined;
                  const sprite = createTextSprite(node.name || node.id, '#334155');
                  if (sprite) {
                    sprite.scale.setScalar(Math.max(4, Number(node.size || node.degree || 1) * 0.25));
                    sprite.position.set(0, -8, 0);
                  }
                  return sprite || undefined;
                }}
                nodeThreeObjectExtend={showNodeLabels}
                linkColor={(link) => {
                  const isPredicted = Boolean(link.properties?.isPredicted);
                  const isHighlighted = highlightedLinkIds.has(String(link.id));
                  if (isPredicted) return link.color || '#ec4899';
                  if (!hasPathHighlights) return withAlpha(link.color || '#94A3B8', '72');
                  return isHighlighted ? (link.color || '#94A3B8') : '#475569';
                }}
                linkOpacity={0.28}
                linkWidth={(link) => {
                  if (link.properties?.isPredicted) return 2.4;
                  return highlightedLinkIds.has(String(link.id)) ? 2.1 : (link.type ? 0.9 : 0.65);
                }}
                linkDirectionalParticles={(link) => {
                  if (link.properties?.isPredicted) return 8;
                  return highlightedLinkIds.has(String(link.id)) ? 3 : 1;
                }}
                linkDirectionalParticleColor={(link) => link.properties?.isPredicted ? '#ec4899' : link.color}
                linkDirectionalParticleWidth={(link) => (link.properties?.isPredicted ? 3 : 2)}
                linkDirectionalParticleSpeed={(link) => (link.properties?.isPredicted ? 0.0065 : 0.0045)}
                linkDirectionalArrowLength={5}
                linkDirectionalArrowRelPos={1}
                linkDirectionalArrowColor={(link) => link.properties?.isPredicted ? '#ec4899' : (link.color || '#64748B')}
                linkThreeObject={(link) => {
                  if (!showRelationshipLabels) return undefined;
                  const sprite = createTextSprite(link.type || '', '#475569');
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
                onNodeHover={(node) => {
                  setHoveredNodeId(node?.id ?? null);
                  const domElement = graphRef.current?.renderer?.()?.domElement;
                  if (!domElement) return;
                  domElement.style.cursor = node
                    ? (draggingNodeId && String(draggingNodeId) === String(node.id) ? 'grabbing' : 'grab')
                    : (draggingNodeId ? 'grabbing' : 'grab');
                }}
                onNodeDrag={(node) => {
                  if (!node) return;
                  setDraggingNodeId(node.id);
                  const domElement = graphRef.current?.renderer?.()?.domElement;
                  if (domElement) domElement.style.cursor = 'grabbing';
                }}
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
