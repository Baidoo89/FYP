import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '../../../../lib/auth';

export async function POST(request: NextRequest) {
  if (!getAuthSession(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 },
    );
  }

  return NextResponse.json(
    {
      success: false,
      error: 'Staff profile data must be created and verified by HRODD.',
      code: 'HRODD_PROFILE_REQUIRED',
    },
    { status: 403 },
  );
}
