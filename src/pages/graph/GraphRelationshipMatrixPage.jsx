import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { graphService } from '../../services/graphService';
import { Skeleton } from '../../components/ui/Skeleton';
import { filterGraphData } from './filterGraphData';
import { capGraphData } from './graphDisplayData';

export default function GraphRelationshipMatrixPage(props) {
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
        const data = await graphService.getFolder(folderId, 10000);
        setGraphData(data);
      } catch (err) {
        console.error('Failed to load graph:', err);
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

  const matrix = useMemo(() => {
    const nodeTypes = [...new Set(renderedGraph.nodes.map((node) => node.type || 'Unknown'))].sort();
    const counts = {};
    const getId = (value) => (typeof value === 'object' ? value?.id : value);

    nodeTypes.forEach((sourceType) => {
      nodeTypes.forEach((targetType) => {
        counts[`${sourceType}|${targetType}`] = 0;
      });
    });

    renderedGraph.links.forEach((link) => {
      const sourceType = renderedGraph.nodes.find((node) => node.id === getId(link.source))?.type || 'Unknown';
      const targetType = renderedGraph.nodes.find((node) => node.id === getId(link.target))?.type || 'Unknown';
      const key = `${sourceType}|${targetType}`;
      if (key in counts) counts[key] += 1;
    });

    return { nodeTypes, counts };
  }, [renderedGraph.nodes, renderedGraph.links]);

  const maxCount = Math.max(...Object.values(matrix.counts), 1);
  const activePairs = Object.values(matrix.counts).filter((count) => count > 0).length;

  const getColorForCount = (count) => {
    if (count === 0) return 'rgba(241, 245, 249, 0.72)';
    const intensity = Math.min(count / maxCount, 1);
    const lightness = 96 - intensity * 42;
    const saturation = 42 + intensity * 28;
    return `hsl(174, ${saturation}%, ${lightness}%)`;
  };

  const getTextColorForCount = (count) => {
    if (count === 0) return '#94A3B8';
    const intensity = Math.min(count / maxCount, 1);
    return intensity > 0.58 ? '#F8FAFC' : '#134E4A';
  };

  return (
    <div className="space-y-5 p-1">
      <div className="grid gap-3 md:grid-cols-3">
        <Card className="border-border/60 bg-card/80 shadow-sm">
          <CardContent className="p-5">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">Node Types</p>
            <p className="mt-2 text-3xl font-semibold text-foreground">{matrix.nodeTypes.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card/80 shadow-sm">
          <CardContent className="p-5">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">Active Pairs</p>
            <p className="mt-2 text-3xl font-semibold text-foreground">{activePairs}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card/80 shadow-sm">
          <CardContent className="p-5">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">Peak Density</p>
            <p className="mt-2 text-3xl font-semibold text-emerald-700 dark:text-emerald-300">{maxCount}</p>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <Skeleton className="h-[32rem] rounded-2xl" />
      ) : (
        <Card className="overflow-hidden border-border/60 bg-card/85 shadow-sm">
          <CardContent className="overflow-auto p-0">
            <table className="w-full border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className="sticky left-0 top-0 z-20 min-w-[160px] border-b border-r border-border/60 bg-card px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    Type
                  </th>
                  {matrix.nodeTypes.map((type) => (
                    <th
                      key={type}
                      className="sticky top-0 z-10 min-w-[144px] border-b border-border/60 bg-card px-4 py-4 text-center text-sm font-semibold text-foreground"
                    >
                      {type}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrix.nodeTypes.map((sourceType) => (
                  <tr key={sourceType}>
                    <td className="sticky left-0 z-10 min-w-[160px] border-r border-border/60 bg-card px-5 py-4 text-sm font-semibold text-foreground">
                      {sourceType}
                    </td>
                    {matrix.nodeTypes.map((targetType) => {
                      const count = matrix.counts[`${sourceType}|${targetType}`] || 0;

                      return (
                        <td
                          key={`${sourceType}|${targetType}`}
                          className="h-24 min-w-[144px] border-b border-r border-border/50 px-4 py-4 text-center align-middle text-base font-semibold transition hover:scale-[1.01] hover:shadow-sm"
                          style={{
                            backgroundColor: getColorForCount(count),
                            color: getTextColorForCount(count),
                          }}
                          title={`${sourceType} -> ${targetType}: ${count} relationship(s)`}
                        >
                          <div className="flex h-full flex-col items-center justify-center gap-1">
                            <span className="text-lg font-semibold">{count > 0 ? count : '—'}</span>
                            <span className="text-[11px] font-medium uppercase tracking-[0.2em] opacity-75">
                              {count > 0 ? 'links' : 'none'}
                            </span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <Card className="border-border/60 bg-card/80 shadow-sm">
        <CardContent className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-sm font-semibold">Legend</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Light cells show weak or no interaction. Deeper teal cells show stronger relationship density.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">Low</span>
            <div className="h-3 w-40 rounded-full bg-gradient-to-r from-slate-100 via-teal-200 to-teal-700" />
            <span className="text-xs text-muted-foreground">High</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
