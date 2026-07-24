'use client';

type StatusBadgeProps = {
  status: string;
  label?: string;
};

const statusMap: Record<string, { label: string; className: string }> = {
  DRAFT: { label: 'Draft', className: 'border-slate-200 bg-slate-100 text-slate-700' },
  PENDING: { label: 'Pending', className: 'border-amber-200 bg-amber-50 text-amber-800' },
  PENDING_REVIEW: { label: 'Pending', className: 'border-amber-200 bg-amber-50 text-amber-800' },
  SUBMITTED: { label: 'Submitted', className: 'border-sky-200 bg-sky-50 text-sky-800' },
  UNDER_REVIEW: { label: 'Under Review', className: 'border-sky-200 bg-sky-50 text-sky-800' },
  UNDER_DEPARTMENT_REVIEW: { label: 'Department Review', className: 'border-sky-200 bg-sky-50 text-sky-800' },
  UNDER_HR_VERIFICATION: { label: 'HR Verification', className: 'border-sky-200 bg-sky-50 text-sky-800' },
  UNDER_COMMITTEE_REVIEW: { label: 'Committee Review', className: 'border-indigo-200 bg-indigo-50 text-indigo-800' },
  VERIFIED: { label: 'Verified', className: 'border-emerald-200 bg-emerald-50 text-emerald-800' },
  REJECTED: { label: 'Rejected', className: 'border-rose-200 bg-rose-50 text-rose-800' },
  REQUIRES_CORRECTION: { label: 'Requires Correction', className: 'border-orange-200 bg-orange-50 text-orange-800' },
  RETURNED_FOR_CORRECTION: { label: 'Returned for Correction', className: 'border-orange-200 bg-orange-50 text-orange-800' },
  ELIGIBLE: { label: 'Eligible', className: 'border-emerald-200 bg-emerald-50 text-emerald-800' },
  NOT_ELIGIBLE: { label: 'Not Eligible', className: 'border-rose-200 bg-rose-50 text-rose-800' },
  NOT_CALCULATED: { label: 'Not Calculated', className: 'border-slate-200 bg-slate-100 text-slate-700' },
  INCOMPLETE_APPLICATION: { label: 'Incomplete Application', className: 'border-amber-200 bg-amber-50 text-amber-800' },
  REQUIRES_FURTHER_REVIEW: { label: 'Requires Further Review', className: 'border-sky-200 bg-sky-50 text-sky-800' },
  RECOMMENDED: { label: 'Recommended', className: 'border-emerald-200 bg-emerald-50 text-emerald-800' },
  NOT_RECOMMENDED: { label: 'Not Recommended', className: 'border-rose-200 bg-rose-50 text-rose-800' },
  APPROVED: { label: 'Approved', className: 'border-emerald-200 bg-emerald-50 text-emerald-800' },
  APPROVED_BY_AUTHORITY: { label: 'Authority Approved', className: 'border-emerald-200 bg-emerald-50 text-emerald-800' },
  COMPLETED: { label: 'Completed', className: 'border-emerald-900 bg-emerald-900 text-white' },
};

function titleCase(value: string) {
  return value.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase());
}

function getConfig(status: string) {
  const normalized = status.toUpperCase();
  if (statusMap[normalized]) return statusMap[normalized];
  if (normalized.includes('CORRECTION')) return statusMap.RETURNED_FOR_CORRECTION;
  if (normalized.includes('REJECT')) return statusMap.REJECTED;
  if (normalized.includes('NOT_ELIGIBLE') || normalized.includes('NOT_RECOMMENDED')) return statusMap.REJECTED;
  if (normalized.includes('ELIGIBLE') || normalized.includes('VERIFIED') || normalized.includes('APPROVED')) return statusMap.ELIGIBLE;
  if (normalized.includes('COMMITTEE')) return statusMap.UNDER_COMMITTEE_REVIEW;
  if (normalized.includes('UNDER') || normalized.includes('SUBMITTED') || normalized.includes('REVIEW')) return statusMap.UNDER_REVIEW;
  if (normalized.includes('PENDING')) return statusMap.PENDING;
  return { label: titleCase(status), className: 'border-slate-200 bg-slate-100 text-slate-700' };
}

export default function StatusBadge({ status, label }: StatusBadgeProps) {
  const config = getConfig(status);
  return (
    <span className={`inline-flex max-w-full items-center whitespace-normal break-words rounded-full border px-3 py-1 text-left text-xs font-semibold leading-4 ${config.className}`}>
      {label || config.label}
    </span>
  );
}
