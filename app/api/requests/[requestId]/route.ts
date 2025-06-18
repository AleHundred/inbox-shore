import { NextResponse } from 'next/server';

import { getMockRequestDetail } from '@/lib/api/mockData/requests';
import { handleApiError } from '@/lib/errors/adapters';
import { messageStore } from '@/lib/store/messageStore';
import { ErrorCategory } from '@/lib/utils/AppError';

/**
 * Handles GET requests for retrieving request details and associated messages
 * Implements fallback pattern: first check messageStore, then mock data
 * @param request - The incoming HTTP request
 * @param params - Route parameters containing the requestId
 * @returns JSON response containing request details and timeline entries
 */
export async function GET(_request: Request, { params }: { params: { requestId: string } }) {
  try {
    const { requestId } = params;

    const messagesFromStore = messageStore.getMessages(requestId);
    const requestInfoFromStore = messageStore.getRequestInfo(requestId);

    const hasRealData =
      messagesFromStore.length > 0 ||
      (requestInfoFromStore.title !== `Request ${requestId}` &&
        requestInfoFromStore.customerName !== 'Unknown Customer');

    if (hasRealData) {
      const mockResponse = {
        request: {
          id: requestId,
          title: requestInfoFromStore.title,
          status: requestInfoFromStore.status,
          priority: requestInfoFromStore.priority,
          customer: {
            id: requestInfoFromStore.customerId,
            fullName: requestInfoFromStore.customerName,
          },
          createdAt: {
            iso8601: new Date().toISOString(),
          },
          updatedAt: {
            iso8601: messagesFromStore[0]?.timestamp || new Date().toISOString(),
          },
          timelineEntries: {
            items: messagesFromStore,
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
              currentPage: 1,
              totalPages: 1,
              totalItems: messagesFromStore.length,
            },
          },
        },
        timeline: {
          timelineEntries: {
            items: messagesFromStore,
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
              currentPage: 1,
              totalPages: 1,
              totalItems: messagesFromStore.length,
            },
          },
        },
      };

      return NextResponse.json(mockResponse);
    }

    const mockRequestDetail = getMockRequestDetail(requestId);

    if (mockRequestDetail) {
      return NextResponse.json(mockRequestDetail);
    }

    return NextResponse.json(
      {
        success: false,
        error: `Request ${requestId} not found`,
      },
      { status: 404 }
    );
  } catch (error) {
    return handleApiError(error, 'processing request detail', {
      metadata: { category: ErrorCategory.SERVER },
    });
  }
}
