import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  drag as d3Drag,
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceRadial,
  forceSimulation,
  select,
  zoom as d3Zoom,
  zoomIdentity,
} from 'd3';
import { Activity, AlertCircle, Loader2, Zap } from 'lucide-react';
import { GraphNodeCrudModal } from '../../components/crud';
import { graphService } from '../../services/graphService';
import { GraphFocusDrawer } from './GraphFocusDrawer';
import { buildNodeFocusGraph, buildRelationshipFocusGraph } from './graphFocusUtils';
import { filterGraphData } from './filterGraphData';
import { GRAPH_FETCH_STEPS, GRAPH_RENDER_LIMITS, sanitizeGraphForRender } from './graphDisplayData';
import { getNodeTypeColor, getRelationshipTypeColor, withAlpha } from './colorSystem';
import { annotateParallelLinks, getLinkLabelPlacement } from './rendering/linkLabelLayout';

function getNodeRadius(node) {
  const base = Math.max(1, Number(node?.size || node?.degree || 1));
  return Math.max(10, Math.min(18, 10 + Math.log2(base + 1) * 2.8));
}

function getGraphDetailLevel(nodeCount, linkCount) {
  if (nodeCount >= 1400 || linkCount >= 2400) return 'ultra';
  if (nodeCount >= 900 || linkCount >= 1600) return 'dense';
  if (nodeCount >= 500 || linkCount >= 900) return 'medium';
  return 'full';
}

function fitGraphToViewport(svg, zoomBehavior, nodes, width, height, duration = 350) {
  if (!svg || !zoomBehavior || !nodes?.length || !width || !height) return;

  const validNodes = nodes.filter(
    (node) => Number.isFinite(node.x) && Number.isFinite(node.y)
  );
  if (!validNodes.length) return;

  const minX = Math.min(...validNodes.map((node) => node.x));
  const maxX = Math.max(...validNodes.map((node) => node.x));
  const minY = Math.min(...validNodes.map((node) => node.y));
  const maxY = Math.max(...validNodes.map((node) => node.y));

  const graphWidth = Math.max(maxX - minX, 1);
  const graphHeight = Math.max(maxY - minY, 1);
  const padding = 70;
  const scale = Math.max(
    0.2,
    Math.min(
      3.4,
      Math.min(
        (width - padding * 2) / graphWidth,
        (height - padding * 2) / graphHeight
      )
    )
  );

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const transform = zoomIdentity
    .translate(width / 2 - centerX * scale, height / 2 - centerY * scale)
    .scale(scale);

  svg.transition().duration(duration).call(zoomBehavior.transform, transform);
}

function buildGridLines(width, height, step = 80) {
  const lines = [];

  for (let x = 0; x <= width; x += step) {
    lines.push({ x1: x, y1: 0, x2: x, y2: height });
  }
  for (let y = 0; y <= height; y += step) {
    lines.push({ x1: 0, y1: y, x2: width, y2: y });
  }

  return lines;
}

function focusNodeInViewport(svg, zoomBehavior, node, width, height, scale = 1.7, duration = 550) {
  if (!svg || !zoomBehavior || !node) return;
  const nextScale = Math.max(0.7, Math.min(2.6, scale));
  const transform = zoomIdentity
    .translate(width / 2 - (node.x || 0) * nextScale, height / 2 - (node.y || 0) * nextScale)
    .scale(nextScale);

  svg.transition().duration(duration).call(zoomBehavior.transform, transform);
}

