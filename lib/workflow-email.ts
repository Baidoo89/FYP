import { RequestStatus } from '@prisma/client';
import { getAppBaseUrl } from './app-url';
import { sendEmail } from './email';

type ApplicantMilestoneRequest = {
  id: number;
  currentRank: string;
  targetRank: string;
  status: RequestStatus;
  lecturer: {
    name: string;
    email: string;
  };
};

type MilestoneCopy = {
  subject: string;
  title: string;
  summary: string;
  nextStep: string;
};

const MILESTONE_COPY: Partial<Record<RequestStatus, MilestoneCopy>> = {
  [RequestStatus.SUBMITTED]: {
    subject: 'Your GCTU promotion application has been submitted',
    title: 'Application submitted for academic review',
    summary: 'Your promotion application has been submitted and is ready for HOD/Dean review.',
    nextStep: 'The assigned academic reviewer will review your evidence and either forward the application to HR or return it for correction.',
  },
  [RequestStatus.UNDER_HR_VERIFICATION]: {
    subject: 'Your GCTU promotion application has reached HR verification',
    title: 'Application forwarded to HR',
    summary: 'Your HOD/Dean review has been recorded and the application has moved to HR verification.',
    nextStep: 'HR will verify the uploaded evidence before eligibility is calculated.',
  },
  [RequestStatus.RETURNED_FOR_CORRECTION]: {
    subject: 'Action required on your GCTU promotion application',
    title: 'Application returned for correction',
    summary: 'Your promotion application requires correction before it can continue.',
    nextStep: 'Review the feedback in your portal, replace or correct the required evidence, and resubmit the application.',
  },
  [RequestStatus.UNDER_COMMITTEE_REVIEW]: {
    subject: 'Your GCTU promotion application has reached committee review',
    title: 'Application forwarded to committee',
    summary: 'HR verification and eligibility checks have been completed, and your application has moved to committee review.',
    nextStep: 'The Promotion Committee will review the verified file and record a recommendation.',
  },
  [RequestStatus.REQUIRES_FURTHER_REVIEW]: {
    subject: 'Your GCTU promotion application requires further review',
    title: 'Further review required',
    summary: 'Your application has been marked for further administrative or academic review.',
    nextStep: 'Monitor your portal notifications for additional reviewer comments or required actions.',
  },
  [RequestStatus.RECOMMENDED]: {
    subject: 'Committee recommendation recorded for your GCTU promotion application',
    title: 'Committee recommendation recorded',
    summary: 'The Promotion Committee has recorded a recommendation on your application.',
    nextStep: 'HR will continue the final administrative workflow and update the official status.',
  },
  [RequestStatus.NOT_RECOMMENDED]: {
    subject: 'Committee decision recorded for your GCTU promotion application',
    title: 'Committee decision recorded',
    summary: 'The Promotion Committee has recorded its decision on your application.',
    nextStep: 'Review the outcome and comments in your portal. HR will complete the final administrative record.',
  },
  [RequestStatus.APPROVED_BY_AUTHORITY]: {
    subject: 'Final authority approval recorded for your GCTU promotion application',
    title: 'Authority approval recorded',
    summary: 'Final authority approval has been recorded for your promotion application.',
    nextStep: 'HR will complete the official administrative record.',
  },
  [RequestStatus.APPROVED]: {
    subject: 'Your GCTU promotion application has been approved',
    title: 'Application approved',
    summary: 'Your promotion application has been approved in the system.',
    nextStep: 'Check your portal for the official status summary and any HR follow-up.',
  },
  [RequestStatus.REJECTED]: {
    subject: 'Final decision recorded for your GCTU promotion application',
    title: 'Final decision recorded',
    summary: 'A final decision has been recorded for your promotion application.',
    nextStep: 'Review the comments and official status summary in your portal.',
  },
  [RequestStatus.COMPLETED]: {
    subject: 'Your GCTU promotion application workflow is complete',
    title: 'Promotion workflow completed',
    summary: 'The administrative workflow for your promotion application has been completed.',
    nextStep: 'You may view or print the application summary from your portal.',
  },
};

