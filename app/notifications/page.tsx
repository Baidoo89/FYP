'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import { EmptyState, ErrorState, LoadingState } from '../../components/enterprise-ui';
import StatusBadge from '../../components/promotion/StatusBadge';
import { useToast } from '../../components/Toast';

type NotificationType = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
type ReadState = 'all' | 'unread' | 'read';
type ViewerRole = 'STAFF' | 'LECTURER' | 'HOD_DEAN' | 'HR_ADMIN' | 'COMMITTEE_REVIEWER' | 'SYSTEM_ADMIN';

type PromotionContext = {
  id: number;
  status: string;
  eligibilityStatus: string;
  currentRank: string;
  targetRank: string;
  lecturer?: {
    name?: string | null;
    department?: string | null;
  } | null;
} | null;

type NotificationItem = {
  id: number;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
  promotionRequestId?: number | null;
  promotionRequest?: PromotionContext;
};

type NotificationSummary = {
  total: number;
  unread: number;
  read: number;
  filtered: number;
  typeCounts: Record<NotificationType, number>;
};

type NotificationsPayload = {
  notifications: NotificationItem[];
  summary: NotificationSummary;
  viewerRole: ViewerRole;
};

type NotificationsResponse = {
  success: boolean;
  data?: NotificationsPayload;
  error?: string;
};

type NotificationGroup = {
  label: 'Today' | 'Yesterday' | 'Earlier';
  items: NotificationItem[];
};

const typeOptions: Array<'ALL' | NotificationType> = ['ALL', 'INFO', 'SUCCESS', 'WARNING', 'ERROR'];

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not recorded';
  return new Intl.DateTimeFormat('en-GH', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function relativeTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not recorded';

  const diffSeconds = Math.round((date.getTime() - Date.now()) / 1000);
  const absSeconds = Math.abs(diffSeconds);
  const formatter = new Intl.RelativeTimeFormat('en-GH', { numeric: 'auto' });

  if (absSeconds < 60) return formatter.format(diffSeconds, 'second');
  if (absSeconds < 3600) return formatter.format(Math.round(diffSeconds / 60), 'minute');
  if (absSeconds < 86400) return formatter.format(Math.round(diffSeconds / 3600), 'hour');
  if (absSeconds < 604800) return formatter.format(Math.round(diffSeconds / 86400), 'day');
  return formatDate(value);
}

function sameCalendarDate(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate();
}

function notificationGroupLabel(value: string): NotificationGroup['label'] {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Earlier';

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (sameCalendarDate(date, today)) return 'Today';
  if (sameCalendarDate(date, yesterday)) return 'Yesterday';
  return 'Earlier';
}

function groupNotifications(notifications: NotificationItem[]): NotificationGroup[] {
  const groups: NotificationGroup[] = [
    { label: 'Today', items: [] },
    { label: 'Yesterday', items: [] },
    { label: 'Earlier', items: [] },
  ];

  notifications.forEach((notification) => {
    const group = groups.find((item) => item.label === notificationGroupLabel(notification.createdAt));
    group?.items.push(notification);
  });

  return groups.filter((group) => group.items.length > 0);
}

function typeTone(type: NotificationType) {
  if (type === 'SUCCESS') return 'border-teal-200 bg-teal-50 text-teal-800';
  if (type === 'WARNING') return 'border-amber-200 bg-amber-50 text-amber-900';
  if (type === 'ERROR') return 'border-rose-200 bg-rose-50 text-rose-800';
  return 'border-teal-200 bg-teal-50 text-teal-800';
}

function typeLabel(type: string) {
  return type.toLowerCase().replace(/\b\w/g, (match) => match.toUpperCase());
}

function notificationTypeIcon(type: NotificationType) {
  if (type === 'SUCCESS') return <CheckCircle2 className="h-4 w-4" aria-hidden="true" />;
  if (type === 'WARNING') return <AlertTriangle className="h-4 w-4" aria-hidden="true" />;
  if (type === 'ERROR') return <XCircle className="h-4 w-4" aria-hidden="true" />;
  return <Info className="h-4 w-4" aria-hidden="true" />;
}

function applicationHref(notification: NotificationItem, viewerRole: ViewerRole) {
  if (!notification.promotionRequestId) return null;

  if (viewerRole === 'STAFF' || viewerRole === 'LECTURER') return '/lecturer-portal/application';
  if (viewerRole === 'HOD_DEAN') return `/hod/review-queue?request=${notification.promotionRequestId}`;
  if (viewerRole === 'COMMITTEE_REVIEWER') return `/committee/review?request=${notification.promotionRequestId}`;
  return `/hr/requests?request=${notification.promotionRequestId}`;
}

function rankPath(request: PromotionContext) {
  if (!request) return '';
  return `${request.currentRank.replace(/_/g, ' ')} to ${request.targetRank.replace(/_/g, ' ')}`;
}

