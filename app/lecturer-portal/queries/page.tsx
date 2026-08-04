'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Query {
  documentId: number;
  requestId: number;
  title: string;
  fileUrl: string;
  category: string;
  verificationStatus: string;
  adminComment: string | null;
  flaggedAt: string;
}

interface QueriesData {
  queries: Query[];
  count: number;
}

export default function QueriesPage() {
  const [data, setData] = useState<QueriesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadQueries() {
      try {
        const response = await fetch('/api/lecturer/queries');
        const payload = await response.json();

        if (!response.ok || !payload.success) {
          throw new Error(payload.error || 'Failed to load queries');
        }

        setData(payload.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load query data');
      } finally {
        setLoading(false);
      }
    }

    loadQueries();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600 shadow-sm">
          Loading your inbox...
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center font-medium text-slate-900 shadow-sm">
          {error || 'Failed to load queries'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="pro-hero px-6 py-8">
        <div>
          <div className="pro-eyebrow">
            HR Feedback Inbox
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Review Queries</h1>
        </div>
      </section>
      <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <p className="font-semibold text-slate-900">Needs correction</p>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-900">{data.count}</span>
      </div>

      {/* Queries List */}
      {data.count === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
          <p className="font-semibold text-slate-950">No documents need correction.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.queries.map((query) => (
            <div key={query.documentId} className="rounded-2xl border-2 border-slate-200 bg-slate-50 p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-950">{query.title}</h3>
                  <div className="mt-2 flex items-center gap-3">
                    <span className="inline-block rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold text-slate-700">
                      {query.category}
                    </span>
                    <span className="text-sm text-slate-700">
                      Flagged {new Date(query.flaggedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="text-3xl"></div>
              </div>

              {/* HR Comment */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 my-4">
                <p className="text-sm font-semibold text-slate-900 mb-2">HR Comment</p>
                <p className="text-slate-700">{query.adminComment || 'No comment provided'}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/lecturer-portal/evidence?category=${encodeURIComponent(query.category)}&title=${encodeURIComponent(query.title)}`}
                  className="rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
                >
                  Replace Document
                </Link>
                <a
                  href={query.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  View Original
                </a>
              </div>
            </div>
          ))}
        </div>
      )}



      {/* Back Link */}
      <Link href="/lecturer-portal" className="inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
         Back to Dashboard
      </Link>
    </div>
  );
}
