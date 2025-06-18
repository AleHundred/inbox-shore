import * as React from 'react';

import { type CardProps } from '@/lib/types';
import { cn } from '@/lib/utils';

/**
 * Card component for containing content with a consistent style
 * @param className - Additional CSS classes to apply
 * @param props - Additional props to pass to the div element
 */
function Card({ className, ...props }: CardProps) {
  return (
    <div
      data-slot='card'
      className={cn(
        'bg-card text-card-foreground flex flex-col gap-6 border border-slate-700 py-6 shadow-sm',
        className
      )}
      {...props}
    />
  );
}

/**
 * CardHeader component for the top section of a card
 * @param children - Content to render inside the header
 * @param className - Additional CSS classes to apply
 */
function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('border-b border-slate-800 p-4', className)}>{children}</div>;
}

/**
 * CardContent component for the main content area of a card
 * @param children - Content to render inside the content area
 * @param className - Additional CSS classes to apply
 */
function CardContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('flex-1', className)}>{children}</div>;
}

/**
 * CardFooter component for the bottom section of a card
 * @param children - Content to render inside the footer
 * @param className - Additional CSS classes to apply
 */
function CardFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('border-t border-slate-800 pt-4', className)}>{children}</div>;
}

/**
 * CardTitle component for the title of a card
 * @param children - Content to render as the title
 * @param className - Additional CSS classes to apply
 */
function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h2 className={cn('text-lg font-semibold', className)}>{children}</h2>;
}

/**
 * CardDescription component for the description text of a card
 * @param children - Content to render as the description
 * @param className - Additional CSS classes to apply
 */
function CardDescription({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <p className={cn('text-md text-gray-100', className)}>{children}</p>;
}

export { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription };
