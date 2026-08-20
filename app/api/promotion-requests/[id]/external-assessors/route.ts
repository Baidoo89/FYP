import { ExternalAssessorStatus } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '../../../../../lib/auth';
import { writeAuditLog } from '../../../../../lib/audit-logger';
import { canAccessDepartmentPromotionRequest } from '../../../../../lib/department-scope';
import { prisma } from '../../../../../lib/prisma';
import type { ApiResponse } from '../../../../../types';

const INTERNAL_ROLES = new Set(['HOD_DEAN', 'HR_ADMIN', 'COMMITTEE_REVIEWER', 'SYSTEM_ADMIN']);
const NOMINATION_ROLES = new Set(['HOD_DEAN', 'HR_ADMIN', 'SYSTEM_ADMIN']);
const MANAGEMENT_ROLES = new Set(['HR_ADMIN', 'SYSTEM_ADMIN']);

const TRANSITIONS: Partial<Record<ExternalAssessorStatus, ExternalAssessorStatus[]>> = {
  NOMINATED: [ExternalAssessorStatus.CONFLICTED, ExternalAssessorStatus.INVITED, ExternalAssessorStatus.WITHDRAWN],
  CONFLICTED: [ExternalAssessorStatus.NOMINATED, ExternalAssessorStatus.WITHDRAWN],
  INVITED: [ExternalAssessorStatus.ACCEPTED, ExternalAssessorStatus.DECLINED, ExternalAssessorStatus.WITHDRAWN],
  ACCEPTED: [ExternalAssessorStatus.REPORT_REQUESTED, ExternalAssessorStatus.WITHDRAWN],
  DECLINED: [ExternalAssessorStatus.REPLACED],
  REPORT_REQUESTED: [ExternalAssessorStatus.REPORT_RECEIVED, ExternalAssessorStatus.WITHDRAWN],
};

function responseError(error: string, status: number) {
  return NextResponse.json({ success: false, error } as ApiResponse<null>, { status });
}

async function canAccessFile(requestId: number, session: NonNullable<ReturnType<typeof getAuthSession>>) {
  if (session.role !== 'HOD_DEAN') return true;
  return canAccessDepartmentPromotionRequest(prisma, {
    userId: session.userId,
    role: session.role,
    sessionDepartment: session.department,
    requestId,
  });
}

