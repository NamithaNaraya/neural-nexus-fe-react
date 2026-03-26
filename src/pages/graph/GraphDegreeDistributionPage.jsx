import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { graphService } from '../../services/graphService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Skeleton } from '../../components/ui/Skeleton';

export default function GraphDegreeDistributionPage({ folderId }) {
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

  const degreeData = useMemo(() => {
    const degrees = {};
    graphData.nodes.forEach((node) => {
      const degree = node.degree || 0;
      degrees[degree] = (degrees[degree] || 0) + 1;
    });
    return Object.entries(degrees)
      .map(([degree, count]) => ({ degree: parseInt(degree), count }))
      .sort((a, b) => a.degree - b.degree)
      .slice(0, 30);
  }, [graphData.nodes]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Degree Distribution</h1>
        <p className="text-sm text-muted-foreground">Node connectivity distribution (reveals hubs, influencers, orphans).</p>
      </div>

      {loading ? (
        <Skeleton className="h-96 rounded-lg" />
      ) : (
        <Card>
          <CardContent className="h-[400px] p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={degreeData} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis
                  dataKey="degree"
                  label={{ value: 'Node Degree', position: 'insideBottom', offset: -10 }}
                  tick={{ fontSize: 12 }}
                />
                <YAxis label={{ value: 'Count', angle: -90, position: 'insideLeft' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Legend />
                <Bar dataKey="count" fill="#10b981" name="Nodes" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4">
          <h2 className="text-sm font-semibold mb-3">Statistics</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Max Degree</p>
              <p className="text-lg font-bold">{Math.max(...graphData.nodes.map((n) => n.degree || 0), 0)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Avg Degree</p>
              <p className="text-lg font-bold">
                {graphData.nodes.length > 0
                  ? (graphData.nodes.reduce((sum, n) => sum + (n.degree || 0), 0) / graphData.nodes.length).toFixed(2)
                  : 0}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Orphans (Degree 0)</p>
              <p className="text-lg font-bold">{graphData.nodes.filter((n) => !n.degree || n.degree === 0).length}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Hubs (Degree {'>'} 5)</p>
              <p className="text-lg font-bold">{graphData.nodes.filter((n) => (n.degree || 0) > 5).length}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
