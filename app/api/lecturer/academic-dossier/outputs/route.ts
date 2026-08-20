import { NextRequest, NextResponse } from 'next/server';
import { Prisma, ScholarlyOutputType } from '@prisma/client';
import { getAuthSession } from '../../../../../lib/auth';
import { isApplicantAccountRole } from '../../../../../lib/access-roles';
import { prisma, WORKFLOW_TRANSACTION_OPTIONS } from '../../../../../lib/prisma';
import {
  AcademicDossierError,
  assertAcademicDossierEditable,
  ensureAcademicDossier,
  getOwnedScheduleJContext,
  nullableText,
  optionalDateValue,
} from '../../../../../lib/academic-dossier-context';
import { equivalenceUnitsFor, normalizeDoi } from '../../../../../lib/academic-dossier-rules';
import { scholarlyOutputSchema } from '../../../../../lib/validation/academic-dossier.schema';
import { writeAuditLog } from '../../../../../lib/audit-logger';

function errorResponse(error: unknown) {
  const duplicate = error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
  const status = duplicate ? 409 : error instanceof AcademicDossierError ? error.statusCode : 500;
  const message = duplicate
    ? 'This DOI is already recorded in the active academic dossier.'
    : error instanceof Error
      ? error.message
      : 'Unable to save the scholarly output.';
  if (status === 500) console.error('Scholarly output create error:', error);
  return NextResponse.json({ success: false, error: message }, { status });
}

export async function POST(request: NextRequest) {
  try {
    const session = getAuthSession(request);
    if (!session || session.legacy) throw new AcademicDossierError('Unauthorized', 401);
    if (!isApplicantAccountRole(session.role)) throw new AcademicDossierError('Only applicants can add scholarly outputs.', 403);

    const parsed = scholarlyOutputSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Check the scholarly output details.', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const output = await prisma.$transaction(async (tx) => {
      const context = await getOwnedScheduleJContext(tx, session.userId);
      assertAcademicDossierEditable(context);
      const dossier = await ensureAcademicDossier(tx, context.id);
      const isIndexed = parsed.data.type === ScholarlyOutputType.INDEXED_CONFERENCE_PROCEEDING || parsed.data.isIndexed;

      const saved = await tx.scholarlyOutput.create({
        data: {
          academicDossierId: dossier.id,
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
        },
      });

      await writeAuditLog(tx, {
        actorId: session.userId,
        requestId: context.id,
        action: 'academic_dossier.output_added',
        entityType: 'ScholarlyOutput',
        entityId: saved.id,
        description: 'Applicant added a scholarly output to the Schedule J catalogue.',
        metadata: { type: saved.type, equivalenceUnits: saved.equivalenceUnits, doi: saved.doi },
      });
      return saved;
    }, WORKFLOW_TRANSACTION_OPTIONS);

    return NextResponse.json({ success: true, message: 'Scholarly output added.', data: output }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
