import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { graphService } from '../../services/graphService';
import { Skeleton } from '../../components/ui/Skeleton';
import { ArrowRight } from 'lucide-react';
import { filterGraphData } from './filterGraphData';

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

  const schema = useMemo(() => {
    const nodeTypeCounts = {};
    const relTypeCounts = {};

    filteredGraph.nodes.forEach((node) => {
      const type = node.type || 'Unknown';
      nodeTypeCounts[type] = (nodeTypeCounts[type] || 0) + 1;
    });

    filteredGraph.links.forEach((link) => {
      const type = link.type || 'UNKNOWN';
      relTypeCounts[type] = (relTypeCounts[type] || 0) + 1;
    });

    return { nodeTypeCounts, relTypeCounts };
  }, [filteredGraph.nodes, filteredGraph.links]);

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

  const sortedNodeTypes = Object.entries(schema.nodeTypeCounts).sort((a, b) => b[1] - a[1]);
  const sortedRelTypes = Object.entries(schema.relTypeCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Schema Explorer</h1>
        <p className="text-sm text-muted-foreground">Data model view showing node types, relationship types, and their frequencies.</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
        </div>
      ) : (
        <>
          <Card>
            <CardContent className="p-4">
              <h2 className="text-lg font-semibold mb-4">Node Types</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {sortedNodeTypes.map(([type, count], idx) => (
                  <div
                    key={type}
                    className="p-3 rounded-lg border border-border hover:border-primary transition cursor-pointer"
                    style={{ borderLeftColor: colors[idx % colors.length], borderLeftWidth: 4 }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm">{type}</p>
                        <p className="text-xs text-muted-foreground">{count} nodes</p>
                      </div>
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm"
                        style={{ backgroundColor: colors[idx % colors.length] }}
                      >
                        {count}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h2 className="text-lg font-semibold mb-4">Relationship Types</h2>
              <div className="space-y-2">
                {sortedRelTypes.map(([type, count], idx) => (
                  <div
                    key={type}
                    className="p-3 rounded-lg border border-border hover:border-primary transition flex items-center justify-between"
                    style={{ borderLeftColor: colors[idx % colors.length], borderLeftWidth: 4 }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-semibold">{type}</span>
                    </div>
                    <span className="text-xs bg-muted px-2 py-1 rounded">{count} links</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h2 className="text-lg font-semibold mb-3">Schema Summary</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Total Node Types</p>
                  <p className="text-2xl font-bold">{Object.keys(schema.nodeTypeCounts).length}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Nodes</p>
                  <p className="text-2xl font-bold">{filteredGraph.nodes.length}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Rel Types</p>
                  <p className="text-2xl font-bold">{Object.keys(schema.relTypeCounts).length}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Links</p>
                  <p className="text-2xl font-bold">{filteredGraph.links.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