export default function NotificationsPage() {
  const toast = useToast();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [viewerRole, setViewerRole] = useState<ViewerRole>('LECTURER');
  const [summary, setSummary] = useState<NotificationSummary>({ total: 0, unread: 0, read: 0, filtered: 0, typeCounts: { INFO: 0, SUCCESS: 0, WARNING: 0, ERROR: 0 } });
  const [readState, setReadState] = useState<ReadState>('all');
  const [typeFilter, setTypeFilter] = useState<'ALL' | NotificationType>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | 'all' | null>(null);
  const [error, setError] = useState('');

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set('readState', readState);
    params.set('take', '100');
    if (typeFilter !== 'ALL') params.set('type', typeFilter);
    if (searchTerm.trim()) params.set('q', searchTerm.trim());
    return params.toString();
  }, [readState, typeFilter, searchTerm]);

  async function loadNotifications() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/notifications?${queryString}`, { cache: 'no-store' });
      const payload = (await response.json()) as NotificationsResponse;
      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.error || 'Unable to load notifications');
      }
      setNotifications(payload.data.notifications || []);
      setViewerRole(payload.data.viewerRole || 'LECTURER');
      setSummary(payload.data.summary);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load notifications');
    } finally {
      setLoading(false);
    }
  }

  async function updateReadState(notificationId: number | undefined, isRead = true) {
    setUpdatingId(notificationId || 'all');
    setError('');
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notificationId ? { notificationId, isRead } : { markAllRead: true }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Unable to update notification');
      }
      await loadNotifications();
      toast.success(notificationId ? (isRead ? 'Notification marked read' : 'Notification marked unread') : 'Notifications updated', notificationId ? 'The notification status has been updated.' : 'All notifications have been marked as read.');
    } catch (updateError) {
      const message = updateError instanceof Error ? updateError.message : 'Unable to update notification';
      setError(message);
      toast.error('Notification update failed', message);
    } finally {
      setUpdatingId(null);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, [queryString]);

  const actionItems = notifications.filter((notification) => !notification.isRead || notification.type === 'WARNING' || notification.type === 'ERROR').length;
  const notificationGroups = useMemo(() => groupNotifications(notifications), [notifications]);
  const hasActiveFilters = readState !== 'all' || typeFilter !== 'ALL' || searchTerm.trim().length > 0;

  const clearFilters = () => {
    setReadState('all');
    setTypeFilter('ALL');
    setSearchTerm('');
  };

  return (
    <section className="space-y-6">
      <div className="pro-hero px-6 py-8">
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="pro-eyebrow">Notification Centre</div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">System Notifications</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-600">
              Track workflow actions, evidence decisions, eligibility updates, account verification, and administrative messages in one professional inbox.
            </p>
          </div>
          <button
            type="button"
            onClick={() => updateReadState(undefined)}
            disabled={summary.unread === 0 || Boolean(updatingId)}
            className="w-fit rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-800 disabled:bg-gray-400"
          >
            {updatingId === 'all' ? 'Updating...' : 'Mark all read'}
          </button>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <InboxMetric code="ALL" label="Total" value={summary.total} detail="All notifications" />
        <InboxMetric code="NEW" label="Unread" value={summary.unread} detail="Needs attention" tone="amber" />
        <InboxMetric code="ACT" label="Action Items" value={actionItems} detail="Warnings, errors, unread" tone="rose" />
        <InboxMetric code="OK" label="Success" value={summary.typeCounts.SUCCESS || 0} detail="Positive workflow updates" />
      </section>

      <section className="pro-card p-4 sm:p-5">
        <div className="grid gap-3 xl:grid-cols-[1fr_auto_auto_auto] xl:items-end">
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Search</span>
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search title or message"
              className="brand-input"
            />
          </label>
          <div>
            <span className="mb-1 block text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Read State</span>
            <div className="grid grid-cols-3 gap-2 rounded-lg border border-gray-200 bg-gray-50 p-1 text-xs font-bold">
              {(['all', 'unread', 'read'] as ReadState[]).map((state) => (
                <button
                  key={state}
                  type="button"
                  onClick={() => setReadState(state)}
                  className={`rounded-md px-3 py-2 capitalize ${readState === state ? 'bg-white text-teal-800 shadow-sm' : 'text-gray-600 hover:text-gray-950'}`}
                >
                  {state}
                </button>
              ))}
            </div>
          </div>
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Type</span>
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as 'ALL' | NotificationType)} className="brand-input min-w-44">
              {typeOptions.map((type) => (
                <option key={type} value={type}>{type === 'ALL' ? 'All types' : typeLabel(type)}</option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={clearFilters}
            disabled={!hasActiveFilters}
            className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
          >
            Clear filters
          </button>
        </div>
      </section>

      {error && <ErrorState message={error} />}
      {loading && <LoadingState label="Loading notifications..." />}

      {!loading && notifications.length === 0 && (
        <EmptyState
          title="No notifications found"
          description="Adjust the filters or wait for workflow activity to generate system notifications."
          action={hasActiveFilters ? (
            <button type="button" onClick={clearFilters} className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800">
              Clear filters
            </button>
          ) : undefined}
        />
      )}

      {!loading && notifications.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-gray-700">Showing {summary.filtered} notification(s)</p>
            <div className="hidden flex-wrap gap-2 sm:flex">
              {typeOptions.filter((type) => type !== 'ALL').map((type) => (
                <span key={type} className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${typeTone(type as NotificationType)}`}>
                  {typeLabel(type)} {summary.typeCounts[type as NotificationType] || 0}
                </span>
              ))}
            </div>
          </div>

          {notificationGroups.map((group) => (
            <div key={group.label} className="space-y-3">
              <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-4 py-2 shadow-sm">
                <h2 className="text-sm font-bold text-gray-950">{group.label}</h2>
                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-600">{group.items.length}</span>
              </div>
              {group.items.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  viewerRole={viewerRole}
                  updatingId={updatingId}
                  onToggleRead={(notificationId, nextReadState) => updateReadState(notificationId, nextReadState)}
                />
              ))}
            </div>
          ))}
        </section>
      )}
    </section>
  );
}

