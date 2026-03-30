import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { PieChart } from 'lucide-react';
import { dashboardService } from '../../services/dashboardService';
import { cn } from '../../utils/cn';

/**
 * Node Type Distribution Card
 * Shows the composition of your knowledge graph by entity type
 * Updates dynamically from the actual Neo4j database
 */
export function NodeTypeDistributionCard({ folderId = null }) {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalNodes, setTotalNodes] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await dashboardService.getNodeTypeDistribution(folderId);
        setTypes(data);
        const total = data.reduce((sum, t) => sum + t.count, 0);
        setTotalNodes(total);
      } catch (err) {
        console.error(err);
        setError('Failed to load node types');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [folderId]);

  if (loading) {
    return (
      <Card className="hover:border-primary/10 transition-all duration-500 ease-out">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <PieChart className="w-4 h-4 text-primary" />
            Node Type Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || types.length === 0) {
    return (
      <Card className="hover:border-primary/10 transition-all duration-500 ease-out">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <PieChart className="w-4 h-4 text-primary" />
            Node Type Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground text-sm">
            <PieChart className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p>{error || 'No node types found'}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Color palette for different types
  const colors = [
    'bg-blue-500',
    'bg-purple-500',
    'bg-emerald-500',
    'bg-amber-500',
    'bg-pink-500',
    'bg-cyan-500',
    'bg-rose-500',
    'bg-indigo-500',
  ];

  return (
    <Card className="hover:border-primary/10 transition-all duration-500 ease-out">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <PieChart className="w-4 h-4 text-primary" />
          Node Type Distribution
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          Total: <span className="font-semibold">{totalNodes.toLocaleString()}</span> entities
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {types.slice(0, 6).map((type, idx) => {
            const percentage = totalNodes > 0 ? (type.count / totalNodes) * 100 : 0;
            
            return (
              <div key={type.type} className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={cn('w-3 h-3 rounded-full shrink-0', colors[idx % colors.length])} />
                    <p className="text-sm font-medium truncate">{type.type}</p>
                  </div>
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <span className="text-xs text-muted-foreground">{type.count.toLocaleString()}</span>
                    <span className="text-xs font-semibold text-primary">{percentage.toFixed(0)}%</span>
                  </div>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn('h-full transition-all duration-500 ease-out', colors[idx % colors.length])}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
          
          {types.length > 6 && (
            <div className="pt-2 text-xs text-muted-foreground text-center">
              +{types.length - 6} more types
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
