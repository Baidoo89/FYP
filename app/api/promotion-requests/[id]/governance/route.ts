import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '../../../../../lib/auth';
import { writeAuditLog } from '../../../../../lib/audit-logger';
import { AssessmentType, PromotionStageStatus, ReviewRecommendation } from '@prisma/client';
import { prisma } from '../../../../../lib/prisma';
import type { ApiResponse } from '../../../../../types';

const REVIEW_ROLES = new Set([
  'STAFF',
  'LECTURER',
  'HOD_DEAN',
  'HR_ADMIN',
  'COMMITTEE_REVIEWER',
  'SYSTEM_ADMIN',
]);

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = getAuthSession(request);
  if (!session || session.legacy || !REVIEW_ROLES.has(session.role)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' } as ApiResponse<null>, { status: 401 });
  }

  const { id } = await context.params;
  const requestId = Number(id);
  if (!Number.isInteger(requestId) || requestId <= 0) {
    return NextResponse.json({ success: false, error: 'Invalid request id.' } as ApiResponse<null>, { status: 400 });
  }

  const file = await prisma.promotionRequest.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      lecturerId: true,
      status: true,
      currentRank: true,
      targetRank: true,
      receiptNumber: true,
      submittedAt: true,
      promotionRoute: {
        select: {
          code: true,
          name: true,
          promotionTrack: { select: { type: true } },
        },
      },
      workflowStages: {
        orderBy: [{ sequence: 'asc' }],
        select: {
          id: true,
          stage: true,
          sequence: true,
          status: true,
          assignedToId: true,
          startedAt: true,
          dueAt: true,
          completedAt: true,
          decision: true,
          decisionReason: true,
        },
      },
      externalAssessors: {
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          name: true,
          institution: true,
          country: true,
          specialization: true,
          status: true,
          conflictCheckedAt: true,
          invitedAt: true,
          acceptedAt: true,
          reportRequestedAt: true,
          reportReceivedAt: true,
          reportSummary: true,
        },
      },
      assessments: {
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          stageRecordId: true,
          assessorId: true,
          type: true,
          teachingCategory: true,
          knowledgeCategory: true,
          serviceCategory: true,
          workKnowledgeCategory: true,
          workApplicationCategory: true,
          humanRelationsCategory: true,
          narrative: true,
          recommendation: true,
          isConfidential: true,
          submittedAt: true,
          createdAt: true,
        },
      },
      committeeMeetings: {
        orderBy: { meetingDate: 'asc' },
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
        },
      },
      appealCases: {
        orderBy: { filedAt: 'desc' },
        select: {
          id: true,
          status: true,
          grounds: true,
          filedAt: true,
          dueAt: true,
          decidedAt: true,
          decision: true,
        },
      },
    },
  });

  if (!file) {
    return NextResponse.json({ success: false, error: 'Promotion file not found.' } as ApiResponse<null>, { status: 404 });
  }

  if (session.role === 'STAFF' || session.role === 'LECTURER') {
    if (file.lecturerId !== session.userId) {
      return NextResponse.json({ success: false, error: 'You can only view your own promotion file.' } as ApiResponse<null>, { status: 403 });
    }
  }

  const data = {
    ...file,
    externalAssessors:
      session.role === 'STAFF' || session.role === 'LECTURER' ? [] : file.externalAssessors,
    assessments: file.assessments.filter((assessment) => {
      if (!assessment.isConfidential) return true;
      return session.role !== 'STAFF' && session.role !== 'LECTURER';
    }),
  };

  return NextResponse.json({ success: true, data } as ApiResponse<typeof data>);
}




const STAGE_ROLES: Record<string, string[]> = {
  DEPARTMENT: ['HOD_DEAN', 'SYSTEM_ADMIN'],
  FACULTY: ['HOD_DEAN', 'COMMITTEE_REVIEWER', 'SYSTEM_ADMIN'],
  RAPC: ['HR_ADMIN', 'COMMITTEE_REVIEWER', 'SYSTEM_ADMIN'],
  EXTERNAL_ASSESSMENT: ['HR_ADMIN', 'COMMITTEE_REVIEWER', 'SYSTEM_ADMIN'],
  UAPC: ['HR_ADMIN', 'COMMITTEE_REVIEWER', 'SYSTEM_ADMIN'],
  COUNCIL: ['HR_ADMIN', 'COMMITTEE_REVIEWER', 'SYSTEM_ADMIN'],
  ACADEMIC_BOARD: ['HR_ADMIN', 'COMMITTEE_REVIEWER', 'SYSTEM_ADMIN'],
  FINAL_NOTIFICATION: ['HR_ADMIN', 'SYSTEM_ADMIN'],
  APPEAL: ['HR_ADMIN', 'SYSTEM_ADMIN'],
};

