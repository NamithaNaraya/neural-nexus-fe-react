import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { FolderOpen, Network, FileText } from 'lucide-react';
import { graphService } from '../../services/graphService';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Skeleton } from '../../components/ui/Skeleton';

export default function GraphOverviewPage({ folderId }) {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        if (!folderId) {
          setGraphData({ nodes: [], links: [], total_nodes: 0, total_links: 0 });
          return;
        }
        const data = await graphService.getFolder(folderId, 10000);
        setGraphData(data);
      } catch (err) {
        console.error('Graph overview load failed:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [folderId]);

  const nodeTypeCounts = useMemo(() => {
    const counts = {};
    graphData.nodes.forEach((node) => {
      const type = node.type || 'unknown';
      counts[type] = (counts[type] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([type, value]) => ({ type, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 12);
  }, [graphData.nodes]);

  const filteredNodes = useMemo(() => graphData.nodes.slice(0, 200), [graphData.nodes]);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Graph Overview</h1>
        <p className="text-sm text-muted-foreground">High-level summary and safe subset UI for large graphs.</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (<Skeleton key={i} className="h-24 rounded-lg" />))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-primary"><FolderOpen className="w-4 h-4" /> Nodes</div>
                <p className="text-3xl font-bold">{graphData.nodes.length.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Loaded up to 20k rows, total may exceed</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-primary"><Network className="w-4 h-4" /> Links</div>
                <p className="text-3xl font-bold">{graphData.links.length.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Limited to avoid browser hang</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-primary"><FileText className="w-4 h-4" /> Types</div>
                <p className="text-3xl font-bold">{new Set(graphData.nodes.map((n) => n.type || 'unknown')).size}</p>
                <p className="text-xs text-muted-foreground">Top 12 shown in chart</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-4">
              <h2 className="text-sm font-semibold mb-3">Node type distribution</h2>
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={nodeTypeCounts} margin={{ right: 14, left: 14, top: 10, bottom: 10 }}>
                    <XAxis dataKey="type" tick={{ fontSize: 10 }} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#6366f1" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h2 className="text-sm font-semibold mb-3">Sample nodes (first 200)</h2>
              <div className="max-h-64 overflow-y-auto border border-border rounded-lg">
                <table className="w-full text-xs">
                  <thead className="bg-muted/30 sticky top-0">
                    <tr>
                      <th className="p-2">Name</th>
                      <th className="p-2">Type</th>
                      <th className="p-2">Degree</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredNodes.map((node) => (
                      <tr key={node.id} className="border-t border-border">
                        <td className="px-2 py-1">{node.name}</td>
                        <td className="px-2 py-1">{node.type || 'unknown'}</td>
                        <td className="px-2 py-1">{node.degree ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
