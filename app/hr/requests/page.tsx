'use client';

import { useEffect, useMemo, useState } from 'react';
import StatusBadge from '../../../components/promotion/StatusBadge';
import PromotionApplicationDetail, { type PromotionApplicationDetailRecord } from '../../../components/promotion/PromotionApplicationDetail';
import { EmptyState, ErrorState, LoadingState } from '../../../components/enterprise-ui';

type PromotionRequest = PromotionApplicationDetailRecord & {
  submittedAt: string | null;
  verifiedAt: string | null;
  documentCount: number;
  verifiedDocumentCount?: number;
  requiredDocumentCount?: number;
};

type QueueSegment = 'all' | 'hr-work' | 'returned' | 'committee' | 'final' | 'completed';

type WorkflowAction = {
  status: string;
  label: string;
  comment: string;
  description: string;
  variant: 'primary' | 'warning' | 'success' | 'slate';
  confirm?: string;
};

const statuses = [
  'DRAFT',
  'SUBMITTED',
  'UNDER_DEPARTMENT_REVIEW',
  'RETURNED_FOR_CORRECTION',
  'UNDER_HR_VERIFICATION',
  'UNDER_COMMITTEE_REVIEW',
  'REQUIRES_FURTHER_REVIEW',
  'RECOMMENDED',
  'NOT_RECOMMENDED',
  'APPROVED_BY_AUTHORITY',
  'COMPLETED',
];

function formatLabel(value?: string | null) {
  if (!value) return 'Not available';
  return value.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase());
}

function applicationCode(id: number) {
  return `PR-${String(id).padStart(5, '0')}`;
}

