import React from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { AnimatedNumber } from '../../components/shared/AnimatedNumber';
import { Network, GitFork, FolderOpen, Sparkles } from 'lucide-react';
import { cn } from '../../utils/cn';

const defaultStatConfig = [
  { label: 'Total Nodes', icon: Network, gradient: 'from-blue-500 to-cyan-500', bg: 'bg-blue-500/10', iconColor: 'text-blue-500' },
  { label: 'Relationships', icon: GitFork, gradient: 'from-purple-500 to-pink-500', bg: 'bg-purple-500/10', iconColor: 'text-purple-500' },
  { label: 'Folders', icon: FolderOpen, gradient: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-500/10', iconColor: 'text-emerald-500' },
  { label: 'AI Queries', icon: Sparkles, gradient: 'from-amber-500 to-orange-500', bg: 'bg-amber-500/10', iconColor: 'text-amber-500' },
];

export function StatsCards({ stats = [], loading = false }) {
  const displayStats = stats.length > 0
    ? stats.map((s, i) => ({
        ...defaultStatConfig[i % defaultStatConfig.length],
        label: s.label || s.name || defaultStatConfig[i % defaultStatConfig.length].label,
        value: s.value ?? s.count ?? '—',
      }))
    : defaultStatConfig.map(s => ({ ...s, value: '—' }));

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {displayStats.map((stat, i) => (
        <Card
          key={i}
          className="hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-500 ease-out cursor-pointer group"
        >
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {stat.label}
                </p>
                <p className="text-3xl font-bold tracking-tight">
                  {typeof stat.value === 'number' ? (
                    <AnimatedNumber value={stat.value} />
                  ) : (
                    stat.value
                  )}
                </p>
              </div>
              <div className={cn(
                'w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-500 ease-out group-hover:scale-110 group-hover:rotate-3',
                stat.bg
              )}>
                <stat.icon className={cn('w-5 h-5', stat.iconColor)} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
