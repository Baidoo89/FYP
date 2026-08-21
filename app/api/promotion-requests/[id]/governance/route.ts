import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '../../../../../lib/auth';
import { writeAuditLog } from '../../../../../lib/audit-logger';
import {
  AssessmentType,
  OfficialFormAudience,
  OfficialFormSubmissionStatus,
  PolicyRequirementType,
  PromotionStage,
  PromotionStageStatus,
  ReviewRecommendation,
} from '@prisma/client';
import { prisma } from '../../../../../lib/prisma';
import { templateApplies } from '../../../../../lib/forms/official-form-service';
import { stageDueAt } from '../../../../../lib/promotion-stage-rules';
import type { ApiResponse } from '../../../../../types';

const REVIEW_ROLES = new Set([
  'STAFF',
  'LECTURER',
  'HOD_DEAN',
  'HR_ADMIN',
  'COMMITTEE_REVIEWER',
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
      caseDueAt: true,
      nextApplicantUpdateDueAt: true,
      decisionCommunicatedAt: true,
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

  const canViewConfidential = session.role === 'HR_ADMIN' || session.role === 'COMMITTEE_REVIEWER';
  const data = {
    ...file,
    externalAssessors: canViewConfidential ? file.externalAssessors : [],
    assessments: file.assessments.filter((assessment) => {
      if (!assessment.isConfidential) return true;
      return canViewConfidential;
    }),
  };

  return NextResponse.json({ success: true, data } as ApiResponse<typeof data>);
}




const STAGE_ROLES: Record<string, string[]> = {
  DEPARTMENT: ['HOD_DEAN'],
  FACULTY: ['HOD_DEAN', 'HR_ADMIN', 'COMMITTEE_REVIEWER'],
  RAPC: ['COMMITTEE_REVIEWER'],
  EXTERNAL_ASSESSMENT: ['HR_ADMIN'],
  UAPC: ['COMMITTEE_REVIEWER'],
  COUNCIL: ['COMMITTEE_REVIEWER'],
  ACADEMIC_BOARD: ['COMMITTEE_REVIEWER'],
  FINAL_NOTIFICATION: ['HR_ADMIN'],
  APPEAL: ['COMMITTEE_REVIEWER'],
};

const ASSESSMENT_TYPE_BY_STAGE: Record<string, AssessmentType> = {
  DEPARTMENT: AssessmentType.HEAD_OF_UNIT,
  FACULTY: AssessmentType.FAPC,
  RAPC: AssessmentType.RAPC,
  EXTERNAL_ASSESSMENT: AssessmentType.EXTERNAL_ASSESSOR,
  UAPC: AssessmentType.UAPC,
  COUNCIL: AssessmentType.COUNCIL,
};

const COMMITTEE_STAGES = new Set<PromotionStage>([
  PromotionStage.FACULTY,
  PromotionStage.RAPC,
  PromotionStage.UAPC,
  PromotionStage.COUNCIL,
  PromotionStage.ACADEMIC_BOARD,
]);

async function stageCompletionError(stageRecord: {
  id: number;
  promotionRequestId: number;
  stage: PromotionStage;
  promotionRequest: {
    promotionRoute: {
      code: string;
      promotionTrack: { type: string; staffCategory: string };
      requirements: Array<{ type: string; numberValue: number | null }>;
    } | null;
  };
}) {
  const route = stageRecord.promotionRequest.promotionRoute;
  if (!route) return 'The promotion route is not configured.';

  if (stageRecord.stage === PromotionStage.EXTERNAL_ASSESSMENT) {
    const required = route.requirements.find((item) => item.type === PolicyRequirementType.EXTERNAL_ASSESSOR_COUNT)?.numberValue || 0;
    const received = await prisma.externalAssessor.count({
      where: {
        promotionRequestId: stageRecord.promotionRequestId,
        status: 'REPORT_RECEIVED',
        formSubmissions: { some: { status: OfficialFormSubmissionStatus.FROZEN } },
      },
    });
    if (received < required) return `Receive ${required} signed confidential external assessment report${required === 1 ? '' : 's'} before completing this stage. Current: ${received}.`;
  }

  if (COMMITTEE_STAGES.has(stageRecord.stage)) {
    const validMeeting = await prisma.committeeMeeting.findFirst({
      where: {
        promotionRequestId: stageRecord.promotionRequestId,
        stageRecordId: stageRecord.id,
        quorumMet: true,
        resolution: { not: null },
        participants: { some: {} },
      },
      select: { id: true },
    });
    if (!validMeeting) return 'Record a committee meeting with valid quorum and a resolution before completing this stage.';
  }

  const audiencesByStage: Partial<Record<PromotionStage, OfficialFormAudience[]>> = {
    [PromotionStage.DEPARTMENT]: route.promotionTrack.type === 'SCHEDULE_K'
      ? [OfficialFormAudience.DEPARTMENT, OfficialFormAudience.SUPERVISOR]
      : [OfficialFormAudience.DEPARTMENT],
    [PromotionStage.FACULTY]: [OfficialFormAudience.FACULTY],
    [PromotionStage.RAPC]: [OfficialFormAudience.HRODD, OfficialFormAudience.RAPC],
    [PromotionStage.UAPC]: [OfficialFormAudience.UAPC],
  };
  const audiences = audiencesByStage[stageRecord.stage] || [];
  if (audiences.length === 0) return null;

  const templates = await prisma.officialFormTemplate.findMany({
    where: { isActive: true, audience: { in: audiences } },
    select: { id: true, name: true, trackType: true, staffCategory: true, routeCodePrefixes: true },
  });
  const applicable = templates.filter((template) => templateApplies(template, {
    routeCode: route.code,
    trackType: route.promotionTrack.type,
    staffCategory: route.promotionTrack.staffCategory,
  }));
  const frozen = await prisma.promotionFormSubmission.findMany({
    where: { promotionRequestId: stageRecord.promotionRequestId, templateId: { in: applicable.map((item) => item.id) }, status: OfficialFormSubmissionStatus.FROZEN },
    select: { templateId: true },
  });
  const frozenIds = new Set(frozen.map((item) => item.templateId));
  const missing = applicable.filter((item) => !frozenIds.has(item.id));
  return missing.length ? `Complete and sign the controlled stage forms first: ${missing.map((item) => item.name).join(', ')}.` : null;
}

async function facultyWaiverError(stageRecord: {
  id: number;
  stage: PromotionStage;
  promotionRequest: { promotionRoute: { promotionTrack: { type: string } } | null };
}) {
  if (stageRecord.stage !== PromotionStage.FACULTY) {
    return 'Only a Faculty/FAPC stage may use the lawful-constitution waiver.';
  }
  if (stageRecord.promotionRequest.promotionRoute?.promotionTrack.type !== 'SCHEDULE_J') {
    return 'The FAPC constitution waiver applies only to Schedule J academic cases.';
  }

  const failedConstitution = await prisma.committeeMeeting.findFirst({
    where: {
      stageRecordId: stageRecord.id,
      authority: 'FAPC',
      quorumMet: false,
      resolution: { not: null },
      participants: { some: {} },
    },
    select: { id: true },
  });
  return failedConstitution
    ? null
    : 'Record the attempted FAPC membership, ineligible or recused members, failed computed quorum, and a formal resolution before using this waiver.';
}

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
  if (!Number.isInteger(stageRecordId) || !['COMPLETED', 'RETURNED', 'BLOCKED', 'WAIVED'].includes(decision || '') || reason.length < 10) {
    return NextResponse.json({ success: false, error: 'A valid stage, decision, and reason of at least 10 characters are required.' } as ApiResponse<null>, { status: 400 });
  }

  const stageRecord = await prisma.promotionStageRecord.findFirst({
    where: { id: stageRecordId, promotionRequestId: requestId },
    select: {
      id: true,
      promotionRequestId: true,
      stage: true,
      status: true,
      assignedToId: true,
      promotionRequest: {
        select: {
          lecturerId: true,
          promotionRoute: {
            select: {
              code: true,
              promotionTrack: { select: { type: true, staffCategory: true } },
              requirements: { select: { type: true, numberValue: true } },
            },
          },
        },
      },
    },
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
  if (stageRecord.stage === PromotionStage.FACULTY && session.role === 'HR_ADMIN' && decision !== PromotionStageStatus.WAIVED) {
    return NextResponse.json({ success: false, error: 'HRODD may coordinate the Faculty stage but may only record the evidenced FAPC-constitution waiver.' } as ApiResponse<null>, { status: 403 });
  }
  const isHroddFacultyWaiver = decision === PromotionStageStatus.WAIVED
    && stageRecord.stage === PromotionStage.FACULTY
    && session.role === 'HR_ADMIN';
  if (stageRecord.assignedToId && stageRecord.assignedToId !== session.userId && !isHroddFacultyWaiver) {
    return NextResponse.json({ success: false, error: 'This workflow stage is assigned to another reviewer.' } as ApiResponse<null>, { status: 403 });
  }
  if (stageRecord.status !== PromotionStageStatus.IN_PROGRESS) {
    return NextResponse.json({ success: false, error: 'Only the active workflow stage can be decided.' } as ApiResponse<null>, { status: 409 });
  }
  if (decision === PromotionStageStatus.COMPLETED) {
    const completionError = await stageCompletionError(stageRecord);
    if (completionError) return NextResponse.json({ success: false, error: completionError } as ApiResponse<null>, { status: 409 });
  }
  if (decision === PromotionStageStatus.WAIVED) {
    if (session.role !== 'HR_ADMIN') {
      return NextResponse.json({ success: false, error: 'Only HRODD may record the exceptional FAPC route.' } as ApiResponse<null>, { status: 403 });
    }
    if (reason.length < 20) {
      return NextResponse.json({ success: false, error: 'Record a detailed waiver reason of at least 20 characters.' } as ApiResponse<null>, { status: 400 });
    }
    const waiverError = await facultyWaiverError(stageRecord);
    if (waiverError) return NextResponse.json({ success: false, error: waiverError } as ApiResponse<null>, { status: 409 });
  }

  const assessment = body.assessment && typeof body.assessment === 'object' ? body.assessment : null;
  if (
    decision === PromotionStageStatus.COMPLETED
    && COMMITTEE_STAGES.has(stageRecord.stage)
    && !Object.values(ReviewRecommendation).includes(assessment?.recommendation)
  ) {
    return NextResponse.json({ success: false, error: 'Select the committee recommendation before completing this stage.' } as ApiResponse<null>, { status: 400 });
  }
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

    if (decision === PromotionStageStatus.COMPLETED || decision === PromotionStageStatus.WAIVED) {
      const next = await tx.promotionStageRecord.findFirst({
        where: { promotionRequestId: requestId, status: PromotionStageStatus.PENDING },
        orderBy: { sequence: 'asc' },
        select: { id: true, stage: true },
      });
      if (next) {
        const trackType = stageRecord.promotionRequest.promotionRoute?.promotionTrack.type;
        await tx.promotionStageRecord.update({
          where: { id: next.id },
          data: {
            status: PromotionStageStatus.IN_PROGRESS,
            startedAt: now,
            dueAt: trackType ? stageDueAt(next.stage, trackType, now) : null,
          },
        });
      } else if (stageRecord.stage === PromotionStage.FINAL_NOTIFICATION) {
        await tx.promotionRequest.update({ where: { id: requestId }, data: { decisionCommunicatedAt: now } });
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
