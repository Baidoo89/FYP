import { NextRequest, NextResponse } from 'next/server';
import { AcademicPacketStatus } from '@prisma/client';
import { getAuthSession } from '../../../../../lib/auth';
import { isApplicantAccountRole } from '../../../../../lib/access-roles';
import { prisma, WORKFLOW_TRANSACTION_OPTIONS } from '../../../../../lib/prisma';
import {
  AcademicDossierError,
  academicRouteRules,
  assertAcademicDossierEditable,
  ensureAcademicDossier,
  getOwnedScheduleJContext,
} from '../../../../../lib/academic-dossier-context';
import { evaluateAcademicDossier, scholarlyOutputSnapshot } from '../../../../../lib/academic-dossier-rules';
import { bestNSelectionSchema } from '../../../../../lib/validation/academic-dossier.schema';
import { writeAuditLog } from '../../../../../lib/audit-logger';

function errorResponse(error: unknown) {
  const status = error instanceof AcademicDossierError ? error.statusCode : 500;
  const message = error instanceof Error ? error.message : 'Unable to save the best-N packet.';
  if (status === 500) console.error('Academic packet error:', error);
  return NextResponse.json({ success: false, error: message }, { status });
}

export async function PUT(request: NextRequest) {
  try {
    const session = getAuthSession(request);
    if (!session || session.legacy) throw new AcademicDossierError('Unauthorized', 401);
    if (!isApplicantAccountRole(session.role)) throw new AcademicDossierError('Only applicants can select the assessment packet.', 403);

    const parsed = bestNSelectionSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Select valid scholarly outputs.' }, { status: 400 });
    }
    if (new Set(parsed.data.outputIds).size !== parsed.data.outputIds.length) {
      throw new AcademicDossierError('An output can appear only once in the assessment packet.');
    }

    const result = await prisma.$transaction(async (tx) => {
      let context = await getOwnedScheduleJContext(tx, session.userId);
      assertAcademicDossierEditable(context);
      const dossier = await ensureAcademicDossier(tx, context.id);
      context = await getOwnedScheduleJContext(tx, session.userId);
      const { requirements, ruleSnapshot } = academicRouteRules(context);

      if (requirements.bestOutputsRequired === null) {
        throw new AcademicDossierError('This qualification-based Schedule J route does not require a best-N scholarly packet.', 409);
      }
      if (parsed.data.outputIds.length > requirements.bestOutputsRequired) {
        throw new AcademicDossierError(`Select no more than ${requirements.bestOutputsRequired} outputs for this route.`);
      }

      const outputs = context.academicDossier?.scholarlyOutputs || [];
      const selectedSet = new Set(parsed.data.outputIds);
      const selectedOutputs = parsed.data.outputIds.map((id) => outputs.find((output) => output.id === id));
      if (selectedOutputs.some((output) => !output || output.claimedForCurrentRoute === false)) {
        throw new AcademicDossierError('Every selected output must belong to and be claimed for this application.');
      }

      const existing = context.academicDossier?.assessmentPackets[0] || null;
      const packet = existing || await tx.academicAssessmentPacket.create({
        data: {
          academicDossierId: dossier.id,
          promotionRouteId: context.promotionRoute!.id,
          version: 1,
          status: AcademicPacketStatus.DRAFT,
          submittedOutputMinimum: requirements.submittedMinimum,
          submittedOutputMaximum: requirements.submittedMaximum,
          minimumRefereedOutputs: requirements.minimumRefereed,
          bestOutputsRequired: requirements.bestOutputsRequired,
          ruleSnapshot,
        },
        include: { items: true },
      });

      await tx.academicAssessmentPacketItem.deleteMany({ where: { academicAssessmentPacketId: packet.id } });
      for (const [index, output] of selectedOutputs.entries()) {
        if (!output) continue;
        await tx.academicAssessmentPacketItem.create({
          data: {
            academicAssessmentPacketId: packet.id,
            scholarlyOutputId: output.id,
            selectionOrder: index + 1,
            equivalenceUnitsSnapshot: output.equivalenceUnits,
            outputSnapshot: scholarlyOutputSnapshot(output),
          },
        });
      }

      const readiness = evaluateAcademicDossier({
        requirements,
        outputs,
        selectedOutputIds: [...selectedSet],
        applicantDeclaration: context.academicDossier?.applicantDeclaration || false,
      });

      const savedPacket = await tx.academicAssessmentPacket.update({
        where: { id: packet.id },
        data: {
          promotionRouteId: context.promotionRoute!.id,
          submittedOutputMinimum: requirements.submittedMinimum,
          submittedOutputMaximum: requirements.submittedMaximum,
          minimumRefereedOutputs: requirements.minimumRefereed,
          bestOutputsRequired: requirements.bestOutputsRequired,
          selectedOutputCount: readiness.metrics.selectedOutputCount,
          selectedEquivalentUnits: readiness.metrics.selectedEquivalentUnits,
          ruleSnapshot,
        },
        include: { items: { orderBy: { selectionOrder: 'asc' } } },
      });

      await writeAuditLog(tx, {
        actorId: session.userId,
        requestId: context.id,
        action: 'academic_dossier.best_n_saved',
        entityType: 'AcademicAssessmentPacket',
        entityId: savedPacket.id,
        description: 'Applicant saved the ordered Schedule J best-N assessment packet.',
        metadata: { selectedOutputIds: parsed.data.outputIds, selectedEquivalentUnits: readiness.metrics.selectedEquivalentUnits },
      });

      return { packet: savedPacket, readiness };
    }, WORKFLOW_TRANSACTION_OPTIONS);

    return NextResponse.json({ success: true, message: 'Best-N assessment packet saved.', data: result });
  } catch (error) {
    return errorResponse(error);
  }
}
