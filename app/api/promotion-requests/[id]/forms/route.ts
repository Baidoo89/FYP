import {
  OfficialFormAudience,
  OfficialFormSubmissionStatus,
  Prisma,
  RecordVerificationState,
} from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '../../../../../lib/auth';
import { writeAuditLog } from '../../../../../lib/audit-logger';
import {
  audiencesForActor,
  initialFormResponses,
  isApplicantRole,
  professionalOutputReuseErrors,
  templateApplies,
  validateFormResponses,
  type FormResponses,
  type FormSchema,
} from '../../../../../lib/forms/official-form-service';
import { prisma } from '../../../../../lib/prisma';
import type { ApiResponse } from '../../../../../types';

const EDITABLE_STATUSES: OfficialFormSubmissionStatus[] = [
  OfficialFormSubmissionStatus.DRAFT,
  OfficialFormSubmissionStatus.READY,
  OfficialFormSubmissionStatus.RETURNED,
];

function responseError(error: string, status: number) {
  return NextResponse.json({ success: false, error } as ApiResponse<null>, { status });
}

async function parseRequestId(context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const requestId = Number(id);
  return Number.isInteger(requestId) && requestId > 0 ? requestId : null;
}

async function actorAccessRoles(userId: number) {
  const actor = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      staffMember: {
        select: {
          accessAssignments: {
            where: {
              endedAt: null,
              verificationState: RecordVerificationState.VERIFIED,
            },
            select: { role: true, organizationUnitId: true },
          },
        },
      },
    },
  });
  return actor?.staffMember?.accessAssignments || [];
}

async function loadPromotionFile(requestId: number) {
  return prisma.promotionRequest.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      lecturerId: true,
      currentRank: true,
      targetRank: true,
      status: true,
      receiptNumber: true,
      dossierVersion: true,
      lecturer: {
        select: {
          name: true,
          staffId: true,
          department: true,
        },
      },
      staffAssignment: {
        select: {
          organizationUnitId: true,
          organizationUnit: { select: { name: true } },
        },
      },
      promotionRoute: {
        select: {
          code: true,
          name: true,
          promotionTrack: {
            select: {
              type: true,
              staffCategory: true,
            },
          },
        },
      },
      workflowStages: {
        orderBy: { sequence: 'asc' },
        select: {
          id: true,
          stage: true,
          sequence: true,
          status: true,
          assignedToId: true,
        },
      },
    },
  });
}

function routeIdentity(file: NonNullable<Awaited<ReturnType<typeof loadPromotionFile>>>) {
  if (!file.promotionRoute) return null;
  return {
    routeCode: file.promotionRoute.code,
    trackType: file.promotionRoute.promotionTrack.type,
    staffCategory: file.promotionRoute.promotionTrack.staffCategory,
  };
}

function canUseTemplate(
  template: { audience: OfficialFormAudience; trackType: string | null; staffCategory: string | null; routeCodePrefixes: unknown },
  audiences: Set<string>,
  route: NonNullable<ReturnType<typeof routeIdentity>>,
) {
  return audiences.has(template.audience) && templateApplies(template, route);
}