async function getRequestId(context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const requestId = Number(id);
  return Number.isInteger(requestId) && requestId > 0 ? requestId : null;
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = getAuthSession(request);
  const requestId = await getRequestId(context);
  if (!session || session.legacy || !INTERNAL_ROLES.has(session.role)) return responseError('Unauthorized', 401);
  if (!requestId) return responseError('Invalid request id.', 400);
  if (!(await canAccessFile(requestId, session))) return responseError('This promotion file is outside your department scope.', 403);

  const assessors = await prisma.externalAssessor.findMany({
    where: { promotionRequestId: requestId },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      name: true,
      institution: true,
      country: true,
      specialization: true,
      officialEmail: true,
      status: true,
      conflictCheckedAt: true,
      conflictReason: true,
      invitedAt: true,
      acceptedAt: true,
      reportRequestedAt: true,
      reportReceivedAt: true,
      reportSummary: true,
      createdAt: true,
    },
  });
  return NextResponse.json({ success: true, data: assessors } as ApiResponse<typeof assessors>);
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = getAuthSession(request);
  const requestId = await getRequestId(context);
  if (!session || session.legacy || !NOMINATION_ROLES.has(session.role)) return responseError('Unauthorized', 401);
  if (!requestId) return responseError('Invalid request id.', 400);
  if (!(await canAccessFile(requestId, session))) return responseError('This promotion file is outside your department scope.', 403);

  const body = await request.json();
  const name = String(body.name || '').trim();
  const institution = String(body.institution || '').trim();
  const country = String(body.country || '').trim();
  const specialization = String(body.specialization || '').trim();
  const officialEmail = String(body.officialEmail || '').trim().toLowerCase();
  if (name.length < 3 || institution.length < 2 || country.length < 2 || specialization.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(officialEmail)) {
    return responseError('Provide the assessor name, institution, country, specialization, and an official email address.', 400);
  }

  const file = await prisma.promotionRequest.findUnique({ where: { id: requestId }, select: { id: true } });
  if (!file) return responseError('Promotion file not found.', 404);

  const assessor = await prisma.externalAssessor.create({
    data: {
      promotionRequestId: requestId,
      nominatedById: session.userId,
      name,
      institution,
      country,
      specialization,
      officialEmail,
    },
    select: { id: true, name: true, status: true, createdAt: true },
  });
  const nomineeCount = await prisma.externalAssessor.count({ where: { promotionRequestId: requestId, status: { notIn: [ExternalAssessorStatus.REPLACED, ExternalAssessorStatus.WITHDRAWN] } } });

  await writeAuditLog(prisma, {
    actorId: session.userId,
    action: 'external_assessor_nominated',
    entityType: 'ExternalAssessor',
    entityId: assessor.id,
    requestId,
    description: 'External assessor candidate nominated.',
    metadata: { name, institution, country, nomineeCount },
  });

  return NextResponse.json({ success: true, data: { assessor, nomineeCount } } as ApiResponse<{ assessor: typeof assessor; nomineeCount: number }>, { status: 201 });
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = getAuthSession(request);
  const requestId = await getRequestId(context);
  if (!session || session.legacy || !MANAGEMENT_ROLES.has(session.role)) return responseError('Unauthorized', 401);
  if (!requestId) return responseError('Invalid request id.', 400);

  const body = await request.json();
  const assessorId = Number(body.assessorId);
  const nextStatus = String(body.status || '') as ExternalAssessorStatus;
  const conflictReason = typeof body.conflictReason === 'string' ? body.conflictReason.trim() : '';
  const reportSummary = typeof body.reportSummary === 'string' ? body.reportSummary.trim() : '';
  if (!Number.isInteger(assessorId) || !Object.values(ExternalAssessorStatus).includes(nextStatus)) return responseError('Select a valid assessor and lifecycle status.', 400);

  const assessor = await prisma.externalAssessor.findFirst({
    where: { id: assessorId, promotionRequestId: requestId },
    select: { id: true, status: true },
  });
  if (!assessor) return responseError('External assessor record not found.', 404);
  if (!(TRANSITIONS[assessor.status] || []).includes(nextStatus)) return responseError('This lifecycle transition is not allowed.', 409);
  if (nextStatus === ExternalAssessorStatus.CONFLICTED && conflictReason.length < 5) return responseError('Record the reason for the conflict of interest.', 400);
  if (nextStatus === ExternalAssessorStatus.REPORT_RECEIVED && reportSummary.length < 10) return responseError('Record a concise confidential report summary.', 400);

  const now = new Date();
  const updated = await prisma.externalAssessor.update({
    where: { id: assessor.id },
    data: {
      status: nextStatus,
      appointedById: (nextStatus === ExternalAssessorStatus.INVITED || nextStatus === ExternalAssessorStatus.REPORT_REQUESTED) ? session.userId : undefined,
      conflictCheckedAt: nextStatus === ExternalAssessorStatus.CONFLICTED ? now : undefined,
      conflictReason: nextStatus === ExternalAssessorStatus.CONFLICTED ? conflictReason : undefined,
      invitedAt: nextStatus === ExternalAssessorStatus.INVITED ? now : undefined,
      acceptedAt: nextStatus === ExternalAssessorStatus.ACCEPTED ? now : undefined,
      reportRequestedAt: nextStatus === ExternalAssessorStatus.REPORT_REQUESTED ? now : undefined,
      reportReceivedAt: nextStatus === ExternalAssessorStatus.REPORT_RECEIVED ? now : undefined,
      reportSummary: nextStatus === ExternalAssessorStatus.REPORT_RECEIVED ? reportSummary : undefined,
    },
    select: { id: true, name: true, status: true, updatedAt: true },
  });

  await writeAuditLog(prisma, {
    actorId: session.userId,
    action: 'external_assessor_status_updated',
    entityType: 'ExternalAssessor',
    entityId: assessor.id,
    requestId,
    description: 'External assessor lifecycle status updated.',
    metadata: { previousStatus: assessor.status, nextStatus, conflictReason: conflictReason || undefined, reportSummary: reportSummary || undefined },
  });

  return NextResponse.json({ success: true, data: updated } as ApiResponse<typeof updated>);
}