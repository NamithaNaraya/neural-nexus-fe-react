import React from 'react';
import { Badge as ChakraBadge } from '@chakra-ui/react';
import { cn } from '../../utils/cn';

const badgeVariants = {
  default: 'bg-primary/15 text-primary border-primary/30',
  secondary: 'bg-secondary text-secondary-foreground border-secondary',
  destructive: 'bg-destructive/15 text-red-400 border-destructive/30',
  outline: 'text-foreground border-border',
  success: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-300',
  warning: 'bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-300',
  info: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-300',
};

export function Badge({ className, variant = 'default', children, ...props }) {
  return (
    <ChakraBadge
      unstyled
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
        badgeVariants[variant],
        className
      )}
      {...props}
    >
      {children}
    </ChakraBadge>
  );
}

// Specialized status badge with animated dot
export function StatusBadge({ status, label, className }) {
  const statusConfig = {
    healthy: { color: 'bg-emerald-500', variant: 'success', text: label || 'Healthy' },
    up: { color: 'bg-emerald-500', variant: 'success', text: label || 'Online' },
    degraded: { color: 'bg-amber-600', variant: 'warning', text: label || 'Degraded' },
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