function relevantStage(
  file: NonNullable<Awaited<ReturnType<typeof loadPromotionFile>>>,
  audience: OfficialFormAudience,
  requestedStageRecordId?: number,
) {
  if (requestedStageRecordId) return file.workflowStages.find((stage) => stage.id === requestedStageRecordId) || null;
  const stageByAudience: Partial<Record<OfficialFormAudience, string>> = {
    DEPARTMENT: 'DEPARTMENT',
    FACULTY: 'FACULTY',
    RAPC: 'RAPC',
    EXTERNAL_ASSESSOR: 'EXTERNAL_ASSESSMENT',
    UAPC: 'UAPC',
    COUNCIL: 'COUNCIL',
  };
  const stage = stageByAudience[audience];
  return stage ? file.workflowStages.find((record) => record.stage === stage) || null : null;
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = getAuthSession(request);
  const requestId = await parseRequestId(context);
  if (!session || session.legacy) return responseError('Unauthorized', 401);
  if (session.role === 'SYSTEM_ADMIN') return responseError('Technical administration cannot view promotion-form content.', 403);
  if (!requestId) return responseError('Invalid request id.', 400);

  const file = await loadPromotionFile(requestId);
  if (!file) return responseError('Promotion file not found.', 404);
  if (isApplicantRole(session.role) && file.lecturerId !== session.userId) {
    return responseError('You can only view forms for your own promotion file.', 403);
  }
  const route = routeIdentity(file);
  if (!route) return responseError('Select a verified promotion route before completing official forms.', 409);

  const accessAssignments = await actorAccessRoles(session.userId);
  const audiences = audiencesForActor(session.role, accessAssignments.map((assignment) => assignment.role));
  const templates = await prisma.officialFormTemplate.findMany({
    where: {
      isActive: true,
      audience: { in: [...audiences] as OfficialFormAudience[] },
    },
    orderBy: [{ audience: 'asc' }, { name: 'asc' }, { version: 'desc' }],
  });
  const applicableTemplates = templates.filter((template) => canUseTemplate(template, audiences, route));

  const submissions = await prisma.promotionFormSubmission.findMany({
    where: {
      promotionRequestId: requestId,
      ...(isApplicantRole(session.role)
        ? {
            completedById: session.userId,
            template: { audience: OfficialFormAudience.APPLICANT },
          }
        : {}),
    },
    orderBy: [{ updatedAt: 'desc' }, { version: 'desc' }],
    include: {
      template: { select: { code: true, name: true, audience: true, version: true } },
      completedBy: { select: { id: true, name: true, email: true } },
      stageRecord: { select: { id: true, stage: true, sequence: true, status: true } },
    },
  });

  const editableByTemplate = new Map<number, typeof submissions[number]>();
  for (const submission of submissions) {
    if (submission.completedById === session.userId && !editableByTemplate.has(submission.templateId)) {
      editableByTemplate.set(submission.templateId, submission);
    }
  }

  const forms = applicableTemplates.map((template) => ({
    template,
    submission: editableByTemplate.get(template.id) || null,
    stage: relevantStage(file, template.audience),
  }));

  return NextResponse.json({
    success: true,
    data: {
      request: {
        id: file.id,
        currentRank: file.currentRank,
        targetRank: file.targetRank,
        status: file.status,
        receiptNumber: file.receiptNumber,
        route: file.promotionRoute,
      },
      forms,
      history: submissions,
    },
  });
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = getAuthSession(request);
  const requestId = await parseRequestId(context);
  if (!session || session.legacy) return responseError('Unauthorized', 401);
  if (session.role === 'SYSTEM_ADMIN') return responseError('Technical administration cannot create promotion-form content.', 403);
  if (!requestId) return responseError('Invalid request id.', 400);

  const body = await request.json();
  const templateId = Number(body.templateId);
  const requestedStageRecordId = body.stageRecordId ? Number(body.stageRecordId) : undefined;
  if (!Number.isInteger(templateId) || (requestedStageRecordId && !Number.isInteger(requestedStageRecordId))) {
    return responseError('Select a valid official form.', 400);
  }

  const file = await loadPromotionFile(requestId);
  if (!file) return responseError('Promotion file not found.', 404);
  if (isApplicantRole(session.role) && file.lecturerId !== session.userId) {
    return responseError('You can only complete forms for your own promotion file.', 403);
  }
  const route = routeIdentity(file);
  if (!route) return responseError('Select a verified promotion route before completing official forms.', 409);

  const [template, accessAssignments] = await Promise.all([
    prisma.officialFormTemplate.findFirst({ where: { id: templateId, isActive: true } }),
    actorAccessRoles(session.userId),
  ]);
  if (!template) return responseError('Official form template not found.', 404);

  const audiences = audiencesForActor(session.role, accessAssignments.map((assignment) => assignment.role));
  if (!canUseTemplate(template, audiences, route)) return responseError('This form is not assigned to your role or promotion route.', 403);

  const stage = relevantStage(file, template.audience, requestedStageRecordId);
  if (requestedStageRecordId && !stage) return responseError('The selected workflow stage does not belong to this promotion file.', 400);
  if (stage?.assignedToId && stage.assignedToId !== session.userId) {
    return responseError('This assessment stage is assigned to another reviewer.', 403);
  }

  const existing = await prisma.promotionFormSubmission.findFirst({
    where: {
      promotionRequestId: requestId,
      templateId,
      completedById: session.userId,
      status: { in: EDITABLE_STATUSES },
    },
    orderBy: { version: 'desc' },
  });
  if (existing) return NextResponse.json({ success: true, data: existing });

  const latest = await prisma.promotionFormSubmission.findFirst({
    where: { promotionRequestId: requestId, templateId, completedById: session.userId },
    orderBy: { version: 'desc' },
    select: { id: true, version: true },
  });
  const responses = initialFormResponses({
    applicantName: file.lecturer.name,
    staffId: file.lecturer.staffId,
    currentRank: file.currentRank,
    targetRank: file.targetRank,
    unit: file.staffAssignment?.organizationUnit.name || file.lecturer.department,
    dossierVersion: file.dossierVersion,
  });
  const validation = validateFormResponses(template.schema as unknown as FormSchema, responses);

  const submission = await prisma.promotionFormSubmission.create({
    data: {
      promotionRequestId: requestId,
      templateId,
      stageRecordId: stage?.id || null,
      completedById: session.userId,
      version: (latest?.version || 0) + 1,
      templateSnapshot: template.schema,
      responses: responses as Prisma.InputJsonValue,
      completionPercent: validation.completionPercent,
      validationErrors: validation.errors,
      isConfidential: Boolean((template.schema as Record<string, unknown>).confidential),
      supersedesId: latest?.id || null,
    },
  });

  await writeAuditLog(prisma, {
    actorId: session.userId,
    action: 'official_form_started',
    entityType: 'PromotionFormSubmission',
    entityId: submission.id,
    requestId,
    description: `Official form started: ${template.name}.`,
    metadata: { templateCode: template.code, templateVersion: template.version, submissionVersion: submission.version },
  });
  return NextResponse.json({ success: true, data: submission }, { status: 201 });
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = getAuthSession(request);
  const requestId = await parseRequestId(context);
  if (!session || session.legacy) return responseError('Unauthorized', 401);
  if (session.role === 'SYSTEM_ADMIN') return responseError('Technical administration cannot change promotion-form content.', 403);
  if (!requestId) return responseError('Invalid request id.', 400);

  const body = await request.json();
  const submissionId = Number(body.submissionId);
  const action = typeof body.action === 'string' ? body.action.toUpperCase() : 'SAVE';
  if (!Number.isInteger(submissionId) || !['SAVE', 'MARK_READY', 'SUBMIT'].includes(action)) {
    return responseError('Select a valid form action.', 400);
  }

  const submission = await prisma.promotionFormSubmission.findFirst({
    where: { id: submissionId, promotionRequestId: requestId },
    include: {
      template: true,
      promotionRequest: { select: { lecturerId: true } },
    },
  });
  if (!submission) return responseError('Official form submission not found.', 404);
  if (submission.completedById !== session.userId) {
    return responseError('You cannot edit another person\'s official form.', 403);
  }
  if (!EDITABLE_STATUSES.includes(submission.status)) {
    return responseError('This submitted form is frozen. Start a new version if a correction is authorised.', 409);
  }
  if (isApplicantRole(session.role) && submission.promotionRequest.lecturerId !== session.userId) {
    return responseError('You can only complete forms for your own promotion file.', 403);
  }

  const incoming = body.responses && typeof body.responses === 'object' && !Array.isArray(body.responses)
    ? body.responses as FormResponses
    : {};
  const existingResponses = submission.responses && typeof submission.responses === 'object' && !Array.isArray(submission.responses)
    ? submission.responses as FormResponses
    : {};
  const responses = { ...existingResponses, ...incoming };
  const schema = submission.templateSnapshot as unknown as FormSchema;
  const validation = validateFormResponses(schema, responses);
  const declared = body.declared === true;
  const signedName = typeof body.signedName === 'string' ? body.signedName.trim() : '';

  if ((action === 'MARK_READY' || action === 'SUBMIT') && validation.errors.length > 0) {
    return NextResponse.json({
      success: false,
      error: 'Complete every required field before this form can be marked ready.',
      data: validation,
    }, { status: 422 });
  }
  if (action === 'SUBMIT' && (!declared || signedName.length < 3)) {
    return responseError('Confirm the declaration and enter your full name before submission.', 422);
  }
  if (action === 'SUBMIT' && submission.template.code === 'GCTU_SCHEDULE_K_APPLICATION_PART_A') {
    const priorForms = await prisma.promotionFormSubmission.findMany({
      where: {
        promotionRequestId: { not: requestId },
        promotionRequest: { lecturerId: submission.promotionRequest.lecturerId },
        template: { code: 'GCTU_SCHEDULE_K_APPLICATION_PART_A' },
        status: OfficialFormSubmissionStatus.FROZEN,
      },
      select: {
        responses: true,
        promotionRequest: { select: { id: true, receiptNumber: true } },
      },
    });
    const reuseErrors = professionalOutputReuseErrors(responses, priorForms.map((form) => ({
      requestLabel: form.promotionRequest.receiptNumber || `PR-${String(form.promotionRequest.id).padStart(5, '0')}`,
      responses: form.responses as FormResponses,
    })));
    if (reuseErrors.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Professional outputs already counted for promotion cannot be reused.',
        data: { errors: reuseErrors },
      }, { status: 409 });
    }
  }

  const now = new Date();
  const nextStatus = action === 'SUBMIT'
    ? OfficialFormSubmissionStatus.FROZEN
    : action === 'MARK_READY'
      ? OfficialFormSubmissionStatus.READY
      : OfficialFormSubmissionStatus.DRAFT;

  const updated = await prisma.promotionFormSubmission.update({
    where: { id: submission.id },
    data: {
      responses: responses as Prisma.InputJsonValue,
      completionPercent: validation.completionPercent,
      validationErrors: validation.errors,
      status: nextStatus,
      declared: action === 'SUBMIT' ? true : submission.declared,
      declarationText: action === 'SUBMIT' ? schema.declarationText || null : submission.declarationText,
      signedName: action === 'SUBMIT' ? signedName : submission.signedName,
      signedAt: action === 'SUBMIT' ? now : submission.signedAt,
      signedIpAddress: action === 'SUBMIT' ? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null : submission.signedIpAddress,
      signedUserAgent: action === 'SUBMIT' ? request.headers.get('user-agent') || null : submission.signedUserAgent,
      submittedAt: action === 'SUBMIT' ? now : submission.submittedAt,
      frozenAt: action === 'SUBMIT' ? now : submission.frozenAt,
    },
  });

  await writeAuditLog(prisma, {
    actorId: session.userId,
    action: action === 'SUBMIT' ? 'official_form_submitted' : 'official_form_saved',
    entityType: 'PromotionFormSubmission',
    entityId: submission.id,
    requestId,
    description: action === 'SUBMIT'
      ? `Official form submitted and frozen: ${submission.template.name}.`
      : `Official form progress saved: ${submission.template.name}.`,
    metadata: { status: nextStatus, completionPercent: validation.completionPercent, templateCode: submission.template.code, outputReuseChecked: action === 'SUBMIT' && submission.template.code === 'GCTU_SCHEDULE_K_APPLICATION_PART_A' },
  });

  return NextResponse.json({ success: true, data: updated });
}
