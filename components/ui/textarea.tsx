import * as React from 'react';

import { type TextAreaProps } from '@/lib/types';
import { cn } from '@/lib/utils';

/**
 * Textarea component for multi-line text input.
 *
 */
const Textarea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    { id, className, value, onChange, placeholder, disabled = false, required = false, onKeyDown },
    ref
  ) => {
    return (
      <textarea
        id={id}
        ref={ref}
        data-slot='textarea'
        className={cn(
          'border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          className
        )}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        onKeyDown={onKeyDown}
      />
    );
  }
);

Textarea.displayName = 'Textarea';

export { Textarea };
