import { NextResponse } from 'next/server';

import type { DateTimeParts, RequestSummary } from '@/lib/types/api';

import { getMockRequests } from '../../../lib/api/mockData/requests';
import { messageStore } from '../../../lib/store/messageStore';
import { authUser } from '../auth/auth-helper';

/**
 * Ensure value is in DateTimeParts format
 */
function ensureDateTimeParts(value: string | DateTimeParts | undefined): DateTimeParts {
  if (!value) {
    return { iso8601: new Date().toISOString() };
  }
  if (typeof value === 'string') {
    return { iso8601: value };
  }
  return value;
}

/**
 * Handles GET requests to fetch a paginated list of support requests
 * @param request - The incoming HTTP request
 * @returns A JSON response containing the list of requests and pagination info
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const page = parseInt(url.searchParams.get('page') || '1');

    const userRequestIds = messageStore.getAllRequestIds();
    const userRequests: RequestSummary[] = userRequestIds.map((requestId) => {
      const messages = messageStore.getMessages(requestId);
      const info = messageStore.getRequestInfo(requestId);
      const lastMessage = messages[0];

      const customerFullName = info.customerName || 'Unknown Customer';

      const requestSummary: RequestSummary = {
        id: requestId,
        title: info.title,
        status: info.status,
        priority: info.priority,
        customer: {
          id: info.customerId,
          fullName: customerFullName,
        },
        updatedAt: ensureDateTimeParts(lastMessage?.timestamp),
        previewText: lastMessage?.text?.substring(0, 100) || 'No messages yet',
      };

      return requestSummary;
    });

    const TOTAL_ITEMS = 22;

    const mockData = getMockRequests(1, TOTAL_ITEMS, TOTAL_ITEMS);
    const mockTickets: RequestSummary[] = (mockData.tickets || []).map((ticket) => ({
      id: ticket.id,
      title: ticket.title || 'Untitled Request',
      status: ticket.status,
      priority: ticket.priority,
      customer: {
        id: ticket.customer?.id || 'unknown',
        fullName: ticket.customer?.fullName || 'Unknown Customer',
      },
      updatedAt: ensureDateTimeParts(ticket.updatedAt),
      previewText: ticket.previewText || 'No preview available',
    }));

    const allRequests: RequestSummary[] = [...userRequests, ...mockTickets];

    const seenIds = new Set<string>();
    const uniqueRequests = allRequests.filter((request) => {
      if (seenIds.has(request.id)) {
        return false;
      }
      seenIds.add(request.id);
      return true;
    });

    uniqueRequests.sort((a, b) => {
      const timeA = typeof a.updatedAt === 'string' ? a.updatedAt : a.updatedAt.iso8601;
      const timeB = typeof b.updatedAt === 'string' ? b.updatedAt : b.updatedAt.iso8601;
      return new Date(timeB).getTime() - new Date(timeA).getTime();
    });

    const totalActualItems = uniqueRequests.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedRequests = uniqueRequests.slice(startIndex, endIndex);

    const response = {
      success: true,
      tickets: paginatedRequests,
      pagination: {
        page,
        limit,
        total: totalActualItems,
        hasNextPage: endIndex < totalActualItems,
        hasPreviousPage: page > 1,
        currentPage: page,
        totalPages: Math.ceil(totalActualItems / limit),
        totalItems: totalActualItems,
      },
      customerDataMap: mockData.customerDataMap || {},
    };

    return NextResponse.json(response);
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Handles POST requests to create a new support request
 * @param request - The incoming HTTP request containing request details
 * @returns A JSON response with the created request ID
 */
export async function POST(request: Request) {
  try {
    const user = authUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid request body: unable to parse JSON' },
        { status: 400 }
      );
    }

    if (!body.title || !body.message) {
      return NextResponse.json(
        { success: false, error: 'Title and message are required' },
        { status: 400 }
      );
    }

    const customerName = user.name || user.email || 'Unknown Customer';
    const newRequestId = messageStore.createNewRequest(body.title, body.message, customerName);

    const response = {
      success: true,
      requestId: newRequestId,
      message: 'Request created successfully',
    };

    return NextResponse.json(response);
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
