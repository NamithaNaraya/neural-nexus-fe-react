import React from 'react';
import { cn } from '../../utils/cn';

const badgeVariants = {
  default: 'bg-primary/15 text-primary border-primary/30',
  secondary: 'bg-secondary text-secondary-foreground border-secondary',
  destructive: 'bg-destructive/15 text-red-400 border-destructive/30',
  outline: 'text-foreground border-border',
  success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  warning: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  info: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
};

export function Badge({ className, variant = 'default', children, ...props }) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
        badgeVariants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// Specialized status badge with animated dot
export function StatusBadge({ status, label, className }) {
  const statusConfig = {
    healthy: { color: 'bg-emerald-400', variant: 'success', text: label || 'Healthy' },
    up: { color: 'bg-emerald-400', variant: 'success', text: label || 'Online' },
    degraded: { color: 'bg-amber-400', variant: 'warning', text: label || 'Degraded' },
    unhealthy: { color: 'bg-red-400', variant: 'destructive', text: label || 'Offline' },
    down: { color: 'bg-red-400', variant: 'destructive', text: label || 'Down' },
  };

  const config = statusConfig[status] || statusConfig.unhealthy;

  return (
    <Badge variant={config.variant} className={cn('gap-1.5', className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full animate-pulse', config.color)} />
      {config.text}
    </Badge>
  );
}
