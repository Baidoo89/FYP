import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '../../../../lib/auth';

export async function GET(request: NextRequest) {
  const session = getAuthSession(request);

  if (!session) {
    return NextResponse.json(
      {
        authenticated: false,
      },
      { status: 401 }
    );
  }

  return NextResponse.json({
    authenticated: true,
    role: session.role,
    user: {
      id: session.userId,
      name: session.name,
      email: session.email,
      department: session.department || null,
    },
  });
}
