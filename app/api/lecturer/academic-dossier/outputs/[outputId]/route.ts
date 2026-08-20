import { NextRequest, NextResponse } from 'next/server';
import { AcademicPacketStatus, Prisma, ScholarlyOutputType } from '@prisma/client';
import { getAuthSession } from '../../../../../../lib/auth';
import { isApplicantAccountRole } from '../../../../../../lib/access-roles';
import { prisma, WORKFLOW_TRANSACTION_OPTIONS } from '../../../../../../lib/prisma';
import {
  AcademicDossierError,
  assertAcademicDossierEditable,
  getOwnedScheduleJContext,
  nullableText,
  optionalDateValue,
} from '../../../../../../lib/academic-dossier-context';
import { equivalenceUnitsFor, normalizeDoi, scholarlyOutputSnapshot } from '../../../../../../lib/academic-dossier-rules';
import { scholarlyOutputSchema } from '../../../../../../lib/validation/academic-dossier.schema';
import { writeAuditLog } from '../../../../../../lib/audit-logger';

function outputIdFrom(value: string) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new AcademicDossierError('Invalid scholarly output id.');
  return id;
}

function errorResponse(error: unknown) {
  const duplicate = error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
  const status = duplicate ? 409 : error instanceof AcademicDossierError ? error.statusCode : 500;
  const message = duplicate
    ? 'This DOI is already recorded in the active academic dossier.'
    : error instanceof Error
      ? error.message
      : 'Unable to update the scholarly output.';
  if (status === 500) console.error('Scholarly output update error:', error);
  return NextResponse.json({ success: false, error: message }, { status });
}

function authenticate(request: NextRequest) {
  const session = getAuthSession(request);
  if (!session || session.legacy) throw new AcademicDossierError('Unauthorized', 401);
  if (!isApplicantAccountRole(session.role)) throw new AcademicDossierError('Only applicants can manage scholarly outputs.', 403);
  return session;
}

async function ownedOutput(tx: Prisma.TransactionClient, userId: number, outputId: number) {
  const context = await getOwnedScheduleJContext(tx, userId);
  assertAcademicDossierEditable(context);
  const output = context.academicDossier?.scholarlyOutputs.find((item) => item.id === outputId);
  if (!output) throw new AcademicDossierError('Scholarly output not found.', 404);

  const packetItems = await tx.academicAssessmentPacketItem.findMany({
    where: { scholarlyOutputId: outputId },
    include: { academicAssessmentPacket: true },
  });
  if (packetItems.some((item) => item.academicAssessmentPacket.status === AcademicPacketStatus.FROZEN)) {
    throw new AcademicDossierError('An output in a frozen assessment packet cannot be changed.', 409);
  }
  return { context, output, packetItems };
}

export async function PATCH(request: NextRequest, contextParams: { params: Promise<{ outputId: string }> }) {
  try {
    const session = authenticate(request);
    const { outputId: rawId } = await contextParams.params;
    const outputId = outputIdFrom(rawId);
    const parsed = scholarlyOutputSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Check the scholarly output details.', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const output = await prisma.$transaction(async (tx) => {
      const { context, packetItems } = await ownedOutput(tx, session.userId, outputId);
      const isIndexed = parsed.data.type === ScholarlyOutputType.INDEXED_CONFERENCE_PROCEEDING || parsed.data.isIndexed;
      const saved = await tx.scholarlyOutput.update({
        where: { id: outputId },
        data: {
          type: parsed.data.type,
          title: parsed.data.title,
          citation: parsed.data.citation,
          abstract: nullableText(parsed.data.abstract),
          publicationDate: optionalDateValue(parsed.data.publicationDate),
          doi: normalizeDoi(parsed.data.doi),
          url: nullableText(parsed.data.url),
          issn: nullableText(parsed.data.issn),
          isbn: nullableText(parsed.data.isbn),
          journalOrPublisher: nullableText(parsed.data.journalOrPublisher),
          volumeIssuePages: nullableText(parsed.data.volumeIssuePages),
          indexingSource: nullableText(parsed.data.indexingSource),
          authors: parsed.data.authors,
          applicantAuthorPosition: parsed.data.applicantAuthorPosition || null,
          contributionStatement: parsed.data.contributionStatement,
          isRefereed: parsed.data.isRefereed,
          isIndexed,
          claimedForCurrentRoute: parsed.data.claimedForCurrentRoute,
          equivalenceUnits: equivalenceUnitsFor(parsed.data.type),
          departmentVerificationStatus: 'PENDING',
          departmentVerifiedById: null,
          departmentVerificationNote: null,
          departmentVerifiedAt: null,
          libraryVerificationStatus: 'PENDING',
          libraryVerifiedById: null,
          libraryVerificationNote: null,
          libraryVerifiedAt: null,
        },
      });

      for (const item of packetItems) {
        await tx.academicAssessmentPacketItem.update({
          where: { id: item.id },
          data: {
            equivalenceUnitsSnapshot: saved.equivalenceUnits,
            outputSnapshot: scholarlyOutputSnapshot(saved),
          },
        });
      }

      await writeAuditLog(tx, {
        actorId: session.userId,
        requestId: context.id,
        action: 'academic_dossier.output_updated',
        entityType: 'ScholarlyOutput',
        entityId: saved.id,
        description: 'Applicant updated a scholarly output; verification was reset.',
        metadata: { type: saved.type, equivalenceUnits: saved.equivalenceUnits, doi: saved.doi },
      });
      return saved;
    }, WORKFLOW_TRANSACTION_OPTIONS);

    return NextResponse.json({ success: true, message: 'Scholarly output updated.', data: output });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: NextRequest, contextParams: { params: Promise<{ outputId: string }> }) {
  try {
    const session = authenticate(request);
    const { outputId: rawId } = await contextParams.params;
    const outputId = outputIdFrom(rawId);

    await prisma.$transaction(async (tx) => {
      const { context, packetItems } = await ownedOutput(tx, session.userId, outputId);
      const packetIds = [...new Set(packetItems.map((item) => item.academicAssessmentPacketId))];
      await tx.academicAssessmentPacketItem.deleteMany({ where: { scholarlyOutputId: outputId } });
      await tx.scholarlyOutput.delete({ where: { id: outputId } });

      for (const packetId of packetIds) {
        const remainingItems = await tx.academicAssessmentPacketItem.findMany({
          where: { academicAssessmentPacketId: packetId },
          select: { equivalenceUnitsSnapshot: true },
        });
        await tx.academicAssessmentPacket.update({
          where: { id: packetId },
          data: {
            selectedOutputCount: remainingItems.length,
            selectedEquivalentUnits: remainingItems.reduce((sum, item) => sum + item.equivalenceUnitsSnapshot, 0),
          },
        });
      }

      await writeAuditLog(tx, {
        actorId: session.userId,
        requestId: context.id,
        action: 'academic_dossier.output_deleted',
        entityType: 'ScholarlyOutput',
        entityId: outputId,
        description: 'Applicant removed an unfrozen scholarly output from the Schedule J catalogue.',
      });
    }, WORKFLOW_TRANSACTION_OPTIONS);

    return NextResponse.json({ success: true, message: 'Scholarly output removed.' });
  } catch (error) {
    return errorResponse(error);
  }
}
