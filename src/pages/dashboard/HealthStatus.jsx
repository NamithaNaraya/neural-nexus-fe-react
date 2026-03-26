import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { Activity, Database, Server, Cpu } from 'lucide-react';
import { cn } from '../../utils/cn';

const serviceIcons = { neo4j: Database, redis: Server, ollama: Cpu };

export function HealthStatus({ health, loading = false }) {
  const services = health?.services ? Object.entries(health.services) : [];

  return (
    <Card className="hover:border-primary/10 transition-all duration-500 ease-out">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="w-4 h-4 text-primary" />
            System Health
          </CardTitle>
          {health && <StatusBadge status={health.status} />}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-[72px] w-full rounded-xl" />
            ))}
          </div>
        ) : services.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {services.map(([name, info]) => {
              const Icon = serviceIcons[name] || Server;
              const isUp = info.status === 'healthy' || info.status === 'up';
              const isDegraded = info.status === 'degraded';

              return (
                <div
                  key={name}
                  className="flex items-center gap-3 p-4 rounded-xl bg-muted/20 border border-border/30 hover:bg-muted/30 transition-all duration-300 ease-out"
                >
                  <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-300',
                    isUp ? 'bg-emerald-500/10' : isDegraded ? 'bg-amber-500/10' : 'bg-red-500/10'
                  )}>
                    <Icon className={cn(
                      'w-5 h-5 transition-colors duration-300',
                      isUp ? 'text-emerald-500' : isDegraded ? 'text-amber-500' : 'text-red-500'
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold capitalize">{name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <StatusBadge status={info.status} />
                      {info.latency_ms !== undefined && (
                        <span className="text-[10px] text-muted-foreground">
                          {Math.round(info.latency_ms)}ms
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyHealth />
        )}
      </CardContent>
    </Card>
  );
}

function EmptyHealth() {
  return (
    <div className="text-center py-8 text-muted-foreground text-sm">
      <Server className="w-8 h-8 mx-auto mb-2 opacity-40" />
      <p>Connect to backend to view system health</p>
      <p className="text-xs mt-1 text-muted-foreground/50">
        Backend should be running on localhost:8000
      </p>
    </div>
  );
}
