import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { Clock, Activity } from 'lucide-react';

export function ActivityFeed({ activity = [], loading = false }) {
  return (
    <Card className="hover:border-primary/10 transition-all duration-500 ease-out">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="w-4 h-4 text-primary" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : activity.length > 0 ? (
          <div className="space-y-1">
            {activity.map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/20 transition-colors duration-300 ease-out"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Activity className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-2">
                    {item.message || item.action || 'Activity'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.timestamp
                      ? new Date(item.timestamp).toLocaleString()
                      : 'Just now'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyActivity />
        )}
      </CardContent>
    </Card>
  );
}

function EmptyActivity() {
  return (
    <div className="text-center py-8 text-muted-foreground text-sm">
      <Activity className="w-8 h-8 mx-auto mb-2 opacity-40" />
      <p>No recent activity</p>
      <p className="text-xs mt-1 text-muted-foreground/50">
        Activity will appear here as you use the platform
      </p>
    </div>
  );
}
