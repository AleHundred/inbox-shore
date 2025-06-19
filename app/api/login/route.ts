import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    return NextResponse.json({
      success: true,
      message: 'Login route is working',
      received: { email, password: '***' },
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Test error' }, { status: 500 });
  }
}
