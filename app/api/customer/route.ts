import { type NextRequest, NextResponse } from 'next/server';

import { supportClient as customerSupportClient } from '@/lib/api/services/supportClient';
import { handleApiError } from '@/lib/errors/adapters';
import { ErrorCategory } from '@/lib/utils/AppError';

/**
 * Handles GET request to retrieve customer data by ID
 * @param request - The incoming HTTP request
 * @returns Response with customer data or error message
 */
export async function GET(request: NextRequest) {
  try {
    const customerId = request.nextUrl.searchParams.get('customerId');

    if (!customerId) {
      return handleApiError(new Error('Customer ID is required'), 'validating customer request', {
        metadata: { category: ErrorCategory.VALIDATION },
      });
    }

    const result = await customerSupportClient.get(`/customers/${customerId}`);

    if (result.error) {
      return handleApiError(result.error, 'fetching customer data', {
        metadata: { category: ErrorCategory.SERVER },
      });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    return handleApiError(error, 'processing customer request', {
      metadata: { category: ErrorCategory.SERVER },
    });
  }
}

/**
 * Handles POST request to create or update a customer
 * @param request - The incoming HTTP request
 * @returns Response with customer data or error message
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, fullName, isVerified } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const customerData = {
      email,
      fullName: fullName || email.split('@')[0],
      isVerified: isVerified || false,
    };

    const result = await customerSupportClient.post('/customers', customerData);

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error upserting customer:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
