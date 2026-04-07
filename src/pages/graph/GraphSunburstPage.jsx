import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Card, CardContent } from '../../components/ui/Card';
import { graphService } from '../../services/graphService';
import { Skeleton } from '../../components/ui/Skeleton';
import { filterGraphData } from './filterGraphData';
import { capGraphData } from './graphDisplayData';

function SummaryCard({ label, value, accentClass = 'text-foreground' }) {
  return (
    <Card className="border-border/60 bg-card/80 shadow-sm">
      <CardContent className="p-5">
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">{label}</p>
        <p className={`mt-2 text-3xl font-semibold ${accentClass}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function buildSunburstHierarchy(nodes) {
  const grouped = new Map();

  nodes.forEach((node) => {
    const type = node.type || 'Unknown';
    if (!grouped.has(type)) grouped.set(type, []);
    grouped.get(type).push(node);
  });

  const children = Array.from(grouped.entries())
    .sort((a, b) => b[1].length - a[1].length)
    .map(([type, typeNodes]) => {
      const sortedNodes = [...typeNodes].sort((a, b) => String(a.name || a.id).localeCompare(String(b.name || b.id)));
      const limitedNodes = sortedNodes.slice(0, 80);
      const overflowCount = Math.max(0, sortedNodes.length - limitedNodes.length);

      const nodeChildren = limitedNodes.map((node) => ({
        name: node.name || node.id,
        id: node.id,
        value: 1,
      }));

      if (overflowCount > 0) {
        nodeChildren.push({
          name: `Other ${overflowCount}`,
          value: overflowCount,
          synthetic: true,
        });
      }

      return {
        name: type,
        value: typeNodes.length,
        children: nodeChildren,
      };
    });

  return {
    name: 'Graph',
    children,
  };
}

export default function GraphSunburstPage(props) {
  const {
    folderId,
    graphData: graphDataProp = null,
    nodeTypeFilters,
    relationshipTypeFilters,
    minDegree,
    showOrphans,
    nodeSearch,
  } = props;
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const wrapperRef = useRef(null);
  const svgRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        if (!folderId) {
          setGraphData({ nodes: [], links: [] });
          return;
        }
        if (graphDataProp) {
          setGraphData(graphDataProp);
          return;
        }
        const response = await graphService.getFolder(folderId, 10000);
        setGraphData(response || { nodes: [], links: [] });
      } catch (err) {
        console.error('Graph sunburst load failed:', err);
        setGraphData({ nodes: [], links: [] });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [folderId, graphDataProp]);

  const filteredGraph = useMemo(
    () => filterGraphData(graphData, { nodeTypeFilters, relationshipTypeFilters, minDegree, showOrphans, nodeSearch }),
    [graphData, nodeTypeFilters, relationshipTypeFilters, minDegree, showOrphans, nodeSearch]
  );

  const renderedGraph = useMemo(() => capGraphData(filteredGraph, 12000), [filteredGraph]);
  const sunburstData = useMemo(() => buildSunburstHierarchy(renderedGraph.nodes), [renderedGraph.nodes]);
  const typeCount = sunburstData.children.length;
  const densestType = sunburstData.children[0];

  useEffect(() => {
    if (!wrapperRef.current) return undefined;

    const node = wrapperRef.current;
    const updateWidth = () => setContainerWidth(node.clientWidth || 0);
    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    if (loading || !sunburstData.children.length) return;

    const width = Math.max(containerWidth || 0, 720);
    const height = 640;
    const radius = Math.min(width, height) / 2 - 28;

    const root = d3
      .hierarchy(sunburstData)
      .sum((d) => d.value || 0)
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    d3.partition().size([2 * Math.PI, radius])(root);

    const typeNames = sunburstData.children.map((child) => child.name);
    const colorScale = d3
      .scaleOrdinal()
      .domain(typeNames)
      .range(['#3B82F6', '#14B8A6', '#8B5CF6', '#F59E0B', '#10B981', '#F97316', '#EC4899', '#64748B']);

    const arc = d3
      .arc()
      .startAngle((d) => d.x0)
      .endAngle((d) => d.x1)
      .padAngle(0.008)
      .padRadius(radius / 3)
      .innerRadius((d) => d.y0 + (d.depth === 1 ? 18 : 0))
      .outerRadius((d) => Math.max(d.y0 + 20, d.y1 - 2));

    const g = svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    const segments = root.descendants().filter((d) => d.depth > 0 && (d.x1 - d.x0) > 0.01);

    g.selectAll('path')
      .data(segments)
      .join('path')
      .attr('d', arc)
      .attr('fill', (d) => {
        const baseType = d.depth === 1 ? d.data.name : d.ancestors().find((ancestor) => ancestor.depth === 1)?.data.name;
        const baseColor = colorScale(baseType);
        return d.depth === 1 ? baseColor : d3.color(baseColor)?.brighter(0.75)?.formatHex() || baseColor;
      })
      .attr('stroke', 'rgba(255,255,255,0.92)')
      .attr('stroke-width', (d) => (d.depth === 1 ? 2 : 1))
      .append('title')
      .text((d) => `${d.data.name}: ${d.value}`);

    const topLevelLabels = root.descendants().filter((d) => d.depth === 1 && (d.x1 - d.x0) > 0.22);

    g.selectAll('text')
      .data(topLevelLabels)
      .join('text')
      .attr('transform', (d) => {
        const angle = ((d.x0 + d.x1) / 2) * (180 / Math.PI);
        const y = (d.y0 + d.y1) / 2 + 10;
        return `rotate(${angle - 90}) translate(${y},0) rotate(${angle < 180 ? 0 : 180})`;
      })
      .attr('text-anchor', 'middle')
      .attr('alignment-baseline', 'middle')
      .attr('font-size', 12)
      .attr('font-weight', 600)
      .attr('fill', '#1F2937')
      .text((d) => d.data.name);

    const center = g.append('g').attr('text-anchor', 'middle');
    center.append('circle').attr('r', 52).attr('fill', 'rgba(255,255,255,0.92)').attr('stroke', 'rgba(148,163,184,0.25)');
    center.append('text').attr('y', -4).attr('font-size', 14).attr('font-weight', 600).attr('fill', '#0F172A').text('Nodes');
    center.append('text').attr('y', 18).attr('font-size', 22).attr('font-weight', 700).attr('fill', '#0F766E').text(renderedGraph.nodes.length);
  }, [containerWidth, loading, renderedGraph.nodes.length, sunburstData]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-[42rem] rounded-2xl" />
      </div>
    );
  }

  if (!sunburstData.children.length) {
    return (
      <Card className="border-border/60 bg-card/80 shadow-sm">
        <CardContent className="flex h-72 items-center justify-center text-sm text-muted-foreground">
          No nodes available for this sunburst view.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-3">
        <SummaryCard label="Node Types" value={typeCount} />
        <SummaryCard label="Visible Nodes" value={renderedGraph.nodes.length} accentClass="text-emerald-700 dark:text-emerald-300" />
        <SummaryCard label="Largest Group" value={densestType?.name || '—'} />
      </div>

      <Card className="border-border/60 bg-card/85 shadow-sm">
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Sunburst</h2>
              <p className="mt-1 text-sm text-muted-foreground">Outer rings show individual nodes, grouped by type in the inner ring.</p>
            </div>
            <div className="rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground">
              {densestType?.name || 'Unknown'} is largest
            </div>
          </div>

          <div ref={wrapperRef} className="w-full">
            <svg ref={svgRef} className="h-[640px] w-full" preserveAspectRatio="xMidYMid meet" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
