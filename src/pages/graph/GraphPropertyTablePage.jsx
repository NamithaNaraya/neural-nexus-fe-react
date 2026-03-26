import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { graphService } from '../../services/graphService';
import { Skeleton } from '../../components/ui/Skeleton';
import { ChevronDown } from 'lucide-react';

export default function GraphPropertyTablePage({ folderId }) {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

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

  const sortedNodes = useMemo(() => {
    const nodes = [...graphData.nodes];
    nodes.sort((a, b) => {
      let aVal = a[sortBy] || '';
      let bVal = b[sortBy] || '';
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();

      let result = 0;
      if (aVal < bVal) result = -1;
      else if (aVal > bVal) result = 1;
      return sortOrder === 'asc' ? result : -result;
    });
    return nodes.slice(0, 500);
  }, [graphData.nodes, sortBy, sortOrder]);

  const toggleSort = (key) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Property Table</h1>
        <p className="text-sm text-muted-foreground">Sortable table of all nodes with properties. Click column header to sort.</p>
      </div>

      {loading ? (
        <Skeleton className="h-96 rounded-lg" />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full text-sm border-collapse">
                <thead className="sticky top-0 bg-muted/50">
                  <tr className="border-b border-border">
                    <th
                      onClick={() => toggleSort('id')}
                      className="px-4 py-2 text-left font-semibold text-xs text-muted-foreground uppercase cursor-pointer hover:bg-muted"
                    >
                      <div className="flex items-center gap-1">
                        ID {sortBy === 'id' && <ChevronDown className="w-3 h-3" />}
                      </div>
                    </th>
                    <th
                      onClick={() => toggleSort('name')}
                      className="px-4 py-2 text-left font-semibold text-xs text-muted-foreground uppercase cursor-pointer hover:bg-muted"
                    >
                      <div className="flex items-center gap-1">
                        Name {sortBy === 'name' && <ChevronDown className="w-3 h-3" />}
                      </div>
                    </th>
                    <th
                      onClick={() => toggleSort('type')}
                      className="px-4 py-2 text-left font-semibold text-xs text-muted-foreground uppercase cursor-pointer hover:bg-muted"
                    >
                      <div className="flex items-center gap-1">
                        Type {sortBy === 'type' && <ChevronDown className="w-3 h-3" />}
                      </div>
                    </th>
                    <th
                      onClick={() => toggleSort('degree')}
                      className="px-4 py-2 text-left font-semibold text-xs text-muted-foreground uppercase cursor-pointer hover:bg-muted"
                    >
                      <div className="flex items-center gap-1">
                        Degree {sortBy === 'degree' && <ChevronDown className="w-3 h-3" />}
                      </div>
                    </th>
                    <th className="px-4 py-2 text-left font-semibold text-xs text-muted-foreground uppercase">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedNodes.map((node, idx) => (
                    <tr key={node.id} className={idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                      <td className="px-4 py-2 text-xs font-mono text-muted-foreground truncate max-w-xs">{node.id}</td>
                      <td className="px-4 py-2 text-xs font-medium">{node.name || '—'}</td>
                      <td className="px-4 py-2 text-xs">
                        <span className="px-2 py-1 rounded-md bg-primary/10 text-primary text-xs">{node.type || 'Unknown'}</span>
                      </td>
                      <td className="px-4 py-2 text-xs font-semibold">{node.degree || 0}</td>
                      <td className="px-4 py-2 text-xs text-muted-foreground truncate max-w-sm">{node.description || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
