import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { graphService } from '../../services/graphService';
import { Skeleton } from '../../components/ui/Skeleton';
import * as d3 from 'd3';
import { filterGraphData } from './filterGraphData';
import { capGraphData } from './graphDisplayData';

export default function GraphSunburstPage(props) {
  const {
    folderId,
    nodeTypeFilters,
    relationshipTypeFilters,
    minDegree,
    showOrphans,
    nodeSearch,
  } = props;
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        if (!folderId) {
          setGraphData({ nodes: [], links: [] });
          return;
        }
        const response = await graphService.getFolder(folderId, 10000);
        setGraphData(response);
      } catch (err) {
        console.error('Graph sunburst load failed:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [folderId]);

  const filteredGraph = useMemo(
    () => filterGraphData(graphData, { nodeTypeFilters, relationshipTypeFilters, minDegree, showOrphans, nodeSearch }),
    [graphData, nodeTypeFilters, relationshipTypeFilters, minDegree, showOrphans, nodeSearch]
  );

  const renderedGraph = useMemo(() => capGraphData(filteredGraph, 12000), [filteredGraph]);

  const sunburstData = useMemo(() => {
    const groups = {};
    renderedGraph.nodes.forEach((node) => {
      const type = node.type || 'Unknown';
      if (!groups[type]) groups[type] = { name: type, children: [] };
      groups[type].children.push({ name: node.name || node.id, value: 1, id: node.id });
    });

    return {
      name: 'Graph',
      children: Object.values(groups),
    };
  }, [renderedGraph.nodes]);

  const wrapperRef = useRef(null);
  const svgRef = useRef(null);

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
    if (loading || !sunburstData.children.length || !svgRef.current || !containerWidth) return;

    const width = containerWidth;
    const height = 620;
    const radius = Math.min(width, height * 1.15) / 2.35;

    const partition = d3.partition().size([2 * Math.PI, radius]);
    const root = d3
      .hierarchy(sunburstData)
      .sum((d) => d.value)
      .sort((a, b) => b.value - a.value);

    partition(root);

    const color = d3.scaleOrdinal(d3.quantize(d3.interpolateRainbow, root.children.length + 1));

    const arc = d3
      .arc()
      .startAngle((d) => d.x0)
      .endAngle((d) => d.x1)
      .innerRadius((d) => d.y0)
      .outerRadius((d) => d.y1);

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const g = svg.append('g').attr('transform', `translate(${width / 2},${height / 2})`);

    g.selectAll('path')
      .data(root.descendants().filter((d) => d.depth))
      .join('path')
      .attr('d', arc)
      .attr('fill', (d) => color(d.ancestors().map((n) => n.data.name).reverse().join('/')))
      .attr('stroke', '#fff')
      .on('mouseenter', (event, d) => {
        const tooltip = d3
          .select('#sunburst-tooltip')
          .style('opacity', 1)
          .style('left', `${event.pageX + 8}px`)
          .style('top', `${event.pageY + 8}px`)
          .text(`${d.data.name} (${d.value})`);
      })
      .on('mouseleave', () => {
        d3.select('#sunburst-tooltip').style('opacity', 0);
      });

    g.selectAll('text')
      .data(root.descendants().filter((d) => d.depth === 1))
      .join('text')
      .attr('transform', (d) => {
        const x = ((d.x0 + d.x1) / 2) * (180 / Math.PI);
        const y = (d.y0 + d.y1) / 2;
        return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
      })
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .text((d) => d.data.name);
  }, [sunburstData, loading, containerWidth]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Sunburst View</h1>
      <p className="text-sm text-muted-foreground">Click center on segments to drill down.</p>
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
        </div>
      ) : (
        <Card className="w-full">
          <CardContent ref={wrapperRef} className="relative h-[620px] w-full">
            <svg ref={svgRef} width="100%" height="620" viewBox={`0 0 ${containerWidth || 780} 620`} preserveAspectRatio="xMidYMid meet" />
            <div
              id="sunburst-tooltip"
              className="absolute pointer-events-none z-50 rounded-md bg-black/70 px-2 py-1 text-white text-xs opacity-0 transition-opacity"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
