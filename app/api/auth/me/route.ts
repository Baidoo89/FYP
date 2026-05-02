import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticatedRequest } from '../../../../lib/auth';

export async function GET(request: NextRequest) {
  if (!isAuthenticatedRequest(request)) {
    return NextResponse.json(
      {
        authenticated: false,
      },
      { status: 401 }
    );
  }

  return NextResponse.json({
    authenticated: true,
    role: 'admin',
  });
}
