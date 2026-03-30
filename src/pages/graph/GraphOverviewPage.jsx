import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { FolderOpen, Network, FileText } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { graphService } from '../../services/graphService';
import { filterGraphData } from './filterGraphData';
import { GraphNodeCrudModal } from '../../components/crud';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function GraphOverviewPage(props) {
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
  const [crudOpen, setCrudOpen] = useState(false);
  const [crudMode, setCrudMode] = useState('create');
  const [activeNode, setActiveNode] = useState(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const forceRefreshRef = useRef(false);

  useEffect(() => {
    const handleCrud = () => {
      forceRefreshRef.current = true;
      setRefreshToken((value) => value + 1);
    };

    window.addEventListener('nnv2:graph-crud', handleCrud);
    return () => window.removeEventListener('nnv2:graph-crud', handleCrud);
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        if (!folderId) {
          setGraphData({ nodes: [], links: [], total_nodes: 0, total_links: 0 });
          return;
        }
        const data = await graphService.getFolder(folderId, 10000, { force: forceRefreshRef.current });
        setGraphData(data);
      } catch (err) {
        console.error('Graph overview load failed:', err);
      } finally {
        forceRefreshRef.current = false;
        setLoading(false);
      }
    };
    load();
  }, [folderId, refreshToken]);

  const filteredGraph = useMemo(
    () => filterGraphData(graphData, { nodeTypeFilters, relationshipTypeFilters, minDegree, showOrphans, nodeSearch }),
    [graphData, nodeTypeFilters, relationshipTypeFilters, minDegree, showOrphans, nodeSearch]
  );

  const nodeTypeCounts = useMemo(() => {
    const counts = {};
    filteredGraph.nodes.forEach((node) => {
      const type = node.type || 'unknown';
      counts[type] = (counts[type] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([type, value]) => ({ type, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 12);
  }, [filteredGraph.nodes]);

  const filteredNodes = useMemo(() => filteredGraph.nodes.slice(0, 200), [filteredGraph.nodes]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Graph Overview</h1>
          <p className="text-sm text-muted-foreground">High-level summary and safe subset UI for large graphs.</p>
        </div>
        <Button
          variant="gradient"
          size="sm"
          className="gap-2"
          onClick={() => {
            setCrudMode('create');
            setActiveNode(null);
            setCrudOpen(true);
          }}
        >
          Add Node
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (<Skeleton key={i} className="h-24 rounded-lg" />))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-primary"><FolderOpen className="w-4 h-4" /> Nodes</div>
                <p className="text-3xl font-bold">{filteredGraph.nodes.length.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Loaded up to 20k rows, total may exceed</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-primary"><Network className="w-4 h-4" /> Links</div>
                <p className="text-3xl font-bold">{filteredGraph.links.length.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Limited to avoid browser hang</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-primary"><FileText className="w-4 h-4" /> Types</div>
                <p className="text-3xl font-bold">{new Set(filteredGraph.nodes.map((n) => n.type || 'unknown')).size}</p>
                <p className="text-xs text-muted-foreground">Top 12 shown in chart</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-4">
              <h2 className="mb-3 text-sm font-semibold">Node type distribution</h2>
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
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold">Sample nodes (first 200)</h2>
                <span className="text-xs text-muted-foreground">Edit or delete directly from the table</span>
              </div>
              <div className="max-h-64 overflow-y-auto rounded-lg border border-border">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-muted/30">
                    <tr>
                      <th className="p-2 text-left">Name</th>
                      <th className="p-2 text-left">Type</th>
                      <th className="p-2 text-left">Degree</th>
                      <th className="p-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredNodes.map((node) => (
                      <tr key={node.id} className="border-t border-border">
                        <td className="px-2 py-1">{node.name}</td>
                        <td className="px-2 py-1">{node.type || 'unknown'}</td>
                        <td className="px-2 py-1">{node.degree ?? '-'}</td>
                        <td className="px-2 py-1 text-right">
                          <button
                            className="mr-2 rounded-md border border-border/50 px-2 py-1 text-[10px] font-medium hover:bg-muted/50"
                            onClick={() => {
                              setCrudMode('edit');
                              setActiveNode(node);
                              setCrudOpen(true);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="rounded-md border border-red-500/20 px-2 py-1 text-[10px] font-medium text-red-600 hover:bg-red-500/5"
                            onClick={async () => {
                              await graphService.deleteNode(node.id, folderId);
                              setRefreshToken((value) => value + 1);
                            }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <GraphNodeCrudModal
        open={crudOpen}
        mode={crudMode}
        folderId={folderId}
        initialNode={activeNode}
        onClose={() => setCrudOpen(false)}
        onSuccess={() => setRefreshToken((value) => value + 1)}
      />
    </div>
  );
}
