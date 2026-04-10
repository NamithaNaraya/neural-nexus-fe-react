import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { graphService } from '../../services/graphService';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import { filterGraphData } from './filterGraphData';
import { capGraphData } from './graphDisplayData';

export default function GraphTreemapPage(props) {
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

  const filteredGraph = useMemo(
    () => filterGraphData(graphData, { nodeTypeFilters, relationshipTypeFilters, minDegree, showOrphans, nodeSearch }),
    [graphData, nodeTypeFilters, relationshipTypeFilters, minDegree, showOrphans, nodeSearch]
  );

  const renderedGraph = useMemo(() => capGraphData(filteredGraph, 12000), [filteredGraph]);
  const brandPrimary = 'hsl(var(--primary))';
  const brandBorder = 'hsl(var(--primary) / 0.24)';
  const tooltipSurface = 'hsl(var(--card) / 0.92)';

  const treeData = useMemo(() => {
    const groups = {};
    renderedGraph.nodes.forEach((n) => {
      const type = n.type || 'Unknown';
      groups[type] = groups[type] || { name: type, children: [] };
      groups[type].children.push({ name: n.name || n.id, value: 1 });
    });
    return {
      name: 'Graph',
      children: Object.values(groups).map((group) => ({ ...group, children: group.children.slice(0, 150) })),
    };
  }, [renderedGraph.nodes]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Treemap View</h1>
      <p className="text-sm text-muted-foreground">Structural node distribution grouped by entity type.</p>
      {loading ? (
        <p className="text-sm">Loading... please wait.</p>
      ) : (
        <Card variant="branded">
          <CardContent className="h-[550px]">
            <ResponsiveContainer width="100%" height="100%">
              <Treemap
                data={treeData.children}
                dataKey="value"
                ratio={4 / 3}
                stroke="rgba(0,0,0,0.05)"
                fill={brandPrimary}
              >
                <Tooltip 
                   contentStyle={{ backgroundColor: tooltipSurface, borderRadius: '12px', border: `1px solid ${brandBorder}` }}
                />
              </Treemap>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
