import React from 'react';
import { cn } from '../../utils/cn';

export function Input({ className, type = 'text', ...props }) {
  return (
    <input
      type={type}
      className={cn(
        'flex h-10 w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-sm transition-all duration-200',
        'placeholder:text-muted-foreground/60',
        'focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary/50',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'backdrop-blur-sm',
        className
      )}
      {...props}
    />
  );
}

export function Label({ className, children, ...props }) {
  return (
    <label
      className={cn(
        'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        className
      )}
      {...props}
    >
      {children}
    </label>
  );
}
