'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import StatusBadge from './StatusBadge';
import ProgressStepper from './ProgressStepper';

export type PromotionDocumentItem = {
  id: number;
  title: string;
  category: string;
  fileUrl?: string;
  fileName?: string | null;
  fileType?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
  uploadedAt?: string | null;
  verificationStatus?: string;
  verificationComment?: string | null;
  verifiedBy?: {
    name?: string | null;
    role?: string | null;
  } | null;
};

export type PromotionReviewItem = {
  id?: number;
  comment: string;
  recommendation?: string | null;
  createdAt?: string | null;
  reviewer?: {
    name?: string | null;
    role?: string | null;
  } | null;
};

export type PromotionStatusItem = {
  id?: number;
  oldStatus?: string | null;
  newStatus: string;
  comment?: string | null;
  createdAt?: string | null;
  changedBy?: {
    name?: string | null;
    role?: string | null;
  } | null;
};

export type PromotionApplicationDetailRecord = {
  id: number;
  lecturerName: string;
  lecturerEmail: string;
  lecturerStaffId?: string | null;
  department: string;
  faculty?: string | null;
  currentRank: string;
  targetRank: string;
  yearsInCurrentRank?: number;
  status: string;
  eligibilityStatus?: string;
  eligibilityReason?: string | null;
  totalScore?: number | null;
  adminComment?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  documentCount?: number;
  verifiedDocumentCount?: number;
  requiredDocumentCount?: number;
  documents?: PromotionDocumentItem[];
  reviewComments?: PromotionReviewItem[];
  statusHistory?: PromotionStatusItem[];
};

type PromotionApplicationDetailProps = {
  application: PromotionApplicationDetailRecord;
  role: 'HOD_DEAN' | 'HR_ADMIN' | 'COMMITTEE_REVIEWER' | 'SYSTEM_ADMIN' | 'LECTURER';
  children?: ReactNode;
};

type DocumentStats = {
  total: number;
  verified: number;
  pending: number;
  correction: number;
  rejected: number;
  required: number;
};

const WORKFLOW_STEPS = ['Draft', 'Submitted', 'Department Review', 'HR Verification', 'Committee Review', 'Recommendation', 'Completed'];

const STATUS_STEP: Record<string, number> = {
  DRAFT: 1,
  SUBMITTED: 2,
  UNDER_DEPARTMENT_REVIEW: 3,
  RETURNED_FOR_CORRECTION: 3,
  UNDER_HR_VERIFICATION: 4,
  UNDER_REVIEW: 4,
  UNDER_COMMITTEE_REVIEW: 5,
  ELIGIBLE: 5,
  NOT_ELIGIBLE: 5,
  REQUIRES_FURTHER_REVIEW: 5,
  RECOMMENDED: 6,
  NOT_RECOMMENDED: 6,
  APPROVED: 7,
  APPROVED_BY_AUTHORITY: 7,
  REJECTED: 7,
  COMPLETED: 7,
};

function label(value?: string | null) {
  if (!value) return 'Not available';
  return value.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase());
}

function formatDate(value?: string | null) {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not recorded';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function roleLabel(role: PromotionApplicationDetailProps['role']) {
  const labels: Record<PromotionApplicationDetailProps['role'], string> = {
    LECTURER: 'Applicant View',
    HOD_DEAN: 'Department Review',
    HR_ADMIN: 'HR Verification',
    COMMITTEE_REVIEWER: 'Committee Review',
    SYSTEM_ADMIN: 'System Admin View',
  };
  return labels[role];
}

function applicationCode(id: number) {
  return `PR-${String(id).padStart(5, '0')}`;
}

function documentStats(application: PromotionApplicationDetailRecord): DocumentStats {
  const documents = application.documents || [];
  const total = application.documentCount ?? documents.length;
  const verified = application.verifiedDocumentCount ?? documents.filter((document) => document.verificationStatus === 'VERIFIED').length;
  const pending = documents.filter((document) => !document.verificationStatus || document.verificationStatus === 'PENDING').length;
  const correction = documents.filter((document) => document.verificationStatus === 'REQUIRES_CORRECTION').length;
  const rejected = documents.filter((document) => document.verificationStatus === 'REJECTED').length;
  const required = application.requiredDocumentCount && application.requiredDocumentCount > 0 ? application.requiredDocumentCount : 3;

  return { total, verified, pending, correction, rejected, required };
}

