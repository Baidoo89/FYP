import { DecisionAuthority, PromotionStage, ReviewRecommendation } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '../../../../../lib/auth';
import { writeAuditLog } from '../../../../../lib/audit-logger';
import { prisma } from '../../../../../lib/prisma';
import type { ApiResponse } from '../../../../../types';

const MEETING_ROLES = new Set(['HR_ADMIN', 'COMMITTEE_REVIEWER', 'SYSTEM_ADMIN']);

const AUTHORITY_BY_STAGE: Partial<Record<PromotionStage, DecisionAuthority>> = {
  FACULTY: DecisionAuthority.FAPC,
  RAPC: DecisionAuthority.RAPC,
  UAPC: DecisionAuthority.UAPC,
  COUNCIL: DecisionAuthority.COUNCIL,
  ACADEMIC_BOARD: DecisionAuthority.ACADEMIC_BOARD,
};

function responseError(error: string, status: number) {
  return NextResponse.json({ success: false, error } as ApiResponse<null>, { status });
}

async function getRequestId(context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const requestId = Number(id);
  return Number.isInteger(requestId) && requestId > 0 ? requestId : null;
}

function validAuthority(value: unknown): value is DecisionAuthority {
  return typeof value === 'string' && Object.values(DecisionAuthority).includes(value as DecisionAuthority);
}

function validRecommendation(value: unknown): value is ReviewRecommendation {
  return typeof value === 'string' && Object.values(ReviewRecommendation).includes(value as ReviewRecommendation);
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = getAuthSession(request);
  const requestId = await getRequestId(context);
  if (!session || session.legacy || !MEETING_ROLES.has(session.role)) return responseError('Unauthorized', 401);
  if (!requestId) return responseError('Invalid request id.', 400);

  const meetings = await prisma.committeeMeeting.findMany({
    where: { promotionRequestId: requestId },
    orderBy: [{ meetingDate: 'desc' }, { id: 'desc' }],
    select: {
      id: true,
      stageRecordId: true,
      authority: true,
      meetingDate: true,
      quorumRequired: true,
      quorumPresent: true,
      quorumMet: true,
      agendaReference: true,
      resolution: true,
      recommendation: true,
      createdAt: true,
      chair: { select: { name: true, email: true } },
      secretary: { select: { name: true, email: true } },
    },
  });

  return NextResponse.json({ success: true, data: meetings } as ApiResponse<typeof meetings>);
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = getAuthSession(request);
  const requestId = await getRequestId(context);
  if (!session || session.legacy || !MEETING_ROLES.has(session.role)) return responseError('Unauthorized', 401);
  if (!requestId) return responseError('Invalid request id.', 400);

  const body = await request.json();
  const stageRecordId = Number(body.stageRecordId || 0);
  const meetingDate = typeof body.meetingDate === 'string' ? new Date(body.meetingDate) : null;
  const quorumRequired = Number(body.quorumRequired);
  const quorumPresent = Number(body.quorumPresent);
  const agendaReference = typeof body.agendaReference === 'string' ? body.agendaReference.trim() : '';
  const resolution = typeof body.resolution === 'string' ? body.resolution.trim() : '';
  const authority = validAuthority(body.authority) ? body.authority : null;
  const recommendation = validRecommendation(body.recommendation) ? body.recommendation : null;

  if (!meetingDate || Number.isNaN(meetingDate.getTime())) return responseError('Select a valid meeting date.', 400);
  if (!Number.isInteger(quorumRequired) || quorumRequired < 1 || !Number.isInteger(quorumPresent) || quorumPresent < 0) return responseError('Record valid quorum required and quorum present numbers.', 400);
  if (quorumPresent > 200 || quorumRequired > 200) return responseError('Quorum numbers are outside the expected range.', 400);
  if (agendaReference.length < 3) return responseError('Record the agenda or minute reference.', 400);
  if (resolution.length < 15) return responseError('Record a clear committee resolution of at least 15 characters.', 400);
  if (!recommendation) return responseError('Select the committee recommendation.', 400);

  const file = await prisma.promotionRequest.findUnique({ where: { id: requestId }, select: { id: true, lecturerId: true } });
  if (!file) return responseError('Promotion file not found.', 404);
  if (file.lecturerId === session.userId) return responseError('You cannot record a committee meeting for your own promotion file.', 403);

  const stage = stageRecordId > 0
    ? await prisma.promotionStageRecord.findFirst({ where: { id: stageRecordId, promotionRequestId: requestId }, select: { id: true, stage: true } })
    : await prisma.promotionStageRecord.findFirst({ where: { promotionRequestId: requestId, stage: { in: [PromotionStage.RAPC, PromotionStage.UAPC, PromotionStage.COUNCIL, PromotionStage.ACADEMIC_BOARD, PromotionStage.FACULTY] } }, orderBy: { sequence: 'asc' }, select: { id: true, stage: true } });
  if (stageRecordId > 0 && !stage) return responseError('Workflow stage not found for this meeting.', 404);

  const resolvedAuthority = authority || (stage ? AUTHORITY_BY_STAGE[stage.stage] : null);
  if (!resolvedAuthority) return responseError('Select the committee authority for this meeting.', 400);

  const meeting = await prisma.committeeMeeting.create({
    data: {
      promotionRequestId: requestId,
      stageRecordId: stage?.id,
      authority: resolvedAuthority,
      meetingDate,
      quorumRequired,
      quorumPresent,
      quorumMet: quorumPresent >= quorumRequired,
      agendaReference,
      resolution,
      recommendation,
      chairId: session.userId,
      secretaryId: session.userId,
    },
    select: { id: true, authority: true, quorumMet: true, recommendation: true, meetingDate: true },
  });

  await writeAuditLog(prisma, {
    actorId: session.userId,
    action: 'committee_meeting_recorded',
    entityType: 'CommitteeMeeting',
    entityId: meeting.id,
    requestId,
    description: 'Formal committee meeting and resolution recorded.',
    metadata: { stageRecordId: stage?.id, authority: resolvedAuthority, quorumRequired, quorumPresent, recommendation },
  });

  return NextResponse.json({ success: true, data: meeting } as ApiResponse<typeof meeting>, { status: 201 });
}