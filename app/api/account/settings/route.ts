import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { getAuthSession } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';
import { getDashboardForRole } from '../../../../lib/rbac';
import { getRequestSessionMetadata, maskIpAddress } from '../../../../lib/session-metadata';

function asRecord(value: Prisma.JsonValue | null | undefined) {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function textFrom(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function sessionFromAuditLog(log: {
  id: number;
  createdAt: Date;
  ipAddress: string | null;
  metadata: Prisma.JsonValue;
}) {
  const metadata = asRecord(log.metadata);
  const browser = textFrom(metadata.browser, 'Unknown browser');
  const platform = textFrom(metadata.platform, 'Unknown device');

  return {
    id: log.id,
    startedAt: log.createdAt,
    browser,
    platform,
    deviceType: textFrom(metadata.deviceType, 'Unknown'),
    device: textFrom(metadata.device, `${browser} on ${platform}`),
    ipAddress: maskIpAddress(log.ipAddress),
    location: textFrom(metadata.location, 'Location unavailable'),
    active: false,
  };
}

function timelineItem(label: string, value?: Date | null) {
  return {
    label,
    date: value,
    status: value ? 'Completed' : 'Pending',
  };
}

export async function GET(request: NextRequest) {
  const session = getAuthSession(request);

  if (!session || session.legacy) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      emailVerified: true,
      emailVerifiedAt: true,
      name: true,
      role: true,
      currentRank: true,
      department: true,
      staffId: true,
      onboarded: true,
      createdAt: true,
      updatedAt: true,
      departmentRef: { select: { name: true } },
      faculty: { select: { name: true } },
    },
  });

  if (!user) {
    return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
  }

  const [recentLoginLogs, firstLoginLog, profileCompletedLog] = await Promise.all([
    prisma.auditLog.findMany({
      where: { actorId: user.id, action: 'USER_LOGIN' },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.auditLog.findFirst({
      where: { actorId: user.id, action: 'USER_LOGIN' },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.auditLog.findFirst({
      where: { actorId: user.id, action: 'PROFILE_COMPLETED' },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  const currentMetadata = getRequestSessionMetadata(request);
  const sessionStartedAt = session.iat ? new Date(session.iat * 1000) : new Date();
  const currentSession = {
    id: 'current',
    startedAt: sessionStartedAt,
    browser: currentMetadata.browser,
    platform: currentMetadata.platform,
    deviceType: currentMetadata.deviceType,
    device: currentMetadata.device,
    ipAddress: currentMetadata.maskedIpAddress,
    location: currentMetadata.location,
    active: true,
  };

  const recentSessions = recentLoginLogs.length > 0
    ? recentLoginLogs.map(sessionFromAuditLog)
    : [currentSession];
  const lastLogin = recentSessions[0] || currentSession;
  const firstLoginAt = firstLoginLog?.createdAt || sessionStartedAt;
  const profileCompletedAt = profileCompletedLog?.createdAt || (user.onboarded ? user.updatedAt : null);
  const timeline = [
    timelineItem('Account Created', user.createdAt),
    timelineItem('Email Verified', user.emailVerifiedAt),
    timelineItem('Profile Completed', profileCompletedAt),
    timelineItem('First Login', firstLoginAt),
    timelineItem('Last Login', lastLogin.startedAt),
  ].sort((first, second) => {
    if (first.date && second.date) return new Date(first.date).getTime() - new Date(second.date).getTime();
    if (first.date) return -1;
    if (second.date) return 1;
    return 0;
  });

  return NextResponse.json({
    success: true,
    data: {
      profile: {
        email: user.email,
        emailVerified: user.emailVerified,
        emailVerifiedAt: user.emailVerifiedAt,
        name: user.name,
        role: user.role,
        currentRank: user.currentRank,
        department: user.departmentRef?.name || user.department,
        faculty: user.faculty?.name || null,
        staffId: user.staffId,
        onboarded: user.onboarded,
        joinedAt: user.createdAt,
        dashboardPath: getDashboardForRole(user.role),
      },
      security: {
        lastLogin,
        currentSession,
        recentSessions,
        timeline,
        emailVerification: {
          method: 'University Email',
          status: user.emailVerified ? 'Verified' : 'Pending',
          verifiedBy: user.emailVerified ? 'System' : 'Pending',
        },
        notificationPreferences: [
          'Workflow updates',
          'HR feedback',
          'Committee decisions',
          'Promotion status',
        ],
        system: {
          version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0',
          buildNumber: process.env.NEXT_PUBLIC_BUILD_NUMBER || '2026.07.24',
          lastUpdated: process.env.NEXT_PUBLIC_LAST_UPDATED || '2026-07-24',
        },
      },
    },
  });
}
