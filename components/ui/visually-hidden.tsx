import React from 'react';
import type { HTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

interface VisuallyHiddenProps extends HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
}

/**
 * VisuallyHidden component that hides content visually but keeps it accessible to screen readers
 * This is useful for providing additional context to screen reader users without affecting the visual layout
 */
export const VisuallyHidden = ({
  children,
  className,
  ...props
}: VisuallyHiddenProps) => {
  return (
    <span
      className={cn(
        'absolute h-px w-px overflow-hidden whitespace-nowrap p-0 border-0',
        'clip-rect-0',
        '-m-px',
        className
      )}
      style={{
        clip: 'rect(0 0 0 0)',
      }}
      {...props}
    >
      {children}
    </span>
  );
};
