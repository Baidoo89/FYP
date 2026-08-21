import { DecisionAuthority, PromotionStage, ReviewRecommendation } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '../../../../../lib/auth';
import { writeAuditLog } from '../../../../../lib/audit-logger';
import { prisma } from '../../../../../lib/prisma';
import type { ApiResponse } from '../../../../../types';

const MEETING_ROLES = new Set(['HR_ADMIN', 'COMMITTEE_REVIEWER']);

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
      participants: {
        orderBy: [{ isChair: 'desc' }, { memberName: 'asc' }],
        select: {
          id: true,
          memberName: true,
          memberRole: true,
          rankCodeSnapshot: true,
          attended: true,
          conflictDeclared: true,
          conflictDetails: true,
          recused: true,
          eligibleForCase: true,
          ineligibilityReason: true,
          isChair: true,
          isSecretary: true,
        },
      },
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
  const agendaReference = typeof body.agendaReference === 'string' ? body.agendaReference.trim() : '';
  const resolution = typeof body.resolution === 'string' ? body.resolution.trim() : '';
  const authority = validAuthority(body.authority) ? body.authority : null;
  const recommendation = validRecommendation(body.recommendation) ? body.recommendation : null;

  if (!meetingDate || Number.isNaN(meetingDate.getTime())) return responseError('Select a valid meeting date.', 400);
  if (!Number.isInteger(quorumRequired) || quorumRequired < 1 || quorumRequired > 200) return responseError('Record a valid baseline quorum requirement.', 400);
  if (agendaReference.length < 3) return responseError('Record the agenda or minute reference.', 400);
  if (resolution.length < 15) return responseError('Record a clear committee resolution of at least 15 characters.', 400);
  if (!recommendation) return responseError('Select the committee recommendation.', 400);

  const file = await prisma.promotionRequest.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      lecturerId: true,
      lecturer: { select: { name: true } },
      promotionRoute: {
        select: {
          targetRank: { select: { level: true } },
          promotionTrack: { select: { type: true } },
        },
      },
    },
  });
  if (!file) return responseError('Promotion file not found.', 404);
  if (file.lecturerId === session.userId) return responseError('You cannot record a committee meeting for your own promotion file.', 403);

  const stage = stageRecordId > 0
    ? await prisma.promotionStageRecord.findFirst({ where: { id: stageRecordId, promotionRequestId: requestId }, select: { id: true, stage: true } })
    : await prisma.promotionStageRecord.findFirst({ where: { promotionRequestId: requestId, stage: { in: [PromotionStage.RAPC, PromotionStage.UAPC, PromotionStage.COUNCIL, PromotionStage.ACADEMIC_BOARD, PromotionStage.FACULTY] } }, orderBy: { sequence: 'asc' }, select: { id: true, stage: true } });
  if (stageRecordId > 0 && !stage) return responseError('Workflow stage not found for this meeting.', 404);

  const resolvedAuthority = authority || (stage ? AUTHORITY_BY_STAGE[stage.stage] : null);
  if (!resolvedAuthority) return responseError('Select the committee authority for this meeting.', 400);

  const participantInput = Array.isArray(body.participants) ? body.participants : [];
  if (participantInput.length === 0 || participantInput.length > 100) return responseError('Record the committee membership and attendance for this case.', 400);
  const rankCodes = participantInput.map((item) => typeof item?.rankCode === 'string' ? item.rankCode.trim() : '').filter(Boolean);
  const ranks = rankCodes.length ? await prisma.rankDefinition.findMany({ where: { code: { in: rankCodes } }, select: { code: true, level: true } }) : [];
  const rankLevels = new Map(ranks.map((rank) => [rank.code, rank.level]));
  const applicantName = file.lecturer.name.trim().toLowerCase();
  const targetLevel = file.promotionRoute?.targetRank.level || null;
  const participants = participantInput.map((item, index) => {
    const memberName = typeof item?.memberName === 'string' ? item.memberName.trim() : '';
    const memberRole = typeof item?.memberRole === 'string' ? item.memberRole.trim() : '';
    const rankCodeSnapshot = typeof item?.rankCode === 'string' ? item.rankCode.trim() || null : null;
    const conflictDeclared = item?.conflictDeclared === true;
    const conflictDetails = typeof item?.conflictDetails === 'string' ? item.conflictDetails.trim() : '';
    const attended = item?.attended !== false;
    const isApplicant = memberName.toLowerCase() === applicantName;
    const knownLevel = rankCodeSnapshot ? rankLevels.get(rankCodeSnapshot) : undefined;
    const belowTarget = targetLevel !== null && knownLevel !== undefined && knownLevel < targetLevel;
    const recused = item?.recused === true || conflictDeclared || isApplicant;
    const eligibleForCase = item?.eligibleForCase !== false && !belowTarget && !recused;
    const reasons = [
      isApplicant ? 'Applicant excluded from own case' : '',
      conflictDeclared ? 'Conflict declared' : '',
      belowTarget ? 'Member rank below target rank' : '',
      item?.eligibleForCase === false ? 'Marked ineligible by Secretariat' : '',
    ].filter(Boolean);
    return {
      memberName,
      memberRole: memberRole || null,
      rankCodeSnapshot,
      attended,
      conflictDeclared,
      conflictDetails: conflictDetails || null,
      recused,
      eligibleForCase,
      ineligibilityReason: reasons.join('; ') || null,
      isChair: item?.isChair === true,
      isSecretary: item?.isSecretary === true,
      row: index + 1,
    };
  });
  const invalidName = participants.find((participant) => participant.memberName.length < 3);
  if (invalidName) return responseError(`Committee member name is required in row ${invalidName.row}.`, 400);
  const unresolvedConflict = participants.find((participant) => participant.conflictDeclared && !participant.conflictDetails);
  if (unresolvedConflict) return responseError(`Record conflict details for ${unresolvedConflict.memberName}.`, 400);

  const eligiblePresent = participants.filter((participant) => participant.attended && participant.eligibleForCase && !participant.recused);
  let resolvedQuorumRequired = quorumRequired;
  if (stage?.stage === PromotionStage.FACULTY) resolvedQuorumRequired = Math.max(3, quorumRequired);
  if (stage?.stage === PromotionStage.UAPC) resolvedQuorumRequired = Math.max(quorumRequired, Math.ceil(participants.length / 2));
  const eligibleChairPresent = eligiblePresent.some((participant) => participant.isChair);
  const viceChancellorPresent = eligiblePresent.some((participant) => /vice[- ]chancellor/i.test(participant.memberRole || ''));
  const requiresFacultyChair = stage?.stage === PromotionStage.FACULTY;
  const requiresScheduleKViceChancellor = stage?.stage === PromotionStage.UAPC && file.promotionRoute?.promotionTrack.type === 'SCHEDULE_K';
  const quorumMet = eligiblePresent.length >= resolvedQuorumRequired
    && (!requiresFacultyChair || eligibleChairPresent)
    && (!requiresScheduleKViceChancellor || viceChancellorPresent);

  const meeting = await prisma.committeeMeeting.create({
    data: {
      promotionRequestId: requestId,
      stageRecordId: stage?.id,
      authority: resolvedAuthority,
      meetingDate,
      quorumRequired: resolvedQuorumRequired,
      quorumPresent: eligiblePresent.length,
      quorumMet,
      agendaReference,
      resolution,
      recommendation,
      chairId: session.userId,
      secretaryId: session.userId,
      participants: {
        create: participants.map(({ row: _row, ...participant }) => participant),
      },
    },
    select: { id: true, authority: true, quorumRequired: true, quorumPresent: true, quorumMet: true, recommendation: true, meetingDate: true },
  });

  await writeAuditLog(prisma, {
    actorId: session.userId,
    action: 'committee_meeting_recorded',
    entityType: 'CommitteeMeeting',
    entityId: meeting.id,
    requestId,
    description: 'Formal committee meeting and resolution recorded.',
    metadata: {
      stageRecordId: stage?.id,
      authority: resolvedAuthority,
      quorumRequired: resolvedQuorumRequired,
      quorumPresent: eligiblePresent.length,
      quorumMet,
      participantCount: participants.length,
      conflicts: participants.filter((participant) => participant.conflictDeclared).length,
      recusals: participants.filter((participant) => participant.recused).length,
      recommendation,
    },
  });

  return NextResponse.json({ success: true, data: meeting } as ApiResponse<typeof meeting>, { status: 201 });
}
