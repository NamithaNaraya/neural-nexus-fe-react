import React, { useEffect, useMemo, useState } from 'react';
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

export default function GraphSchemaExplorerPage(props) {
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

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        if (!folderId) {
          setGraphData({ nodes: [], links: [] });
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
  }, [folderId]);

  const filteredGraph = useMemo(
    () => filterGraphData(graphData, { nodeTypeFilters, relationshipTypeFilters, minDegree, showOrphans, nodeSearch }),
    [graphData, nodeTypeFilters, relationshipTypeFilters, minDegree, showOrphans, nodeSearch]
  );

  const renderedGraph = useMemo(() => capGraphData(filteredGraph, 12000), [filteredGraph]);

  const schema = useMemo(() => {
    const nodeTypeCounts = {};
    const relTypeCounts = {};

    renderedGraph.nodes.forEach((node) => {
      const type = node.type || 'Unknown';
      nodeTypeCounts[type] = (nodeTypeCounts[type] || 0) + 1;
    });

    renderedGraph.links.forEach((link) => {
      const type = link.type || 'UNKNOWN';
      relTypeCounts[type] = (relTypeCounts[type] || 0) + 1;
    });

    return { nodeTypeCounts, relTypeCounts };
  }, [renderedGraph.nodes, renderedGraph.links]);

  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#14B8A6', '#F97316', '#EC4899', '#64748B'];
  const sortedNodeTypes = Object.entries(schema.nodeTypeCounts).sort((a, b) => b[1] - a[1]);
  const sortedRelTypes = Object.entries(schema.relTypeCounts).sort((a, b) => b[1] - a[1]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Node Types" value={sortedNodeTypes.length} />
        <SummaryCard label="Total Nodes" value={filteredGraph.nodes.length} accentClass="text-emerald-700 dark:text-emerald-300" />
        <SummaryCard label="Relationship Types" value={sortedRelTypes.length} />
        <SummaryCard label="Total Links" value={filteredGraph.links.length} />
      </div>

      <Card className="border-border/60 bg-card/85 shadow-sm">
        <CardContent className="p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Node Types</h2>
              <p className="mt-1 text-sm text-muted-foreground">Most common entity groups in the current filtered dataset.</p>
            </div>
            <div className="rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground">
              {sortedNodeTypes.length} groups
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {sortedNodeTypes.map(([type, count], index) => (
              <div
                key={type}
                className="rounded-2xl border border-border/60 bg-background/70 p-4 shadow-sm transition hover:border-primary/40 hover:shadow-md"
                style={{ borderLeftColor: colors[index % colors.length], borderLeftWidth: 5 }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-foreground">{type}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{count} nodes in this view</p>
                  </div>
                  <div
                    className="flex h-12 min-w-12 items-center justify-center rounded-full text-sm font-semibold text-white shadow-sm"
                    style={{ backgroundColor: colors[index % colors.length] }}
                  >
                    {count}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/85 shadow-sm">
        <CardContent className="p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Relationship Types</h2>
              <p className="mt-1 text-sm text-muted-foreground">Connection patterns ranked by how often they appear after filtering.</p>
            </div>
            <div className="rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground">
              {sortedRelTypes.length} kinds
            </div>
          </div>

          <div className="space-y-3">
            {sortedRelTypes.map(([type, count], index) => {
              const maxCount = sortedRelTypes[0]?.[1] || 1;
              const width = `${Math.max(12, (count / maxCount) * 100)}%`;

              return (
                <div
                  key={type}
                  className="rounded-2xl border border-border/60 bg-background/70 p-4 shadow-sm"
                  style={{ borderLeftColor: colors[index % colors.length], borderLeftWidth: 5 }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold tracking-[0.08em] text-foreground">{type}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{count} links in the filtered graph</p>
                    </div>
                    <div className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                      {count} links
                    </div>
                  </div>
                  <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted/70">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width,
                        backgroundColor: colors[index % colors.length],
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
