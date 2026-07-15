import {
  EligibilityStatus,
  NotificationType,
  RequestStatus,
  ReviewRecommendation,
  VerificationStatus,
  type DocumentCategory,
  type Prisma,
  type PrismaClient,
} from '@prisma/client';
import type { AuthRole } from './auth';
import { writeAuditLog, writeStatusHistory } from './audit-logger';
import { calculateEligibility, REQUIRED_CATEGORIES } from './promotion-engine';
import { assertStatusTransition } from './workflow';

type DbClient = PrismaClient | Prisma.TransactionClient;

export type WorkflowActor = {
  id: number;
  role: AuthRole;
  name?: string;
};

export class WorkflowError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'WorkflowError';
    this.statusCode = statusCode;
  }
}

export type DepartmentReviewDecision = 'FORWARD_TO_HR' | 'RETURN_FOR_CORRECTION' | 'REQUIRES_FURTHER_REVIEW' | 'COMMENT_ONLY';

const TERMINAL_STATUSES = new Set<RequestStatus>([
  RequestStatus.COMPLETED,
  RequestStatus.REJECTED,
  RequestStatus.NOT_RECOMMENDED,
]);

const FINAL_REVIEW_STATUSES = new Set<RequestStatus>([
  RequestStatus.RECOMMENDED,
  RequestStatus.NOT_RECOMMENDED,
  RequestStatus.REQUIRES_FURTHER_REVIEW,
]);

const APPLICANT_NOTIFICATION_TYPE: Partial<Record<RequestStatus, NotificationType>> = {
  [RequestStatus.RETURNED_FOR_CORRECTION]: NotificationType.WARNING,
  [RequestStatus.REJECTED]: NotificationType.ERROR,
  [RequestStatus.NOT_RECOMMENDED]: NotificationType.WARNING,
  [RequestStatus.RECOMMENDED]: NotificationType.SUCCESS,
  [RequestStatus.APPROVED]: NotificationType.SUCCESS,
  [RequestStatus.APPROVED_BY_AUTHORITY]: NotificationType.SUCCESS,
  [RequestStatus.COMPLETED]: NotificationType.SUCCESS,
};

const NEXT_OWNER_ROLES: Partial<Record<RequestStatus, AuthRole[]>> = {
  [RequestStatus.SUBMITTED]: ['HOD_DEAN', 'SYSTEM_ADMIN'],
  [RequestStatus.UNDER_DEPARTMENT_REVIEW]: ['HOD_DEAN', 'SYSTEM_ADMIN'],
  [RequestStatus.UNDER_HR_VERIFICATION]: ['HR_ADMIN', 'SYSTEM_ADMIN'],
  [RequestStatus.UNDER_COMMITTEE_REVIEW]: ['COMMITTEE_REVIEWER', 'SYSTEM_ADMIN'],
  [RequestStatus.REQUIRES_FURTHER_REVIEW]: ['HOD_DEAN', 'HR_ADMIN', 'SYSTEM_ADMIN'],
  [RequestStatus.RECOMMENDED]: ['HR_ADMIN', 'SYSTEM_ADMIN'],
  [RequestStatus.NOT_RECOMMENDED]: ['HR_ADMIN', 'SYSTEM_ADMIN'],
};

function formatEnum(value: string) {
  return value.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase());
}

function normalizeRank(rank: string) {
  return rank.trim().toUpperCase().replace(/\s+/g, '_').replace(/-/g, '_');
}

function assertActorRole(actor: WorkflowActor, allowedRoles: AuthRole[]) {
  if (!allowedRoles.includes(actor.role)) {
    throw new WorkflowError('You do not have permission to perform this workflow action.', 403);
  }
}

async function notifyUser(
  client: DbClient,
  input: {
    userId: number;
    promotionRequestId: number;
    title: string;
    message: string;
    type?: NotificationType;
  }
) {
  await client.notification.create({
    data: {
      userId: input.userId,
      promotionRequestId: input.promotionRequestId,
      title: input.title,
      message: input.message,
      type: input.type || NotificationType.INFO,
    },
  });
}

