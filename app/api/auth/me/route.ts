import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { authUser } from '../auth-helper';

/**
 * GET /api/auth/me
 * Returns the current authenticated user's information
 */
export async function GET(request: NextRequest) {
  try {
    const user = authUser(request);

    if (!user) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error('Error in /api/auth/me:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
