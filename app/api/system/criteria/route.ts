import { NextRequest, NextResponse } from 'next/server';
import { AcademicRank, DocumentCategory, PerformanceCategory } from '@prisma/client';
import { z } from 'zod';
import { getAuthSession } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';
import { writeAuditLog } from '../../../../lib/audit-logger';
import type { ApiResponse } from '../../../../types';

const criteriaSchema = z.object({
  id: z.number().int().positive().optional(),
  currentRank: z.nativeEnum(AcademicRank),
  targetRank: z.nativeEnum(AcademicRank),
  minimumYearsInCurrentRank: z.number().int().min(0),
  requiredDocumentCategories: z.array(z.nativeEnum(DocumentCategory)).min(1),
  requiredTeachingEvidence: z.number().int().min(0).default(1),
  requiredResearchPublicationEvidence: z.number().int().min(0).default(1),
  requiredServiceEvidence: z.number().int().min(0).default(1),
  minimumPerformanceCategory: z.nativeEnum(PerformanceCategory),
  scoringEnabled: z.boolean().default(true),
  minimumTotalScore: z.number().min(0).max(100).nullable().optional(),
  publicationRequirement: z.string().optional().nullable(),
  professionalDevelopmentRequirement: z.string().optional().nullable(),
  optionalReviewerNotes: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

function requireSystemAdmin(request: NextRequest) {
  const session = getAuthSession(request);
  if (!session || session.legacy || session.role !== 'SYSTEM_ADMIN') {
    return { session: null, response: NextResponse.json({ success: false, error: 'Forbidden' } as ApiResponse<null>, { status: 403 }) };
  }
  return { session, response: null };
}

export async function GET(request: NextRequest) {
  const { response } = requireSystemAdmin(request);
  if (response) return response;

  const criteria = await prisma.promotionCriteria.findMany({
    orderBy: [
      { currentRank: 'asc' },
      { targetRank: 'asc' },
    ],
  });

  return NextResponse.json({ success: true, data: criteria } as ApiResponse<typeof criteria>);
}

export async function POST(request: NextRequest) {
  const { session, response } = requireSystemAdmin(request);
  if (response) return response;

  const body = await request.json();
  const parsed = criteriaSchema.safeParse({
    ...body,
    minimumYearsInCurrentRank: Number(body.minimumYearsInCurrentRank),
    requiredTeachingEvidence: Number(body.requiredTeachingEvidence ?? 1),
    requiredResearchPublicationEvidence: Number(body.requiredResearchPublicationEvidence ?? 1),
    requiredServiceEvidence: Number(body.requiredServiceEvidence ?? 1),
    minimumTotalScore: body.minimumTotalScore === '' || body.minimumTotalScore === undefined ? null : Number(body.minimumTotalScore),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Validation failed', data: parsed.error.flatten().fieldErrors } as ApiResponse<unknown>,
      { status: 400 }
    );
  }

  const saved = await prisma.$transaction(async (tx) => {
    const criteria = await tx.promotionCriteria.upsert({
      where: {
        currentRank_targetRank: {
          currentRank: parsed.data.currentRank,
          targetRank: parsed.data.targetRank,
        },
      },
      update: {
        ...parsed.data,
        updatedById: session!.userId,
      },
      create: {
        ...parsed.data,
        createdById: session!.userId,
        updatedById: session!.userId,
      },
    });

    await writeAuditLog(tx, {
      actorId: session!.userId,
      action: 'CRITERIA_UPDATED',
      entityType: 'PromotionCriteria',
      entityId: criteria.id,
      description: `Promotion criteria configured for ${criteria.currentRank} to ${criteria.targetRank}.`,
      metadata: {
        currentRank: criteria.currentRank,
        targetRank: criteria.targetRank,
      },
    });

    return criteria;
  });

  return NextResponse.json({ success: true, message: 'Promotion criteria saved', data: saved } as ApiResponse<typeof saved>);
}