async function notifyRoles(
  client: DbClient,
  input: {
    roles: AuthRole[];
    promotionRequestId: number;
    title: string;
    message: string;
    type?: NotificationType;
    excludeUserId?: number;
  }
) {
  const users = await client.user.findMany({
    where: {
      role: { in: input.roles },
      isActive: true,
      id: input.excludeUserId ? { not: input.excludeUserId } : undefined,
    },
    select: { id: true },
  });

  if (users.length === 0) {
    return;
  }

  await client.notification.createMany({
    data: users.map((user) => ({
      userId: user.id,
      promotionRequestId: input.promotionRequestId,
      title: input.title,
      message: input.message,
      type: input.type || NotificationType.INFO,
    })),
  });
}

async function getRequiredDocumentCategories(client: DbClient, promotionRequestId: number) {
  const request = await client.promotionRequest.findUnique({
    where: { id: promotionRequestId },
    select: {
      currentRank: true,
      targetRank: true,
    },
  });

  if (!request) {
    throw new WorkflowError('Promotion request not found.', 404);
  }

  const criteria = await client.promotionCriteria.findFirst({
    where: {
      currentRank: normalizeRank(request.currentRank) as any,
      targetRank: normalizeRank(request.targetRank) as any,
      isActive: true,
    },
    select: {
      requiredDocumentCategories: true,
    },
  });

  return criteria?.requiredDocumentCategories?.length
    ? criteria.requiredDocumentCategories
    : [...REQUIRED_CATEGORIES];
}

async function requiredDocumentsAreVerified(client: DbClient, promotionRequestId: number) {
  const requiredCategories = await getRequiredDocumentCategories(client, promotionRequestId);
  const documents = await client.document.findMany({
    where: {
      requestId: promotionRequestId,
      category: { in: requiredCategories },
    },
    select: {
      category: true,
      verificationStatus: true,
    },
  });

  const verifiedCategories = new Set(
    documents
      .filter((document) => document.verificationStatus === VerificationStatus.VERIFIED)
      .map((document) => document.category)
  );

  return requiredCategories.every((category) => verifiedCategories.has(category));
}

export async function createPromotionRequestWithWorkflow(
  client: DbClient,
  input: {
    actor: WorkflowActor;
    lecturerId: number;
    currentRank: string;
    targetRank: string;
    yearsInCurrentRank: number;
    adminComment?: string | null;
  }
) {
  assertActorRole(input.actor, ['LECTURER']);

  if (input.actor.id !== input.lecturerId) {
    throw new WorkflowError('You can only create a request for your own account.', 403);
  }

  const activeRequest = await client.promotionRequest.findFirst({
    where: {
      lecturerId: input.actor.id,
      status: {
        notIn: [RequestStatus.COMPLETED, RequestStatus.REJECTED, RequestStatus.NOT_RECOMMENDED],
      },
    },
  });

  if (activeRequest) {
    throw new WorkflowError('You already have an active promotion request. Complete or resolve it before creating another.', 409);
  }

  const request = await client.promotionRequest.create({
    data: {
      lecturerId: input.lecturerId,
      applicantId: input.lecturerId,
      requestedById: input.actor.id,
      status: RequestStatus.DRAFT,
      currentRank: input.currentRank,
      targetRank: input.targetRank,
      yearsInCurrentRank: input.yearsInCurrentRank || 0,
      adminComment: input.adminComment || null,
    },
    include: {
      lecturer: true,
      requestedBy: true,
      documents: true,
    },
  });

  await writeStatusHistory(client, {
    promotionRequestId: request.id,
    changedById: input.actor.id,
    oldStatus: null,
    newStatus: RequestStatus.DRAFT,
    comment: 'Promotion request draft created.',
  });

  await writeAuditLog(client, {
    actorId: input.actor.id,
    requestId: request.id,
    action: 'promotion_request.create',
    entityType: 'PromotionRequest',
    entityId: request.id,
    description: 'Promotion request draft was created.',
    metadata: {
      lecturerId: input.lecturerId,
      currentRank: input.currentRank,
      targetRank: input.targetRank,
    },
  });

  await notifyUser(client, {
    userId: request.lecturerId,
    promotionRequestId: request.id,
    title: 'Promotion request draft created',
    message: 'Your promotion request draft has been created. Upload required evidence before submitting.',
    type: NotificationType.INFO,
  });

  return request;
}

