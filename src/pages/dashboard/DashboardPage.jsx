import React from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useDashboard } from '../../hooks/useDashboard';
import { StatsCards } from './StatsCards';
import { HealthStatus } from './HealthStatus';
import { QuickActions } from './QuickActions';
import { ActivityFeed } from './ActivityFeed';
import { cn } from '../../utils/cn';

export default function DashboardPage() {
  const { stats, activity, health, loading, refresh } = useDashboard();

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="gradient-text">Dashboard</span>
          </h1>
          <p className="text-muted-foreground text-sm">
            Your knowledge graph overview and system health at a glance.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refresh}
          className="gap-2 self-start"
          disabled={loading}
        >
          <RefreshCw className={cn('w-4 h-4 transition-transform duration-700', loading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={stats} loading={loading} />

      {/* Health + Quick Actions Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <HealthStatus health={health} loading={loading} />
        </div>
        <QuickActions />
      </div>

      {/* Recent Activity */}
      <ActivityFeed activity={activity} loading={loading} />
    </div>
  );
}