function formatEnum(value: string) {
  return value.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase());
}

function applicationCode(id: number) {
  return `PR-${String(id).padStart(5, '0')}`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function workflowEmailHtml(input: {
  request: ApplicantMilestoneRequest;
  copy: MilestoneCopy;
  comment?: string | null;
  actionUrl: string;
}) {
  const request = input.request;
  const safeName = escapeHtml(request.lecturer.name);
  const safeActionUrl = escapeHtml(input.actionUrl);
  const safeComment = input.comment?.trim() ? escapeHtml(input.comment.trim()) : '';

  return [
    '<div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6; max-width: 620px;">',
    '<p style="margin: 0 0 8px; color: #475569; font-size: 13px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase;">GCTU Digital Staff Promotion Support System</p>',
    `<h2 style="margin: 0 0 12px; color: #0b2d5b; font-size: 22px;">${escapeHtml(input.copy.title)}</h2>`,
    `<p>Hello ${safeName},</p>`,
    `<p>${escapeHtml(input.copy.summary)}</p>`,
    '<div style="margin: 16px 0; padding: 14px; border: 1px solid #dbe4ef; border-radius: 10px; background: #f8fafc;">',
    `<p style="margin: 0 0 6px; font-size: 13px; color: #475569;">Application ID: <strong>${applicationCode(request.id)}</strong></p>`,
    `<p style="margin: 0 0 6px; font-size: 13px; color: #475569;">Current status: <strong>${formatEnum(request.status)}</strong></p>`,
    `<p style="margin: 0; font-size: 13px; color: #475569;">Promotion path: <strong>${formatEnum(request.currentRank)} to ${formatEnum(request.targetRank)}</strong></p>`,
    '</div>',
    safeComment ? `<p><strong>Reviewer note:</strong> ${safeComment}</p>` : '',
    `<p><strong>Next step:</strong> ${escapeHtml(input.copy.nextStep)}</p>`,
    `<p><a href="${safeActionUrl}" style="display: inline-block; background: #0b2d5b; color: #ffffff; padding: 12px 18px; border-radius: 8px; text-decoration: none; font-weight: 700;">Open Application</a></p>`,
    `<p style="font-size: 13px; color: #475569;">If the button does not work, copy this link into your browser:<br />${safeActionUrl}</p>`,
    '<p style="font-size: 13px; color: #475569;">This is an automated workflow notification from the official GCTU staff promotion system.</p>',
    '</div>',
  ].join('');
}

export async function sendApplicantMilestoneEmail(input: {
  request: ApplicantMilestoneRequest;
  previousStatus: RequestStatus;
  comment?: string | null;
}) {
  if (input.previousStatus === input.request.status) {
    return { attempted: false, delivered: false, provider: 'not-applicable' };
  }

  const copy = MILESTONE_COPY[input.request.status];
  if (!copy) {
    return { attempted: false, delivered: false, provider: 'not-applicable' };
  }

  const actionUrl = `${getAppBaseUrl()}/lecturer-portal/application`;
  const request = input.request;

  try {
    const result = await sendEmail({
      to: request.lecturer.email,
      subject: copy.subject,
      text: [
        `Hello ${request.lecturer.name},`,
        '',
        copy.summary,
        '',
        `Application ID: ${applicationCode(request.id)}`,
        `Current status: ${formatEnum(request.status)}`,
        `Promotion path: ${formatEnum(request.currentRank)} to ${formatEnum(request.targetRank)}`,
        input.comment?.trim() ? `Reviewer note: ${input.comment.trim()}` : '',
        '',
        `Next step: ${copy.nextStep}`,
        actionUrl,
        '',
        'This is an automated workflow notification from the official GCTU staff promotion system.',
      ].filter(Boolean).join('\n'),
      html: workflowEmailHtml({
        request,
        copy,
        comment: input.comment,
        actionUrl,
      }),
    });

    return { attempted: true, ...result };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Workflow email delivery failed';
    console.error('Workflow email delivery failed:', message);
    return { attempted: true, delivered: false, provider: 'error', error: message };
  }
}
