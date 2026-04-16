import React from 'react';
import { cn } from '../../utils/cn';

const cardVariants = {
  default: 'rounded-xl border-border/50 bg-card/60',
  branded: 'rounded-[32px] border-primary/10 bg-card/75 shadow-[0_24px_70px_-48px_hsl(var(--primary)/0.24)]',
};

export function Card({ className, variant = 'default', children, ...props }) {
  return (
    <div
      className={cn(
        'border backdrop-blur-xl text-card-foreground shadow-sm transition-all duration-300',
        cardVariants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }) {
  return (
    <div className={cn('flex flex-col space-y-1.5 p-6', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }) {
  return (
    <h3 className={cn('text-lg font-semibold leading-none tracking-tight', className)} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...props }) {
  return (
    <p className={cn('text-sm text-muted-foreground', className)} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ className, children, ...props }) {
  return (
    <div className={cn('p-6 pt-0', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }) {
  return (
    <div className={cn('flex items-center p-6 pt-0', className)} {...props}>
      {children}
    </div>
  );
}
