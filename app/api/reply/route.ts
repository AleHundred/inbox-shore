import { NextResponse } from 'next/server';

import { supportClient } from '@/lib/api/services/supportClient';

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

    if (!body.requestId && !body.message) {
      return NextResponse.json(
        { success: false, error: 'Request ID and message are required' },
        { status: 400 }
      );
    } else if (!body.requestId) {
      return NextResponse.json(
        { success: false, error: 'Request ID is required' },
        { status: 400 }
      );
    } else if (!body.message) {
      return NextResponse.json({ success: false, error: 'Message is required' }, { status: 400 });
    }

    const { requestId, message } = body;

    const customer = await upsertCustomer(user);

    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Failed to create or retrieve customer record' },
        { status: 500 }
      );
    }

    const replyData = {
      requestId,
      customerId: customer.id,
      message,
    };

    const result = await supportClient.post('/replies', replyData);

    if (result.error) {
      return NextResponse.json({ success: false, error: result.error.message }, { status: 500 });
    }

    if (!result.data) {
      return NextResponse.json(
        { success: false, error: 'No data returned from the API' },
        { status: 500 }
      );
    }

    interface ReplyResponse {
      chatId?: string;
      [key: string]: unknown;
    }

    const responseData = result.data as ReplyResponse;
    const chatId = responseData.chatId;
    if (!chatId) {
      return NextResponse.json(
        { success: false, error: 'No chat ID returned from the API' },
        { status: 500 }
      );
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
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
