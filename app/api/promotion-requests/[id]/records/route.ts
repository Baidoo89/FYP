import { RecordAccessClassification, RecordLifecycleStatus } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '../../../../../lib/auth';
import { writeAuditLog } from '../../../../../lib/audit-logger';
import { prisma } from '../../../../../lib/prisma';
import { sendApplicantQuarterlyStatusEmail } from '../../../../../lib/workflow-email';
import type { ApiResponse } from '../../../../../types';

const VIEW_ROLES = new Set(['HR_ADMIN']);

function responseError(error: string, status: number) {
  return NextResponse.json({ success: false, error } as ApiResponse<null>, { status });
}

async function requestIdFrom(context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const requestId = Number(id);
  return Number.isInteger(requestId) && requestId > 0 ? requestId : null;
}

function addRetentionYears(value: Date) {
  const result = new Date(value);
  result.setFullYear(result.getFullYear() + 6);
  return result;
}

async function loadRecords(requestId: number) {
  const [control, communications, promotionRequest] = await Promise.all([
    prisma.promotionRecordControl.findUnique({ where: { promotionRequestId: requestId } }),
    prisma.communicationDelivery.findMany({
      where: { promotionRequestId: requestId },
      orderBy: { attemptedAt: 'desc' },
      take: 25,
      select: {
        id: true,
        purpose: true,
        recipientAddress: true,
        subject: true,
        provider: true,
        providerMessageId: true,
        status: true,
        errorMessage: true,
        attemptedAt: true,
        sentAt: true,
      },
    }),
    prisma.promotionRequest.findUnique({
      where: { id: requestId },
      select: {
        effectiveDate: true,
        nextApplicantUpdateDueAt: true,
        promotionRoute: { select: { promotionTrack: { select: { type: true } } } },
      },
    }),
  ]);
  return { control, communications, promotionRequest };
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = getAuthSession(request);
  const requestId = await requestIdFrom(context);
  if (!session || session.legacy || !VIEW_ROLES.has(session.role)) return responseError('Unauthorized', 401);
  if (!requestId) return responseError('Invalid request id.', 400);
  const file = await prisma.promotionRequest.findUnique({ where: { id: requestId }, select: { id: true } });
  if (!file) return responseError('Promotion file not found.', 404);
  return NextResponse.json({ success: true, data: await loadRecords(requestId) });
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = getAuthSession(request);
  const requestId = await requestIdFrom(context);
  if (!session || session.legacy || session.role !== 'HR_ADMIN') return responseError('Only HRODD records staff can change record controls.', 403);
  if (!requestId) return responseError('Invalid request id.', 400);

  const file = await prisma.promotionRequest.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      status: true,
      currentRank: true,
      targetRank: true,
      lecturer: { select: { id: true, name: true, email: true } },
      promotionRoute: { select: { promotionTrack: { select: { type: true } } } },
      workflowStages: {
        where: { status: 'IN_PROGRESS' },
        orderBy: { sequence: 'asc' },
        take: 1,
        select: { stage: true },
      },
    },
  });
  if (!file) return responseError('Promotion file not found.', 404);
  const body = await request.json();
  const action = typeof body.action === 'string' ? body.action.toUpperCase() : '';
  const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
  const reference = typeof body.reference === 'string' ? body.reference.trim() : '';
  const now = new Date();

  if (action === 'SEND_STATUS_UPDATE') {
    if (file.promotionRoute?.promotionTrack.type !== 'SCHEDULE_J') return responseError('Quarterly status notices apply to Schedule J academic cases.', 409);
    if (['DRAFT', 'APPROVED', 'REJECTED', 'COMPLETED'].includes(file.status)) return responseError('This application is not in an active submitted workflow.', 409);
    const delivery = await sendApplicantQuarterlyStatusEmail({
      request: file,
      currentStage: file.workflowStages[0]?.stage || null,
      note: reason || null,
    });
    let nextApplicantUpdateDueAt = null;
    if (delivery.delivered) {
      nextApplicantUpdateDueAt = new Date(now);
      nextApplicantUpdateDueAt.setMonth(nextApplicantUpdateDueAt.getMonth() + 3);
      await prisma.promotionRequest.update({ where: { id: requestId }, data: { nextApplicantUpdateDueAt } });
    }
    await writeAuditLog(prisma, {
      actorId: session.userId,
      action: 'promotion_quarterly_status_attempted',
      entityType: 'PromotionRequest',
      entityId: requestId,
      requestId,
      description: delivery.delivered ? 'Quarterly applicant status update delivered.' : 'Quarterly applicant status update attempted but not confirmed delivered.',
      metadata: { provider: delivery.provider, delivered: delivery.delivered, nextApplicantUpdateDueAt, note: reason || undefined },
    });
    return NextResponse.json({
      success: true,
      data: await loadRecords(requestId),
      message: delivery.delivered
        ? 'Status update delivered; the next three-month deadline is scheduled.'
        : 'Status update was logged but delivery was not confirmed. The due date remains active for retry.',
    });
  }

  if (action === 'SET_EFFECTIVE_DATE') {
    if (!['APPROVED_BY_AUTHORITY', 'APPROVED', 'COMPLETED'].includes(file.status)) return responseError('Final authority approval must be recorded before setting the effective date.', 409);
    if (reason.length < 10) return responseError('Record the approved calculation or adjustment reason.', 400);
    const value = typeof body.effectiveDate === 'string' ? body.effectiveDate : '';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return responseError('Enter a valid effective date.', 400);
    const effectiveDate = new Date(`${value}T00:00:00.000Z`);
    const validWindow = (effectiveDate.getUTCMonth() === 1 || effectiveDate.getUTCMonth() === 7)
      && effectiveDate.getUTCDate() === 1;
    if (Number.isNaN(effectiveDate.getTime()) || !validWindow) return responseError('Normal GCTU effective dates must be 1 February or 1 August.', 400);
    await prisma.promotionRequest.update({ where: { id: requestId }, data: { effectiveDate } });
    await writeAuditLog(prisma, {
      actorId: session.userId,
      action: 'promotion_effective_date_set',
      entityType: 'PromotionRequest',
      entityId: requestId,
      requestId,
      description: 'Authorized promotion effective date recorded.',
      metadata: { effectiveDate: effectiveDate.toISOString(), reason },
    });
    return NextResponse.json({ success: true, data: await loadRecords(requestId), message: 'Effective date recorded and audited.' });
  }

  const current = await prisma.promotionRecordControl.upsert({
    where: { promotionRequestId: requestId },
    update: {},
    create: { promotionRequestId: requestId },
  });

  let data;
  if (action === 'SET_CLASSIFICATION') {
    const classification = body.classification as RecordAccessClassification;
    if (!Object.values(RecordAccessClassification).includes(classification)) return responseError('Select a valid record classification.', 400);
    data = { accessClassification: classification };
  } else if (action === 'SET_RETENTION_TRIGGER') {
    const trigger = new Date(body.triggerDate);
    if (Number.isNaN(trigger.getTime())) return responseError('Enter a valid employment-end retention trigger date.', 400);
    data = { retentionTriggerDate: trigger, retainUntil: addRetentionYears(trigger) };
  } else if (action === 'PLACE_HOLD') {
    if (reason.length < 10) return responseError('State the legal, audit, appeal, or administrative hold reason.', 400);
    data = { legalHold: true, holdReason: reason, holdPlacedById: session.userId, holdPlacedAt: now, lifecycleStatus: RecordLifecycleStatus.UNDER_HOLD };
  } else if (action === 'RELEASE_HOLD') {
    if (!current.legalHold) return responseError('This promotion record is not under hold.', 409);
    if (reason.length < 10) return responseError('Record the authority and reason for releasing the hold.', 400);
    data = { legalHold: false, holdReason: `${current.holdReason || 'Hold'} | Release: ${reason}`, holdReleasedById: session.userId, holdReleasedAt: now, lifecycleStatus: file.status === 'COMPLETED' ? RecordLifecycleStatus.CLOSED : RecordLifecycleStatus.ACTIVE };
  } else if (action === 'CLOSE_RECORD') {
    if (file.status !== 'COMPLETED') return responseError('Complete the promotion workflow before closing its records file.', 409);
    data = { lifecycleStatus: current.legalHold ? RecordLifecycleStatus.UNDER_HOLD : RecordLifecycleStatus.CLOSED, notes: reason || current.notes };
  } else if (action === 'MARK_ARCHIVED') {
    if (reference.length < 3) return responseError('Enter the University Archives transfer reference.', 400);
    data = { archiveReference: reference, archivedById: session.userId, archivedAt: now, lifecycleStatus: RecordLifecycleStatus.ARCHIVED };
  } else if (action === 'AUTHORIZE_DISPOSITION') {
    if (current.legalHold) return responseError('Disposition cannot be authorized while a hold is active.', 409);
    if (!current.retainUntil || current.retainUntil > now) return responseError('The retention period has not expired or has not been established.', 409);
    if (reason.length < 10) return responseError('Record the Archivist or depositing-office disposition authority.', 400);
    data = { dispositionApprovedById: session.userId, dispositionApprovedAt: now, lifecycleStatus: RecordLifecycleStatus.DISPOSITION_AUTHORIZED, notes: reason };
  } else if (action === 'MARK_DISPOSED') {
    if (current.legalHold) return responseError('A held record cannot be disposed.', 409);
    if (current.lifecycleStatus !== RecordLifecycleStatus.DISPOSITION_AUTHORIZED) return responseError('Disposition must be authorized first.', 409);
    if (reference.length < 5) return responseError('Enter the destruction certificate or disposition register reference.', 400);
    data = { destructionCertificateReference: reference, disposedById: session.userId, disposedAt: now, lifecycleStatus: RecordLifecycleStatus.DISPOSED };
  } else {
    return responseError('Select a valid records action.', 400);
  }

  const updated = await prisma.promotionRecordControl.update({ where: { id: current.id }, data });
  await writeAuditLog(prisma, {
    actorId: session.userId,
    action: `promotion_records_${action.toLowerCase()}`,
    entityType: 'PromotionRecordControl',
    entityId: updated.id,
    requestId,
    description: `Promotion records control updated: ${action.replace(/_/g, ' ')}.`,
    metadata: { reason: reason || undefined, reference: reference || undefined, lifecycleStatus: updated.lifecycleStatus },
  });
  return NextResponse.json({ success: true, data: await loadRecords(requestId) });
}
