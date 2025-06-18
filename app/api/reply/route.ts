import { supportClient } from '@/lib/api/services/supportClient';
import { handleApiError } from '@/lib/errors/adapters';
import { ErrorCategory } from '@/lib/utils/AppError';

import { authUser } from '../auth/auth-helper';
import { upsertCustomer } from '../upsertCustomer';

/**
 * Handles POST request to send a reply to a request
 * This endpoint processes reply messages and forwards them to the support system
 * @param request - The incoming HTTP request containing reply data
 * @returns Response with the chat ID or error message
 */
export async function POST(request: Request) {
  try {
    const user = authUser(request);
    if (!user) {
      return handleApiError(new Error('Authentication required'), 'reply authorization', {
        metadata: { category: ErrorCategory.AUTH },
      });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return handleApiError(
        new Error('Invalid request body: unable to parse JSON'),
        'parsing reply request',
        { metadata: { category: ErrorCategory.VALIDATION } }
      );
    }

    if (!body.requestId && !body.message) {
      return handleApiError(
        new Error('Request ID and message are required'),
        'validating reply fields',
        { metadata: { category: ErrorCategory.VALIDATION } }
      );
    } else if (!body.requestId) {
      return handleApiError(new Error('Request ID is required'), 'validating reply fields', {
        metadata: { category: ErrorCategory.VALIDATION },
      });
    } else if (!body.message) {
      return handleApiError(new Error('Message is required'), 'validating reply fields', {
        metadata: { category: ErrorCategory.VALIDATION },
      });
    }

    const { requestId, message } = body;

    const customer = await upsertCustomer(user);

    if (!customer) {
      return handleApiError(
        new Error('Failed to create or retrieve customer record'),
        'preparing customer for reply',
        { metadata: { category: ErrorCategory.SERVER } }
      );
    }

    const replyData = {
      requestId,
      customerId: customer.id,
      message,
    };

    const result = await supportClient.post('/replies', replyData);

    if (result.error) {
      return handleApiError(result.error, 'sending chat message to the API', {
        metadata: { category: ErrorCategory.SERVER },
      });
    }

    if (!result.data) {
      return handleApiError(new Error('No data returned from the API'), 'processing API response', {
        metadata: { category: ErrorCategory.SERVER },
      });
    }

    interface ReplyResponse {
      chatId?: string;
      [key: string]: unknown;
    }

    const responseData = result.data as ReplyResponse;
    const chatId = responseData.chatId;
    if (!chatId) {
      return handleApiError(new Error('No chat ID returned from the API'), 'extracting chat ID', {
        metadata: { category: ErrorCategory.SERVER },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: {
          id: chatId,
          content: message,
          createdAt: {
            iso8601: new Date().toISOString(),
          },
        },
        chatId: chatId,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return handleApiError(error, 'processing reply request', {
      metadata: { category: ErrorCategory.SERVER },
    });
  }
}
