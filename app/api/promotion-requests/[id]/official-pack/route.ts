import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { getAuthSession } from '../../../../../lib/auth';
import { writeAuditLog } from '../../../../../lib/audit-logger';
import { prisma } from '../../../../../lib/prisma';
import type { ApiResponse } from '../../../../../types';

const EXPORT_ROLES = new Set(['STAFF', 'LECTURER', 'HOD_DEAN', 'HR_ADMIN', 'COMMITTEE_REVIEWER', 'SYSTEM_ADMIN']);

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
      lecturer: { select: { name: true, email: true, department: true, faculty: true } },
      promotionRoute: { select: { code: true, name: true, finalAuthority: true, promotionTrack: { select: { name: true, type: true, staffCategory: true } } } },
      documents: { orderBy: { createdAt: 'asc' }, select: { title: true, category: true, verificationStatus: true, verifiedAt: true } },
      workflowStages: { orderBy: { sequence: 'asc' }, select: { sequence: true, stage: true, status: true, decision: true, completedAt: true } },
      externalAssessors: { orderBy: { createdAt: 'asc' }, select: { name: true, institution: true, country: true, specialization: true, status: true, reportReceivedAt: true } },
      committeeMeetings: { orderBy: { meetingDate: 'asc' }, select: { authority: true, meetingDate: true, quorumRequired: true, quorumPresent: true, quorumMet: true, agendaReference: true, recommendation: true, resolution: true } },
      appealCases: { orderBy: { filedAt: 'asc' }, select: { status: true, grounds: true, filedAt: true, dueAt: true, decidedAt: true, decision: true } },
    },
  });

  if (!file) return responseError('Promotion file not found.', 404);
  if ((session.role === 'STAFF' || session.role === 'LECTURER') && file.lecturerId !== session.userId) return responseError('You can only export your own promotion file.', 403);

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
  row('Completed', dateLabel(file.completedAt));

  section('Workflow Stages');
  for (const stage of file.workflowStages) row(stage.sequence + '. ' + label(stage.stage), label(stage.status) + ' / ' + label(stage.decision) + ' / ' + dateLabel(stage.completedAt));

  section('Evidence Documents');
  for (const document of file.documents) row(label(document.category), document.title + ' - ' + label(document.verificationStatus) + ' - ' + dateLabel(document.verifiedAt));
  if (file.documents.length === 0) draw('No evidence documents recorded.');

  section('External Assessors');
  for (const assessor of file.externalAssessors) row(assessor.name, [assessor.institution, assessor.country, assessor.specialization, label(assessor.status), dateLabel(assessor.reportReceivedAt)].filter(Boolean).join(' | '));
  if (file.externalAssessors.length === 0) draw('No external assessor records entered.');

  section('Committee Meetings');
  for (const meeting of file.committeeMeetings) {
    row(label(meeting.authority), dateLabel(meeting.meetingDate) + ' | Quorum ' + (meeting.quorumPresent ?? 0) + '/' + (meeting.quorumRequired ?? 0) + ' | ' + (meeting.quorumMet ? 'Met' : 'Not met') + ' | ' + label(meeting.recommendation));
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

  section('Certification Note');
  for (const line of wrap('This pack is generated from the digital promotion workflow records, including uploaded evidence metadata, governed stage decisions, assessor lifecycle records, committee meetings, appeal records, notifications, and audit-backed administrative actions.', 120)) draw(line);

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