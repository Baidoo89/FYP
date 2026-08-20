import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: 'Public registration is disabled. Staff access must be issued from an HRODD-verified staff record.',
      code: 'PUBLIC_REGISTRATION_DISABLED',
    },
    { status: 403 },
  );
}
