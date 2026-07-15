'use client';

import StatusBadge from './StatusBadge';
import ProgressStepper from './ProgressStepper';

export type PromotionDocumentItem = {
  id: number;
  title: string;
  category: string;
  fileUrl?: string;
  verificationStatus?: string;
  verificationComment?: string | null;
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
  department: string;
  currentRank: string;
  targetRank: string;
  yearsInCurrentRank?: number;
  status: string;
  eligibilityStatus?: string;
  eligibilityReason?: string | null;
  totalScore?: number | null;
  adminComment?: string | null;
  documentCount?: number;
  verifiedDocumentCount?: number;
  documents?: PromotionDocumentItem[];
  reviewComments?: PromotionReviewItem[];
  statusHistory?: PromotionStatusItem[];
};

type PromotionApplicationDetailProps = {
  application: PromotionApplicationDetailRecord;
  role: 'HOD_DEAN' | 'HR_ADMIN' | 'COMMITTEE_REVIEWER' | 'SYSTEM_ADMIN' | 'LECTURER';
  children?: React.ReactNode;
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
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
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

export default function PromotionApplicationDetail({ application, role, children }: PromotionApplicationDetailProps) {
  const documents = application.documents || [];
  const reviewComments = application.reviewComments || [];
  const statusHistory = application.statusHistory || [];
  const verifiedCount = application.verifiedDocumentCount ?? documents.filter((document) => document.verificationStatus === 'VERIFIED').length;
  const documentCount = application.documentCount ?? documents.length;
  const currentStep = STATUS_STEP[application.status] || 1;

  return (
    <div className="space-y-5">
      <div className="pro-card p-5">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">{roleLabel(role)}</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-950">{application.lecturerName}</h2>
            <p className="mt-1 text-sm text-slate-600">{application.lecturerEmail}</p>
            <p className="mt-1 text-sm text-slate-600">{application.department}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={application.status} />
            {application.eligibilityStatus && <StatusBadge status={application.eligibilityStatus} />}
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Promotion path" value={`${application.currentRank} to ${application.targetRank}`} />
          <Metric label="Years in rank" value={application.yearsInCurrentRank ?? 'Not set'} />
          <Metric label="Verified evidence" value={`${verifiedCount}/${documentCount}`} />
          <Metric label="Total score" value={application.totalScore ?? 'Not scored'} />
        </div>

        {application.adminComment && (
          <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
            <p className="font-semibold">Latest administrative note</p>
            <p className="mt-1 leading-6">{application.adminComment}</p>
          </div>
        )}
      </div>

      <ProgressStepper currentStep={currentStep} steps={WORKFLOW_STEPS} status={application.status} />

      {application.eligibilityReason && (
        <div className="pro-card p-5">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <h3 className="text-lg font-bold text-slate-950">Eligibility Recommendation</h3>
            {application.eligibilityStatus && <StatusBadge status={application.eligibilityStatus} />}
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-700">{application.eligibilityReason}</p>
        </div>
      )}

      {children && <div className="pro-card p-5">{children}</div>}

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="pro-card p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-950">Evidence Documents</h3>
              <p className="mt-1 text-sm text-slate-600">Uploaded files and verification decisions.</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{documentCount} total</span>
          </div>
          <div className="mt-4 space-y-3">
            {documents.length === 0 ? (
              <EmptyLine message="No evidence documents have been uploaded yet." />
            ) : (
              documents.map((document) => (
                <div key={document.id} className="rounded-lg border border-slate-200 bg-white p-4">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div>
                      <p className="font-semibold text-slate-950">{document.title}</p>
                      <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{label(document.category)}</p>
                      {document.verificationComment && <p className="mt-2 text-sm leading-6 text-slate-600">{document.verificationComment}</p>}
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <StatusBadge status={document.verificationStatus || 'PENDING'} />
                      {document.fileUrl && (
                        <a href={document.fileUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-teal-200 px-3 py-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-50">
                          Open
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="pro-card p-5">
            <h3 className="text-lg font-bold text-slate-950">Review Comments</h3>
            <div className="mt-4 space-y-3">
              {reviewComments.length === 0 ? (
                <EmptyLine message="No review comments recorded yet." />
              ) : (
                reviewComments.slice(0, 4).map((review, index) => (
                  <div key={review.id || index} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-950">{review.reviewer?.name || 'Reviewer'}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{label(review.reviewer?.role)} {formatDate(review.createdAt)}</p>
                      </div>
                      {review.recommendation && <StatusBadge status={review.recommendation} />}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-700">{review.comment}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pro-card p-5">
            <h3 className="text-lg font-bold text-slate-950">Status History</h3>
            <div className="mt-4 space-y-3">
              {statusHistory.length === 0 ? (
                <EmptyLine message="Status history will appear as workflow actions are completed." />
              ) : (
                statusHistory.slice(0, 5).map((item, index) => (
                  <div key={item.id || index} className="border-l-2 border-teal-600 pl-3">
                    <p className="text-sm font-semibold text-slate-950">{label(item.newStatus)}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{item.changedBy?.name || 'System'} {formatDate(item.createdAt)}</p>
                    {item.comment && <p className="mt-1 text-sm leading-6 text-slate-600">{item.comment}</p>}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-bold text-slate-950">{value}</p>
    </div>
  );
}

function EmptyLine({ message }: { message: string }) {
  return <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">{message}</div>;
}
