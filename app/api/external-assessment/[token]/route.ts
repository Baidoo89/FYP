import {
  ExternalAssessorStatus,
  OfficialFormAudience,
  OfficialFormSubmissionStatus,
  Prisma,
} from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { writeAuditLog } from '../../../../lib/audit-logger';
import { hashExternalAssessorToken } from '../../../../lib/external-assessor-invitation';
import {
  initialFormResponses,
  templateApplies,
  validateFormResponses,
  type FormResponses,
  type FormSchema,
} from '../../../../lib/forms/official-form-service';
import { prisma } from '../../../../lib/prisma';

function responseError(error: string, status: number) {
  return NextResponse.json({ success: false, error }, { status });
}

async function tokenValue(context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  return /^[a-f0-9]{64}$/i.test(token) ? token : null;
}

async function loadAssessor(token: string) {
  return prisma.externalAssessor.findUnique({
    where: { invitationTokenHash: hashExternalAssessorToken(token) },
    include: {
      promotionRequest: {
        select: {
          id: true,
          currentRank: true,
          targetRank: true,
          dossierVersion: true,
          lecturer: { select: { name: true, staffId: true, department: true } },
          staffAssignment: { select: { organizationUnit: { select: { name: true } } } },
          promotionRoute: {
            select: {
              code: true,
              name: true,
              promotionTrack: { select: { type: true, staffCategory: true } },
            },
          },
          academicDossier: {
            select: {
              assessmentPackets: {
                where: { status: 'FROZEN' },
                orderBy: { version: 'desc' },
                take: 1,
                select: {
                  version: true,
                  items: {
                    orderBy: { selectionOrder: 'asc' },
                    select: {
                      selectionOrder: true,
                      outputSnapshot: true,
                      scholarlyOutput: {
                        select: {
                          title: true,
                          citation: true,
                          abstract: true,
                          doi: true,
                          url: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      formSubmissions: {
        orderBy: { version: 'desc' },
        include: { template: true },
      },
    },
  });
}

function validateAccess(assessor: Awaited<ReturnType<typeof loadAssessor>>) {
  if (!assessor) return { error: 'This assessment invitation is invalid.', status: 404 };
  if (!assessor.invitationExpiresAt || assessor.invitationExpiresAt.getTime() < Date.now()) {
    return { error: 'This assessment invitation has expired. Contact GCTU HRODD for a new link.', status: 410 };
  }
  const inactiveStatuses: ExternalAssessorStatus[] = [ExternalAssessorStatus.WITHDRAWN, ExternalAssessorStatus.REPLACED];
  if (inactiveStatuses.includes(assessor.status)) {
    return { error: 'This assessment invitation is no longer active.', status: 410 };
  }
  return null;
}

async function applicableTemplate(assessor: NonNullable<Awaited<ReturnType<typeof loadAssessor>>>) {
  const route = assessor.promotionRequest.promotionRoute;
  if (!route) return null;
  const templates = await prisma.officialFormTemplate.findMany({
    where: { isActive: true, audience: OfficialFormAudience.EXTERNAL_ASSESSOR },
    orderBy: { version: 'desc' },
  });
  return templates.find((template) => templateApplies(template, {
    routeCode: route.code,
    trackType: route.promotionTrack.type,
    staffCategory: route.promotionTrack.staffCategory,
  })) || null;
}

async function scheduleKOutputs(requestId: number) {
  const applicantForm = await prisma.promotionFormSubmission.findFirst({
    where: {
      promotionRequestId: requestId,
      status: OfficialFormSubmissionStatus.FROZEN,
      template: { code: 'GCTU_SCHEDULE_K_APPLICATION_PART_A' },
    },
    orderBy: { version: 'desc' },
    select: { responses: true },
  });
  const responses = applicantForm?.responses && typeof applicantForm.responses === 'object' && !Array.isArray(applicantForm.responses)
    ? applicantForm.responses as Record<string, unknown>
    : {};
  return Array.isArray(responses.professionalOutputs) ? responses.professionalOutputs : [];
}

async function payloadFor(assessor: NonNullable<Awaited<ReturnType<typeof loadAssessor>>>) {
  const template = await applicableTemplate(assessor);
  const submission = template
    ? assessor.formSubmissions.find((item) => item.templateId === template.id) || null
    : null;
  const academicItems = assessor.promotionRequest.academicDossier?.assessmentPackets[0]?.items || [];
  const assignedOutputs = academicItems.length > 0
    ? academicItems.map((item) => ({
        selectionOrder: item.selectionOrder,
        ...(item.outputSnapshot && typeof item.outputSnapshot === 'object' ? item.outputSnapshot as Record<string, unknown> : item.scholarlyOutput),
      }))
    : await scheduleKOutputs(assessor.promotionRequestId);

  return {
    assessor: {
      id: assessor.id,
      name: assessor.name,
      institution: assessor.institution,
      specialization: assessor.specialization,
      status: assessor.status,
      invitationExpiresAt: assessor.invitationExpiresAt,
    },
    promotion: {
      currentRank: assessor.promotionRequest.currentRank,
      targetRank: assessor.promotionRequest.targetRank,
      applicantName: assessor.promotionRequest.lecturer.name,
      routeName: assessor.promotionRequest.promotionRoute?.name,
    },
    template,
    submission,
    assignedOutputs,
  };
}

export async function GET(request: NextRequest, context: { params: Promise<{ token: string }> }) {
  const token = await tokenValue(context);
  if (!token) return responseError('Invalid assessment invitation.', 400);
  const assessor = await loadAssessor(token);
  const denied = validateAccess(assessor);
  if (denied) return responseError(denied.error, denied.status);

  await prisma.externalAssessor.update({
    where: { id: assessor!.id },
    data: { portalLastAccessAt: new Date() },
  });
  return NextResponse.json({ success: true, data: await payloadFor(assessor!) });
}

export async function POST(request: NextRequest, context: { params: Promise<{ token: string }> }) {
  const token = await tokenValue(context);
  if (!token) return responseError('Invalid assessment invitation.', 400);
  const assessor = await loadAssessor(token);
  const denied = validateAccess(assessor);
  if (denied) return responseError(denied.error, denied.status);

  const body = await request.json();
  const action = typeof body.action === 'string' ? body.action.toUpperCase() : '';
  const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();

  if (action === 'DECLINE') {
    const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
    if (reason.length < 5) return responseError('Provide a brief reason for declining the assessment.', 422);
    await prisma.externalAssessor.update({
      where: { id: assessor!.id },
      data: {
        status: ExternalAssessorStatus.DECLINED,
        conflictReason: reason,
        invitationTokenHash: null,
      },
    });
    await writeAuditLog(prisma, {
      action: 'external_assessor_declined',
      entityType: 'ExternalAssessor',
      entityId: assessor!.id,
      requestId: assessor!.promotionRequestId,
      ipAddress,
      description: 'External assessor declined the confidential invitation.',
      metadata: { externalAssessorId: assessor!.id, reason },
    });
    return NextResponse.json({ success: true, data: { status: ExternalAssessorStatus.DECLINED } });
  }

  if (action === 'ACCEPT') {
    if (body.termsAccepted !== true) return responseError('Accept the confidentiality and secure-use terms to continue.', 422);
    const conflictStatus = typeof body.conflictStatus === 'string' ? body.conflictStatus : '';
    const conflictDetails = typeof body.conflictDetails === 'string' ? body.conflictDetails.trim() : '';
    if (!['NO_CONFLICT', 'CONFLICT_EXISTS'].includes(conflictStatus)) return responseError('Complete the conflict-of-interest declaration.', 422);
    if (conflictStatus === 'CONFLICT_EXISTS' && conflictDetails.length < 10) return responseError('Explain the conflict of interest before submitting the declaration.', 422);

    if (conflictStatus === 'CONFLICT_EXISTS') {
      await prisma.externalAssessor.update({
        where: { id: assessor!.id },
        data: {
          status: ExternalAssessorStatus.CONFLICTED,
          conflictReason: conflictDetails,
          conflictCheckedAt: new Date(),
          conflictDeclaredAt: new Date(),
          termsAcceptedAt: new Date(),
          invitationTokenHash: null,
        },
      });
      await writeAuditLog(prisma, {
        action: 'external_assessor_conflict_declared',
        entityType: 'ExternalAssessor',
        entityId: assessor!.id,
        requestId: assessor!.promotionRequestId,
        ipAddress,
        description: 'External assessor declared a conflict of interest.',
        metadata: { externalAssessorId: assessor!.id, conflictDetails },
      });
      return NextResponse.json({ success: true, data: { status: ExternalAssessorStatus.CONFLICTED } });
    }

    const template = await applicableTemplate(assessor!);
    if (!template) return responseError('No controlled external assessment form is configured for this promotion route.', 503);
    const existing = assessor!.formSubmissions.find((item) => item.templateId === template.id);
    if (!existing) {
      const route = assessor!.promotionRequest;
      const responses = initialFormResponses({
        applicantName: route.lecturer.name,
        staffId: route.lecturer.staffId,
        currentRank: route.currentRank,
        targetRank: route.targetRank,
        unit: route.staffAssignment?.organizationUnit.name || route.lecturer.department,
        dossierVersion: route.dossierVersion,
      });
      const validation = validateFormResponses(template.schema as unknown as FormSchema, responses);
      await prisma.promotionFormSubmission.create({
        data: {
          promotionRequestId: assessor!.promotionRequestId,
          templateId: template.id,
          externalAssessorId: assessor!.id,
          completedById: null,
          version: 1,
          templateSnapshot: template.schema,
          responses: responses as Prisma.InputJsonValue,
          completionPercent: validation.completionPercent,
          validationErrors: validation.errors,
          isConfidential: true,
        },
      });
    }
    await prisma.externalAssessor.update({
      where: { id: assessor!.id },
      data: {
        status: ExternalAssessorStatus.REPORT_REQUESTED,
        acceptedAt: new Date(),
        reportRequestedAt: new Date(),
        conflictCheckedAt: new Date(),
        conflictDeclaredAt: new Date(),
        termsAcceptedAt: new Date(),
        conflictReason: null,
      },
    });
    await writeAuditLog(prisma, {
      action: 'external_assessor_invitation_accepted',
      entityType: 'ExternalAssessor',
      entityId: assessor!.id,
      requestId: assessor!.promotionRequestId,
      ipAddress,
      description: 'External assessor accepted the invitation and no conflict was declared.',
      metadata: { externalAssessorId: assessor!.id },
    });
    const refreshed = await loadAssessor(token);
    return NextResponse.json({ success: true, data: await payloadFor(refreshed!) });
  }

  if (!['SAVE', 'SUBMIT'].includes(action)) return responseError('Select a valid assessment action.', 400);
  if (assessor!.status !== ExternalAssessorStatus.REPORT_REQUESTED) return responseError('Accept the invitation before completing the assessment.', 409);
  const template = await applicableTemplate(assessor!);
  const submission = template
    ? assessor!.formSubmissions.find((item) => item.templateId === template.id)
    : null;
  if (!template || !submission) return responseError('The controlled assessment form is unavailable.', 409);
  if (submission.status === OfficialFormSubmissionStatus.FROZEN) return responseError('This assessment has already been submitted and frozen.', 409);

  const incoming = body.responses && typeof body.responses === 'object' && !Array.isArray(body.responses)
    ? body.responses as FormResponses
    : {};
  const current = submission.responses && typeof submission.responses === 'object' && !Array.isArray(submission.responses)
    ? submission.responses as FormResponses
    : {};
  const responses = { ...current, ...incoming };
  const schema = submission.templateSnapshot as unknown as FormSchema;
  const validation = validateFormResponses(schema, responses);
  const signedName = typeof body.signedName === 'string' ? body.signedName.trim() : '';
  if (action === 'SUBMIT' && validation.errors.length > 0) {
    return NextResponse.json({ success: false, error: 'Complete every required assessment field.', data: validation }, { status: 422 });
  }
  if (action === 'SUBMIT' && (body.declared !== true || signedName.length < 3)) {
    return responseError('Confirm the declaration and enter your full name before submission.', 422);
  }

  const now = new Date();
  await prisma.$transaction([
    prisma.promotionFormSubmission.update({
      where: { id: submission.id },
      data: {
        responses: responses as Prisma.InputJsonValue,
        completionPercent: validation.completionPercent,
        validationErrors: validation.errors,
        status: action === 'SUBMIT' ? OfficialFormSubmissionStatus.FROZEN : OfficialFormSubmissionStatus.DRAFT,
        declared: action === 'SUBMIT',
        declarationText: action === 'SUBMIT' ? schema.declarationText || null : submission.declarationText,
        signedName: action === 'SUBMIT' ? signedName : submission.signedName,
        signedAt: action === 'SUBMIT' ? now : submission.signedAt,
        signedIpAddress: action === 'SUBMIT' ? ipAddress || null : submission.signedIpAddress,
        signedUserAgent: action === 'SUBMIT' ? request.headers.get('user-agent') : submission.signedUserAgent,
        submittedAt: action === 'SUBMIT' ? now : submission.submittedAt,
        frozenAt: action === 'SUBMIT' ? now : submission.frozenAt,
      },
    }),
    ...(action === 'SUBMIT'
      ? [prisma.externalAssessor.update({
          where: { id: assessor!.id },
          data: {
            status: ExternalAssessorStatus.REPORT_RECEIVED,
            reportReceivedAt: now,
            reportSummary: 'Confidential structured external assessment received.',
          },
        })]
      : []),
  ]);
  await writeAuditLog(prisma, {
    action: action === 'SUBMIT' ? 'external_assessment_submitted' : 'external_assessment_draft_saved',
    entityType: 'PromotionFormSubmission',
    entityId: submission.id,
    requestId: assessor!.promotionRequestId,
    ipAddress,
    description: action === 'SUBMIT' ? 'Confidential external assessment submitted and frozen.' : 'External assessment draft saved.',
    metadata: { externalAssessorId: assessor!.id, completionPercent: validation.completionPercent },
  });

  const refreshed = await loadAssessor(token);
  return NextResponse.json({ success: true, data: await payloadFor(refreshed!) });
}
