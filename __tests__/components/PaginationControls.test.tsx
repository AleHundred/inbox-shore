import { render, screen, fireEvent } from '@testing-library/react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

import PaginationControls from '@/components/features/requests/PaginationControls';
import type { TimelinePageInfo } from '@/lib/types/api';

/**
 * Mock Next.js navigation hooks for component testing
 * This allows us to test navigation behavior without actual routing
 */
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
  usePathname: jest.fn(),
}));

/**
 * Component tests for pagination controls
 * These tests validate user interaction and navigation behavior
 */
describe('PaginationControls', () => {
  const mockPush = jest.fn();
  const mockSearchParams = new URLSearchParams();

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
    (usePathname as jest.Mock).mockReturnValue('/requests');
    mockPush.mockClear();
  });

  /**
   * Tests basic pagination information display
   * Validates that users can see current page context clearly
   */
  it('should display current page information', () => {
    const pageInfo: TimelinePageInfo = {
      currentPage: 2,
      totalPages: 5,
      hasNextPage: true,
      hasPreviousPage: true,
      totalItems: 50,
    };

    render(<PaginationControls pageInfo={pageInfo} />);

    expect(screen.getByText('Page')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('of 5')).toBeInTheDocument();
  });

  /**
   * Tests navigation to previous page
   * Validates correct URL construction and navigation behavior
   */
  it('should navigate to previous page when button is clicked', () => {
    const pageInfo: TimelinePageInfo = {
      currentPage: 3,
      totalPages: 5,
      hasNextPage: true,
      hasPreviousPage: true,
      totalItems: 50,
    };

    render(<PaginationControls pageInfo={pageInfo} />);

    const previousButton = screen.getByRole('button', { name: /previous/i });
    fireEvent.click(previousButton);

    expect(mockPush).toHaveBeenCalledWith('/requests?page=2');
  });

  /**
   * Tests navigation to next page
   * Validates forward navigation and URL parameter handling
   */
  it('should navigate to next page when button is clicked', () => {
    const pageInfo: TimelinePageInfo = {
      currentPage: 2,
      totalPages: 5,
      hasNextPage: true,
      hasPreviousPage: true,
      totalItems: 50,
    };

    render(<PaginationControls pageInfo={pageInfo} />);

    const nextButton = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextButton);

    expect(mockPush).toHaveBeenCalledWith('/requests?page=3');
  });

  /**
   * Tests disabled state for first page
   * Ensures users cannot navigate beyond valid page boundaries
   */
  it('should disable previous button on first page', () => {
    const pageInfo: TimelinePageInfo = {
      currentPage: 1,
      totalPages: 5,
      hasNextPage: true,
      hasPreviousPage: false,
      totalItems: 50,
    };

    render(<PaginationControls pageInfo={pageInfo} />);

    const previousButton = screen.getByRole('button', { name: /previous/i });
    expect(previousButton).toBeDisabled();
  });

  /**
   * Tests disabled state for last page
   * Ensures users cannot navigate beyond valid page boundaries
   */
  it('should disable next button on last page', () => {
    const pageInfo: TimelinePageInfo = {
      currentPage: 5,
      totalPages: 5,
      hasNextPage: false,
      hasPreviousPage: true,
      totalItems: 50,
    };

    render(<PaginationControls pageInfo={pageInfo} />);

    const nextButton = screen.getByRole('button', { name: /next/i });
    expect(nextButton).toBeDisabled();
  });

  /**
   * Tests keyboard accessibility
   * Validates that pagination works with keyboard navigation for accessibility
   */
  it('should handle keyboard navigation', () => {
    const pageInfo: TimelinePageInfo = {
      currentPage: 2,
      totalPages: 5,
      hasNextPage: true,
      hasPreviousPage: true,
      totalItems: 50,
    };

    render(<PaginationControls pageInfo={pageInfo} />);

    const previousButton = screen.getByRole('button', { name: /previous/i });
    fireEvent.keyDown(previousButton, { key: 'Enter' });

    expect(mockPush).toHaveBeenCalledWith('/requests?page=1');
  });
});