function getRoleGuidance(application: PromotionApplicationDetailRecord, role: PromotionApplicationDetailProps['role'], stats: DocumentStats) {
  const status = application.status;
  const needsCorrection = status === 'RETURNED_FOR_CORRECTION' || stats.correction > 0 || stats.rejected > 0;

  if (role === 'LECTURER') {
    if (status === 'DRAFT') {
      return stats.total < stats.required
        ? {
            title: 'Complete your evidence portfolio',
            description: 'Upload the required teaching, research, service, and supporting evidence before submission.',
            tone: 'amber' as const,
          }
        : {
            title: 'Ready for submission',
            description: 'Your evidence is attached. Submit the application so department review can begin.',
            tone: 'green' as const,
          };
    }

    if (needsCorrection) {
      return {
        title: 'Correction required',
        description: 'Review the returned evidence comments, replace the affected documents, and keep checking notifications.',
        tone: 'amber' as const,
      };
    }

    if (status === 'UNDER_COMMITTEE_REVIEW') {
      return {
        title: 'Awaiting committee recommendation',
        description: 'Your verified file is with the promotion committee. New feedback will appear here and in notifications.',
        tone: 'blue' as const,
      };
    }

    return {
      title: 'Track your application',
      description: 'Monitor workflow history, evidence decisions, eligibility outcome, and reviewer feedback from this record.',
      tone: 'blue' as const,
    };
  }

  if (role === 'HOD_DEAN') {
    if (['SUBMITTED', 'UNDER_DEPARTMENT_REVIEW'].includes(status)) {
      return {
        title: 'Department decision required',
        description: 'Review the evidence summary, add a formal comment, then forward to HR or return the file for correction.',
        tone: 'blue' as const,
      };
    }

    return {
      title: 'Department review record',
      description: 'Use this view to inspect department comments, application history, and whether the file has moved beyond department review.',
      tone: 'slate' as const,
    };
  }

  if (role === 'HR_ADMIN') {
    if (status === 'UNDER_HR_VERIFICATION') {
      return {
        title: 'Evidence verification required',
        description: 'Verify valid documents, return unclear evidence with comments, and let eligibility route the application automatically.',
        tone: 'blue' as const,
      };
    }

    if (stats.pending > 0 && ['SUBMITTED', 'UNDER_DEPARTMENT_REVIEW'].includes(status)) {
      return {
        title: 'Awaiting department handoff',
        description: 'Evidence exists on this file, but HR verification begins only after HOD/Dean forwards the application.',
        tone: 'slate' as const,
      };
    }

    if (needsCorrection) {
      return {
        title: 'Waiting for corrected evidence',
        description: 'The applicant must replace returned evidence before HR can complete verification and eligibility routing.',
        tone: 'amber' as const,
      };
    }

    return {
      title: 'Administrative oversight',
      description: 'Review verification outcomes, eligibility status, committee comments, and final workflow actions.',
      tone: 'slate' as const,
    };
  }

  if (role === 'COMMITTEE_REVIEWER') {
    if (status === 'UNDER_COMMITTEE_REVIEW') {
      return {
        title: 'Committee recommendation required',
        description: 'Review verified evidence and eligibility notes, then record a recommendation with clear rationale.',
        tone: 'blue' as const,
      };
    }

    return {
      title: 'Committee decision record',
      description: 'This file is no longer open for committee changes. Review the recorded recommendation and history.',
      tone: 'slate' as const,
    };
  }

  return {
    title: 'System governance view',
    description: 'Monitor workflow integrity, role activity, audit history, and final administrative readiness.',
    tone: 'slate' as const,
  };
}

function scoreDisplay(score?: number | null) {
  if (score === null || score === undefined) return 'Not scored';
  return `${score}/100`;
}

function completionPercent(stats: DocumentStats) {
  if (!stats.required) return 0;
  return Math.min(100, Math.round((stats.verified / stats.required) * 100));
}

