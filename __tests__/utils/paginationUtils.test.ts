import type { PaginationParams } from '@/lib/types/api';
import {
  calculateTotalPages,
  createDefaultPagination,
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  isValidPage,
  normalizePaginationParams,
} from '@/lib/utils/paginationUtils';

/**
 * Tests for pagination utility functions
 * These tests validate core pagination logic that powers the request list and timeline navigation
 */
describe('Pagination Utils', () => {
  describe('normalizePaginationParams', () => {
    /**
     * Tests the fundamental pagination normalization with page-based parameters
     * This is crucial for ensuring consistent API requests regardless of input format
     */
    it('should normalize page-based pagination parameters', () => {
      const params = { page: 2, limit: 20 };
      const result = normalizePaginationParams(params);

      expect(result).toEqual({
        page: 2,
        limit: 20,
      });
    });

    /**
     * Tests cursor-based pagination fallback behavior
     * Important for timeline entries where cursor pagination provides better performance
     */
    it('should handle cursor-based pagination when page is not provided', () => {
      const params = { after: 'cursor123', limit: 15 };
      const result = normalizePaginationParams(params);

      expect(result).toEqual({
        after: 'cursor123',
        limit: 15,
      });
    });

    /**
     * Tests default value application when no parameters are provided
     * Ensures consistent behavior across all paginated endpoints
     */
    it('should apply defaults when no parameters are provided', () => {
      const result = normalizePaginationParams();

      expect(result).toEqual({
        page: DEFAULT_PAGE,
        limit: DEFAULT_LIMIT,
      });
    });

    /**
     * Tests cleanup of undefined values to prevent invalid API requests
     * Critical for maintaining clean query strings and API compatibility
     */
    it('should remove undefined values from parameters', () => {
      const params = { page: 1, limit: undefined, after: undefined } as unknown as PaginationParams;
      const result = normalizePaginationParams(params);

      expect(result).toEqual({
        page: 1,
        limit: DEFAULT_LIMIT,
      });
      expect(result.after).toBeUndefined();
    });
  });

  describe('calculateTotalPages', () => {
    /**
     * Tests accurate page calculation for exact divisions
     * Fundamental for displaying correct pagination controls
     */
    it('should calculate total pages correctly for exact divisions', () => {
      expect(calculateTotalPages(100, 10)).toBe(10);
      expect(calculateTotalPages(50, 25)).toBe(2);
    });

    /**
     * Tests rounding up for partial pages
     * Ensures all items are accessible even when they don't fill a complete page
     */
    it('should round up for partial pages', () => {
      expect(calculateTotalPages(101, 10)).toBe(11);
      expect(calculateTotalPages(23, 10)).toBe(3);
    });

    /**
     * Tests edge cases that could break pagination UI
     * Prevents division by zero and handles empty datasets gracefully
     */
    it('should handle edge cases', () => {
      expect(calculateTotalPages(0, 10)).toBe(0);
      expect(calculateTotalPages(1, 10)).toBe(1);
    });
  });

  describe('isValidPage', () => {
    /**
     * Tests page validation within valid ranges
     * Critical for preventing invalid API requests and 404 errors
     */
    it('should validate pages within range', () => {
      expect(isValidPage(1, 5)).toBe(true);
      expect(isValidPage(3, 5)).toBe(true);
      expect(isValidPage(5, 5)).toBe(true);
    });

    /**
     * Tests rejection of invalid page numbers
     * Protects against malicious or accidental invalid navigation
     */
    it('should reject invalid page numbers', () => {
      expect(isValidPage(0, 5)).toBe(false);
      expect(isValidPage(6, 5)).toBe(false);
      expect(isValidPage(-1, 5)).toBe(false);
    });
  });

  describe('createDefaultPagination', () => {
    /**
     * Tests default pagination object creation
     * Ensures consistent initialization across components
     */
    it('should create default pagination parameters', () => {
      const result = createDefaultPagination();

      expect(result).toEqual({
        page: DEFAULT_PAGE,
        limit: DEFAULT_LIMIT,
      });
    });

    /**
     * Tests override capability for customizing defaults
     * Allows components to specify different page sizes while maintaining defaults
     */
    it('should allow overrides of default values', () => {
      const result = createDefaultPagination({ limit: 25, page: 2 });

      expect(result).toEqual({
        page: 2,
        limit: 25,
      });
    });
  });
});