const ASSESSMENT_TYPE_BY_STAGE: Record<string, AssessmentType> = {
  DEPARTMENT: AssessmentType.HEAD_OF_UNIT,
  FACULTY: AssessmentType.FAPC,
  RAPC: AssessmentType.RAPC,
  EXTERNAL_ASSESSMENT: AssessmentType.EXTERNAL_ASSESSOR,
  UAPC: AssessmentType.UAPC,
  COUNCIL: AssessmentType.COUNCIL,
};

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = getAuthSession(request);
  if (!session || session.legacy || !REVIEW_ROLES.has(session.role)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' } as ApiResponse<null>, { status: 401 });
  }

  const { id } = await context.params;
  const requestId = Number(id);
  if (!Number.isInteger(requestId) || requestId <= 0) {
    return NextResponse.json({ success: false, error: 'Invalid request id.' } as ApiResponse<null>, { status: 400 });
  }

  const body = await request.json();
  const stageRecordId = Number(body.stageRecordId);
  const decision = body.decision as PromotionStageStatus | undefined;
  const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
  if (!Number.isInteger(stageRecordId) || !['COMPLETED', 'RETURNED', 'BLOCKED'].includes(decision || '') || reason.length < 10) {
    return NextResponse.json({ success: false, error: 'A valid stage, decision, and reason of at least 10 characters are required.' } as ApiResponse<null>, { status: 400 });
  }

  const stageRecord = await prisma.promotionStageRecord.findFirst({
    where: { id: stageRecordId, promotionRequestId: requestId },
    select: { id: true, stage: true, status: true, assignedToId: true, promotionRequest: { select: { lecturerId: true } } },
  });
  if (!stageRecord) {
    return NextResponse.json({ success: false, error: 'Workflow stage not found for this promotion file.' } as ApiResponse<null>, { status: 404 });
  }
  if (stageRecord.promotionRequest.lecturerId === session.userId) {
    return NextResponse.json({ success: false, error: 'You cannot review your own promotion file.' } as ApiResponse<null>, { status: 403 });
  }
  if (!(STAGE_ROLES[stageRecord.stage] || []).includes(session.role)) {
    return NextResponse.json({ success: false, error: 'Your role is not authorized to decide this workflow stage.' } as ApiResponse<null>, { status: 403 });
  }
  if (stageRecord.assignedToId && stageRecord.assignedToId !== session.userId && session.role !== 'SYSTEM_ADMIN') {
    return NextResponse.json({ success: false, error: 'This workflow stage is assigned to another reviewer.' } as ApiResponse<null>, { status: 403 });
  }
  if (stageRecord.status !== PromotionStageStatus.IN_PROGRESS) {
    return NextResponse.json({ success: false, error: 'Only the active workflow stage can be decided.' } as ApiResponse<null>, { status: 409 });
  }

  const assessment = body.assessment && typeof body.assessment === 'object' ? body.assessment : null;
  const stageRecommendation = decision === PromotionStageStatus.COMPLETED && Object.values(ReviewRecommendation).includes(assessment?.recommendation) ? assessment.recommendation as ReviewRecommendation : decision === PromotionStageStatus.COMPLETED ? ReviewRecommendation.RECOMMENDED : ReviewRecommendation.REQUIRES_FURTHER_REVIEW;
  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.promotionStageRecord.update({
      where: { id: stageRecord.id },
      data: { status: decision, decision: stageRecommendation, decisionReason: reason, completedAt: now },
    });

    if (assessment && (assessment.narrative || assessment.recommendation || assessment.teachingCategory || assessment.knowledgeCategory || assessment.serviceCategory || assessment.workKnowledgeCategory || assessment.workApplicationCategory || assessment.humanRelationsCategory)) {
      await tx.promotionAssessment.create({
        data: {
          promotionRequestId: requestId,
          stageRecordId: stageRecord.id,
          assessorId: session.userId,
          type: ASSESSMENT_TYPE_BY_STAGE[stageRecord.stage] || AssessmentType.HEAD_OF_UNIT,
          teachingCategory: assessment.teachingCategory || null,
          knowledgeCategory: assessment.knowledgeCategory || null,
          serviceCategory: assessment.serviceCategory || null,
          workKnowledgeCategory: assessment.workKnowledgeCategory || null,
          workApplicationCategory: assessment.workApplicationCategory || null,
          humanRelationsCategory: assessment.humanRelationsCategory || null,
          narrative: typeof assessment.narrative === 'string' ? assessment.narrative.trim() || null : null,
          recommendation: assessment.recommendation || null,
          isConfidential: Boolean(assessment.isConfidential),
          submittedAt: now,
        },
      });
    }

    if (decision === PromotionStageStatus.COMPLETED) {
      const next = await tx.promotionStageRecord.findFirst({
        where: { promotionRequestId: requestId, status: PromotionStageStatus.PENDING },
        orderBy: { sequence: 'asc' },
        select: { id: true },
      });
      if (next) {
        await tx.promotionStageRecord.update({ where: { id: next.id }, data: { status: PromotionStageStatus.IN_PROGRESS, startedAt: now } });
      }
    }
  });

  await writeAuditLog(prisma, {
    actorId: session.userId,
    action: 'promotion_workflow_stage_decided',
    entityType: 'PromotionRequest',
    entityId: requestId,
    requestId,
    description: 'Governed promotion stage decision recorded.',
    metadata: { stageRecordId, stage: stageRecord.stage, decision, stageRecommendation, reason },
  });

  return NextResponse.json({ success: true, data: { stageRecordId, decision } } as ApiResponse<{ stageRecordId: number; decision: PromotionStageStatus }>);
}