function formatDate(value?: string | null) {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not recorded';
  return new Intl.DateTimeFormat('en-GH', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

function documentCounts(request?: PromotionRequest | null) {
  const documents = request?.documents || [];
  return {
    total: documents.length,
    pending: documents.filter((document) => !document.verificationStatus || document.verificationStatus === 'PENDING').length,
    verified: documents.filter((document) => document.verificationStatus === 'VERIFIED').length,
    returned: documents.filter((document) => ['REQUIRES_CORRECTION', 'REJECTED'].includes(document.verificationStatus || '')).length,
  };
}

function segmentMatches(request: PromotionRequest, segment: QueueSegment) {
  const counts = documentCounts(request);

  if (segment === 'all') return true;
  if (segment === 'hr-work') {
    return ['SUBMITTED', 'UNDER_DEPARTMENT_REVIEW', 'UNDER_HR_VERIFICATION', 'REQUIRES_FURTHER_REVIEW'].includes(request.status) || counts.pending > 0;
  }
  if (segment === 'returned') {
    return request.status === 'RETURNED_FOR_CORRECTION' || request.eligibilityStatus === 'INCOMPLETE_APPLICATION' || counts.returned > 0;
  }
  if (segment === 'committee') return request.status === 'UNDER_COMMITTEE_REVIEW';
  if (segment === 'final') return ['RECOMMENDED', 'NOT_RECOMMENDED', 'APPROVED_BY_AUTHORITY'].includes(request.status);
  if (segment === 'completed') return ['COMPLETED', 'REJECTED', 'APPROVED'].includes(request.status);
  return true;
}

function workflowHealth(request: PromotionRequest) {
  const counts = documentCounts(request);

  if (request.status === 'RETURNED_FOR_CORRECTION' || counts.returned > 0) {
    return { title: 'Applicant action needed', detail: 'Returned evidence or application details must be corrected before HR can continue.', tone: 'warning' as const };
  }

  if (request.status === 'UNDER_HR_VERIFICATION' || counts.pending > 0) {
    return { title: 'Verify evidence', detail: `${counts.pending} pending document(s) require an HR verification decision.`, tone: 'primary' as const };
  }

  if (request.status === 'UNDER_COMMITTEE_REVIEW') {
    return { title: 'With committee', detail: 'No HR final action is expected until committee recommendation is recorded.', tone: 'primary' as const };
  }

  if (request.status === 'RECOMMENDED') {
    return { title: 'Final approval ready', detail: 'Committee has recommended this application. HR can record authority approval or complete the workflow.', tone: 'success' as const };
  }

  if (request.status === 'NOT_RECOMMENDED') {
    return { title: 'Final close-out ready', detail: 'Committee did not recommend this application. HR should complete the record after administrative review.', tone: 'warning' as const };
  }

  if (request.status === 'APPROVED_BY_AUTHORITY') {
    return { title: 'Complete record', detail: 'Authority approval is recorded. Complete the workflow when all documentation is finalized.', tone: 'success' as const };
  }

  if (request.status === 'COMPLETED') {
    return { title: 'Completed', detail: 'This promotion workflow has been finalized.', tone: 'slate' as const };
  }

  return { title: 'Track workflow', detail: 'Monitor this request and open review when HR action is needed.', tone: 'slate' as const };
}

export default function MasterQueuePage() {
  const [requests, setRequests] = useState<PromotionRequest[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [segment, setSegment] = useState<QueueSegment>('hr-work');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadRequests = async (preferredId?: number | null) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/promotion-requests?scope=hr', { cache: 'no-store' });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Failed to load requests');
      }

      const allRequests = (payload.data || []) as PromotionRequest[];
      setRequests(allRequests);

      const next = allRequests.find((request) => request.id === preferredId)
        || allRequests.find((request) => request.status === 'UNDER_HR_VERIFICATION')
        || allRequests.find((request) => request.status === 'RECOMMENDED')
        || allRequests.find((request) => segmentMatches(request, 'hr-work'))
        || allRequests[0]
        || null;

      setSelectedId(next?.id || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const filteredRequests = useMemo(() => {
    let filtered = requests.filter((request) => segmentMatches(request, segment));

    if (statusFilter) {
      filtered = filtered.filter((request) => request.status === statusFilter);
    }

    if (searchTerm.trim()) {
      const query = searchTerm.trim().toLowerCase();
      filtered = filtered.filter(
        (request) =>
          request.lecturerName.toLowerCase().includes(query) ||
          request.lecturerEmail.toLowerCase().includes(query) ||
          request.department.toLowerCase().includes(query) ||
          applicationCode(request.id).toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [requests, searchTerm, statusFilter, segment]);

  const selectedRequest = filteredRequests.find((request) => request.id === selectedId)
    || requests.find((request) => request.id === selectedId)
    || filteredRequests[0]
    || null;

  async function updateStatus(requestId: number, status: string, comment: string) {
    setUpdatingId(requestId);
    setError('');
    setMessage('');

    try {
      const response = await fetch(`/api/promotion-requests/${requestId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, comment }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Failed to update status');
      }
      setMessage(`${applicationCode(requestId)} updated to ${formatLabel(status)}.`);
      await loadRequests(requestId);
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading && requests.length === 0) return <LoadingState label="Loading HR master queue..." />;
  if (error && requests.length === 0) return <ErrorState message={error} />;

  const hrWorkCount = requests.filter((request) => segmentMatches(request, 'hr-work')).length;
  const committeeCount = requests.filter((request) => request.status === 'UNDER_COMMITTEE_REVIEW').length;
  const finalCount = requests.filter((request) => segmentMatches(request, 'final')).length;
  const completedCount = requests.filter((request) => segmentMatches(request, 'completed')).length;
  const returnedCount = requests.filter((request) => segmentMatches(request, 'returned')).length;

  return (
    <div className="space-y-6">
      <section className="pro-hero px-6 py-8">
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="pro-eyebrow">Queue Management</div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-gray-950 sm:text-4xl">HR Master Queue</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-600">
              Control verification, committee routing, authority approval, and final administrative close-out from one shared application workspace.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href="/hr/verify" className="inline-flex w-fit rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-950">
              Verification workspace
            </a>
            <a href="/analytics" className="inline-flex w-fit rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm hover:bg-gray-50">
              Reports
            </a>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <QueueMetric code="ALL" label="All requests" value={requests.length} />
        <QueueMetric code="HR" label="Active HR work" value={hrWorkCount} tone="amber" />
        <QueueMetric code="RET" label="Returned" value={returnedCount} tone="rose" />
        <QueueMetric code="FIN" label="Final decisions" value={finalCount} tone="blue" />
        <QueueMetric code="DONE" label="Completed" value={completedCount} tone="slate" />
      </section>

      {message && <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">{message}</div>}
      {error && <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">{error}</div>}

      <section className="pro-card p-4 sm:p-5">
        <div className="grid gap-3 xl:grid-cols-[1fr_18rem_18rem_auto] xl:items-end">
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Search</span>
            <input
              type="text"
              placeholder="Name, email, department, or PR code"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="brand-input"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Status</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="brand-input">
              <option value="">All statuses</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {formatLabel(status)}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Queue segment</span>
            <select value={segment} onChange={(event) => setSegment(event.target.value as QueueSegment)} className="brand-input">
              <option value="all">All work</option>
              <option value="hr-work">Active HR work</option>
              <option value="returned">Returned / incomplete</option>
              <option value="committee">Committee review</option>
              <option value="final">Final decisions</option>
              <option value="completed">Completed</option>
            </select>
          </label>
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700">
            Showing {filteredRequests.length} of {requests.length}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <DecisionCard title="Verification Discipline" detail="Use the verification workspace for evidence decisions. HR routing should happen only after required evidence is clear." code="01" />
        <DecisionCard title="Committee Boundary" detail={`${committeeCount} application(s) are with committee. Wait for formal recommendation before final administrative action.`} code="02" />
        <DecisionCard title="Final Authority" detail={`${finalCount} application(s) are ready for authority approval or close-out. Use final controls with a clear audit note.`} code="03" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.82fr_1.68fr]">
        <aside className="pro-card overflow-hidden">
          <div className="border-b border-gray-200 p-5">
            <h2 className="text-lg font-bold text-gray-950">Promotion Queue</h2>
            <p className="mt-1 text-sm text-gray-600">Select an application to inspect details, evidence, history, and HR actions.</p>
          </div>

          {filteredRequests.length === 0 ? (
            <div className="p-5">
              <EmptyState title="No matching requests" description="Adjust the segment, status, or search term to view promotion files." />
            </div>
          ) : (
            <div className="max-h-[76rem] divide-y divide-gray-100 overflow-y-auto">
              {filteredRequests.map((request) => {
                const health = workflowHealth(request);
                const counts = documentCounts(request);
                const isSelected = selectedRequest?.id === request.id;

                return (
                  <button
                    key={request.id}
                    type="button"
                    onClick={() => setSelectedId(request.id)}
                    className={`block w-full p-5 text-left transition hover:bg-gray-50 ${isSelected ? 'bg-blue-50/70' : ''}`}
                  >
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start xl:flex-col 2xl:flex-row">
                      <div className="min-w-0">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">{applicationCode(request.id)}</p>
                        <p className="mt-2 truncate font-semibold text-gray-950">{request.lecturerName}</p>
                        <p className="mt-1 truncate text-sm text-gray-600">{request.department}</p>
                        <p className="mt-1 text-xs text-gray-500">Submitted {formatDate(request.submittedAt)}</p>
                      </div>
                      <StatusBadge status={request.status} />
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs font-semibold text-gray-600">
                      <span className="rounded-lg bg-gray-100 px-2 py-1">Docs {counts.total}</span>
                      <span className="rounded-lg bg-emerald-50 px-2 py-1 text-emerald-800">Verified {counts.verified}</span>
                      <span className="rounded-lg bg-amber-50 px-2 py-1 text-amber-900">Pending {counts.pending}</span>
                    </div>
                    <HealthPill title={health.title} detail={health.detail} tone={health.tone} />
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        {!selectedRequest ? (
          <div className="pro-card p-6">
            <EmptyState title="Select an application" description="Choose a promotion file from the queue to open the shared application detail workspace." />
          </div>
        ) : (
          <PromotionApplicationDetail application={selectedRequest} role="HR_ADMIN">
            <div className="grid gap-4 lg:grid-cols-[1fr_0.95fr]">
              <div>
                <h3 className="text-lg font-bold text-gray-950">HR Administrative Actions</h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Use document verification for evidence decisions. Use final workflow controls only when committee or authority outcomes are ready to record.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <a href={`/hr/verify?requestId=${selectedRequest.id}`} className="rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-950">
                    Open verification workspace
                  </a>
                  <a href="/hr/logs" className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50">
                    View audit activity
                  </a>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Current HR guidance</p>
                <HealthPill {...workflowHealth(selectedRequest)} />
                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs font-semibold text-gray-600">
                  <InfoTile label="Required" value={selectedRequest.requiredDocumentCount || 3} />
                  <InfoTile label="Verified" value={selectedRequest.verifiedDocumentCount || 0} />
                  <InfoTile label="Uploaded" value={selectedRequest.documentCount || 0} />
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div>
                  <p className="text-sm font-bold text-gray-950">Final Workflow Controls</p>
                  <p className="mt-1 text-xs leading-5 text-gray-500">Actions are permission-checked by the server and recorded in audit logs, status history, and notifications.</p>
                </div>
                <StatusBadge status={selectedRequest.status} />
              </div>
              <div className="mt-4">
                <WorkflowActions request={selectedRequest} updating={updatingId === selectedRequest.id} onUpdate={updateStatus} />
              </div>
            </div>
          </PromotionApplicationDetail>
        )}
      </section>
    </div>
  );
}

function QueueMetric({ code, label, value, tone = 'blue' }: { code: string; label: string; value: number; tone?: 'blue' | 'amber' | 'slate' | 'rose' }) {
  const toneClass = tone === 'amber'
    ? 'border-amber-200 bg-amber-50 text-amber-800'
    : tone === 'slate'
      ? 'border-gray-200 bg-gray-100 text-gray-700'
      : tone === 'rose'
        ? 'border-rose-200 bg-rose-50 text-rose-800'
        : 'border-blue-200 bg-blue-50 text-blue-800';

  return (
    <div className="pro-tile p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-gray-950">{value}</p>
        </div>
        <span className={`flex h-10 w-10 items-center justify-center rounded-lg border text-xs font-bold ${toneClass}`}>{code}</span>
      </div>
    </div>
  );
}

function DecisionCard({ code, title, detail }: { code: string; title: string; detail: string }) {
  return (
    <div className="pro-card p-5">
      <div className="flex items-start gap-3">
        <span className="pro-code-badge">{code}</span>
        <div>
          <h3 className="font-semibold text-gray-950">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-gray-600">{detail}</p>
        </div>
      </div>
    </div>
  );
}

function HealthPill({ title, detail, tone }: { title: string; detail: string; tone: 'primary' | 'warning' | 'success' | 'slate' }) {
  const toneClass = tone === 'warning'
    ? 'border-amber-200 bg-amber-50 text-amber-950'
    : tone === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
      : tone === 'primary'
        ? 'border-sky-200 bg-sky-50 text-sky-950'
        : 'border-gray-200 bg-gray-50 text-gray-700';

  return (
    <div className={`rounded-lg border p-3 ${toneClass}`}>
      <p className="text-xs font-bold uppercase tracking-[0.12em] opacity-75">{title}</p>
      <p className="mt-1 text-xs leading-5 opacity-85">{detail}</p>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-500">{label}</p>
      <p className="mt-1 text-base font-bold text-gray-950">{value}</p>
    </div>
  );
}

function WorkflowActions({
  request,
  updating,
  onUpdate,
}: {
  request: PromotionRequest;
  updating: boolean;
  onUpdate: (requestId: number, status: string, comment: string) => void;
}) {
  const actions = getWorkflowActions(request);

  if (actions.length === 0) {
    return <span className="text-xs font-medium text-gray-500">No direct HR final action is currently available for this application.</span>;
  }

  return (
    <div className="grid gap-2 md:grid-cols-2">
      {actions.map((action) => (
        <button
          key={action.status}
          type="button"
          disabled={updating}
          onClick={() => {
            if (action.confirm && !window.confirm(action.confirm)) return;
            onUpdate(request.id, action.status, action.comment);
          }}
          className={`rounded-lg border px-3 py-3 text-left text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${actionClass(action.variant)}`}
        >
          <span className="block">{updating ? 'Updating...' : action.label}</span>
          <span className="mt-1 block font-normal leading-5 opacity-75">{action.description}</span>
        </button>
      ))}
    </div>
  );
}

function getWorkflowActions(request: PromotionRequest): WorkflowAction[] {
  const actions: WorkflowAction[] = [];

  if (request.status === 'SUBMITTED') {
    actions.push({
      status: 'UNDER_DEPARTMENT_REVIEW',
      label: 'Start department review',
      comment: 'Application moved to department review.',
      description: 'Move this submitted file into department review tracking.',
      variant: 'primary',
    });
  }

  if (request.status === 'UNDER_DEPARTMENT_REVIEW') {
    actions.push({
      status: 'UNDER_HR_VERIFICATION',
      label: 'Accept into HR verification',
      comment: 'Application forwarded for HR verification.',
      description: 'Use after department review has been completed or confirmed.',
      variant: 'primary',
      confirm: 'Move this application to HR verification?',
    });
  }

  if (request.status === 'UNDER_HR_VERIFICATION' && request.eligibilityStatus === 'ELIGIBLE') {
    actions.push({
      status: 'UNDER_COMMITTEE_REVIEW',
      label: 'Send to committee',
      comment: 'Application forwarded to committee review after HR verification.',
      description: 'Use only after required evidence has been verified and eligibility is ready.',
      variant: 'primary',
      confirm: 'Forward this application to committee review?',
    });
  }

  if (request.status === 'REQUIRES_FURTHER_REVIEW') {
    actions.push({
      status: 'UNDER_HR_VERIFICATION',
      label: 'Return to HR verification',
      comment: 'Application returned to HR verification for additional administrative review.',
      description: 'Use when HR needs to resolve further review items.',
      variant: 'warning',
    });
  }

  if (request.status === 'RECOMMENDED') {
    actions.push({
      status: 'APPROVED_BY_AUTHORITY',
      label: 'Record authority approval',
      comment: 'Final administrative authority approved the recommendation.',
      description: 'Records formal authority approval before completion.',
      variant: 'success',
      confirm: 'Record final authority approval for this recommended application?',
    });
    actions.push({
      status: 'COMPLETED',
      label: 'Complete after approval',
      comment: 'Application workflow completed after committee recommendation and administrative review.',
      description: 'Use only when approval documentation is complete.',
      variant: 'slate',
      confirm: 'Complete this recommended application without a separate authority-approved status?',
    });
  }

  if (request.status === 'APPROVED_BY_AUTHORITY') {
    actions.push({
      status: 'COMPLETED',
      label: 'Complete workflow',
      comment: 'Application workflow completed after final authority approval.',
      description: 'Final close-out after approval documents are ready.',
      variant: 'success',
      confirm: 'Complete this approved promotion workflow?',
    });
  }

  if (request.status === 'NOT_RECOMMENDED') {
    actions.push({
      status: 'COMPLETED',
      label: 'Close not recommended file',
      comment: 'Application workflow completed after committee did not recommend promotion.',
      description: 'Final close-out for a not recommended application.',
      variant: 'warning',
      confirm: 'Close this not recommended application as completed?',
    });
  }

  return actions;
}

function actionClass(variant: WorkflowAction['variant']) {
  if (variant === 'success') return 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100';
  if (variant === 'warning') return 'border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100';
  if (variant === 'slate') return 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50';
  return 'border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100';
}