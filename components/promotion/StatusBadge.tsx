'use client';

type StatusBadgeProps = {
  status: string;
  label?: string;
};

export default function StatusBadge({ status, label }: StatusBadgeProps) {
  const tone = getTone(status);

  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>{label || status}</span>;
}

function getTone(status: string) {
  const normalized = status.toUpperCase();

  if (normalized.includes('APPROVED') || normalized.includes('ELIGIBLE') || normalized.includes('VERIFIED')) {
    return 'brand-badge-blue';
  }

  if (normalized.includes('REJECTED') || normalized.includes('NOT_ELIGIBLE')) {
    return 'border border-blue-950/15 bg-blue-950 text-white';
  }

  if (normalized.includes('UNDER_REVIEW') || normalized.includes('NEEDS_REVIEW') || normalized.includes('PENDING')) {
    return 'brand-badge-gold';
  }

  return 'brand-badge-blue';
}
