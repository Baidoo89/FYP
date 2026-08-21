'use client';

import Link from 'next/link';
import { FileCheck2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import OfficialFormsWorkspace from '../../../components/promotion/OfficialFormsWorkspace';
import { ErrorState, LoadingState } from '../../../components/enterprise-ui';

type PromotionRequest = {
  id: number;
  currentRank: string;
  targetRank: string;
  status: string;
  receiptNumber?: string | null;
  promotionRoute?: { code: string; name: string } | null;
};

const closedStatuses = new Set(['REJECTED', 'COMPLETED']);

function requestLabel(request: PromotionRequest) {
  return `${request.receiptNumber || `PR-${String(request.id).padStart(5, '0')}`} � ${request.currentRank} to ${request.targetRank}`;
}

export default function OfficialFormsPage() {
  const [requests, setRequests] = useState<PromotionRequest[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        const response = await fetch('/api/promotion-requests?scope=lecturer', { cache: 'no-store' });
        const payload = await response.json();
        if (!response.ok || !payload.success) throw new Error(payload.error || 'Unable to load promotion applications.');
        const nextRequests = (payload.data || []) as PromotionRequest[];
        setRequests(nextRequests);
        const preferred = nextRequests.find((item) => !closedStatuses.has(item.status)) || nextRequests[0] || null;
        setSelectedId(preferred?.id || null);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load promotion applications.');
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const selected = useMemo(() => requests.find((request) => request.id === selectedId) || null, [requests, selectedId]);

  if (loading) return <LoadingState label="Loading official forms..." />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <header className="flex flex-col justify-between gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-end">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-brand-primary">
            <FileCheck2 className="h-5 w-5" aria-hidden="true" />
            <span className="text-xs font-bold uppercase">Application Record</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold text-gray-950">Official Promotion Forms</h1>
          <p className="mt-1 text-sm text-gray-600">Complete the GCTU form assigned to your verified promotion route.</p>
        </div>
        {requests.length > 1 ? (
          <label className="block w-full sm:max-w-md">
            <span className="text-xs font-bold text-gray-600">Promotion application</span>
            <select value={selectedId || ''} onChange={(event) => setSelectedId(Number(event.target.value))} className="brand-input mt-1 w-full">
              {requests.map((request) => <option key={request.id} value={request.id}>{requestLabel(request)}</option>)}
            </select>
          </label>
        ) : null}
      </header>

      {!selected ? (
        <div className="rounded-md border border-dashed border-gray-300 bg-white p-8 text-center">
          <FileCheck2 className="mx-auto h-8 w-8 text-brand-primary" aria-hidden="true" />
          <h2 className="mt-3 text-lg font-bold text-gray-950">No promotion application</h2>
          <Link href="/lecturer-portal/start-application" className="mt-4 inline-flex min-h-10 items-center rounded-md bg-brand-primary px-4 py-2 text-sm font-semibold text-white hover:bg-brand-primaryDark">
            Start application
          </Link>
        </div>
      ) : !selected.promotionRoute ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-5 text-sm font-semibold text-amber-900">
          Select a verified promotion route before completing an official form.
        </div>
      ) : (
        <OfficialFormsWorkspace requestId={selected.id} />
      )}
    </div>
  );
}
