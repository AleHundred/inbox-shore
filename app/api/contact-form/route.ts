import { NextResponse } from 'next/server';

import { messageStore } from '@/lib/store/messageStore';

import { authUser } from '../auth/auth-helper';

export type RequestBody = {
  title: string;
  message: string;
};

/**
 * Handles POST request to create a new request from contact form
 * This endpoint creates a new support request using the provided title and message
 * @param request - The incoming HTTP request containing form data
 * @returns Response with request ID or error message
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

    return NextResponse.json({
      success: true,
      requestId: newRequestId,
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
