import { AppealStatus } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '../../../../../lib/auth';
import { writeAuditLog } from '../../../../../lib/audit-logger';
import { prisma } from '../../../../../lib/prisma';
import type { ApiResponse } from '../../../../../types';

const VIEW_ROLES = new Set(['STAFF', 'LECTURER', 'HR_ADMIN', 'COMMITTEE_REVIEWER']);
const DECISION_ROLES = new Set(['COMMITTEE_REVIEWER']);
const APPEALABLE_STATUSES = new Set(['NOT_RECOMMENDED', 'REJECTED', 'COMPLETED', 'APPROVED_BY_AUTHORITY']);

const TRANSITIONS: Partial<Record<AppealStatus, AppealStatus[]>> = {
  FILED: [AppealStatus.UNDER_REVIEW, AppealStatus.WITHDRAWN, AppealStatus.CLOSED],
  UNDER_REVIEW: [AppealStatus.HEARING_SCHEDULED, AppealStatus.DECIDED, AppealStatus.CLOSED],
  HEARING_SCHEDULED: [AppealStatus.DECIDED, AppealStatus.CLOSED],
  DECIDED: [AppealStatus.CLOSED],
  WITHDRAWN: [AppealStatus.CLOSED],
};

function responseError(error: string, status: number) {
  return NextResponse.json({ success: false, error } as ApiResponse<null>, { status });
}

async function getRequestId(context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const requestId = Number(id);
  return Number.isInteger(requestId) && requestId > 0 ? requestId : null;
}

function validStatus(value: unknown): value is AppealStatus {
  return typeof value === 'string' && Object.values(AppealStatus).includes(value as AppealStatus);
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = getAuthSession(request);
  const requestId = await getRequestId(context);
  if (!session || session.legacy || !VIEW_ROLES.has(session.role)) return responseError('Unauthorized', 401);
  if (!requestId) return responseError('Invalid request id.', 400);

  const file = await prisma.promotionRequest.findUnique({ where: { id: requestId }, select: { id: true, lecturerId: true } });
  if (!file) return responseError('Promotion file not found.', 404);
  const applicantView = session.role === 'STAFF' || session.role === 'LECTURER';
  if (applicantView && file.lecturerId !== session.userId) return responseError('You can only view appeals for your own promotion file.', 403);

  const appeals = await prisma.appealCase.findMany({
    where: { promotionRequestId: requestId },
    orderBy: [{ filedAt: 'desc' }, { id: 'desc' }],
    select: {
      id: true,
      status: true,
      grounds: true,
      filedAt: true,
      dueAt: true,
      decidedAt: true,
      decision: true,
      filedBy: { select: { name: true, email: true } },
      decisionBy: applicantView ? false : { select: { name: true, email: true } },
    },
  });

  return NextResponse.json({ success: true, data: appeals } as ApiResponse<typeof appeals>);
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = getAuthSession(request);
  const requestId = await getRequestId(context);
  if (!session || session.legacy || !['STAFF', 'LECTURER'].includes(session.role)) return responseError('Only the applicant can file an appeal.', 401);
  if (!requestId) return responseError('Invalid request id.', 400);

  const body = await request.json();
  const grounds = typeof body.grounds === 'string' ? body.grounds.trim() : '';
  if (grounds.length < 30) return responseError('Appeal grounds must clearly explain the basis for review in at least 30 characters.', 400);

  const file = await prisma.promotionRequest.findUnique({ where: { id: requestId }, select: { id: true, lecturerId: true, status: true } });
  if (!file) return responseError('Promotion file not found.', 404);
  if (file.lecturerId !== session.userId) return responseError('You can only appeal your own promotion file.', 403);
  if (!APPEALABLE_STATUSES.has(file.status)) return responseError('This promotion file is not yet at an appealable decision stage.', 409);

  const openAppeal = await prisma.appealCase.findFirst({ where: { promotionRequestId: requestId, status: { in: [AppealStatus.FILED, AppealStatus.UNDER_REVIEW, AppealStatus.HEARING_SCHEDULED] } }, select: { id: true } });
  if (openAppeal) return responseError('An open appeal already exists for this promotion file.', 409);

  const filingWindowSetting = await prisma.systemSetting.findUnique({
    where: { key: 'promotion.appeal.initialWindowMonths' },
    select: { value: true },
  });
  const configuredMonths = Number(filingWindowSetting?.value || 1);
  const filingWindowMonths = Number.isInteger(configuredMonths) && configuredMonths > 0 && configuredMonths <= 6
    ? configuredMonths
    : 1;
  const dueAt = new Date();
  dueAt.setMonth(dueAt.getMonth() + filingWindowMonths);
  const appeal = await prisma.appealCase.create({
    data: { promotionRequestId: requestId, filedById: session.userId, grounds, dueAt },
    select: { id: true, status: true, filedAt: true, dueAt: true },
  });

  await writeAuditLog(prisma, {
    actorId: session.userId,
    action: 'promotion_appeal_filed',
    entityType: 'AppealCase',
    entityId: appeal.id,
    requestId,
    description: 'Promotion appeal filed by applicant.',
    metadata: {
      status: appeal.status,
      dueAt: appeal.dueAt?.toISOString(),
      filingWindowMonths,
      policySetting: 'promotion.appeal.initialWindowMonths',
    },
  });

  return NextResponse.json({ success: true, data: appeal } as ApiResponse<typeof appeal>, { status: 201 });
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = getAuthSession(request);
  const requestId = await getRequestId(context);
  if (!session || session.legacy || !DECISION_ROLES.has(session.role)) return responseError('Unauthorized', 401);
  if (!requestId) return responseError('Invalid request id.', 400);

  const body = await request.json();
  const appealId = Number(body.appealId);
  const nextStatus = validStatus(body.status) ? body.status : null;
  const decision = typeof body.decision === 'string' ? body.decision.trim() : '';
  if (!Number.isInteger(appealId) || !nextStatus) return responseError('Select a valid appeal and status.', 400);

  const appeal = await prisma.appealCase.findFirst({ where: { id: appealId, promotionRequestId: requestId }, select: { id: true, status: true } });
  if (!appeal) return responseError('Appeal record not found.', 404);
  if (!(TRANSITIONS[appeal.status] || []).includes(nextStatus)) return responseError('This appeal transition is not allowed.', 409);
  if ((nextStatus === AppealStatus.DECIDED || nextStatus === AppealStatus.CLOSED) && decision.length < 15) return responseError('Record the appeal decision or close-out note.', 400);

  const now = new Date();
  const updated = await prisma.appealCase.update({
    where: { id: appeal.id },
    data: {
      status: nextStatus,
      decision: decision || undefined,
      decidedAt: nextStatus === AppealStatus.DECIDED || nextStatus === AppealStatus.CLOSED ? now : undefined,
      decisionById: nextStatus === AppealStatus.DECIDED || nextStatus === AppealStatus.CLOSED ? session.userId : undefined,
    },
    select: { id: true, status: true, decidedAt: true, decision: true },
  });

  await writeAuditLog(prisma, {
    actorId: session.userId,
    action: 'promotion_appeal_status_updated',
    entityType: 'AppealCase',
    entityId: appeal.id,
    requestId,
    description: 'Promotion appeal lifecycle updated.',
    metadata: { previousStatus: appeal.status, nextStatus, decision: decision || undefined },
  });

  return NextResponse.json({ success: true, data: updated } as ApiResponse<typeof updated>);
}
