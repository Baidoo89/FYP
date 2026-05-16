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
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-8 text-center font-medium text-blue-900 shadow-sm">
          {error || 'Failed to load queries'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[1.75rem] border border-blue-100 bg-gradient-to-br from-blue-950 via-blue-900 to-slate-950 px-6 py-8 text-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
        <div>
          <div className="inline-flex rounded-full border border-yellow-300/25 bg-yellow-400/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-yellow-100">
            HR Feedback Inbox
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Review Queries</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-blue-100/90">
            Documents flagged by HR for revision. Read feedback carefully and re-upload corrected versions.
          </p>
        </div>
      </section>

      {/* Inbox Badge */}
      <div className="flex items-center justify-between rounded-2xl border border-blue-100 bg-blue-50 p-6">
        <div>
          <p className="text-sm font-semibold text-blue-900">Attention Required</p>
          <p className="mt-1 text-lg font-bold text-blue-900">{data.count} flagged document(s)</p>
        </div>
        <div className="text-5xl">🔔</div>
      </div>

      {/* Queries List */}
      {data.count === 0 ? (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-8 text-center">
          <div className="text-5xl mb-4">✓</div>
          <p className="font-semibold text-blue-950">All Clear!</p>
          <p className="mt-2 text-sm text-blue-900">No flagged documents. Great job on your submissions!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.queries.map((query) => (
            <div key={query.documentId} className="rounded-2xl border-2 border-blue-200 bg-blue-50 p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-blue-950">{query.title}</h3>
                  <div className="mt-2 flex items-center gap-3">
                    <span className="inline-block rounded-full border border-blue-300 bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                      {query.category}
                    </span>
                    <span className="text-sm text-blue-800">
                      Flagged {new Date(query.flaggedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="text-3xl">⚠️</div>
              </div>

              {/* HR Comment */}
              <div className="rounded-xl border border-blue-200 bg-white p-4 my-4">
                <p className="text-sm font-semibold text-slate-900 mb-2">HR Admin Comment:</p>
                <p className="text-slate-700">{query.adminComment || 'No comment provided'}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/lecturer-portal/evidence?category=${encodeURIComponent(query.category)}&title=${encodeURIComponent(query.title)}`}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Re-upload File
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

      {/* Instructions */}
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
        <h3 className="font-semibold text-blue-900">How to Fix Flagged Documents</h3>
        <ol className="mt-3 space-y-2 text-sm text-blue-800">
          <li className="flex gap-3">
            <span className="font-bold">1.</span>
            <span>Read the HR comment carefully to understand why the document was rejected.</span>
          </li>
          <li className="flex gap-3">
            <span className="font-bold">2.</span>
            <span>Make the necessary corrections or improvements to your document.</span>
          </li>
          <li className="flex gap-3">
            <span className="font-bold">3.</span>
            <span>Click "Re-upload File" and select your corrected document.</span>
          </li>
          <li className="flex gap-3">
            <span className="font-bold">4.</span>
            <span>HR will review again and update the status once processed.</span>
          </li>
        </ol>
      </div>

      {/* Back Link */}
      <Link href="/lecturer-portal" className="inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
        ← Back to Dashboard
      </Link>
    </div>
  );
}