export default function GraphHybridForcePage({
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
  onTraversalNodeClick = null,
  traversalPath = [],
  showNodeLabels = false,
  showRelationshipLabels = false,
  onJumpHandled = null,
  onStatsChange,
  addNodeSignal,
  resetPinnedSignal = 0,
  resetViewSignal = 0,
  graphDataOverride = null,
  disableRemoteLoad = false,
  hideEngineHud = false,
  _traversalMode = false,
}) {
  const svgRef = useRef(null);
  const viewportRef = useRef(null);
  const simulationRef = useRef(null);
  const simulationNodesRef = useRef([]);
  const zoomBehaviorRef = useRef(null);
  const currentZoomScaleRef = useRef(1);
  const forceRefreshRef = useRef(false);
  const labelSelectionRef = useRef(null);
  const relationshipLabelSelectionRef = useRef(null);
  const relationshipLabelBackgroundSelectionRef = useRef(null);
  const particleSelectionRef = useRef(null);
  const haloSelectionRef = useRef(null);
  const nodeSelectionRef = useRef(null);
  const nodeHighlightSelectionRef = useRef(null);
  const latestFitRequestRef = useRef(0);

  const [fullGraphData, setFullGraphData] = useState({ nodes: [], links: [] });
  const [focusedGraphData, setFocusedGraphData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [focusLoading, setFocusLoading] = useState(false);
  const [error, setError] = useState(null);
  const [crudOpen, setCrudOpen] = useState(false);
  const [crudMode, setCrudMode] = useState('create');
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [hoverNodeId, setHoverNodeId] = useState(null);
  const [activeRelationship, setActiveRelationship] = useState(null);
  const [focusType, setFocusType] = useState('');
  const [focusLabel, setFocusLabel] = useState('');
  const [refreshToken, setRefreshToken] = useState(0);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [expandDepth, setExpandDepth] = useState(1);
  const [expandRelationshipTypes, setExpandRelationshipTypes] = useState([]);
  const [radialStrength, setRadialStrength] = useState(0.14);
  const [particleSpeed, setParticleSpeed] = useState(1.4);
  const [showGrid, setShowGrid] = useState(true);
  const [hydrating, setHydrating] = useState(false);

  useEffect(() => {
    setFocusedGraphData(null);
    setFocusType('');
    setFocusLabel('');
    setSelectedNodeId(null);
    setHoverNodeId(null);
    setActiveRelationship(null);
    setInspectorOpen(false);
  }, [folderId]);

  useEffect(() => {
    const handleCrud = () => {
      forceRefreshRef.current = true;
      setRefreshToken((value) => value + 1);
    };

    window.addEventListener('nnv2:graph-crud', handleCrud);
    let cancelled = false;

    async function loadGraph() {
      if (graphData || disableRemoteLoad) {
        setLoading(false);
        setHydrating(false);
        setError(null);
        setFullGraphData(graphData || graphDataOverride || { nodes: [], links: [] });
        setFocusedGraphData(null);
        forceRefreshRef.current = false;
        return;
      }

      if (!folderId) {
        setLoading(false);
        setHydrating(false);
        setFullGraphData({ nodes: [], links: [] });
        setFocusedGraphData(null);
        return;
      }

      setLoading(true);
      setHydrating(false);
      setError(null);
      try {
        const [firstLimit, ...nextLimits] = GRAPH_FETCH_STEPS.hybrid2d;
        const firstData = await graphService.getFolder(folderId, firstLimit, { force: forceRefreshRef.current });
        if (cancelled) return;

        setFullGraphData(firstData);
        setFocusedGraphData(null);
        setLoading(false);

        if (nextLimits.length) {
          setHydrating(true);
        }

        for (const limit of nextLimits) {
          const nextData = await graphService.getFolder(folderId, limit, { force: forceRefreshRef.current });
          if (cancelled) return;
          setFullGraphData(nextData);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) setError('Failed to load graph data.');
      } finally {
        forceRefreshRef.current = false;
        if (!cancelled) {
          setLoading(false);
          setHydrating(false);
        }
      }
    }

    loadGraph();
    return () => {
      cancelled = true;
      window.removeEventListener('nnv2:graph-crud', handleCrud);
    };
  }, [folderId, refreshToken, graphData, graphDataOverride, disableRemoteLoad]);

  useEffect(() => {
    if (!addNodeSignal) return;
    setCrudMode('create');
    setCrudOpen(true);
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

  const filteredGraph = useMemo(
    () =>
      filterGraphData(activeGraphData, {
        nodeTypeFilters,
        relationshipTypeFilters,
        minDegree,
        showOrphans,
        nodeSearch,
        searchResultIds,
      }),
    [
      activeGraphData,
      nodeTypeFilters,
      relationshipTypeFilters,
      minDegree,
      showOrphans,
      nodeSearch,
      searchResultIds,
    ]
  );

  const renderedGraph = useMemo(() => {
    const enrichedNodes = filteredGraph.nodes.map((node) => ({
      ...node,
      color: getNodeTypeColor(node.type || 'Unknown', nodeTypeColors),
    }));

    const enrichedLinks = annotateParallelLinks(
      filteredGraph.links.map((link) => ({
        ...link,
        color: link.properties?.isPredicted
          ? '#ec4899'
          : getRelationshipTypeColor(link.type || 'Unknown', relationshipTypeColors),
      }))
    );

    return sanitizeGraphForRender({ nodes: enrichedNodes, links: enrichedLinks }, GRAPH_RENDER_LIMITS.hybrid2d);
  }, [filteredGraph, nodeTypeColors, relationshipTypeColors]);

  const graphNodes = useMemo(
    () => renderedGraph.nodes.map((node) => ({ ...node, id: String(node.id) })),
    [renderedGraph.nodes]
  );

  const graphLinks = useMemo(
    () =>
      renderedGraph.links.map((link) => ({
        ...link,
        id: String(link.id),
        source: String(typeof link.source === 'object' ? link.source.id : link.source),
        target: String(typeof link.target === 'object' ? link.target.id : link.target),
      })),
    [renderedGraph.links]
  );

  const nodeLookup = useMemo(
    () => new Map(graphNodes.map((node) => [String(node.id), node])),
    [graphNodes]
  );

  const activeNode = selectedNodeId ? nodeLookup.get(String(selectedNodeId)) || null : null;
  const detailLevel = useMemo(
    () => getGraphDetailLevel(graphNodes.length, graphLinks.length),
    [graphNodes.length, graphLinks.length]
  );
  const shouldRenderRelationshipLabels = showRelationshipLabels && detailLevel === 'full' && graphLinks.length <= 900;
  const canRenderAmbientNodeLabels = showNodeLabels && graphNodes.length <= 120;
  const hasPathHighlights = highlightedNodeIds.size > 0 || highlightedLinkIds.size > 0;
  const allowAmbientParticles = (detailLevel === 'full' || detailLevel === 'medium') && graphLinks.length <= 900;
  const allowHighlightedParticles = detailLevel !== 'ultra';
  const nodeLabelZoomThreshold = detailLevel === 'full' ? 1.05 : detailLevel === 'medium' ? 1.3 : 1.6;
  const relationshipLabelZoomThreshold = detailLevel === 'full' ? 1.15 : detailLevel === 'medium' ? 1.55 : 1.95;

  useEffect(() => {
    const labelSelection = labelSelectionRef.current;
    const relationshipLabelSelection = relationshipLabelSelectionRef.current;
    const relationshipLabelBackgroundSelection = relationshipLabelBackgroundSelectionRef.current;
    const haloSelection = haloSelectionRef.current;
    const nodeSelection = nodeSelectionRef.current;
    const nodeHighlightSelection = nodeHighlightSelectionRef.current;

    if (labelSelection) {
      labelSelection.attr('display', (node) => {
        const zoomReady = currentZoomScaleRef.current >= nodeLabelZoomThreshold;
        const shouldShow = canRenderAmbientNodeLabels
          || highlightedNodeIds.has(String(node.id))
          || String(hoverNodeId) === String(node.id)
          || String(selectedNodeId) === String(node.id);
        return shouldShow && zoomReady ? null : 'none';
      });
    }

    if (haloSelection) {
      haloSelection
        .attr('display', (node) => (
          String(selectedNodeId) === String(node.id) || String(hoverNodeId) === String(node.id)
            ? null
            : 'none'
        ))
        .attr('fill', (node) => withAlpha(node.color || '#93C5FD', String(selectedNodeId) === String(node.id) ? '24' : '18'))
        .attr('stroke', (node) => withAlpha(node.color || '#93C5FD', String(selectedNodeId) === String(node.id) ? '7A' : '48'))
        .attr('stroke-width', (node) => (String(selectedNodeId) === String(node.id) ? 2.8 : 1.5));
    }

    if (nodeSelection) {
      nodeSelection
        .attr('stroke', (node) => {
          const color = node.color || '#93C5FD';
          const isSelected = String(selectedNodeId) === String(node.id);
          const isHighlighted = highlightedNodeIds.has(String(node.id));
          return isSelected || isHighlighted ? withAlpha(color, 'FF') : withAlpha(color, 'AA');
        })
        .attr('stroke-width', (node) => {
          const isSelected = String(selectedNodeId) === String(node.id);
          const isHighlighted = highlightedNodeIds.has(String(node.id));
          return isSelected || isHighlighted ? 3.2 : 1.8;
        });
    }

    if (nodeHighlightSelection) {
      nodeHighlightSelection.attr('opacity', (node) => {
        if (String(selectedNodeId) === String(node.id)) return 0.95;
        if (String(hoverNodeId) === String(node.id)) return 0.84;
        return 0.52;
      });
    }

    if (relationshipLabelSelection) {
      relationshipLabelSelection.attr('display', (link) => {
        if (!shouldRenderRelationshipLabels || currentZoomScaleRef.current < relationshipLabelZoomThreshold) return 'none';
        const placement = getLinkLabelPlacement(
          link,
          { x: link.source.x || 0, y: link.source.y || 0 },
          { x: link.target.x || 0, y: link.target.y || 0 },
          1
        );
        return placement && placement.length >= 40 ? null : 'none';
      });
    }

    if (relationshipLabelBackgroundSelection) {
      relationshipLabelBackgroundSelection.attr('display', (link) => {
        if (!shouldRenderRelationshipLabels || currentZoomScaleRef.current < relationshipLabelZoomThreshold) return 'none';
        const placement = getLinkLabelPlacement(
          link,
          { x: link.source.x || 0, y: link.source.y || 0 },
          { x: link.target.x || 0, y: link.target.y || 0 },
          1
        );
        return placement && placement.length >= 40 ? null : 'none';
      });
    }
  }, [
    highlightedNodeIds,
    hoverNodeId,
    nodeLabelZoomThreshold,
    relationshipLabelZoomThreshold,
    selectedNodeId,
    canRenderAmbientNodeLabels,
    shouldRenderRelationshipLabels,
  ]);

  useEffect(() => {
    onStatsChange?.({
      nodes: renderedGraph.nodes.length,
      links: renderedGraph.links.length,
    });
  }, [renderedGraph.nodes.length, renderedGraph.links.length, onStatsChange]);

  useEffect(() => {
    const simulation = simulationRef.current;
    const nodes = simulationNodesRef.current;
    if (!simulation || !nodes.length) return;

    const radialDistance = Math.min(460, 160 + Math.sqrt(nodes.length) * 11);
    simulation.force(
      'radial',
      radialStrength > 0
        ? forceRadial(radialDistance, 0, 0).strength(radialStrength)
        : null
    );
    simulation.alpha(0.2).restart();
  }, [radialStrength]);

  useEffect(() => {
    requestFitGraph(360);
  }, [graphNodes.length, graphLinks.length]);

  useEffect(() => {
    requestFitGraph(280);
  }, [radialStrength]);

  const clearFocus = () => {
    setFocusedGraphData(null);
    setFocusType('');
    setFocusLabel('');
    setSelectedNodeId(null);
    setHoverNodeId(null);
    setActiveRelationship(null);
    setInspectorOpen(false);
  };

  const requestFitGraph = (duration = 320) => {
    latestFitRequestRef.current += 1;
    const requestId = latestFitRequestRef.current;
    window.setTimeout(() => {
      if (requestId !== latestFitRequestRef.current) return;
      const svgElement = svgRef.current;
      const zoomBehavior = zoomBehaviorRef.current;
      const nodes = simulationNodesRef.current;
      if (!svgElement || !zoomBehavior || !nodes?.length) return;
      const svg = select(svgElement);
      fitGraphToViewport(
        svg,
        zoomBehavior,
        nodes,
        svgElement.clientWidth || 1200,
        svgElement.clientHeight || 720,
        duration
      );
    }, 60);
  };

  const refreshNodeFocus = async (node, depthValue = expandDepth, relationshipTypesValue = expandRelationshipTypes) => {
    if (!node?.id) return;
    setFocusLoading(true);
    try {
      const expanded = await graphService.expandNode(node.id, {
        depth: depthValue,
        relationshipTypes: relationshipTypesValue,
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
    if (!node?.id) return;
    setSelectedNodeId(String(node.id));
    setActiveRelationship(null);
    setFocusType('node');
    setFocusLabel(node.name || node.id);
    setInspectorOpen(true);

    if (traversalModeActive && onTraversalNodeClick) {
      onTraversalNodeClick(node);
    }

    await refreshNodeFocus(node);
  };

  const handleRelationshipClick = (link) => {
    setActiveRelationship(link);
    setSelectedNodeId(null);
    setFocusType('relationship');
    setFocusLabel(`${link.type || 'Relationship'} ${link.source?.name || link.source || ''} -> ${link.target?.name || link.target || ''}`);
    setFocusedGraphData(buildRelationshipFocusGraph(fullGraphData, link));
    setInspectorOpen(true);
  };

  const handleNodeSelectFromDrawer = async (node) => {
    if (!node?.id) return;
    const nextNode = fullGraphData.nodes.find((item) => String(item.id) === String(node.id)) || node;
    await handleNodeClick(nextNode);
  };

  useEffect(() => {
    const svgElement = svgRef.current;
    const viewportElement = viewportRef.current;
    if (!svgElement || !viewportElement) return;

    const svg = select(svgElement);
    const viewport = select(viewportElement);
    viewport.selectAll('*').remove();

    if (!graphNodes.length) {
      simulationRef.current?.stop?.();
      simulationRef.current = null;
      return;
    }

    const width = svgElement.clientWidth || 1200;
    const height = svgElement.clientHeight || 720;
    const nodes = graphNodes.map((node) => ({ ...node }));
    const links = graphLinks.map((link) => ({ ...link }));
    simulationNodesRef.current = nodes;

    const linkDistance = detailLevel === 'ultra' ? 78 : detailLevel === 'dense' ? 92 : detailLevel === 'medium' ? 108 : 122;
    const chargeStrength = detailLevel === 'ultra' ? -135 : detailLevel === 'dense' ? -180 : detailLevel === 'medium' ? -235 : -290;
    const radialDistance = Math.min(540, 220 + Math.sqrt(nodes.length) * 14);
    const collisionPadding = detailLevel === 'ultra' ? 1.2 : detailLevel === 'dense' ? 2.1 : detailLevel === 'medium' ? 3.2 : 4.5;

    const simulation = forceSimulation(nodes)
      .force('link', forceLink(links).id((node) => node.id).distance(linkDistance).strength(0.18))
      .force('charge', forceManyBody().strength(chargeStrength))
      .force('collide', forceCollide((node) => getNodeRadius(node) + collisionPadding).iterations(detailLevel === 'ultra' ? 1 : 2))
      .force('radial', radialStrength > 0 ? forceRadial(radialDistance, 0, 0).strength(radialStrength) : null)
      .force('center', forceCenter(width / 2, height / 2))
      .alphaDecay(detailLevel === 'ultra' ? 0.08 : 0.055)
      .velocityDecay(detailLevel === 'ultra' ? 0.42 : 0.3);

    simulationRef.current = simulation;

    const gridLayer = svg.append('g').attr('class', 'hybrid-grid');
    if (showGrid) {
      gridLayer
        .selectAll('line')
        .data(buildGridLines(width, height, 88))
        .join('line')
        .attr('x1', (line) => line.x1)
        .attr('y1', (line) => line.y1)
        .attr('x2', (line) => line.x2)
        .attr('y2', (line) => line.y2)
        .attr('stroke', 'rgba(37, 99, 235, 0.05)')
        .attr('stroke-width', 1);
    }

    const linkUnderlayLayer = viewport.append('g').attr('class', 'hybrid-links-underlay');
    const linkLayer = viewport.append('g').attr('class', 'hybrid-links');
    const particleLayer = viewport.append('g').attr('class', 'hybrid-link-particles');
    const haloLayer = viewport.append('g').attr('class', 'hybrid-node-halos');
    const nodeLayer = viewport.append('g').attr('class', 'hybrid-nodes');
    const nodeHighlightLayer = viewport.append('g').attr('class', 'hybrid-node-highlights');
    const labelLayer = viewport.append('g').attr('class', 'hybrid-labels');
    const relLabelLayer = viewport.append('g').attr('class', 'hybrid-rel-labels');
    const relLabelBackgroundLayer = viewport.append('g').attr('class', 'hybrid-rel-label-backgrounds');

    const defs = svg.append('defs');
    const markerData = [
      { id: 'hybrid-arrow-default', color: '#64748B' },
      { id: 'hybrid-arrow-predicted', color: '#ec4899' },
      { id: 'hybrid-arrow-highlighted', color: '#334155' },
    ];

    defs
      .selectAll('marker')
      .data(markerData)
      .join('marker')
      .attr('id', (marker) => marker.id)
      .attr('viewBox', '0 0 10 10')
      .attr('refX', 9)
      .attr('refY', 5)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto-start-reverse')
      .append('path')
      .attr('d', 'M 0 0 L 10 5 L 0 10 z')
      .attr('fill', (marker) => marker.color);

    const linkUnderlaySelection = linkUnderlayLayer
      .selectAll('line')
      .data(links, (link) => link.id)
      .join('line')
      .attr('stroke', (link) => {
        if (link.properties?.isPredicted) return 'rgba(236,72,153,0.18)';
        return highlightedLinkIds.has(String(link.id)) ? 'rgba(51,65,85,0.16)' : 'rgba(148,163,184,0.12)';
      })
      .attr('stroke-width', (link) => (link.properties?.isPredicted ? 8 : highlightedLinkIds.has(String(link.id)) ? 6 : 4))
      .attr('stroke-linecap', 'round');

    const linkSelection = linkLayer
      .selectAll('line')
      .data(links, (link) => link.id)
      .join('line')
      .attr('stroke', (link) => {
        const baseColor = link.properties?.isPredicted ? '#ec4899' : (link.color || '#94A3B8');
        const isHighlighted = highlightedLinkIds.has(String(link.id));
        if (link.properties?.isPredicted) return '#ec4899';
        if (!hasPathHighlights) return withAlpha(baseColor, '88');
        return isHighlighted ? withAlpha(baseColor, 'DD') : withAlpha(baseColor, '35');
      })
      .attr('stroke-width', (link) => (link.properties?.isPredicted ? 2.8 : (highlightedLinkIds.has(String(link.id)) ? 2.2 : 1.4)))
      .attr('stroke-dasharray', (link) => (link.properties?.isPredicted ? '8 5' : null))
      .attr('marker-end', (link) => {
        if (link.properties?.isPredicted) return 'url(#hybrid-arrow-predicted)';
        if (highlightedLinkIds.has(String(link.id))) return 'url(#hybrid-arrow-highlighted)';
        return 'url(#hybrid-arrow-default)';
      })
      .style('cursor', 'pointer')
      .on('click', (_, link) => handleRelationshipClick(link));

    const particleSelection = particleLayer
      .selectAll('circle')
      .data(
        links.flatMap((link) => {
          const isHighlighted = highlightedLinkIds.has(String(link.id));
          const count = link.properties?.isPredicted
            ? (allowHighlightedParticles ? 4 : 2)
            : isHighlighted
              ? (allowHighlightedParticles ? 3 : 1)
              : (allowAmbientParticles ? 2 : 0);
          return Array.from({ length: count }, (_, index) => ({
            id: `${link.id}-particle-${index}`,
            linkId: link.id,
            offset: (index + 1) / (count + 1),
          }));
        }),
        (particle) => particle.id
      )
      .join('circle')
      .attr('r', (particle) => {
        const link = links.find((item) => item.id === particle.linkId);
        if (link?.properties?.isPredicted) return 3.2;
        return highlightedLinkIds.has(String(particle.linkId)) ? 2.5 : 2.1;
      })
      .attr('fill', (particle) => {
        const link = links.find((item) => item.id === particle.linkId);
        if (link?.properties?.isPredicted) return '#ec4899';
        if (highlightedLinkIds.has(String(particle.linkId))) return '#334155';
        return link?.color || '#64748B';
      })
      .attr('opacity', (particle) => {
        const link = links.find((item) => item.id === particle.linkId);
        if (link?.properties?.isPredicted) return 0.92;
        return highlightedLinkIds.has(String(particle.linkId)) ? 0.82 : 0.68;
      });
    particleSelectionRef.current = particleSelection;

    const haloSelection = haloLayer
      .selectAll('circle')
      .data(nodes, (node) => node.id)
      .join('circle')
      .attr('r', (node) => getNodeRadius(node) + (String(selectedNodeId) === String(node.id) ? 12 : 8))
      .attr('fill', (node) => withAlpha(node.color || '#93C5FD', String(selectedNodeId) === String(node.id) ? '24' : '18'))
      .attr('stroke', (node) => withAlpha(node.color || '#93C5FD', String(selectedNodeId) === String(node.id) ? '7A' : '48'))
      .attr('stroke-width', (node) => (String(selectedNodeId) === String(node.id) ? 2.8 : 1.5))
      .attr('display', (node) => (
        String(selectedNodeId) === String(node.id) || String(hoverNodeId) === String(node.id)
          ? null
          : 'none'
      ))
      .attr('pointer-events', 'none');
    haloSelectionRef.current = haloSelection;

    const nodeSelection = nodeLayer
      .selectAll('circle')
      .data(nodes, (node) => node.id)
      .join('circle')
      .attr('r', (node) => getNodeRadius(node))
      .attr('fill', (node) => {
        const color = node.color || '#93C5FD';
        const isHighlighted = highlightedNodeIds.has(String(node.id));
        return hasPathHighlights && !isHighlighted ? withAlpha(color, '55') : color;
      })
      .attr('stroke', (node) => {
        const color = node.color || '#93C5FD';
        const isSelected = String(selectedNodeId) === String(node.id);
        const isHighlighted = highlightedNodeIds.has(String(node.id));
        return isSelected || isHighlighted ? withAlpha(color, 'FF') : withAlpha(color, 'AA');
      })
      .attr('stroke-width', (node) => {
        const isSelected = String(selectedNodeId) === String(node.id);
        const isHighlighted = highlightedNodeIds.has(String(node.id));
        return isSelected || isHighlighted ? 3.2 : 1.8;
      })
      .style('cursor', 'pointer')
      .on('mouseenter', (_, node) => setHoverNodeId(String(node.id)))
      .on('mouseleave', () => setHoverNodeId(null))
      .on('click', (_, node) => {
        handleNodeClick(node);
      })
      .on('dblclick', (_, node) => {
        setSelectedNodeId(String(node.id));
        setCrudMode('edit');
        setCrudOpen(true);
      });
    nodeSelectionRef.current = nodeSelection;

    const nodeHighlightSelection = nodeHighlightLayer
      .selectAll('circle')
      .data(nodes, (node) => node.id)
      .join('circle')
      .attr('r', (node) => Math.max(2.4, getNodeRadius(node) * 0.42))
      .attr('fill', 'rgba(255,255,255,0.72)')
      .attr('pointer-events', 'none');
    nodeHighlightSelectionRef.current = nodeHighlightSelection;

    const dragBehavior = d3Drag()
      .on('start', (event, node) => {
        if (!event.active) simulation.alphaTarget(0.25).restart();
        node.fx = node.x;
        node.fy = node.y;
      })
      .on('drag', (event, node) => {
        node.fx = event.x;
        node.fy = event.y;
      })
      .on('end', (event, node) => {
        if (!event.active) simulation.alphaTarget(0);
      });

    nodeSelection.call(dragBehavior);

    const labelSelection = labelLayer
      .selectAll('text')
      .data(nodes)
      .join('text')
      .attr('font-size', 11)
      .attr('font-weight', 600)
      .attr('fill', '#1f2937')
      .attr('text-anchor', 'middle')
      .attr('display', (node) => {
        const zoomReady = currentZoomScaleRef.current >= nodeLabelZoomThreshold;
        const shouldShow = canRenderAmbientNodeLabels
          || highlightedNodeIds.has(String(node.id))
          || String(hoverNodeId) === String(node.id)
          || String(selectedNodeId) === String(node.id);
        return shouldShow && zoomReady ? null : 'none';
      })
      .text((node) => node.name || node.id);
    labelSelectionRef.current = labelSelection;

    const relationshipLabelSelection = relLabelLayer
      .selectAll('text')
      .data(links)
      .join('text')
      .attr('font-size', 10)
      .attr('font-weight', 500)
      .attr('fill', '#475569')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .text((link) => link.type || '');
    relationshipLabelSelectionRef.current = relationshipLabelSelection;

    const relationshipLabelBackgroundSelection = relLabelBackgroundLayer
      .selectAll('rect')
      .data(links)
      .join('rect')
      .attr('rx', 999)
      .attr('ry', 999)
      .attr('fill', 'rgba(255,255,255,0.92)')
      .attr('stroke', 'rgba(148,163,184,0.42)');
    relationshipLabelBackgroundSelectionRef.current = relationshipLabelBackgroundSelection;

    const zoomBehavior = d3Zoom()
      .scaleExtent([0.2, 4])
      .on('zoom', (event) => {
        currentZoomScaleRef.current = event.transform.k;
        viewport.attr('transform', event.transform);
        if (labelSelectionRef.current) {
          labelSelectionRef.current.attr('display', (node) => {
            const zoomReady = currentZoomScaleRef.current >= nodeLabelZoomThreshold;
            const shouldShow = canRenderAmbientNodeLabels
              || highlightedNodeIds.has(String(node.id))
              || String(hoverNodeId) === String(node.id)
              || String(selectedNodeId) === String(node.id);
            return shouldShow && zoomReady ? null : 'none';
          });
        }
        if (relationshipLabelSelectionRef.current) {
          relationshipLabelSelectionRef.current.attr('display', (link) => {
            if (!shouldRenderRelationshipLabels || currentZoomScaleRef.current < relationshipLabelZoomThreshold) return 'none';
            const placement = getLinkLabelPlacement(
              link,
              { x: link.source.x || 0, y: link.source.y || 0 },
              { x: link.target.x || 0, y: link.target.y || 0 },
              1
            );
            return placement && placement.length >= 40 ? null : 'none';
          });
        }
        if (relationshipLabelBackgroundSelectionRef.current) {
          relationshipLabelBackgroundSelectionRef.current.attr('display', (link) => {
            if (!shouldRenderRelationshipLabels || currentZoomScaleRef.current < relationshipLabelZoomThreshold) return 'none';
            const placement = getLinkLabelPlacement(
              link,
              { x: link.source.x || 0, y: link.source.y || 0 },
              { x: link.target.x || 0, y: link.target.y || 0 },
              1
            );
            return placement && placement.length >= 40 ? null : 'none';
          });
        }
      });

    zoomBehaviorRef.current = zoomBehavior;
    svg.call(zoomBehavior);

    let fitted = false;

    let frameHandle = null;

    const renderTick = () => {
      frameHandle = null;

      linkSelection
        .attr('x1', (link) => link.source.x)
        .attr('y1', (link) => link.source.y)
        .attr('x2', (link) => link.target.x)
        .attr('y2', (link) => link.target.y);

      linkUnderlaySelection
        .attr('x1', (link) => link.source.x)
        .attr('y1', (link) => link.source.y)
        .attr('x2', (link) => link.target.x)
        .attr('y2', (link) => link.target.y);

      particleSelection
        .attr('cx', (particle) => {
          const link = links.find((item) => item.id === particle.linkId);
          if (!link) return -1000;
          const baseSpeed = link.properties?.isPredicted ? 0.018 : highlightedLinkIds.has(String(link.id)) ? 0.012 : 0.0075;
          const speed = baseSpeed * particleSpeed;
          particle.offset = (particle.offset + speed) % 1;
          return (link.source.x || 0) + ((link.target.x || 0) - (link.source.x || 0)) * particle.offset;
        })
        .attr('cy', (particle) => {
          const link = links.find((item) => item.id === particle.linkId);
          if (!link) return -1000;
          return (link.source.y || 0) + ((link.target.y || 0) - (link.source.y || 0)) * particle.offset;
        });

      nodeSelection
        .attr('cx', (node) => node.x)
        .attr('cy', (node) => node.y);

      nodeHighlightSelection
        .attr('cx', (node) => (node.x || 0) - Math.max(1.4, getNodeRadius(node) * 0.22))
        .attr('cy', (node) => (node.y || 0) - Math.max(1.4, getNodeRadius(node) * 0.22))
        .attr('opacity', (node) => {
          if (String(selectedNodeId) === String(node.id)) return 0.95;
          if (String(hoverNodeId) === String(node.id)) return 0.84;
          return 0.52;
        });

      haloSelection
        .attr('cx', (node) => node.x)
        .attr('cy', (node) => node.y)
        .attr('r', (node) => {
          const pulse = String(selectedNodeId) === String(node.id)
            ? 10 + Math.sin(Date.now() / 180) * 2.2
            : 7 + Math.sin(Date.now() / 240) * 1.2;
          return getNodeRadius(node) + pulse;
        });

      labelSelection
        .attr('x', (node) => node.x)
        .attr('y', (node) => node.y + getNodeRadius(node) + 16);

      if (shouldRenderRelationshipLabels) {
        relationshipLabelSelection.each(function updateRelationshipLabel(link) {
          const placement = getLinkLabelPlacement(
            link,
            { x: link.source.x || 0, y: link.source.y || 0 },
            { x: link.target.x || 0, y: link.target.y || 0 },
            1
          );
          const textSelection = select(this);
          if (!placement || placement.length < 40) {
            textSelection.attr('display', 'none');
            return;
          }
          textSelection
            .attr('display', null)
            .attr('x', placement.x)
            .attr('y', placement.y)
            .attr('transform', `rotate(${(placement.angle * 180) / Math.PI}, ${placement.x}, ${placement.y})`);
        });

        relationshipLabelBackgroundSelection.each(function updateRelationshipBackground(link) {
          const placement = getLinkLabelPlacement(
            link,
            { x: link.source.x || 0, y: link.source.y || 0 },
            { x: link.target.x || 0, y: link.target.y || 0 },
            1
          );
          const rectSelection = select(this);
          if (!placement || placement.length < 40) {
            rectSelection.attr('display', 'none');
            return;
          }

          const label = link.type || '';
          const width = Math.max(44, label.length * 6.9 + 14);
          const height = 18;
          rectSelection
            .attr('display', null)
            .attr('x', placement.x - width / 2)
            .attr('y', placement.y - height / 2)
            .attr('width', width)
            .attr('height', height)
            .attr('transform', `rotate(${(placement.angle * 180) / Math.PI}, ${placement.x}, ${placement.y})`);
        });
      }

      if (!fitted && simulation.alpha() < 0.12) {
        fitted = true;
        fitGraphToViewport(svg, zoomBehavior, nodes, width, height);
      }
    };

    simulation.on('tick', () => {
      if (frameHandle !== null) return;
      frameHandle = window.requestAnimationFrame(renderTick);
    });

    window.setTimeout(() => {
      if (!fitted) {
        fitted = true;
        fitGraphToViewport(svg, zoomBehavior, nodes, width, height, 260);
      }
    }, 700);

    return () => {
      if (frameHandle !== null) window.cancelAnimationFrame(frameHandle);
      labelSelectionRef.current = null;
      relationshipLabelSelectionRef.current = null;
      relationshipLabelBackgroundSelectionRef.current = null;
      particleSelectionRef.current = null;
      haloSelectionRef.current = null;
      nodeSelectionRef.current = null;
      nodeHighlightSelectionRef.current = null;
      simulationNodesRef.current = [];
      svg.select('.hybrid-grid').remove();
      svg.select('defs').remove();
      simulation.stop();
    };
  }, [
    graphNodes,
    graphLinks,
    allowAmbientParticles,
    allowHighlightedParticles,
    detailLevel,
    highlightedNodeIds,
    highlightedLinkIds,
    nodeLabelZoomThreshold,
    particleSpeed,
    radialStrength,
    relationshipLabelZoomThreshold,
    showGrid,
    traversalModeActive,
  ]);

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

  useEffect(() => {
    if (!resetPinnedSignal && !resetViewSignal) return;
    const simulation = simulationRef.current;
    if (!simulation) return;
    simulation.nodes().forEach((node) => {
      node.fx = null;
      node.fy = null;
    });
    simulation.alpha(0.35).restart();
    clearFocus();
  }, [resetPinnedSignal, resetViewSignal]);

  const openNodeEditor = () => {
    if (!activeNode) return;
    setCrudMode('edit');
    setCrudOpen(true);
  };

  if (!graphNodes.length) {
    return (
      <div className="flex h-full items-center justify-center rounded-[26px] border border-dashed border-border/60 bg-background/60">
        <div className="flex items-center gap-3 rounded-2xl border border-border/50 bg-card/90 px-4 py-3 text-sm text-muted-foreground shadow-sm">
          <AlertCircle className="h-4 w-4 text-emerald-600" />
          <span>{traversalModeActive && traversalPath.length ? 'No nodes in this traversal slice.' : 'No nodes match the current graph filters.'}</span>
        </div>
      </div>
    );
  }

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
          <svg ref={svgRef} className="h-full w-full cursor-grab active:cursor-grabbing">
            <g ref={viewportRef} />
          </svg>
        )}

        {!loading && hydrating ? (
          <div className="pointer-events-none absolute right-4 top-4 z-20 rounded-full border border-border/60 bg-card/92 px-3 py-1.5 text-[11px] font-medium text-muted-foreground shadow-sm backdrop-blur-xl">
            Loading more nodes in background...
          </div>
        ) : null}
        </div>

        {!_traversalMode && !hideEngineHud ? (
          <div className="absolute left-4 top-4 z-20 w-[280px] rounded-[22px] border border-border/60 bg-card/92 p-3 shadow-[0_18px_38px_rgba(15,23,42,0.12)] backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]" />
                  Hybrid Engine
                </div>
                <div className="mt-1 text-xs text-slate-600">D3 drag physics with the existing graph workspace UI.</div>
              </div>
              <button
                type="button"
                onClick={() => requestFitGraph(420)}
                className="rounded-full border border-border/60 bg-background/80 px-3 py-1.5 text-[11px] font-semibold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-700"
              >
                Re-align
              </button>
            </div>

            <div className="mt-3 space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-medium text-slate-600">
                  <span className="inline-flex items-center gap-1"><Activity className="h-3 w-3" /> Radial gravity</span>
                  <span>{Math.round(radialStrength * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.5"
                  step="0.01"
                  value={radialStrength}
                  onChange={(event) => setRadialStrength(Number(event.target.value))}
                  className="h-2 w-full cursor-pointer accent-emerald-600"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-medium text-slate-600">
                  <span className="inline-flex items-center gap-1"><Zap className="h-3 w-3" /> Particle flow</span>
                  <span>{particleSpeed.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.4"
                  max="3"
                  step="0.1"
                  value={particleSpeed}
                  onChange={(event) => setParticleSpeed(Number(event.target.value))}
                  className="h-2 w-full cursor-pointer accent-emerald-600"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowGrid((value) => !value)}
                  className={[
                    'flex-1 rounded-2xl border px-3 py-2 text-[11px] font-semibold transition',
                    showGrid
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-border/60 bg-background/80 text-slate-600 hover:bg-slate-50',
                  ].join(' ')}
                >
                  {showGrid ? 'Grid on' : 'Grid off'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRadialStrength(0.14);
                    setParticleSpeed(1.4);
                    setShowGrid(true);
                    requestFitGraph(420);
                  }}
                  className="flex-1 rounded-2xl border border-border/60 bg-background/80 px-3 py-2 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Reset HUD
                </button>
              </div>

              <div className="rounded-2xl border border-border/60 bg-background/72 px-3 py-2 text-[11px] text-slate-600">
                {graphNodes.length > 2500
                  ? 'Large graph mode is active. The engine keeps the motion lighter, but focused links and particles still stand out.'
                  : 'Hover or click a node to reveal focus, labels, and richer link motion without clutter.'}
              </div>
            </div>
          </div>
        ) : null}

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
              setSelectedNodeId(null);
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