export async function transitionPromotionRequest(
  client: DbClient,
  input: {
    actor: WorkflowActor;
    requestId: number;
    newStatus: RequestStatus;
    comment?: string | null;
    action?: string;
    ownerId?: number;
    notifyApplicant?: boolean;
    notifyNextRoles?: boolean;
  }
) {
  const current = await client.promotionRequest.findUnique({
    where: { id: input.requestId },
    include: { lecturer: true },
  });

  if (!current) {
    throw new WorkflowError('Promotion request not found.', 404);
  }

  if (input.ownerId && current.lecturerId !== input.ownerId) {
    throw new WorkflowError('You can only manage your own promotion request.', 403);
  }

  if (current.status !== input.newStatus) {
    assertStatusTransition(current.status, input.newStatus, input.actor.role);
  }

  const now = new Date();
  const updateData: Prisma.PromotionRequestUncheckedUpdateInput = {
    status: input.newStatus,
    adminComment: input.comment || current.adminComment,
  };

  if (input.newStatus === RequestStatus.SUBMITTED && !current.submittedAt) {
    updateData.submittedAt = now;
  }

  if (FINAL_REVIEW_STATUSES.has(input.newStatus)) {
    updateData.reviewedAt = now;
    updateData.reviewedById = input.actor.id;
  }

  if (input.newStatus === RequestStatus.COMPLETED) {
    updateData.completedAt = now;
  }

  const updated = await client.promotionRequest.update({
    where: { id: input.requestId },
    data: updateData,
    include: {
      lecturer: true,
      requestedBy: true,
      documents: {
        include: { verifiedBy: true },
        orderBy: { uploadedAt: 'desc' },
      },
      reviewComments: {
        include: {
          reviewer: {
            select: { id: true, name: true, role: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
      statusHistory: {
        include: {
          changedBy: {
            select: { id: true, name: true, role: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 8,
      },
    },
  });

  if (current.status !== input.newStatus) {
    await writeStatusHistory(client, {
      promotionRequestId: input.requestId,
      changedById: input.actor.id,
      oldStatus: current.status,
      newStatus: input.newStatus,
      comment: input.comment,
    });
  }

  await writeAuditLog(client, {
    actorId: input.actor.id,
    requestId: input.requestId,
    action: input.action || 'promotion_request.status_changed',
    entityType: 'PromotionRequest',
    entityId: input.requestId,
    description: `Application status changed from ${formatEnum(current.status)} to ${formatEnum(input.newStatus)}.`,
    metadata: {
      oldStatus: current.status,
      newStatus: input.newStatus,
      comment: input.comment || null,
    },
  });

  if (input.notifyApplicant !== false) {
    await notifyUser(client, {
      userId: current.lecturerId,
      promotionRequestId: input.requestId,
      title: 'Application status updated',
      message: input.comment || `Your promotion application is now ${formatEnum(input.newStatus)}.`,
      type: APPLICANT_NOTIFICATION_TYPE[input.newStatus] || NotificationType.INFO,
    });
  }

  const rolesToNotify = NEXT_OWNER_ROLES[input.newStatus] || [];
  if (input.notifyNextRoles !== false && rolesToNotify.length > 0) {
    await notifyRoles(client, {
      roles: rolesToNotify,
      promotionRequestId: input.requestId,
      title: `Promotion application ${formatEnum(input.newStatus)}`,
      message: `${current.lecturer.name}'s promotion application is now ${formatEnum(input.newStatus)}.`,
      type: NotificationType.INFO,
      excludeUserId: input.actor.id,
    });
  }

  return updated;
}

export async function submitPromotionRequest(
  client: DbClient,
  input: {
    actor: WorkflowActor;
    requestId: number;
  }
) {
  assertActorRole(input.actor, ['LECTURER']);

  return transitionPromotionRequest(client, {
    actor: input.actor,
    requestId: input.requestId,
    newStatus: RequestStatus.SUBMITTED,
    ownerId: input.actor.id,
    comment: 'Lecturer submitted promotion application.',
    action: 'promotion_request.submit',
  });
}

export async function savePromotionDocumentRecord(
  client: DbClient,
  input: {
    actor: WorkflowActor;
    requestId: number;
    category: DocumentCategory;
    title: string;
    fileUrl: string;
    fileName: string;
    fileType: string;
    mimeType?: string | null;
    fileSize: number;
  }
) {
  assertActorRole(input.actor, ['LECTURER']);

  const request = await client.promotionRequest.findUnique({
    where: { id: input.requestId },
    include: { lecturer: true },
  });

  if (!request) {
    throw new WorkflowError('Promotion request not found.', 404);
  }

  if (request.lecturerId !== input.actor.id) {
    throw new WorkflowError('You can only upload evidence for your own promotion request.', 403);
  }

  if (TERMINAL_STATUSES.has(request.status)) {
    throw new WorkflowError('Evidence cannot be uploaded after the application has been finalized.', 409);
  }

  const document = await client.document.upsert({
    where: {
      requestId_category: {
        requestId: input.requestId,
        category: input.category,
      },
    },
    update: {
      title: input.title,
      fileUrl: input.fileUrl,
      fileName: input.fileName,
      mimeType: input.mimeType,
      fileType: input.fileType,
      fileSize: input.fileSize,
      status: VerificationStatus.PENDING,
      verificationStatus: VerificationStatus.PENDING,
      verifiedById: null,
      verificationComment: null,
      verifiedAt: null,
      uploadedById: input.actor.id,
    },
    create: {
      requestId: input.requestId,
      promotionRequestId: input.requestId,
      uploadedById: input.actor.id,
      category: input.category,
      title: input.title,
      fileUrl: input.fileUrl,
      fileName: input.fileName,
      mimeType: input.mimeType,
      fileType: input.fileType,
      fileSize: input.fileSize,
    },
    include: {
      verifiedBy: true,
    },
  });

  await writeAuditLog(client, {
    actorId: input.actor.id,
    requestId: input.requestId,
    action: 'promotion_document.upload',
    entityType: 'Document',
    entityId: document.id,
    description: `${formatEnum(input.category)} evidence was uploaded.`,
    metadata: {
      documentId: document.id,
      category: document.category,
      title: document.title,
      fileName: document.fileName,
    },
  });

  await notifyUser(client, {
    userId: request.lecturerId,
    promotionRequestId: input.requestId,
    title: 'Evidence uploaded',
    message: `${formatEnum(input.category)} evidence has been saved and is pending verification.`,
    type: NotificationType.SUCCESS,
  });

  if (request.status !== RequestStatus.DRAFT) {
    await notifyRoles(client, {
      roles: ['HOD_DEAN', 'HR_ADMIN', 'SYSTEM_ADMIN'],
      promotionRequestId: input.requestId,
      title: 'Promotion evidence uploaded',
      message: `${request.lecturer.name} uploaded ${formatEnum(input.category)} evidence.`,
      type: NotificationType.INFO,
      excludeUserId: input.actor.id,
    });
  }

  return document;
}

export async function recordDepartmentReview(
  client: DbClient,
  input: {
    actor: WorkflowActor;
    requestId: number;
    decision: DepartmentReviewDecision;
    comment: string;
  }
) {
  assertActorRole(input.actor, ['HOD_DEAN', 'SYSTEM_ADMIN']);

  const current = await client.promotionRequest.findUnique({
    where: { id: input.requestId },
    include: { lecturer: true },
  });

  if (!current) {
    throw new WorkflowError('Promotion request not found.', 404);
  }

  const review = await client.reviewComment.create({
    data: {
      promotionRequestId: input.requestId,
      reviewerId: input.actor.id,
      comment: input.comment,
      recommendation: null,
    },
  });

  await writeAuditLog(client, {
    actorId: input.actor.id,
    requestId: input.requestId,
    action: 'department_review.comment_added',
    entityType: 'ReviewComment',
    entityId: review.id,
    description: 'Department review comment was added.',
    metadata: {
      decision: input.decision,
      comment: input.comment,
    },
  });

  const statusByDecision: Partial<Record<DepartmentReviewDecision, RequestStatus>> = {
    FORWARD_TO_HR: RequestStatus.UNDER_HR_VERIFICATION,
    RETURN_FOR_CORRECTION: RequestStatus.RETURNED_FOR_CORRECTION,
    REQUIRES_FURTHER_REVIEW: RequestStatus.REQUIRES_FURTHER_REVIEW,
  };

  if (input.decision === 'COMMENT_ONLY') {
    await notifyUser(client, {
      userId: current.lecturerId,
      promotionRequestId: input.requestId,
      title: 'Department review comment added',
      message: input.comment,
      type: NotificationType.INFO,
    });

    return { review, request: current };
  }

  if (current.status === RequestStatus.SUBMITTED) {
    await transitionPromotionRequest(client, {
      actor: input.actor,
      requestId: input.requestId,
      newStatus: RequestStatus.UNDER_DEPARTMENT_REVIEW,
      comment: 'Department review started.',
      action: 'department_review.started',
      notifyApplicant: false,
      notifyNextRoles: false,
    });
  }

  const newStatus = statusByDecision[input.decision];
  if (!newStatus) {
    throw new WorkflowError('Invalid department review decision.', 400);
  }

  const updated = await transitionPromotionRequest(client, {
    actor: input.actor,
    requestId: input.requestId,
    newStatus,
    comment: input.comment,
    action: `department_review.${input.decision.toLowerCase()}`,
  });

  return { review, request: updated };
}

export async function verifyPromotionDocument(
  client: DbClient,
  input: {
    actor: WorkflowActor;
    requestId: number;
    documentId: number;
    verificationStatus: VerificationStatus;
    comment?: string | null;
  }
) {
  assertActorRole(input.actor, ['HR_ADMIN', 'SYSTEM_ADMIN']);

  const documentRecord = await client.document.findUnique({
    where: { id: input.documentId },
    include: {
      request: {
        include: {
          lecturer: true,
        },
      },
    },
  });

  if (!documentRecord || documentRecord.requestId !== input.requestId) {
    throw new WorkflowError('Document not found for this request.', 404);
  }

  if (TERMINAL_STATUSES.has(documentRecord.request.status)) {
    throw new WorkflowError('Documents cannot be verified after the application has been finalized.', 409);
  }

  const updatedDocument = await client.document.update({
    where: { id: input.documentId },
    data: {
      status: input.verificationStatus,
      verificationStatus: input.verificationStatus,
      verifiedById: input.actor.id,
      verificationComment: input.comment || null,
      verifiedAt: new Date(),
    },
  });

  await client.verification.create({
    data: {
      documentId: updatedDocument.id,
      verifierId: input.actor.id,
      decision: input.verificationStatus,
      comment: input.comment || null,
    },
  });

  await writeAuditLog(client, {
    actorId: input.actor.id,
    requestId: input.requestId,
    action: `promotion_document.${input.verificationStatus.toLowerCase()}`,
    entityType: 'Document',
    entityId: updatedDocument.id,
    description: `${formatEnum(updatedDocument.category)} evidence was ${formatEnum(input.verificationStatus)}.`,
    metadata: {
      documentId: updatedDocument.id,
      category: updatedDocument.category,
      verificationComment: input.comment || null,
    },
  });

  await notifyUser(client, {
    userId: documentRecord.request.lecturerId,
    promotionRequestId: input.requestId,
    title: input.verificationStatus === VerificationStatus.VERIFIED ? 'Document verified' : 'Document requires attention',
    message:
      input.comment ||
      `Your ${formatEnum(updatedDocument.category)} document was ${formatEnum(input.verificationStatus)}.`,
    type: input.verificationStatus === VerificationStatus.VERIFIED ? NotificationType.SUCCESS : NotificationType.WARNING,
  });

  let eligibility: Awaited<ReturnType<typeof calculateEligibility>> | null = null;
  let requestStatus = documentRecord.request.status;
  let updatedRequest: unknown = documentRecord.request;

  if (
    input.verificationStatus === VerificationStatus.REJECTED ||
    input.verificationStatus === VerificationStatus.REQUIRES_CORRECTION
  ) {
    updatedRequest = await transitionPromotionRequest(client, {
      actor: input.actor,
      requestId: input.requestId,
      newStatus: RequestStatus.RETURNED_FOR_CORRECTION,
      comment: input.comment || 'Document requires correction before eligibility can be calculated.',
      action: 'promotion_request.returned_after_verification',
    });
    requestStatus = RequestStatus.RETURNED_FOR_CORRECTION;
  } else if (input.verificationStatus === VerificationStatus.VERIFIED) {
    const readyForEligibility = await requiredDocumentsAreVerified(client, input.requestId);

    if (readyForEligibility) {
      eligibility = await calculateEligibility(client, input.requestId, input.actor.id);

      const nextStatus =
        eligibility.eligibilityStatus === EligibilityStatus.ELIGIBLE
          ? RequestStatus.UNDER_COMMITTEE_REVIEW
          : RequestStatus.REQUIRES_FURTHER_REVIEW;

      updatedRequest = await transitionPromotionRequest(client, {
        actor: input.actor,
        requestId: input.requestId,
        newStatus: nextStatus,
        comment: eligibility.eligibilityReason,
        action: 'promotion_request.eligibility_routed',
      });
      requestStatus = nextStatus;
    } else if (documentRecord.request.status !== RequestStatus.UNDER_HR_VERIFICATION) {
      updatedRequest = await transitionPromotionRequest(client, {
        actor: input.actor,
        requestId: input.requestId,
        newStatus: RequestStatus.UNDER_HR_VERIFICATION,
        comment: 'Document verification saved. Application remains under HR verification.',
        action: 'promotion_request.hr_verification_started',
      });
      requestStatus = RequestStatus.UNDER_HR_VERIFICATION;
    }
  }

  return {
    request: updatedRequest,
    requestStatus,
    document: updatedDocument,
    eligibility,
  };
}

const RECOMMENDATION_STATUS: Record<ReviewRecommendation, RequestStatus> = {
  RECOMMENDED: RequestStatus.RECOMMENDED,
  NOT_RECOMMENDED: RequestStatus.NOT_RECOMMENDED,
  REQUIRES_FURTHER_REVIEW: RequestStatus.REQUIRES_FURTHER_REVIEW,
};

export async function recordCommitteeReview(
  client: DbClient,
  input: {
    actor: WorkflowActor;
    requestId: number;
    comment: string;
    recommendation?: ReviewRecommendation | null;
  }
) {
  assertActorRole(input.actor, ['COMMITTEE_REVIEWER', 'SYSTEM_ADMIN']);

  const current = await client.promotionRequest.findUnique({
    where: { id: input.requestId },
    include: { lecturer: true },
  });

  if (!current) {
    throw new WorkflowError('Promotion request not found.', 404);
  }

  const review = await client.reviewComment.create({
    data: {
      promotionRequestId: input.requestId,
      reviewerId: input.actor.id,
      comment: input.comment,
      recommendation: input.recommendation || null,
    },
  });

  await writeAuditLog(client, {
    actorId: input.actor.id,
    requestId: input.requestId,
    action: 'committee_review.comment_added',
    entityType: 'ReviewComment',
    entityId: review.id,
    description: 'Committee review comment was added.',
    metadata: {
      recommendation: input.recommendation || null,
      comment: input.comment,
    },
  });

  if (!input.recommendation) {
    await notifyUser(client, {
      userId: current.lecturerId,
      promotionRequestId: input.requestId,
      title: 'Committee review comment added',
      message: 'A committee review comment was added to your promotion application.',
      type: NotificationType.INFO,
    });

    return { review, request: current };
  }

  const newStatus = RECOMMENDATION_STATUS[input.recommendation];
  const updated = await transitionPromotionRequest(client, {
    actor: input.actor,
    requestId: input.requestId,
    newStatus,
    comment: input.comment,
    action: `committee_review.${input.recommendation.toLowerCase()}`,
  });

  return { review, request: updated };
}
