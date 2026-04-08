import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as echarts from 'echarts';
import { AlertCircle } from 'lucide-react';
import { filterGraphData } from './filterGraphData';
import { capGraphData } from './graphDisplayData';
import { getNodeTypeColor, getRelationshipTypeColor, withAlpha } from './colorSystem';

export default function GraphECharts2DPage({
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
}) {
  const chartContainerRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);

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

  const renderedGraph = useMemo(() => capGraphData(filteredGraph, 2500), [filteredGraph]);

  const nodeIndexById = useMemo(
    () => new Map(renderedGraph.nodes.map((node, index) => [String(node.id), index])),
    [renderedGraph.nodes]
  );

  useEffect(() => {
    onStatsChange?.({
      nodes: renderedGraph.nodes.length,
      links: renderedGraph.links.length,
    });
  }, [renderedGraph.nodes.length, renderedGraph.links.length, onStatsChange]);

  const nodeTypes = useMemo(
    () => [...new Set(renderedGraph.nodes.map((node) => node.type || 'Unknown'))],
    [renderedGraph.nodes]
  );

  const categories = useMemo(
    () =>
      nodeTypes.map((type) => ({
        name: type,
        itemStyle: {
          color: getNodeTypeColor(type, nodeTypeColors),
        },
      })),
    [nodeTypes, nodeTypeColors]
  );

  const categoryIndexByName = useMemo(
    () => new Map(categories.map((category, index) => [category.name, index])),
    [categories]
  );

  const displayNameById = useMemo(
    () => new Map(renderedGraph.nodes.map((node) => [String(node.id), node.name || String(node.id)])),
    [renderedGraph.nodes]
  );

  const option = useMemo(() => {
    const hasPathHighlights = highlightedNodeIds.size > 0 || highlightedLinkIds.size > 0;

    return {
      animationDuration: 450,
      animationEasingUpdate: 'cubicOut',
      legend: categories.length
        ? [
            {
              type: 'scroll',
              top: 14,
              left: 18,
              icon: 'circle',
              itemWidth: 10,
              itemHeight: 10,
              textStyle: {
                color: '#475569',
                fontSize: 11,
                fontWeight: 600,
              },
              data: categories.map((category) => category.name),
            },
          ]
        : [],
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(255,255,255,0.96)',
        borderColor: 'rgba(148,163,184,0.25)',
        borderWidth: 1,
        textStyle: {
          color: '#0f172a',
        },
        formatter: (params) => {
          if (params.dataType === 'edge') {
            return `
              <div style="min-width:160px">
                <div style="font-weight:700;margin-bottom:4px;">${params.data.label?.formatter || params.data.name || 'Relationship'}</div>
                <div style="font-size:12px;color:#64748b;">${params.data.source} -> ${params.data.target}</div>
              </div>
            `;
          }

          return `
            <div style="min-width:160px">
              <div style="font-weight:700;margin-bottom:4px;">${params.data.displayName || params.data.name || 'Unnamed node'}</div>
              <div style="font-size:12px;color:#64748b;">${params.data.nodeType || 'Unknown'}</div>
              <div style="font-size:12px;color:#64748b;margin-top:4px;">Degree: ${params.data.value || 0}</div>
            </div>
          `;
        },
      },
      series: [
        {
          type: 'graph',
          layout: 'circular',
          draggable: true,
          roam: true,
          zoom: 0.9,
          left: 0,
          right: 0,
          top: categories.length ? 56 : 0,
          bottom: 0,
          emphasis: {
            focus: 'adjacency',
          },
          data: renderedGraph.nodes.map((node) => {
            const type = node.type || 'Unknown';
            const nodeColor = getNodeTypeColor(type, nodeTypeColors);
            const isHighlighted = highlightedNodeIds.has(String(node.id));
            const symbolSize = Math.max(28, Math.min(54, 28 + Math.log2((node.degree || 1) + 1) * 8));

            return {
              id: String(node.id),
              name: String(node.id),
              displayName: node.name || String(node.id),
              value: node.degree || 0,
              nodeType: type,
              category: categoryIndexByName.get(type) ?? 0,
              draggable: true,
              symbolSize,
              itemStyle: {
                color: hasPathHighlights && !isHighlighted ? withAlpha(nodeColor, '55') : nodeColor,
                borderColor: isHighlighted ? withAlpha(nodeColor, 'FF') : withAlpha(nodeColor, 'B8'),
                borderWidth: isHighlighted ? 4 : 2,
                shadowBlur: isHighlighted ? 18 : 10,
                shadowColor: withAlpha(nodeColor, isHighlighted ? '7A' : '3D'),
              },
              label: {
                show: showNodeLabels || symbolSize >= 36 || isHighlighted,
                formatter: ({ data }) => data.displayName || data.name,
                color: '#0f172a',
                fontWeight: isHighlighted ? 700 : 600,
                fontSize: 11,
                position: 'bottom',
                distance: 8,
              },
            };
          }),
          links: renderedGraph.links.map((link) => {
            const type = link.type || 'Unknown';
            const edgeColor = link.properties?.isPredicted
              ? '#ec4899'
              : getRelationshipTypeColor(type, relationshipTypeColors);
            const isHighlighted = highlightedLinkIds.has(String(link.id));

            return {
              source: String(typeof link.source === 'object' ? link.source.id : link.source),
              target: String(typeof link.target === 'object' ? link.target.id : link.target),
              name: `${displayNameById.get(String(typeof link.source === 'object' ? link.source.id : link.source)) || 'Node'} -> ${displayNameById.get(String(typeof link.target === 'object' ? link.target.id : link.target)) || 'Node'}`,
              value: type,
              lineStyle: {
                color: link.properties?.isPredicted
                  ? '#ec4899'
                  : hasPathHighlights
                    ? (isHighlighted ? withAlpha(edgeColor, 'E0') : withAlpha(edgeColor, '2E'))
                    : withAlpha(edgeColor, '88'),
                width: link.properties?.isPredicted ? 2.6 : (isHighlighted ? 2.2 : 1.3),
                type: link.properties?.isPredicted ? 'dashed' : 'solid',
                opacity: link.properties?.isPredicted ? 0.95 : (isHighlighted ? 0.95 : 0.72),
                curveness: Number(link.parallelIndex || 0) ? 0.12 + Number(link.parallelIndex || 0) * 0.04 : 0,
              },
              label: {
                show: showRelationshipLabels,
                formatter: () => type,
                color: '#475569',
                fontSize: 10,
                backgroundColor: 'rgba(255,255,255,0.82)',
                borderRadius: 999,
                padding: [3, 6],
              },
              emphasis: {
                lineStyle: {
                  width: link.properties?.isPredicted ? 3 : 2.6,
                },
              },
            };
          }),
          categories,
          circular: {
            rotateLabel: false,
          },
          lineStyle: {
            opacity: 0.75,
            curveness: 0.16,
          },
          labelLayout: {
            hideOverlap: true,
          },
          edgeSymbol: ['none', 'arrow'],
          edgeSymbolSize: 6,
        },
      ],
    };
  }, [
    renderedGraph.nodes,
    renderedGraph.links,
    categories,
    categoryIndexByName,
    displayNameById,
    nodeTypeColors,
    relationshipTypeColors,
    highlightedNodeIds,
    highlightedLinkIds,
    showNodeLabels,
    showRelationshipLabels,
  ]);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = echarts.init(chartContainerRef.current, null, {
      renderer: 'canvas',
    });
    chartInstanceRef.current = chart;
    chart.getZr().setCursorStyle('pointer');

    const applyPointerCursor = () => {
      chart.getZr().setCursorStyle('pointer');
      if (chartContainerRef.current) {
        chartContainerRef.current.style.cursor = 'pointer';
      }
    };

    const handleClick = (params) => {
      if (params.dataType === 'node') {
        if (traversalModeActive && onTraversalNodeClick) {
          onTraversalNodeClick({ id: params.data.id });
        }
        setSelectedNode({
          id: params.data.id,
          name: params.data.displayName || params.data.name,
          type: params.data.nodeType,
          degree: params.data.value,
        });
      }
    };

    const handleMouseOver = () => applyPointerCursor();
    const handleMouseOut = () => applyPointerCursor();
    const handleMouseDown = () => applyPointerCursor();
    const handleMouseUp = () => applyPointerCursor();

    chart.on('click', handleClick);
    chart.on('mouseover', handleMouseOver);
    chart.on('mouseout', handleMouseOut);
    chart.on('mousedown', handleMouseDown);
    chart.on('mouseup', handleMouseUp);
    applyPointerCursor();

    const resizeObserver = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => {
          chart.resize();
          applyPointerCursor();
        })
      : null;

    if (resizeObserver) {
      resizeObserver.observe(chartContainerRef.current);
    }

    const handleWindowResize = () => chart.resize();
    window.addEventListener('resize', handleWindowResize);

    return () => {
      chart.off('click', handleClick);
      chart.off('mouseover', handleMouseOver);
      chart.off('mouseout', handleMouseOut);
      chart.off('mousedown', handleMouseDown);
      chart.off('mouseup', handleMouseUp);
      window.removeEventListener('resize', handleWindowResize);
      resizeObserver?.disconnect();
      chart.dispose();
      chartInstanceRef.current = null;
    };
  }, [onTraversalNodeClick, traversalModeActive]);

  useEffect(() => {
    const chart = chartInstanceRef.current;
    if (!chart) return;
    chart.setOption(option, true);
    chart.resize();
    chart.getZr().setCursorStyle('pointer');
    if (chartContainerRef.current) {
      chartContainerRef.current.style.cursor = 'pointer';
    }
  }, [option]);

  useEffect(() => {
    if (!jumpRequest?.nodeId) return;
    const chart = chartInstanceRef.current;
    const targetIndex = nodeIndexById.get(String(jumpRequest.nodeId));

    if (!chart || targetIndex == null) {
      onJumpHandled?.();
      return;
    }

    chart.dispatchAction({
      type: 'downplay',
      seriesIndex: 0,
    });
    chart.dispatchAction({
      type: 'highlight',
      seriesIndex: 0,
      dataIndex: targetIndex,
    });

    const targetNode = renderedGraph.nodes[targetIndex];
    if (targetNode) {
      setSelectedNode({
        id: targetNode.id,
        name: targetNode.name || String(targetNode.id),
        type: targetNode.type || 'Unknown',
        degree: targetNode.degree || 0,
      });
    }

    onJumpHandled?.();
  }, [jumpRequest, nodeIndexById, onJumpHandled, renderedGraph.nodes]);

  useEffect(() => {
    if (!selectedNode?.id) return;
    const stillExists = renderedGraph.nodes.some((node) => String(node.id) === String(selectedNode.id));
    if (!stillExists) {
      setSelectedNode(null);
    }
  }, [renderedGraph.nodes, selectedNode]);

  if (!renderedGraph.nodes.length) {
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
      <div ref={chartContainerRef} className="h-full w-full" />

      {selectedNode ? (
        <div className="pointer-events-none absolute bottom-4 left-4 rounded-2xl border border-border/60 bg-card/92 px-4 py-3 shadow-[0_14px_34px_rgba(15,23,42,0.12)] backdrop-blur-xl">
          <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-emerald-700">Selected node</div>
          <div className="mt-1 text-sm font-semibold text-slate-900">{selectedNode.name}</div>
          <div className="mt-1 text-xs text-muted-foreground">{selectedNode.type}</div>
          <div className="mt-2 text-xs font-medium text-slate-600">Degree {selectedNode.degree || 0}</div>
        </div>
      ) : null}
    </div>
  );
}
