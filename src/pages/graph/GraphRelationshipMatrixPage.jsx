import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { graphService } from '../../services/graphService';
import { Skeleton } from '../../components/ui/Skeleton';

export default function GraphRelationshipMatrixPage({ folderId }) {
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

  const matrix = useMemo(() => {
    const nodeTypes = [...new Set(graphData.nodes.map((n) => n.type || 'Unknown'))].sort();
    const counts = {};

    nodeTypes.forEach((t1) => {
      nodeTypes.forEach((t2) => {
        counts[`${t1}|${t2}`] = 0;
      });
    });

    graphData.links.forEach((link) => {
      const sourceType = graphData.nodes.find((n) => n.id === link.source)?.type || 'Unknown';
      const targetType = graphData.nodes.find((n) => n.id === link.target)?.type || 'Unknown';
      const key = `${sourceType}|${targetType}`;
      if (key in counts) counts[key]++;
    });

    return { nodeTypes, counts };
  }, [graphData.nodes, graphData.links]);

  const maxCount = Math.max(...Object.values(matrix.counts), 1);

  const getColorForCount = (count) => {
    if (count === 0) return '#f3f4f6';
    const intensity = Math.min(count / maxCount, 1);
    const hue = (1 - intensity) * 30;
    return `hsl(${hue}, 100%, ${100 - intensity * 50}%)`;
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Relationship Matrix</h1>
        <p className="text-sm text-muted-foreground">Heat map of relationships between node type pairs. Darker = more connections.</p>
      </div>

      {loading ? (
        <Skeleton className="h-96 rounded-lg" />
      ) : (
        <Card>
          <CardContent className="p-4 overflow-x-auto">
            <table className="border-collapse">
              <thead>
                <tr>
                  <th className="px-2 py-2 border border-gray-300 text-xs font-semibold bg-muted">Type</th>
                  {matrix.nodeTypes.map((type) => (
                    <th
                      key={type}
                      className="px-2 py-2 border border-gray-300 text-xs font-semibold bg-muted text-center min-w-20"
                      style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                    >
                      {type}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrix.nodeTypes.map((t1) => (
                  <tr key={t1}>
                    <td className="px-2 py-2 border border-gray-300 text-xs font-semibold bg-muted">{t1}</td>
                    {matrix.nodeTypes.map((t2) => {
                      const count = matrix.counts[`${t1}|${t2}`] || 0;
                      return (
                        <td
                          key={`${t1}|${t2}`}
                          className="px-2 py-2 border border-gray-300 text-xs font-mono text-center hover:ring-2 hover:ring-primary cursor-pointer transition"
                          style={{ backgroundColor: getColorForCount(count) }}
                          title={`${t1} → ${t2}: ${count} relationship(s)`}
                        >
                          {count > 0 ? count : '—'}
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

      <Card>
        <CardContent className="p-4">
          <h2 className="text-sm font-semibold mb-2">Legend</h2>
          <p className="text-xs text-muted-foreground">
            Cell color indicates relationship density. Light = few connections, Dark = many connections.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