function formatFileSize(size?: number | null) {
  if (!size || size <= 0) return null;
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function fileMeta(document: PromotionDocumentItem) {
  const parts = [
    formatFileSize(document.fileSize),
    document.uploadedAt ? `Uploaded ${formatDate(document.uploadedAt)}` : null,
  ].filter(Boolean);
  return parts.length ? parts.join(' | ') : 'Evidence file';
}

function friendlyDownloadName(document: PromotionDocumentItem) {
  const base = (document.title || 'evidence-document')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'evidence-document';
  return `${base}.pdf`;
}

function searchableFileText(document: PromotionDocumentItem) {
  return `${document.mimeType || ''} ${document.fileType || ''} ${document.fileName || ''} ${document.fileUrl || ''}`.toLowerCase();
}

function isPdfDocument(document: PromotionDocumentItem) {
  const text = searchableFileText(document);
  return text.includes('application/pdf') || text.includes('.pdf');
}

function isImageDocument(document: PromotionDocumentItem) {
  const text = searchableFileText(document);
  return text.includes('image/') || /\.(png|jpe?g|gif|webp|bmp)$/i.test(text);
}

export default function PromotionApplicationDetail({ application, role, children }: PromotionApplicationDetailProps) {
  const documents = application.documents || [];
  const previewableDocuments = useMemo(() => documents.filter((document) => Boolean(document.fileUrl)), [documents]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const reviewComments = application.reviewComments || [];
  const statusHistory = application.statusHistory || [];
  const stats = documentStats(application);
  const guidance = getRoleGuidance(application, role, stats);
  const currentStep = STATUS_STEP[application.status] || 1;
  const verifiedPercent = completionPercent(stats);
  const issueCount = stats.correction + stats.rejected;
  const isDepartmentReview = role === 'HOD_DEAN';
  const attachedRequiredCount = Math.min(stats.total, stats.required);
  const evidenceProgressPercent = isDepartmentReview
    ? Math.min(100, Math.round((attachedRequiredCount / Math.max(stats.required, 1)) * 100))
    : verifiedPercent;
  const evidenceProgressLabel = isDepartmentReview ? `${attachedRequiredCount}/${stats.required} attached` : `${verifiedPercent}% verified`;
  const evidenceTitle = isDepartmentReview ? 'Academic Evidence Review' : 'Evidence Readiness';
  const evidenceDescription = isDepartmentReview
    ? 'Open uploaded evidence to review academic completeness and relevance before forwarding to HR.'
    : 'Verified evidence against required promotion categories.';
  const evidenceMetricLabel = isDepartmentReview ? 'Evidence attached' : 'Verified evidence';
  const evidenceMetricValue = isDepartmentReview ? `${attachedRequiredCount}/${stats.required}` : `${stats.verified}/${stats.required}`;
  const documentsDescription = isDepartmentReview
    ? 'Uploaded files for academic review. After forwarding, unverified files are shown as awaiting HR review.'
    : 'Uploaded files, categories, and HR verification decisions.';
  const documentActionLabel = isDepartmentReview ? 'Review File' : role === 'HR_ADMIN' ? 'Inspect' : 'Open';
  const safePreviewIndex = previewableDocuments.length ? Math.min(previewIndex, previewableDocuments.length - 1) : 0;
  const previewDocument = previewableDocuments[safePreviewIndex] || null;

  useEffect(() => {
    setPreviewIndex(0);
  }, [application.id]);

  const selectPreviewDocument = (documentId: number) => {
    const nextIndex = previewableDocuments.findIndex((document) => document.id === documentId);
    if (nextIndex >= 0) setPreviewIndex(nextIndex);
  };

  const movePreviewDocument = (direction: -1 | 1) => {
    setPreviewIndex((current) => {
      if (!previewableDocuments.length) return 0;
      return Math.min(Math.max(current + direction, 0), previewableDocuments.length - 1);
    });
  };

  return (
    <div className="min-w-0 space-y-5 print:space-y-3">
      <section className="pro-card max-w-full overflow-hidden print:shadow-none">
        <div className="border-b border-gray-200 bg-white px-5 py-5">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-teal-800">
                  {roleLabel(role)}
                </span>
                <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-600">
                  {applicationCode(application.id)}
                </span>
              </div>
              <h2 className="mt-3 text-2xl font-bold tracking-tight text-gray-950">{application.lecturerName}</h2>
              <p className="mt-1 text-sm text-gray-600">{application.lecturerEmail}</p>
              <p className="mt-1 text-sm font-medium text-gray-700">{application.department}</p>
            </div>
            <div className="flex flex-wrap gap-2 lg:justify-end">
              <StatusBadge status={application.status} />
              {application.eligibilityStatus && <StatusBadge status={application.eligibilityStatus} />}
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <Metric label="Current rank" value={label(application.currentRank)} />
            <Metric label="Target rank" value={label(application.targetRank)} />
            <Metric label="Declared years" value={application.yearsInCurrentRank ?? 'Not set'} />
            <Metric label={evidenceMetricLabel} value={evidenceMetricValue} />
            <Metric label="Criteria score" value={scoreDisplay(application.totalScore)} />
          </div>
        </div>

        <div className="grid min-w-0 gap-0 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="border-b border-gray-200 p-5 lg:border-b-0 lg:border-r">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-950">{evidenceTitle}</h3>
                <p className="mt-1 text-sm text-gray-600">{evidenceDescription}</p>
              </div>
              <span className="w-fit rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-700">{evidenceProgressLabel}</span>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100">
              <div className="h-full rounded-full bg-teal-700" style={{ width: `${Math.max(evidenceProgressPercent, evidenceProgressPercent ? 8 : 0)}%` }} />
            </div>
            <div className="mt-4 grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-4">
              <MiniMetric label={isDepartmentReview ? "Attached" : "Pending"} value={isDepartmentReview ? stats.total : stats.pending} tone={isDepartmentReview ? "green" : "amber"} />
              <MiniMetric label={isDepartmentReview ? "HR Verified" : "Verified"} value={stats.verified} tone="green" />
              <MiniMetric label="Returned" value={stats.correction} tone={stats.correction > 0 ? 'amber' : 'green'} />
              <MiniMetric label="Needs Fix" value={issueCount} tone={issueCount > 0 ? 'red' : 'green'} />
            </div>
          </div>

          <div className="p-5">
            <RoleGuidance title={guidance.title} description={guidance.description} tone={guidance.tone} />
            {application.adminComment && (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                <p className="font-semibold">Latest administrative note</p>
                <p className="mt-1 leading-6">{application.adminComment}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <ProgressStepper currentStep={currentStep} steps={WORKFLOW_STEPS} status={application.status} />

      {children && (
        <section className="pro-card p-5 print:hidden">
          {children}
        </section>
      )}

      <div className="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <section className="pro-card min-w-0 p-5 print:shadow-none">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div>
              <h3 className="text-lg font-bold text-gray-950">Evidence Documents</h3>
              <p className="mt-1 text-sm text-gray-600">{documentsDescription}</p>
            </div>
            <span className="w-fit rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-700">{stats.total} total</span>
          </div>

          {previewDocument ? (
            <EvidencePreview
              document={previewDocument}
              index={safePreviewIndex}
              total={previewableDocuments.length}
              role={role}
              applicationStatus={application.status}
              onPrevious={() => movePreviewDocument(-1)}
              onNext={() => movePreviewDocument(1)}
              disablePrevious={safePreviewIndex === 0}
              disableNext={safePreviewIndex >= previewableDocuments.length - 1}
            />
          ) : (
            <EmptyLine message="Document preview will appear when an uploaded evidence file is available." />
          )}

          <div className="mt-4 space-y-3">
            {documents.length === 0 ? (
              <EmptyLine message="No evidence documents have been uploaded yet." />
            ) : (
              documents.map((document) => {
                const isPreviewing = previewDocument?.id === document.id;

                return (
                  <article
                    key={document.id}
                    className={`min-w-0 rounded-lg border p-4 shadow-sm transition ${
                      isPreviewing ? 'border-teal-300 bg-teal-50/60 ring-1 ring-teal-100' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="break-words font-semibold text-gray-950">{document.title}</p>
                          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-gray-600">
                            {label(document.category)}
                          </span>
                        </div>
                        <p className="mt-1 break-words text-xs text-gray-500">{fileMeta(document)}</p>
                        {document.verificationComment && <p className="mt-3 text-sm leading-6 text-gray-700">{document.verificationComment}</p>}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                        <DocumentVerificationBadge status={document.verificationStatus} role={role} applicationStatus={application.status} />
                        {document.fileUrl ? (
                          <>
                            <button
                              type="button"
                              onClick={() => selectPreviewDocument(document.id)}
                              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${
                                isPreviewing ? 'border-teal-700 bg-teal-700 text-white' : 'border-teal-200 text-teal-700 hover:bg-teal-50'
                              }`}
                              aria-label={`Preview ${document.title}`}
                            >
                              Preview
                            </button>
                            <a
                              href={document.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
                            >
                              {documentActionLabel}
                            </a>
                          </>
                        ) : (
                          <span className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-500">No file</span>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>

        <div className="space-y-5">
          <section className="pro-card min-w-0 p-5 print:shadow-none">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-lg font-bold text-gray-950">Eligibility Recommendation</h3>
                <p className="mt-1 text-sm text-gray-600">Calculated only after required documents are verified.</p>
              </div>
              {application.eligibilityStatus && <StatusBadge status={application.eligibilityStatus} />}
            </div>
            {application.eligibilityReason ? (
              <p className="mt-3 text-sm leading-6 text-gray-700">{application.eligibilityReason}</p>
            ) : (
              <EmptyLine message="Eligibility has not been calculated for this application yet." />
            )}
          </section>

          <section className="pro-card min-w-0 p-5 print:shadow-none">
            <h3 className="text-lg font-bold text-gray-950">Review Comments</h3>
            <div className="mt-4 space-y-3">
              {reviewComments.length === 0 ? (
                <EmptyLine message="No review comments recorded yet." />
              ) : (
                reviewComments.slice(0, 6).map((review, index) => (
                  <article key={review.id || index} className="min-w-0 rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-950">{review.reviewer?.name || 'Reviewer'}</p>
                        <p className="mt-0.5 text-xs text-gray-500">{label(review.reviewer?.role)} | {formatDate(review.createdAt)}</p>
                      </div>
                      {review.recommendation && <StatusBadge status={review.recommendation} />}
                    </div>
                    <p className="mt-2 break-words text-sm leading-6 text-gray-700">{review.comment}</p>
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="pro-card min-w-0 p-5 print:shadow-none">
            <h3 className="text-lg font-bold text-gray-950">Status History</h3>
            <div className="mt-4 space-y-3">
              {statusHistory.length === 0 ? (
                <EmptyLine message="Status history will appear as workflow actions are completed." />
              ) : (
                statusHistory.slice(0, 7).map((item, index) => (
                  <article key={item.id || index} className="border-l-2 border-teal-600 pl-3">
                    <p className="text-sm font-semibold text-gray-950">{label(item.newStatus)}</p>
                    <p className="mt-0.5 text-xs text-gray-500">{item.changedBy?.name || 'System'} | {formatDate(item.createdAt)}</p>
                    {item.comment && <p className="mt-1 text-sm leading-6 text-gray-700">{item.comment}</p>}
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function isBeyondDepartmentReview(status: string) {
  return [
    'UNDER_HR_VERIFICATION',
    'UNDER_COMMITTEE_REVIEW',
    'ELIGIBLE',
    'NOT_ELIGIBLE',
    'RECOMMENDED',
    'NOT_RECOMMENDED',
    'APPROVED',
    'APPROVED_BY_AUTHORITY',
    'REJECTED',
    'COMPLETED',
  ].includes(status);
}

function DocumentVerificationBadge({ status, role, applicationStatus }: { status?: string | null; role: PromotionApplicationDetailProps['role']; applicationStatus: string }) {
  const nextStatus = status || 'PENDING';

  if (role !== 'HOD_DEAN') {
    return <StatusBadge status={nextStatus} />;
  }

  if (nextStatus === 'PENDING') {
    const forwarded = isBeyondDepartmentReview(applicationStatus);
    return (
      <span className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ${forwarded ? 'border-sky-200 bg-sky-50 text-sky-800' : 'border-teal-200 bg-teal-50 text-teal-800'}`}>
        {forwarded ? 'Awaiting HR' : 'Attached'}
      </span>
    );
  }

  if (nextStatus === 'VERIFIED') {
    return <span className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-teal-800">HR Verified</span>;
  }

  if (nextStatus === 'REQUIRES_CORRECTION') {
    return <span className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-orange-800">HR Returned</span>;
  }

  if (nextStatus === 'REJECTED') {
    return <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-rose-800">HR Rejected</span>;
  }

  return <StatusBadge status={nextStatus} />;
}

function EvidencePreview({
  document,
  index,
  total,
  role,
  applicationStatus,
  onPrevious,
  onNext,
  disablePrevious,
  disableNext,
}: {
  document: PromotionDocumentItem;
  index: number;
  total: number;
  role: PromotionApplicationDetailProps['role'];
  applicationStatus: string;
  onPrevious: () => void;
  onNext: () => void;
  disablePrevious: boolean;
  disableNext: boolean;
}) {
  const fileUrl = document.fileUrl || '';
  const canPreviewPdf = isPdfDocument(document);
  const canPreviewImage = isImageDocument(document);

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-gray-50 print:hidden">
      <div className="flex flex-col gap-3 border-b border-gray-200 bg-white p-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="break-words text-sm font-bold text-gray-950">{document.title}</p>
            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-gray-600">
              {label(document.category)}
            </span>
            <DocumentVerificationBadge status={document.verificationStatus} role={role} applicationStatus={applicationStatus} />
          </div>
          <p className="mt-1 break-words text-xs text-gray-500">
            {fileMeta(document)} | Document {index + 1} of {total}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:shrink-0">
          <button
            type="button"
            onClick={onPrevious}
            disabled={disablePrevious}
            className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
            aria-label="Preview previous evidence document"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={disableNext}
            className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
            aria-label="Preview next evidence document"
          >
            Next
          </button>
          <a
            href={fileUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-teal-200 bg-white px-3 py-2 text-xs font-semibold text-teal-800 transition hover:bg-teal-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
          >
            Open
          </a>
          <a
            href={fileUrl}
            download={friendlyDownloadName(document)}
            className="rounded-lg bg-teal-700 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
          >
            Download
          </a>
        </div>
      </div>

      <div className="bg-white p-3">
        {canPreviewPdf ? (
          <iframe title={`Preview ${document.title}`} src={fileUrl} className="h-80 w-full rounded-lg border border-gray-200 bg-white sm:h-96" />
        ) : canPreviewImage ? (
          <div className="flex max-h-96 items-center justify-center overflow-auto rounded-lg border border-gray-200 bg-gray-50">
            <img src={fileUrl} alt={`${document.title} evidence preview`} className="max-h-96 w-auto max-w-full object-contain" />
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-6 text-center">
            <p className="text-sm font-semibold text-gray-950">Preview is not available for this file type.</p>
            <p className="mt-1 text-sm text-gray-600">Open or download the evidence file to review it in the appropriate application.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="min-w-0 rounded-lg border border-gray-200 bg-gray-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">{label}</p>
      <p className="mt-1 break-words text-sm font-bold text-gray-950">{value}</p>
    </div>
  );
}

function MiniMetric({ label, value, tone }: { label: string; value: number; tone: 'green' | 'amber' | 'red' }) {
  const toneClass = {
    green: 'border-teal-200 bg-teal-50 text-teal-800',
    amber: 'border-amber-200 bg-amber-50 text-amber-900',
    red: 'border-rose-200 bg-rose-50 text-rose-800',
  }[tone];

  return (
    <div className={`rounded-lg border px-3 py-2 ${toneClass}`}>
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] opacity-75">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}

function RoleGuidance({ title, description, tone }: { title: string; description: string; tone: 'green' | 'amber' | 'blue' | 'slate' }) {
  const toneClass = {
    green: 'border-teal-200 bg-teal-50 text-teal-950',
    amber: 'border-amber-200 bg-amber-50 text-amber-950',
    blue: 'border-sky-200 bg-sky-50 text-sky-950',
    slate: 'border-gray-200 bg-gray-50 text-gray-950',
  }[tone];

  return (
    <div className={`rounded-lg border p-4 ${toneClass}`}>
      <p className="text-xs font-bold uppercase tracking-[0.14em] opacity-70">Next Responsibility</p>
      <h3 className="mt-2 text-lg font-bold">{title}</h3>
      <p className="mt-2 text-sm leading-6 opacity-80">{description}</p>
    </div>
  );
}

function EmptyLine({ message }: { message: string }) {
  return <div className="mt-3 rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">{message}</div>;
}
