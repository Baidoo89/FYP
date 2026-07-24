import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '../../../../lib/auth';
import { WORKFLOW_TRANSACTION_OPTIONS, prisma } from '../../../../lib/prisma';
import { writeAuditLog } from '../../../../lib/audit-logger';
import { getRequestSessionMetadata } from '../../../../lib/session-metadata';

export async function POST(request: NextRequest) {
  const session = getAuthSession(request);

  if (!session || session.legacy) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const action = String(body.action || '').trim();

  if (action !== 'SIGN_OUT_OTHER_DEVICES') {
    return NextResponse.json({ success: false, error: 'Unsupported session action' }, { status: 400 });
  }

  const metadata = getRequestSessionMetadata(request);

  await prisma.$transaction((tx) =>
    writeAuditLog(tx, {
      actorId: session.userId,
      action: 'OTHER_SESSIONS_SIGN_OUT_REQUESTED',
      entityType: 'User',
      entityId: session.userId,
      description: 'User requested sign-out from other devices while keeping the current session active.',
      ipAddress: metadata.ipAddress,
      metadata: {
        browser: metadata.browser,
        platform: metadata.platform,
        deviceType: metadata.deviceType,
        device: metadata.device,
        location: metadata.location,
        currentSessionKept: true,
      },
    }),
    WORKFLOW_TRANSACTION_OPTIONS
  );

  return NextResponse.json({
    success: true,
    message: 'Other device sessions were reviewed. Your current session remains active.',
  });
}
