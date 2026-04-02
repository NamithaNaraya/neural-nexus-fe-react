import React from 'react';
import {
  CardRoot as ChakraCardRoot,
  CardHeader as ChakraCardHeader,
  CardBody as ChakraCardBody,
  CardFooter as ChakraCardFooter,
  CardTitle as ChakraCardTitle,
  CardDescription as ChakraCardDescription,
} from '@chakra-ui/react';
import { cn } from '../../utils/cn';

export function Card({ className, children, ...props }) {
  return (
    <ChakraCardRoot
      unstyled
      className={cn(
        'rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm text-card-foreground shadow-sm transition-all duration-300',
        className
      )}
      {...props}
    >
      {children}
    </ChakraCardRoot>
  );
}

export function CardHeader({ className, children, ...props }) {
  return (
    <ChakraCardHeader unstyled className={cn('flex flex-col space-y-1.5 p-6', className)} {...props}>
      {children}
    </ChakraCardHeader>
  );
}

export function CardTitle({ className, children, ...props }) {
  return (
    <ChakraCardTitle unstyled className={cn('text-lg font-semibold leading-none tracking-tight', className)} {...props}>
      {children}
    </ChakraCardTitle>
  );
}

export function CardDescription({ className, children, ...props }) {
  return (
    <ChakraCardDescription unstyled className={cn('text-sm text-muted-foreground', className)} {...props}>
      {children}
    </ChakraCardDescription>
  );
}

export function CardContent({ className, children, ...props }) {
  return (
    <ChakraCardBody unstyled className={cn('p-6 pt-0', className)} {...props}>
      {children}
    </ChakraCardBody>
  );
}

export function CardFooter({ className, children, ...props }) {
  return (
    <ChakraCardFooter unstyled className={cn('flex items-center p-6 pt-0', className)} {...props}>
      {children}
    </ChakraCardFooter>
  );
}
