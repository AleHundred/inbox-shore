import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * An accessible form label component
 *
 * @param props - Configuration options and HTML label attributes
 * @param props.className - Custom styling to merge with default styles
 * @param ref - React ref forwarded to the underlying HTML label element
 * @returns A styled label element for form fields with proper accessibility
 */
const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        className
      )}
      {...props}
    />
  )
);
Label.displayName = 'Label';

export { Label };
