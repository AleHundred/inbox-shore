import { type NextRequest, NextResponse } from 'next/server';

import { apiClient } from '@/lib/api/services/base/apiClient';
import { TIMELINE_PAGE_SIZE } from '@/lib/constants';

import { authUser } from '../auth/auth-helper';

type TimelineEntry = {
  id: string;
  timestamp: string;
  actorType: string;
  actorName: string;
  entryType: string;
  text?: string;
  chatId?: string;
};

type PageInfo = {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  currentPage: number;
  totalPages: number;
  totalItems: number;
};

type TimelineResponse = {
  request: {
    id: string;
    title?: string;
    timelineEntries: {
      items: TimelineEntry[];
      pageInfo: PageInfo;
    };
  };
};

/**
 * API route handler for fetching request timeline data
 * This endpoint handles timeline data retrieval with pagination and message filtering
 * @param request - The Next.js request object containing timeline query parameters
 * @returns JSON response with timeline data or error message
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const user = authUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const requestId = searchParams.get('requestId');

    if (!requestId) {
      return NextResponse.json(
        { success: false, error: 'Request ID is required' },
        { status: 400 }
      );
    }
    const page = searchParams.get('page');
    const limit = searchParams.get('limit');

    if (page && (isNaN(Number(page)) || Number(page) < 1)) {
      return NextResponse.json(
        { success: false, error: 'Page number must be a positive number' },
        { status: 400 }
      );
    }

    if (limit && (isNaN(Number(limit)) || Number(limit) < 1 || Number(limit) > 100)) {
      return NextResponse.json(
        { success: false, error: 'Limit must be a number between 1 and 100' },
        { status: 400 }
      );
    }

    const pageNum = page && Number.isFinite(Number(page)) && Number(page) > 0 ? Number(page) : 1;
    const limitNum =
      limit && Number.isFinite(Number(limit)) && Number(limit) > 0
        ? Number(limit)
        : TIMELINE_PAGE_SIZE;

    const paginationParams = { page: pageNum, limit: limitNum };

    const response = await apiClient.get<TimelineResponse>(`/requests/${requestId}/timeline`, {
      params: paginationParams,
      authHeader: request.headers.get('Authorization') || '',
    });

    if (!response) {
      return NextResponse.json(
        { success: false, error: 'No response received from timeline API' },
        { status: 500 }
      );
    }

    if (!response.request?.timelineEntries) {
      return NextResponse.json(
        { success: false, error: 'Invalid response format from timeline API' },
        { status: 500 }
      );
    }

    const filteredItems = response.request.timelineEntries.items.filter((entry) => {
      if (entry.entryType === 'chat') {
        return entry.text && entry.text.trim() !== '';
      }
      return true;
    });

    const result = {
      request: {
        ...response.request,
        timelineEntries: {
          items: filteredItems,
          pageInfo: response.request.timelineEntries.pageInfo,
        },
      },
    };

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