function NotificationCard({
  notification,
  viewerRole,
  updatingId,
  onToggleRead,
}: {
  notification: NotificationItem;
  viewerRole: ViewerRole;
  updatingId: number | 'all' | null;
  onToggleRead: (notificationId: number, isRead: boolean) => void;
}) {
  const href = applicationHref(notification, viewerRole);

  return (
    <article className={`pro-card overflow-hidden transition ${notification.isRead ? '' : 'border-teal-200 bg-teal-50/30 ring-2 ring-teal-100'}`}>
      <div className="grid gap-0 lg:grid-cols-[1fr_17rem]">
        <div className="p-5">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div className="flex min-w-0 gap-3">
              <span className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${typeTone(notification.type)}`}>
                {notificationTypeIcon(notification.type)}
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${typeTone(notification.type)}`}>{typeLabel(notification.type)}</span>
                  {!notification.isRead && <span className="rounded-full bg-teal-700 px-2.5 py-1 text-xs font-bold text-white">New</span>}
                  <span className="text-xs font-semibold text-gray-500">{relativeTime(notification.createdAt)}</span>
                  <span className="text-xs text-gray-400">{formatDate(notification.createdAt)}</span>
                </div>
                <h2 className="mt-3 break-words text-lg font-bold text-gray-950">{notification.title}</h2>
                <p className="mt-2 break-words text-sm leading-6 text-gray-700">{notification.message}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onToggleRead(notification.id, !notification.isRead)}
              disabled={updatingId === notification.id}
              className="w-fit shrink-0 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
            >
              {updatingId === notification.id ? 'Updating...' : notification.isRead ? 'Mark unread' : 'Mark read'}
            </button>
          </div>
        </div>

        <aside className="border-t border-gray-200 bg-gray-50 p-5 lg:border-l lg:border-t-0">
          {notification.promotionRequest ? (
            <div className="space-y-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Application Context</p>
                <p className="mt-1 font-semibold text-gray-950">PR-{String(notification.promotionRequest.id).padStart(5, '0')}</p>
                <p className="mt-1 text-xs leading-5 text-gray-600">{notification.promotionRequest.lecturer?.name || 'Promotion applicant'} | {notification.promotionRequest.lecturer?.department || 'Department not set'}</p>
                <p className="mt-1 text-xs leading-5 text-gray-600">{rankPath(notification.promotionRequest)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={notification.promotionRequest.status} />
                <StatusBadge status={notification.promotionRequest.eligibilityStatus} />
              </div>
              {href && (
                <Link href={href} className="inline-flex rounded-lg bg-white px-3 py-2 text-xs font-semibold text-teal-700 shadow-sm transition hover:bg-teal-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700">
                  Open Application
                </Link>
              )}
            </div>
          ) : (
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">System Message</p>
              <p className="mt-2 text-sm leading-6 text-gray-600">This notification is not attached to a promotion application.</p>
            </div>
          )}
        </aside>
      </div>
    </article>
  );
}

function InboxMetric({ code, label, value, detail, tone = 'teal' }: { code: string; label: string; value: number; detail: string; tone?: 'teal' | 'amber' | 'rose' }) {
  const toneClass = tone === 'amber'
    ? 'border-amber-200 bg-amber-50 text-amber-900'
    : tone === 'rose'
      ? 'border-rose-200 bg-rose-50 text-rose-800'
      : 'border-teal-200 bg-teal-50 text-teal-800';

  return (
    <div className="pro-tile p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-gray-950">{value}</p>
          <p className="mt-1 text-xs text-gray-500">{detail}</p>
        </div>
        <span className={`flex h-10 w-10 items-center justify-center rounded-lg border text-xs font-black ${toneClass}`}>{code}</span>
      </div>
    </div>
  );
}