import {
  AcademicPacketStatus,
  DossierStatus,
  PromotionTrackType,
  RequestStatus,
  type Prisma,
  type PrismaClient,
} from '@prisma/client';
import { academicRequirementsFromRoute } from './academic-dossier-rules';

type DbClient = PrismaClient | Prisma.TransactionClient;

const TERMINAL_STATUSES: RequestStatus[] = [
  RequestStatus.COMPLETED,
  RequestStatus.REJECTED,
  RequestStatus.NOT_RECOMMENDED,
];

const EDITABLE_STATUSES: RequestStatus[] = [RequestStatus.DRAFT, RequestStatus.RETURNED_FOR_CORRECTION];

export class AcademicDossierError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

export async function getOwnedScheduleJContext(client: DbClient, userId: number) {
  const request = await client.promotionRequest.findFirst({
    where: {
      lecturerId: userId,
      status: { notIn: TERMINAL_STATUSES },
      promotionRoute: { promotionTrack: { type: PromotionTrackType.SCHEDULE_J } },
    },
    include: {
      promotionRoute: {
        include: {
          requirements: { orderBy: { code: 'asc' } },
          targetRank: true,
          promotionTrack: { include: { policyVersion: { include: { policySource: true } } } },
        },
      },
      academicDossier: {
        include: {
          scholarlyOutputs: { orderBy: [{ publicationDate: 'desc' }, { createdAt: 'desc' }] },
          assessmentPackets: {
            where: { status: AcademicPacketStatus.DRAFT },
            orderBy: { version: 'desc' },
            take: 1,
            include: { items: { orderBy: { selectionOrder: 'asc' } } },
          },
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  if (!request?.promotionRoute) {
    throw new AcademicDossierError('Start a verified Schedule J promotion application before preparing an academic dossier.', 409);
  }

  return request;
}

export function assertAcademicDossierEditable(request: Awaited<ReturnType<typeof getOwnedScheduleJContext>>) {
  if (!EDITABLE_STATUSES.includes(request.status)) {
    throw new AcademicDossierError('The academic dossier is read-only after formal submission.', 409);
  }
  if (request.academicDossier?.status === DossierStatus.FROZEN) {
    throw new AcademicDossierError('This dossier version is frozen and cannot be changed.', 409);
  }
}

export async function ensureAcademicDossier(client: DbClient, promotionRequestId: number) {
  return client.academicDossier.upsert({
    where: { promotionRequestId },
    update: {},
    create: { promotionRequestId },
  });
}

export function academicRouteRules(request: Awaited<ReturnType<typeof getOwnedScheduleJContext>>) {
  const route = request.promotionRoute!;
  const requirements = academicRequirementsFromRoute(route.requirements);
  return {
    requirements,
    ruleSnapshot: {
      snapshotVersion: 1,
      route: {
        id: route.id,
        code: route.code,
        name: route.name,
        targetRank: route.targetRank.name,
        sourceClause: route.sourceClause,
      },
      policy: {
        sourceCode: route.promotionTrack.policyVersion.policySource.code,
        sourceTitle: route.promotionTrack.policyVersion.policySource.title,
        version: route.promotionTrack.policyVersion.versionLabel,
      },
      requirements,
    } satisfies Prisma.InputJsonValue,
  };
}

export function nullableText(value?: string | null) {
  const normalized = String(value || '').trim();
  return normalized || null;
}

export function optionalDateValue(value?: string | null) {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}
