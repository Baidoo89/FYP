'use client';

interface AcademicHeaderProps {
  name: string;
  staffId: string;
  currentRank: string;
  department: string;
}

export function AcademicHeader({ name, staffId, currentRank, department }: AcademicHeaderProps) {
  return (
    <div className="pro-card p-5 sm:p-6">
      <div className="grid gap-4 md:grid-cols-4">
        <ProfileFact label="Full name" value={name} />
        <ProfileFact label="Staff ID" value={staffId} mono />
        <ProfileFact label="Current rank" value={currentRank} />
        <ProfileFact label="Department" value={department} />
      </div>
    </div>
  );
}

function ProfileFact({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className={`mt-2 truncate text-sm font-semibold text-slate-950 ${mono ? 'font-mono' : ''}`}>{value || 'Not assigned'}</p>
    </div>
  );
}

interface PromotionReadinessGaugeProps {
  percentage: number;
  targetRank: string;
  status: string;
}

export function PromotionReadinessGauge({ percentage, targetRank, status }: PromotionReadinessGaugeProps) {
  const clamped = Math.max(0, Math.min(100, percentage));
  const getStatusText = (s: string) => {
    switch (s) {
      case 'APPROVED':
        return 'Approved for promotion';
      case 'REJECTED':
        return 'Not eligible';
      case 'UNDER_REVIEW':
        return 'Under review';
      case 'SUBMITTED':
        return 'Awaiting review';
      default:
        return 'Draft';
    }
  };

  return (
    <div className="pro-card p-5 sm:p-6">
      <div className="grid gap-5 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">Promotion readiness</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-950">Targeting {targetRank}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Progress is calculated from application completion, submitted evidence, and workflow status.</p>
        </div>

        <div className="relative mx-auto h-32 w-32">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="43" fill="none" stroke="#e5e7eb" strokeWidth="8" />
            <circle
              cx="50"
              cy="50"
              r="43"
              fill="none"
              stroke="#0f766e"
              strokeWidth="8"
              strokeDasharray={`${(clamped / 100) * 270} 270`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-semibold text-slate-950">{clamped}%</span>
            <span className="text-xs font-medium text-slate-500">Complete</span>
          </div>
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-amber-800">Current status</p>
          <p className="mt-2 text-lg font-semibold text-amber-950">{getStatusText(status)}</p>
        </div>
      </div>
    </div>
  );
}

interface RecentActivityProps {
  documents: Array<{
    title: string;
    category: string;
    verificationStatus: string;
    uploadedAt: string;
  }>;
}

function statusTone(status: string) {
  if (status === 'VERIFIED') return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  if (status === 'REJECTED') return 'border-rose-200 bg-rose-50 text-rose-800';
  return 'border-amber-200 bg-amber-50 text-amber-800';
}

export function RecentActivity({ documents }: RecentActivityProps) {
  return (
    <div className="pro-card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-950">Recent Activity</h3>
          <p className="mt-1 text-sm text-slate-600">Latest document updates and verification states.</p>
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
          {documents.length} item(s)
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {documents.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
            No recent activity yet.
          </div>
        ) : (
          documents.map((doc, idx) => (
            <div key={idx} className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3">
              <span className="pro-code-badge">EV</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-slate-950">{doc.title}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="rounded-full border border-teal-100 bg-teal-50 px-2 py-0.5 font-semibold text-teal-700">{doc.category}</span>
                  <span className={`rounded-full border px-2 py-0.5 font-semibold ${statusTone(doc.verificationStatus)}`}>{doc.verificationStatus}</span>
                  <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}