import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { getAuthSession } from '../../../../../lib/auth';
import { writeAuditLog } from '../../../../../lib/audit-logger';
import { prisma } from '../../../../../lib/prisma';
import type { ApiResponse } from '../../../../../types';

const EXPORT_ROLES = new Set(['STAFF', 'LECTURER', 'HOD_DEAN', 'HR_ADMIN', 'COMMITTEE_REVIEWER']);

function responseError(error: string, status: number) {
  return NextResponse.json({ success: false, error } as ApiResponse<null>, { status });
}

function label(value?: string | null) {
  if (!value) return 'Not recorded';
  return value.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase());
}

function dateLabel(value?: Date | string | null) {
  if (!value) return 'Not recorded';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not recorded';
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

async function getRequestId(context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const requestId = Number(id);
  return Number.isInteger(requestId) && requestId > 0 ? requestId : null;
}

function wrap(text: string, max = 100) {
  const words = String(text || '').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    if ((current + ' ' + word).trim().length > max) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = (current + ' ' + word).trim();
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : ['Not recorded'];
}

function valueText(value: unknown) {
  if (value === null || value === undefined || value === '') return 'Not recorded';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.length === 0 ? 'No entries' : `${value.length} entr${value.length === 1 ? 'y' : 'ies'}`;
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, item]) => `${label(key)}: ${valueText(item)}`)
      .join(' | ');
  }
  return String(value);
}

