import { NextResponse } from 'next/server';

import { supportClient } from '@/lib/api/services/supportClient';
import { handleApiError } from '@/lib/errors/adapters';
import { ErrorCategory } from '@/lib/utils/AppError';

import { authUser } from '../auth/auth-helper';

/**
 * Handles GET requests for request data with pagination
 * This endpoint fetches paginated request thread data from the support system
 * @param request - The incoming HTTP request object with pagination parameters
 * @returns JSON response containing request data or error message
 */
export async function GET(request: Request) {
  try {
    const user = authUser(request);
    if (!user) {
      return handleApiError(new Error('Unauthorized'), 'threads authorization', {
        metadata: { category: ErrorCategory.AUTH },
      });
    }

    const url = new URL(request.url);
    const pageParam = url.searchParams.get('page');
    const limitParam = url.searchParams.get('limit');

    if (pageParam && isNaN(parseInt(pageParam))) {
      return handleApiError(
        new Error('Invalid page parameter: must be a number'),
        'validating pagination parameters',
        { metadata: { category: ErrorCategory.VALIDATION } }
      );
    }

    if (limitParam && isNaN(parseInt(limitParam))) {
      return handleApiError(
        new Error('Invalid limit parameter: must be a number'),
        'validating pagination parameters',
        { metadata: { category: ErrorCategory.VALIDATION } }
      );
    }

    const page = parseInt(pageParam || '1');
    const limit = parseInt(limitParam || '10');

    if (page < 1) {
      return handleApiError(
        new Error('Page number must be greater than 0'),
        'validating pagination parameters',
        { metadata: { category: ErrorCategory.VALIDATION } }
      );
    }

    if (limit < 1 || limit > 100) {
      return handleApiError(
        new Error('Limit must be between 1 and 100'),
        'validating pagination parameters',
        { metadata: { category: ErrorCategory.VALIDATION } }
      );
    }

    const paginationParams: Record<string, string | number | undefined> = {
      page,
      limit,
    };

    const requestsRes = await supportClient.get('/requests', paginationParams);

    if (requestsRes.error) {
      return handleApiError(requestsRes.error, 'fetching requests', {
        metadata: { category: ErrorCategory.SERVER },
      });
    }

    if (!requestsRes.data) {
      return handleApiError(
        new Error('Invalid response format from requests API'),
        'processing requests response',
        { metadata: { category: ErrorCategory.SERVER } }
      );
    }

    return NextResponse.json(requestsRes.data, { status: 200 });
  } catch (error) {
    return handleApiError(error, 'processing threads request', {
      metadata: { category: ErrorCategory.SERVER },
    });
  }
}
