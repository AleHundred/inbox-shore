'use client';

import { ChevronRight, Clock, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type React from 'react';
import { useCallback, useEffect, useRef } from 'react';

import { Badge } from '@/components/ui/badge';
import type { RequestRowProps } from '@/lib/types';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils/dateUtils';
import { getPriority, getPriorityColorClass } from '@/lib/utils/getPriority';

/**
 * Request row component that displays request information in a list view
 *
 * @param props - Component props
 * @param props.request - Request data to display
 * @param props.customerDataMap - Map of customer data indexed by customer ID
 * @param props.onSelect - Callback function when a request is selected
 * @param props.onHover - Callback function when a request is hovered
 * @param props.index - Index of this request in the list
 * @param props.isActive - Whether this request is currently selected
 * @returns {JSX.Element | null} The rendered request row or null if no request data
 */
export default function RequestRow({
  request,
  customerDataMap,
  onSelect,
  onHover,
  index,
  isActive,
}: RequestRowProps) {
  const router = useRouter();
  const rowRef = useRef<HTMLButtonElement>(null);
  const prefetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasPrefetchedRef = useRef<boolean>(false);

  useEffect(() => {
    if (isActive && rowRef.current) {
      const element = rowRef.current;
      const container = element.closest('#requests-list-container');

      if (container) {
        const containerRect = container.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();

        if (elementRect.top < containerRect.top || elementRect.bottom > containerRect.bottom) {
          element.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
      }
    }
  }, [isActive]);

  const customerId = 'customerId' in request ? request.customerId : request?.customer?.id;
  const customer = customerId
    ? customerDataMap?.[customerId as keyof typeof customerDataMap]
    : null;
  const customerName = customer?.fullName || 'Unknown customer';

  const updatedAtIso =
    typeof request?.updatedAt === 'object' && request.updatedAt?.iso8601
      ? request.updatedAt.iso8601
      : typeof request?.updatedAt === 'string'
        ? request.updatedAt
        : '';

  const formattedDate = updatedAtIso ? formatDate(updatedAtIso) : 'Unknown date';
  const priorityValue = typeof request?.priority === 'number' ? request.priority : 1;
  const priorityText = getPriority(priorityValue);
  const priorityColor = getPriorityColorClass(priorityValue);

  useEffect(() => {
    return () => {
      if (prefetchTimeoutRef.current) {
        clearTimeout(prefetchTimeoutRef.current);
      }
    };
  }, []);

  const handleClick = () => {
    if (request?.id) {
      if (onSelect) {
        onSelect(request.id);
      }
      router.push(`/request/${request.id}`);
    }
  };

  const handleHover = useCallback(() => {
    if (!request?.id || !onHover || hasPrefetchedRef.current) return;

    if (prefetchTimeoutRef.current) {
      clearTimeout(prefetchTimeoutRef.current);
    }

    prefetchTimeoutRef.current = setTimeout(() => {
      if (!hasPrefetchedRef.current) {
        hasPrefetchedRef.current = true;
        onHover(request.id);
      }
    }, 100);
  }, [request?.id, onHover]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && request?.id && onSelect) {
      e.preventDefault();
      onSelect(request.id);
    }
  };

  if (!request) {
    return null;
  }

  return (
    <button
      ref={rowRef}
      type='button'
      role='listitem'
      aria-label={`Request: ${request?.title || 'Untitled request'}, Priority: ${priorityText}, Customer: ${customerName}`}
      aria-current={isActive ? 'true' : undefined}
      className={cn(
        'text-left w-full',
        'group flex items-center justify-between p-4 pl-5 transition-colors',
        'border-l-4 transition-all duration-200',
        'hover:bg-muted/15',
        'cursor-pointer relative overflow-hidden',
        isActive ? 'bg-muted/25 border-l-accent' : 'border-l-transparent',
        index !== 0 ? 'border-b border-[#4a7dba]/50' : ''
      )}
      style={
        {
          borderLeftColor: isActive ? 'hsl(var(--accent))' : 'transparent',
          '--hover-color': 'hsl(var(--accent-dark))',
        } as React.CSSProperties
      }
      onClick={handleClick}
      onMouseEnter={handleHover}
      onFocus={handleHover}
      onKeyDown={handleKeyDown}
      data-index={index}
    >
      <div className='flex-1 min-w-0'>
        <div className='flex items-center gap-2'>
          <h3 className='truncate text-lg font-medium text-accent-foreground/90 hover:text-accent-foreground'>
            {request?.title || 'Untitled request'}
          </h3>
        </div>
        <div className='mt-2 flex items-center gap-2 flex-wrap'>
          <Badge variant='outline' className={cn('text-sm font-medium', priorityColor)}>
            {priorityText}
          </Badge>
          <div className='flex items-center gap-1 text-sm foreground-light'>
            <User className='h-3 w-3' />
            <span>{customerName}</span>
          </div>
          <div className='flex items-center gap-1 text-sm foreground-light'>
            <Clock className='h-3 w-3' />
            <span>{formattedDate}</span>
          </div>
          <Badge variant='outline' className='text-md capitalize bg-muted/30 text-foreground'>
            {request?.status?.toLowerCase() || 'unknown'}
          </Badge>
        </div>
        {request?.previewText && (
          <p className='mt-2 line-clamp-1 text-md text-pretty'>{request.previewText}</p>
        )}
      </div>
      <ChevronRight className='h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors' />
    </button>
  );
}
