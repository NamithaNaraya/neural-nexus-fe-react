import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  drag as d3Drag,
  forceCenter,
  forceLink,
  forceManyBody,
  forceSimulation,
  select,
  zoom as d3Zoom,
} from 'd3';
import { AlertCircle } from 'lucide-react';
import { GraphNodeCrudModal } from '../../components/crud';
import { filterGraphData } from './filterGraphData';
import { capGraphData } from './graphDisplayData';
import { getNodeTypeColor, getRelationshipTypeColor, withAlpha } from './colorSystem';
import { annotateParallelLinks, getLinkLabelPlacement } from './rendering/linkLabelLayout';

function getNodeRadius(node) {
  const base = Math.max(1, Number(node?.size || node?.degree || 1));
  return Math.max(10, Math.min(18, 10 + Math.log2(base + 1) * 2.8));
}

function getGraphDetailLevel(nodeCount, linkCount) {
  if (nodeCount >= 1400 || linkCount >= 2400) {
    return 'ultra';
  }
  if (nodeCount >= 900 || linkCount >= 1600) {
    return 'dense';
  }
  if (nodeCount >= 500 || linkCount >= 900) {
    return 'medium';
  }
  return 'full';
}

export default function GraphD3ForcePage({
  folderId,
  graphData: graphDataProp = { nodes: [], links: [] },
  nodeTypeFilters,
  relationshipTypeFilters,
  nodeTypeColors = {},
  relationshipTypeColors = {},
  minDegree,
  showOrphans,
  nodeSearch,
  searchResultIds = null,
  highlightedNodeIds = new Set(),
  highlightedLinkIds = new Set(),
  displayGraphData = null,
  traversalModeActive = false,
  traversalPath = [],
  showNodeLabels = false,
  showRelationshipLabels = false,
  jumpRequest = null,
  onTraversalNodeClick = null,
  onJumpHandled = null,
  onStatsChange,
  addNodeSignal,
  resetPinnedSignal = 0,
  resetViewSignal = 0,
}) {
  const svgRef = useRef(null);
  const viewportRef = useRef(null);
  const simulationRef = useRef(null);
  const zoomBehaviorRef = useRef(null);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [crudOpen, setCrudOpen] = useState(false);
  const [crudMode, setCrudMode] = useState('create');

  const activeGraphData = traversalModeActive
    ? displayGraphData || graphDataProp || { nodes: [], links: [] }
    : graphDataProp || { nodes: [], links: [] };

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

  const renderedGraph = useMemo(() => capGraphData(filteredGraph, 2000), [filteredGraph]);

  const graphNodes = useMemo(
    () =>
      renderedGraph.nodes.map((node) => ({
        ...node,
        id: String(node.id),
      })),
    [renderedGraph.nodes]
  );

  const graphLinks = useMemo(
    () =>
      annotateParallelLinks(
        renderedGraph.links.map((link) => ({
          ...link,
          id: String(link.id),
          source: String(typeof link.source === 'object' ? link.source.id : link.source),
          target: String(typeof link.target === 'object' ? link.target.id : link.target),
        }))
      ),
    [renderedGraph.links]
  );

  const nodeLookup = useMemo(
    () => new Map(graphNodes.map((node) => [String(node.id), node])),
    [graphNodes]
  );

  const selectedNode = selectedNodeId ? nodeLookup.get(String(selectedNodeId)) || null : null;
  const detailLevel = useMemo(
    () => getGraphDetailLevel(graphNodes.length, graphLinks.length),
    [graphNodes.length, graphLinks.length]
  );
  const shouldRenderRelationshipLabels = showRelationshipLabels && detailLevel !== 'ultra';
  const shouldRenderAllNodeLabels = showNodeLabels && detailLevel === 'full';

  useEffect(() => {
    onStatsChange?.({
      nodes: graphNodes.length,
      links: graphLinks.length,
    });
  }, [graphNodes.length, graphLinks.length, onStatsChange]);

  useEffect(() => {
    if (!addNodeSignal) return;
    setCrudMode('create');
    setCrudOpen(true);
  }, [addNodeSignal]);

  useEffect(() => {
    if (!selectedNodeId) return;
    if (!nodeLookup.has(String(selectedNodeId))) {
      setSelectedNodeId(null);
    }
  }, [nodeLookup, selectedNodeId]);

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

    const linkDistance = detailLevel === 'ultra' ? 72 : detailLevel === 'dense' ? 84 : detailLevel === 'medium' ? 96 : 110;
    const chargeStrength = detailLevel === 'ultra' ? -110 : detailLevel === 'dense' ? -150 : detailLevel === 'medium' ? -200 : -260;

    const simulation = forceSimulation(nodes)
      .force('link', forceLink(links).id((node) => node.id).distance(linkDistance).strength(0.18))
      .force('charge', forceManyBody().strength(chargeStrength))
      .force('center', forceCenter(width / 2, height / 2));

    simulationRef.current = simulation;

    const linkLayer = viewport.append('g').attr('class', 'd3-links');
    const nodeLayer = viewport.append('g').attr('class', 'd3-nodes');
    const labelLayer = viewport.append('g').attr('class', 'd3-labels');
    const relLabelLayer = viewport.append('g').attr('class', 'd3-rel-labels');
    const relLabelBackgroundLayer = viewport.append('g').attr('class', 'd3-rel-label-backgrounds');

    const linkSelection = linkLayer
      .selectAll('line')
      .data(links, (link) => link.id)
      .join('line')
      .attr('stroke', (link) => {
        const type = link.type || 'Unknown';
        const baseColor = link.properties?.isPredicted
          ? '#ec4899'
          : getRelationshipTypeColor(type, relationshipTypeColors);
        const isHighlighted = highlightedLinkIds.has(String(link.id));
        const hasHighlights = highlightedNodeIds.size > 0 || highlightedLinkIds.size > 0;
        if (link.properties?.isPredicted) return '#ec4899';
        return hasHighlights
          ? (isHighlighted ? withAlpha(baseColor, 'DD') : withAlpha(baseColor, '35'))
          : withAlpha(baseColor, '88');
      })
      .attr('stroke-width', (link) => (link.properties?.isPredicted ? 2.8 : (highlightedLinkIds.has(String(link.id)) ? 2.2 : 1.4)))
      .attr('stroke-dasharray', (link) => (link.properties?.isPredicted ? '8 5' : null));

    const nodeSelection = nodeLayer
      .selectAll('circle')
      .data(nodes, (node) => node.id)
      .join('circle')
      .attr('r', (node) => getNodeRadius(node))
      .attr('fill', (node) => {
        const type = node.type || 'Unknown';
        const color = getNodeTypeColor(type, nodeTypeColors);
        const isHighlighted = highlightedNodeIds.has(String(node.id));
        const hasHighlights = highlightedNodeIds.size > 0 || highlightedLinkIds.size > 0;
        return hasHighlights && !isHighlighted ? withAlpha(color, '55') : color;
      })
      .attr('stroke', (node) => {
        const type = node.type || 'Unknown';
        const color = getNodeTypeColor(type, nodeTypeColors);
        const isSelected = String(selectedNodeId) === String(node.id);
        const isHighlighted = highlightedNodeIds.has(String(node.id));
        return isSelected || isHighlighted ? withAlpha(color, 'FF') : withAlpha(color, 'AA');
      })
      .attr('stroke-width', (node) => {
        const isSelected = String(selectedNodeId) === String(node.id);
        const isHighlighted = highlightedNodeIds.has(String(node.id));
        return isSelected || isHighlighted ? 3.5 : 1.8;
      })
      .style('cursor', 'pointer')
      .on('click', (_, node) => {
        setSelectedNodeId(String(node.id));
        if (traversalModeActive && onTraversalNodeClick) {
          onTraversalNodeClick({ id: String(node.id) });
        }
      })
      .on('dblclick', (_, node) => {
        setSelectedNodeId(String(node.id));
        setCrudMode('edit');
        setCrudOpen(true);
      });

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
      .data(
        shouldRenderAllNodeLabels
          ? nodes
          : nodes.filter((node) => highlightedNodeIds.has(String(node.id)) || String(selectedNodeId) === String(node.id))
      )
      .join('text')
      .attr('font-size', 11)
      .attr('font-weight', 600)
      .attr('fill', '#1f2937')
      .attr('text-anchor', 'middle')
      .text((node) => node.name || node.id);

    const relationshipLabelSelection = relLabelLayer
      .selectAll('text')
      .data(shouldRenderRelationshipLabels ? links : [])
      .join('text')
      .attr('font-size', 10)
      .attr('font-weight', 500)
      .attr('fill', '#475569')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .text((link) => link.type || '');

    const relationshipLabelBackgroundSelection = relLabelBackgroundLayer
      .selectAll('rect')
      .data(shouldRenderRelationshipLabels ? links : [])
      .join('rect')
      .attr('rx', 999)
      .attr('ry', 999)
      .attr('fill', 'rgba(255,255,255,0.92)')
      .attr('stroke', 'rgba(148,163,184,0.42)');

    const zoomBehavior = d3Zoom()
      .scaleExtent([0.2, 4])
      .on('zoom', (event) => {
        viewport.attr('transform', event.transform);
      });

    zoomBehaviorRef.current = zoomBehavior;
    svg.call(zoomBehavior);

    let frameHandle = null;

    const renderTick = () => {
      frameHandle = null;

      linkSelection
        .attr('x1', (link) => link.source.x)
        .attr('y1', (link) => link.source.y)
        .attr('x2', (link) => link.target.x)
        .attr('y2', (link) => link.target.y);

      nodeSelection
        .attr('cx', (node) => node.x)
        .attr('cy', (node) => node.y);

      labelSelection
        .attr('x', (node) => node.x)
        .attr('y', (node) => node.y + getNodeRadius(node) + 16);

      if (shouldRenderRelationshipLabels) {
        relationshipLabelSelection.each(function updateRelationshipLabel(link) {
          const sourcePoint = { x: link.source.x || 0, y: link.source.y || 0 };
          const targetPoint = { x: link.target.x || 0, y: link.target.y || 0 };
          const placement = getLinkLabelPlacement(link, sourcePoint, targetPoint, 1);
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

        relationshipLabelBackgroundSelection.each(function updateRelationshipLabelBackground(link) {
          const sourcePoint = { x: link.source.x || 0, y: link.source.y || 0 };
          const targetPoint = { x: link.target.x || 0, y: link.target.y || 0 };
          const placement = getLinkLabelPlacement(link, sourcePoint, targetPoint, 1);
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
    };

    simulation.on('tick', () => {
      if (frameHandle !== null) return;
      frameHandle = window.requestAnimationFrame(renderTick);
    });

    return () => {
      if (frameHandle !== null) {
        window.cancelAnimationFrame(frameHandle);
      }
      simulation.stop();
    };
  }, [
    graphNodes,
    graphLinks,
    detailLevel,
    highlightedNodeIds,
    highlightedLinkIds,
    nodeTypeColors,
    relationshipTypeColors,
    selectedNodeId,
    showNodeLabels,
    showRelationshipLabels,
    shouldRenderAllNodeLabels,
    shouldRenderRelationshipLabels,
    traversalModeActive,
    onTraversalNodeClick,
  ]);

  useEffect(() => {
    if (!jumpRequest?.nodeId) return;
    if (!nodeLookup.has(String(jumpRequest.nodeId))) {
      onJumpHandled?.();
      return;
    }
    setSelectedNodeId(String(jumpRequest.nodeId));
    onJumpHandled?.();
  }, [jumpRequest, nodeLookup, onJumpHandled]);

  useEffect(() => {
    if (!resetPinnedSignal && !resetViewSignal) return;
    const simulation = simulationRef.current;
    if (!simulation) return;
    simulation.nodes().forEach((node) => {
      node.fx = null;
      node.fy = null;
    });
    simulation.alpha(0.35).restart();
  }, [resetPinnedSignal, resetViewSignal]);

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
    <div className="relative h-full w-full overflow-hidden rounded-[26px] border border-border/60 bg-background">
      <svg ref={svgRef} className="h-full w-full cursor-grab active:cursor-grabbing">
        <g ref={viewportRef} />
      </svg>

      {selectedNode ? (
        <div className="pointer-events-none absolute bottom-4 left-4 rounded-2xl border border-border/60 bg-card/92 px-4 py-3 shadow-[0_14px_34px_rgba(15,23,42,0.12)] backdrop-blur-xl">
          <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-emerald-700">D3 node</div>
          <div className="mt-1 text-sm font-semibold text-slate-900">{selectedNode.name || selectedNode.id}</div>
          <div className="mt-1 text-xs text-muted-foreground">{selectedNode.type || 'Unknown'}</div>
          <div className="mt-2 text-xs font-medium text-slate-600">Degree {selectedNode.degree || 0}</div>
        </div>
      ) : null}

      {detailLevel !== 'full' ? (
        <div className="pointer-events-none absolute right-4 top-4 rounded-2xl border border-border/60 bg-card/92 px-3 py-2 text-xs text-slate-600 shadow-[0_14px_34px_rgba(15,23,42,0.12)] backdrop-blur-xl">
          <span className="font-semibold text-slate-800">Performance mode</span>
          <span className="ml-2">
            {detailLevel === 'ultra'
              ? 'Labels are trimmed for large graphs.'
              : 'Only key labels are shown while the graph is dense.'}
          </span>
        </div>
      ) : null}

      <GraphNodeCrudModal
        open={crudOpen}
        mode={crudMode}
        folderId={folderId}
        initialNode={selectedNode}
        onClose={() => setCrudOpen(false)}
        onSuccess={() => setCrudOpen(false)}
      />
    </div>
  );
}
