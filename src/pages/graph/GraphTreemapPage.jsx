import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { graphService } from '../../services/graphService';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';

export default function GraphTreemapPage({ folderId }) {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        if (!folderId) {
          setGraphData({ nodes: [], links: [], total_nodes: 0, total_links: 0 });
        } else {
          const data = await graphService.getFolder(folderId, 10000);
          setGraphData(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [folderId]);

  const treeData = useMemo(() => {
    const groups = {};
    graphData.nodes.forEach((n) => {
      const type = n.type || 'Unknown';
      groups[type] = groups[type] || { name: type, children: [] };
      groups[type].children.push({ name: n.name || n.id, value: 1 });
    });
    return {
      name: 'Graph',
      children: Object.values(groups).map((group) => ({ ...group, children: group.children.slice(0, 150) })),
    };
  }, [graphData.nodes]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Sunburst View</h1>
      <p className="text-sm text-muted-foreground">Hierarchical node distribution (folder scoped) with drill-down-style presentation.</p>
      {loading ? (
        <p className="text-sm">Loading... please wait.</p>
      ) : (
        <Card>
          <CardContent className="h-[550px]">
            <ResponsiveContainer width="100%" height="100%">
              <Treemap
                data={treeData.children}
                dataKey="value"
                ratio={4 / 3}
                stroke="#fff"
                fill="#8884d8"
              >
                <Tooltip />
              </Treemap>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