function formResponseRows(templateSnapshot: unknown, responsesValue: unknown) {
  const schema = templateSnapshot && typeof templateSnapshot === 'object'
    ? templateSnapshot as { sections?: Array<{ fields?: Array<{ id?: string; label?: string }> }> }
    : {};
  const responses = responsesValue && typeof responsesValue === 'object' && !Array.isArray(responsesValue)
    ? responsesValue as Record<string, unknown>
    : {};
  const fields = (schema.sections || []).flatMap((section) => section.fields || []);
  return fields.flatMap((field) => {
    if (!field.id) return [];
    const value = responses[field.id];
    if (Array.isArray(value)) {
      if (value.length === 0) return [{ name: field.label || label(field.id), value: 'No entries' }];
      return value.map((entry, index) => ({
        name: `${field.label || label(field.id)} ${index + 1}`,
        value: valueText(entry),
      }));
    }
    return [{ name: field.label || label(field.id), value: valueText(value) }];
  });
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = getAuthSession(request);
  const requestId = await getRequestId(context);
  if (!session || session.legacy || !EXPORT_ROLES.has(session.role)) return responseError('Unauthorized', 401);
  if (!requestId) return responseError('Invalid request id.', 400);

  const file = await prisma.promotionRequest.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      receiptNumber: true,
      lecturerId: true,
      currentRank: true,
      targetRank: true,
      yearsInCurrentRank: true,
      status: true,
      eligibilityStatus: true,
      eligibilityReason: true,
      totalScore: true,
      submittedAt: true,
      verifiedAt: true,
      reviewedAt: true,
      completedAt: true,
      caseDueAt: true,
      nextApplicantUpdateDueAt: true,
      effectiveDate: true,
      decisionCommunicatedAt: true,
      lecturer: { select: { name: true, email: true, department: true, faculty: true } },
      promotionRoute: { select: { code: true, name: true, finalAuthority: true, promotionTrack: { select: { name: true, type: true, staffCategory: true } } } },
      documents: { orderBy: { createdAt: 'asc' }, select: { title: true, category: true, verificationStatus: true, verifiedAt: true } },
      workflowStages: { orderBy: { sequence: 'asc' }, select: { sequence: true, stage: true, status: true, decision: true, dueAt: true, completedAt: true } },
      externalAssessors: { orderBy: { createdAt: 'asc' }, select: { name: true, institution: true, country: true, specialization: true, status: true, reportReceivedAt: true } },
      committeeMeetings: {
        orderBy: { meetingDate: 'asc' },
        select: {
          authority: true,
          meetingDate: true,
          quorumRequired: true,
          quorumPresent: true,
          quorumMet: true,
          agendaReference: true,
          recommendation: true,
          resolution: true,
          participants: {
            orderBy: [{ isChair: 'desc' }, { memberName: 'asc' }],
            select: {
              memberName: true,
              memberRole: true,
              rankCodeSnapshot: true,
              attended: true,
              eligibleForCase: true,
              conflictDeclared: true,
              recused: true,
              ineligibilityReason: true,
              isChair: true,
            },
          },
        },
      },
      appealCases: { orderBy: { filedAt: 'asc' }, select: { status: true, grounds: true, filedAt: true, dueAt: true, decidedAt: true, decision: true } },
      recordControl: true,
      communicationDeliveries: {
        orderBy: { attemptedAt: 'asc' },
        select: { purpose: true, recipientAddress: true, subject: true, provider: true, status: true, attemptedAt: true, sentAt: true, errorMessage: true },
      },
      formSubmissions: {
        orderBy: [{ createdAt: 'asc' }, { version: 'asc' }],
        select: {
          version: true,
          status: true,
          templateSnapshot: true,
          responses: true,
          completionPercent: true,
          isConfidential: true,
          signedName: true,
          signedAt: true,
          submittedAt: true,
          template: { select: { code: true, name: true, audience: true, version: true, sourceReference: true, contentHash: true } },
          completedBy: { select: { name: true } },
          externalAssessor: { select: { name: true } },
        },
      },
    },
  });

  if (!file) return responseError('Promotion file not found.', 404);
  if ((session.role === 'STAFF' || session.role === 'LECTURER') && file.lecturerId !== session.userId) return responseError('You can only export your own promotion file.', 403);
  const canViewConfidential = session.role === 'HR_ADMIN' || session.role === 'COMMITTEE_REVIEWER';

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  let page = doc.addPage([842, 595]);
  let y = 560;

  const newPage = () => {
    page = doc.addPage([842, 595]);
    y = 560;
  };
  const draw = (text: string, options: { size?: number; bold?: boolean; color?: ReturnType<typeof rgb>; indent?: number } = {}) => {
    if (y < 40) newPage();
    page.drawText(text.slice(0, 150), { x: 30 + (options.indent || 0), y, size: options.size || 9, font: options.bold ? bold : font, color: options.color || rgb(0.12, 0.12, 0.12), maxWidth: 780 - (options.indent || 0) });
    y -= options.size && options.size > 10 ? 18 : 13;
  };
  const section = (title: string) => { y -= 6; draw(title, { size: 11, bold: true, color: rgb(0.02, 0.32, 0.36) }); };
  const row = (name: string, value: string | number | null | undefined) => draw(name + ': ' + String(value ?? 'Not recorded'));

  draw('GCTU STAFF PROMOTION OFFICIAL FILE PACK', { size: 14, bold: true, color: rgb(0.02, 0.32, 0.36) });
  draw('Generated: ' + dateLabel(new Date()) + ' | File: PR-' + String(file.id).padStart(5, '0'), { bold: true });

  section('Applicant and Route');
  row('Applicant', file.lecturer.name);
  row('Email', file.lecturer.email);
  row('Department', file.lecturer.department);
  row('Faculty', file.lecturer.faculty?.name);
  row('Route', [file.promotionRoute?.code, file.promotionRoute?.name].filter(Boolean).join(' - ') || 'Not recorded');
  row('Track', file.promotionRoute?.promotionTrack ? label(file.promotionRoute.promotionTrack.type) + ' / ' + label(file.promotionRoute.promotionTrack.staffCategory) : 'Not recorded');
  row('Rank Movement', label(file.currentRank) + ' to ' + label(file.targetRank));
  row('Final Authority', label(file.promotionRoute?.finalAuthority));
  row('Status', label(file.status));
  row('Eligibility', label(file.eligibilityStatus));
  row('Submitted', dateLabel(file.submittedAt));
  row('Case Target', dateLabel(file.caseDueAt));
  row('Next Applicant Update', dateLabel(file.nextApplicantUpdateDueAt));
  row('Effective Date', dateLabel(file.effectiveDate));
  row('Decision Communicated', dateLabel(file.decisionCommunicatedAt));
  row('Completed', dateLabel(file.completedAt));

  section('Workflow Stages');
  for (const stage of file.workflowStages) row(stage.sequence + '. ' + label(stage.stage), label(stage.status) + ' / ' + label(stage.decision) + ' / Due ' + dateLabel(stage.dueAt) + ' / Completed ' + dateLabel(stage.completedAt));

  section('Evidence Documents');
  for (const document of file.documents) row(label(document.category), document.title + ' - ' + label(document.verificationStatus) + ' - ' + dateLabel(document.verifiedAt));
  if (file.documents.length === 0) draw('No evidence documents recorded.');

  section('External Assessment');
  if (!canViewConfidential) {
    const reportsReceived = file.externalAssessors.filter((assessor) => assessor.status === 'REPORT_RECEIVED').length;
    row('Confidential reports received', reportsReceived);
    draw('External assessor identities and reports are confidential and are not included in the applicant copy.');
  } else {
    for (const assessor of file.externalAssessors) row(assessor.name, [assessor.institution, assessor.country, assessor.specialization, label(assessor.status), dateLabel(assessor.reportReceivedAt)].filter(Boolean).join(' | '));
    if (file.externalAssessors.length === 0) draw('No external assessor records entered.');
  }

  section('Official Forms');
  const visibleForms = file.formSubmissions.filter((form) => (
    canViewConfidential
      ? true
      : form.template.audience === 'APPLICANT' && !form.isConfidential
  ));
  for (const form of visibleForms) {
    draw(form.template.name + ' - Submission v' + form.version, { bold: true });
    row('Template', form.template.code + ' v' + form.template.version);
    row('Audience', label(form.template.audience));
    row('Status', label(form.status));
    row('Completion', form.completionPercent + '%');
    row('Signed by', form.signedName || form.completedBy?.name || form.externalAssessor?.name);
    row('Signed', dateLabel(form.signedAt || form.submittedAt));
    for (const responseRow of formResponseRows(form.templateSnapshot, form.responses)) {
      const lines = wrap(responseRow.name + ': ' + responseRow.value, 115);
      for (const line of lines) draw(line, { indent: 12 });
    }
  }
  if (visibleForms.length === 0) draw('No visible official form submissions recorded.');

  section('Committee Meetings');
  for (const meeting of file.committeeMeetings) {
    row(label(meeting.authority), dateLabel(meeting.meetingDate) + ' | Quorum ' + (meeting.quorumPresent ?? 0) + '/' + (meeting.quorumRequired ?? 0) + ' | ' + (meeting.quorumMet ? 'Met' : 'Not met') + ' | ' + label(meeting.recommendation));
    for (const participant of meeting.participants) {
      row(
        participant.memberName,
        [participant.memberRole, participant.rankCodeSnapshot ? label(participant.rankCodeSnapshot) : null, participant.attended ? 'Attended' : 'Absent', participant.eligibleForCase ? 'Eligible' : 'Excluded', participant.conflictDeclared ? 'Conflict declared' : null, participant.recused ? 'Recused' : null, participant.isChair ? 'Chair' : null, participant.ineligibilityReason].filter(Boolean).join(' | '),
      );
    }
    for (const line of wrap(meeting.resolution || '', 120)) draw(line, { indent: 12 });
  }
  if (file.committeeMeetings.length === 0) draw('No committee meeting records entered.');

  section('Appeals');
  for (const appeal of file.appealCases) {
    row(label(appeal.status), 'Filed ' + dateLabel(appeal.filedAt) + ' | Due ' + dateLabel(appeal.dueAt) + ' | Decided ' + dateLabel(appeal.decidedAt));
    for (const line of wrap('Grounds: ' + appeal.grounds, 120)) draw(line, { indent: 12 });
    if (appeal.decision) for (const line of wrap('Decision: ' + appeal.decision, 120)) draw(line, { indent: 12 });
  }
  if (file.appealCases.length === 0) draw('No appeal records entered.');

  if (session.role === 'HR_ADMIN') {
    section('Records Control');
    row('Access Classification', label(file.recordControl?.accessClassification));
    row('Retention Class', label(file.recordControl?.retentionClass));
    row('Retention Trigger', dateLabel(file.recordControl?.retentionTriggerDate));
    row('Retain Until', dateLabel(file.recordControl?.retainUntil));
    row('Lifecycle', label(file.recordControl?.lifecycleStatus));
    row('Legal Hold', file.recordControl?.legalHold ? 'Active' : 'No active hold');
    row('Archive Reference', file.recordControl?.archiveReference);
    row('Destruction Certificate', file.recordControl?.destructionCertificateReference);

    section('Communication Delivery History');
    for (const delivery of file.communicationDeliveries) {
      row(label(delivery.purpose), `${label(delivery.status)} | ${delivery.recipientAddress} | ${delivery.provider} | ${dateLabel(delivery.sentAt || delivery.attemptedAt)}`);
      if (delivery.errorMessage) for (const line of wrap('Delivery error: ' + delivery.errorMessage, 120)) draw(line, { indent: 12 });
    }
    if (file.communicationDeliveries.length === 0) draw('No promotion email delivery attempts recorded.');
  }

  section('Certification Note');
  for (const line of wrap('This pack is generated from the digital promotion workflow records, including signed versioned official forms, uploaded evidence metadata, governed stage decisions, assessor lifecycle records, committee meetings, appeal records, communication delivery evidence, records controls, and audit-backed administrative actions. Confidential sections are included only for authorised internal exports.', 120)) draw(line);

  const pdfBytes = await doc.save();
  await writeAuditLog(prisma, {
    actorId: session.userId,
    action: 'promotion_official_pack_exported',
    entityType: 'PromotionRequest',
    entityId: requestId,
    requestId,
    description: 'Official promotion file pack exported.',
    metadata: { status: file.status, exportedByRole: session.role },
  });

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="promotion-file-PR-' + String(file.id).padStart(5, '0') + '.pdf"',
      'Cache-Control': 'no-store',
    },
  });
}
