import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { authUser } from '@/app/api/auth/auth-helper';
import { createAuthToken } from '@/app/api/auth/token-service';

/**
 * POST /api/auth/token
 * Generates a new token for an already authenticated user
 */
export async function POST(request: NextRequest) {
  try {
    const user = authUser(request);

    if (!user) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const token = createAuthToken({
      userId: user.id,
      email: user.email,
    });

    return NextResponse.json({
      success: true,
      token,
    });
  } catch (error) {
    console.error('Error generating token:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate token' },
      { status: 500 }
    );
  }
}
