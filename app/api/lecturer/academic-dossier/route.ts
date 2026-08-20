import { NextRequest, NextResponse } from 'next/server';
import { DossierStatus } from '@prisma/client';
import { getAuthSession } from '../../../../lib/auth';
import { isApplicantAccountRole } from '../../../../lib/access-roles';
import { prisma, WORKFLOW_TRANSACTION_OPTIONS } from '../../../../lib/prisma';
import {
  AcademicDossierError,
  academicRouteRules,
  assertAcademicDossierEditable,
  getOwnedScheduleJContext,
  nullableText,
} from '../../../../lib/academic-dossier-context';
import { OUTPUT_EQUIVALENCE_UNITS, evaluateAcademicDossier } from '../../../../lib/academic-dossier-rules';
import { academicDossierProfileSchema } from '../../../../lib/validation/academic-dossier.schema';
import { writeAuditLog } from '../../../../lib/audit-logger';

function errorResponse(error: unknown) {
  const status = error instanceof AcademicDossierError ? error.statusCode : 500;
  const message = error instanceof Error ? error.message : 'Unable to process the academic dossier.';
  if (status === 500) console.error('Academic dossier error:', error);
  return NextResponse.json({ success: false, error: message }, { status });
}

function authenticate(request: NextRequest) {
  const session = getAuthSession(request);
  if (!session || session.legacy) throw new AcademicDossierError('Unauthorized', 401);
  if (!isApplicantAccountRole(session.role)) throw new AcademicDossierError('Only applicants can manage an academic dossier.', 403);
  return session;
}

function dossierPayload(context: Awaited<ReturnType<typeof getOwnedScheduleJContext>>) {
  const dossier = context.academicDossier;
  const packet = dossier?.assessmentPackets[0] || null;
  const selectedOutputIds = packet?.items.map((item) => item.scholarlyOutputId) || [];
  const { requirements, ruleSnapshot } = academicRouteRules(context);
  const readiness = evaluateAcademicDossier({
    requirements,
    outputs: dossier?.scholarlyOutputs || [],
    selectedOutputIds,
    applicantDeclaration: dossier?.applicantDeclaration || false,
  });

  return {
    request: {
      id: context.id,
      status: context.status,
      currentRank: context.currentRank,
      targetRank: context.targetRank,
      editable: ['DRAFT', 'RETURNED_FOR_CORRECTION'].includes(context.status) && dossier?.status !== DossierStatus.FROZEN,
    },
    route: ruleSnapshot.route,
    policy: ruleSnapshot.policy,
    requirements,
    equivalenceUnits: OUTPUT_EQUIVALENCE_UNITS,
    dossier,
    outputs: dossier?.scholarlyOutputs || [],
    packet,
    selectedOutputIds,
    readiness,
  };
}

export async function GET(request: NextRequest) {
  try {
    const session = authenticate(request);
    const context = await getOwnedScheduleJContext(prisma, session.userId);
    return NextResponse.json({ success: true, data: dossierPayload(context) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = authenticate(request);
    const parsed = academicDossierProfileSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Check the dossier profile fields.', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const dossier = await prisma.$transaction(async (tx) => {
      const context = await getOwnedScheduleJContext(tx, session.userId);
      assertAcademicDossierEditable(context);
      const currentDeclaration = context.academicDossier?.applicantDeclaration || false;
      const data = {
        orcid: nullableText(parsed.data.orcid),
        googleScholarUrl: nullableText(parsed.data.googleScholarUrl),
        teachingStatement: nullableText(parsed.data.teachingStatement),
        researchStatement: nullableText(parsed.data.researchStatement),
        serviceStatement: nullableText(parsed.data.serviceStatement),
        applicantDeclaration: parsed.data.applicantDeclaration,
        declaredAt: parsed.data.applicantDeclaration
          ? currentDeclaration
            ? context.academicDossier?.declaredAt || new Date()
            : new Date()
          : null,
        status: DossierStatus.DRAFT,
      };

      const saved = await tx.academicDossier.upsert({
        where: { promotionRequestId: context.id },
        update: data,
        create: { promotionRequestId: context.id, ...data },
      });

      await writeAuditLog(tx, {
        actorId: session.userId,
        requestId: context.id,
        action: 'academic_dossier.profile_saved',
        entityType: 'AcademicDossier',
        entityId: saved.id,
        description: 'Applicant saved the Schedule J dossier profile and declaration.',
        metadata: { version: saved.version, applicantDeclaration: saved.applicantDeclaration },
      });

      return saved;
    }, WORKFLOW_TRANSACTION_OPTIONS);

    return NextResponse.json({ success: true, message: 'Academic dossier saved.', data: dossier });
  } catch (error) {
    return errorResponse(error);
  }
}
