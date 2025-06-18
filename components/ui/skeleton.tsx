import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * A simple skeleton element for loading states
 *
 * @param props - Configuration options and HTML div attributes
 * @param props.className - Additional styling classes to combine with defaults
 * @returns An animated placeholder element for content loading states
 */
function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='skeleton'
      className={cn('bg-primary/10 animate-pulse rounded-md', className)}
      {...props}
    />
  );
}

export { Skeleton };
