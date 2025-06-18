'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import type { TimelinePageInfo } from '@/lib/types/api';

import { VisuallyHidden } from '../../../components/ui/visually-hidden';

type PaginationControlsProps = {
  pageInfo: TimelinePageInfo;
};

/**
 * Pagination controls component for navigating through pages of data
 *
 * @param props - Component props
 * @param props.pageInfo - Page information including current page, total pages and navigation flags
 * @returns {JSX.Element} The rendered pagination controls
 */
export default function PaginationControls({ pageInfo }: PaginationControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createQueryString = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set(name, value);
    return params.toString();
  };

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  };

  const goToPreviousPage = () => {
    if (!pageInfo.hasPreviousPage) return;
    const prevPage = Math.max(1, pageInfo.currentPage - 1);
    router.push(`${pathname}?${createQueryString('page', prevPage.toString())}`);
  };

  const goToNextPage = () => {
    if (!pageInfo.hasNextPage) return;
    const nextPage = Math.min(pageInfo.totalPages, pageInfo.currentPage + 1);
    router.push(`${pathname}?${createQueryString('page', nextPage.toString())}`);
  };

  return (
    <nav aria-label='Pagination' className='flex items-center justify-center gap-2 py-6'>
      <Button
        variant='outline'
        size='sm'
        onClick={goToPreviousPage}
        onKeyDown={(e) => handleKeyDown(e, goToPreviousPage)}
        disabled={!pageInfo.hasPreviousPage}
        aria-disabled={!pageInfo.hasPreviousPage}
        aria-label={`Go to previous page, page ${pageInfo.currentPage - 1}`}
        className='gap-1 border-border/20 hover:bg-muted disabled:opacity-50'
      >
        <ChevronLeft className='h-4 w-4' aria-hidden='true' />
        Previous
      </Button>

      <div className='text-sm text-muted-foreground' aria-live='polite' aria-atomic='true'>
        <span>Page </span>
        <span aria-current='page'>{pageInfo.currentPage}</span>
        <span> of {pageInfo.totalPages}</span>
        <VisuallyHidden>
          {pageInfo.totalPages === 0
            ? 'No pages available'
            : `Showing page ${pageInfo.currentPage} of ${pageInfo.totalPages}`}
        </VisuallyHidden>
      </div>

      <Button
        variant='outline'
        size='sm'
        onClick={goToNextPage}
        onKeyDown={(e) => handleKeyDown(e, goToNextPage)}
        disabled={!pageInfo.hasNextPage}
        aria-disabled={!pageInfo.hasNextPage}
        aria-label={`Go to next page, page ${pageInfo.currentPage + 1}`}
        className='gap-1 border-border/20 hover:bg-muted disabled:opacity-50'
      >
        Next
        <ChevronRight className='h-4 w-4' aria-hidden='true' />
      </Button>
    </nav>
  );
}
