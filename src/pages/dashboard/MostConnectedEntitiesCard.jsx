import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { Brain, Network } from 'lucide-react';
import { dashboardService } from '../../services/dashboardService';
import { cn } from '../../utils/cn';

/**
 * Most Connected Entities Card
 * Shows the most important/central nodes in the knowledge graph
 * Updates dynamically from the actual Neo4j database
 */
export function MostConnectedEntitiesCard({ folderId = null }) {
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await dashboardService.getMostConnectedNodes(folderId, 5);
        setEntities(data);
      } catch (err) {
        console.error(err);
        setError('Failed to load connected entities');
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
            <Brain className="w-4 h-4 text-primary" />
            Most Connected Entities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || entities.length === 0) {
    return (
      <Card className="hover:border-primary/10 transition-all duration-500 ease-out">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Brain className="w-4 h-4 text-primary" />
            Most Connected Entities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground text-sm">
            <Brain className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p>{error || 'No connected entities found'}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate max connections for scaling the bar width
  const maxConnections = Math.max(...entities.map(e => e.connections), 1);

  return (
    <Card className="hover:border-primary/10 transition-all duration-500 ease-out">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Brain className="w-4 h-4 text-primary" />
          Most Connected Entities
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          Central hubs in your knowledge graph by relationship count
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {entities.map((entity, idx) => (
            <div key={entity.id} className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{entity.name}</p>
                  <p className="text-xs text-muted-foreground">{entity.type}</p>
                </div>
                <span className="text-sm font-semibold text-primary whitespace-nowrap">
                  {entity.connections} links
                </span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full transition-all duration-500 ease-out rounded-full',
                    idx === 0 ? 'bg-blue-500' :
                    idx === 1 ? 'bg-purple-500' :
                    idx === 2 ? 'bg-emerald-500' :
                    idx === 3 ? 'bg-amber-500' :
                    'bg-pink-500'
                  )}
                  style={{
                    width: `${(entity.connections / maxConnections) * 100}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
