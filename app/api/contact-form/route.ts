import { NextResponse } from 'next/server';

import { handleApiError } from '@/lib/errors/adapters';
import { messageStore } from '@/lib/store/messageStore';
import { ErrorCategory } from '@/lib/utils/AppError';

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
      return handleApiError(
        new Error('Authentication required'),
        'request creation authorization',
        { metadata: { category: ErrorCategory.AUTH } }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return handleApiError(
        new Error('Invalid request body: unable to parse JSON'),
        'parsing request creation request',
        { metadata: { category: ErrorCategory.VALIDATION } }
      );
    }

    if (!body.title || !body.message) {
      return handleApiError(
        new Error('Title and message are required'),
        'validating request creation fields',
        { metadata: { category: ErrorCategory.VALIDATION } }
      );
    }

    const customerName = user.name || user.email || 'Unknown Customer';
    const newRequestId = messageStore.createNewRequest(body.title, body.message, customerName);

    return NextResponse.json({
      success: true,
      requestId: newRequestId,
    });
  } catch (error) {
    return handleApiError(error, 'request creation', {
      metadata: { category: ErrorCategory.SERVER },
    });
  }
}
