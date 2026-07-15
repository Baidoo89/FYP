'use client';

import { useEffect, useState } from 'react';

type NotificationItem = {
  id: number;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  isRead: boolean;
  createdAt: string;
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadNotifications() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/notifications');
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Unable to load notifications');
      }
      setNotifications(payload.data || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load notifications');
    } finally {
      setLoading(false);
    }
  }

  async function markRead(notificationId?: number) {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notificationId ? { notificationId } : { markAllRead: true }),
    });
    await loadNotifications();
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  return (
    <section className="mx-auto max-w-5xl">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">Notification Centre</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">System Notifications</h1>
          <p className="mt-2 text-sm text-slate-600">
            Review account, workflow, evidence verification, eligibility, and status-change updates.
          </p>
        </div>
        <button
          type="button"
          onClick={() => markRead()}
          disabled={unreadCount === 0}
          className="rounded bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:bg-slate-400"
        >
          Mark all read
        </button>
      </div>

      {error && <div className="mt-6 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}
      {loading && <div className="mt-6 rounded border border-slate-200 bg-white p-6 text-sm text-slate-600">Loading notifications...</div>}

      {!loading && notifications.length === 0 && (
        <div className="mt-6 rounded border border-slate-200 bg-white p-6 text-sm text-slate-600">
          No notifications yet.
        </div>
      )}

      <div className="mt-6 space-y-3">
        {notifications.map((notification) => (
          <article
            key={notification.id}
            className={`rounded-lg border bg-white p-4 shadow-sm ${
              notification.isRead ? 'border-slate-200' : 'border-slate-200 ring-1 ring-blue-100'
            }`}
          >
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold text-slate-950">{notification.title}</h2>
                  {!notification.isRead && (
                    <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-semibold text-slate-700">New</span>
                  )}
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                    {notification.type.toLowerCase()}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-700">{notification.message}</p>
                <p className="mt-2 text-xs text-slate-500">{new Date(notification.createdAt).toLocaleString()}</p>
              </div>
              {!notification.isRead && (
                <button
                  type="button"
                  onClick={() => markRead(notification.id)}
                  className="rounded border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Mark read
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
