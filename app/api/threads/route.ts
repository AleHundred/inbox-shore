import { NextResponse } from 'next/server';

import { supportClient } from '@/lib/api/services/supportClient';

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
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const url = new URL(request.url);
    const pageParam = url.searchParams.get('page');
    const limitParam = url.searchParams.get('limit');

    if (pageParam && isNaN(parseInt(pageParam))) {
      return NextResponse.json(
        { error: 'Invalid page parameter: must be a number' },
        { status: 400 }
      );
    }

    if (limitParam && isNaN(parseInt(limitParam))) {
      return NextResponse.json(
        { error: 'Invalid limit parameter: must be a number' },
        { status: 400 }
      );
    }

    const page = parseInt(pageParam || '1');
    const limit = parseInt(limitParam || '10');

    if (page < 1) {
      return NextResponse.json({ error: 'Page number must be greater than 0' }, { status: 400 });
    }

    if (limit < 1 || limit > 100) {
      return NextResponse.json({ error: 'Limit must be between 1 and 100' }, { status: 400 });
    }

    const paginationParams: Record<string, string | number | undefined> = {
      page,
      limit,
    };

    const requestsRes = await supportClient.get('/requests', paginationParams);

    if (requestsRes.error) {
      return NextResponse.json({ error: requestsRes.error.message }, { status: 500 });
    }

    if (!requestsRes.data) {
      return NextResponse.json(
        { error: 'Invalid response format from requests API' },
        { status: 500 }
      );
    }

    return NextResponse.json(requestsRes.data, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
