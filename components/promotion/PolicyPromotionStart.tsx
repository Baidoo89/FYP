'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowRight, CheckCircle2, Clock3, RefreshCw, ShieldCheck } from 'lucide-react';
import { useToast } from '../Toast';
import StartPromotionRequestCard from './StartPromotionRequestCard';

type CreatedRequest = {
  id: number;
  currentRank: string;
  targetRank: string;
  status: string;
};

type PolicyRoute = {
  id: number;
  code: string;
  name: string;
  status: string;
  evidenceState: string;
  finalAuthority: string | null;
  sourceClause: string | null;
  completedYearsInRank: number;
  minimumYearsInRank: number | null;
  timeRequirementMet: boolean;
  retirementRequirementMet: boolean;
  canStart: boolean;
  warnings: string[];
  currentRank: { code: string; name: string };
  targetRank: { code: string; name: string };
  policy: {
    trackCode: string;
    trackName: string;
    version: string;
    sourceCode: string;
    sourceTitle: string;
  };
};

type RouteData = {
  mode: 'V2';
  verificationState: string;
  message: string | null;
  staff: {
    staffNumber: string;
    category: string;
    employmentStatus: string;
    retirementDate?: string | null;
    currentRank?: { code: string; name: string };
    rankStartedAt?: string;
    primaryAssignment?: { id: number; code: string; name: string; type: string; startedAt: string } | null;
  } | null;
  routes: PolicyRoute[];
};

type Props = {
  currentRank?: string | null;
  onCreated?: (request: CreatedRequest) => void | Promise<void>;
};

function label(value?: string | null) {
  if (!value) return 'Not recorded';
  return value.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase());
}

export default function PolicyPromotionStart({ currentRank, onCreated }: Props) {
  const toast = useToast();
  const [data, setData] = useState<RouteData | null>(null);
  const [selectedCode, setSelectedCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [legacyFallback, setLegacyFallback] = useState(false);
  const [error, setError] = useState('');

  async function loadRoutes() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/lecturer/promotion-routes', { cache: 'no-store' });
      const payload = await response.json();

      if (response.status === 503 && payload.code === 'V2_FOUNDATION_NOT_READY') {
        setLegacyFallback(true);
        setData(null);
        return;
      }
      if (!response.ok || !payload.success) throw new Error(payload.error || 'Unable to load promotion routes.');

      const nextData = payload.data as RouteData;
      setLegacyFallback(false);
      setData(nextData);
      setSelectedCode((current) => {
        if (nextData.routes.some((route) => route.code === current)) return current;
        return nextData.routes.find((route) => route.canStart)?.code || nextData.routes[0]?.code || '';
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load promotion routes.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRoutes();
  }, []);

  const selectedRoute = useMemo(
    () => data?.routes.find((route) => route.code === selectedCode) || null,
    [data, selectedCode],
  );

  async function startApplication() {
    if (!selectedRoute?.canStart) return;
    setSaving(true);
    setError('');
    try {
      const response = await fetch('/api/promotion-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ routeCode: selectedRoute.code }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || 'Unable to start promotion application.');

      const message = `${selectedRoute.targetRank.name} application created from your verified staff record.`;
      toast.success('Application started', message);
      await onCreated?.(payload.data as CreatedRequest);
    } catch (startError) {
      const message = startError instanceof Error ? startError.message : 'Unable to start promotion application.';
      setError(message);
      toast.error('Application start failed', message);
    } finally {
      setSaving(false);
    }
  }

  if (legacyFallback) {
    return <StartPromotionRequestCard currentRank={currentRank} onCreated={onCreated} />;
  }

  if (loading) {
    return (
      <section className="pro-card flex min-h-48 items-center justify-center p-6" aria-live="polite">
        <RefreshCw className="mr-3 h-5 w-5 animate-spin text-brand-primary" aria-hidden="true" />
        <span className="text-sm font-semibold text-slate-700">Loading verified promotion routes...</span>
      </section>
    );
  }

  if (error && !data) {
    return (
      <section className="pro-card p-5 sm:p-6">
        <div className="flex items-start gap-3 text-amber-900">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <p className="text-sm font-semibold leading-6">{error}</p>
        </div>
        <button type="button" onClick={loadRoutes} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Retry
        </button>
      </section>
    );
  }

  if (!data || data.verificationState !== 'VERIFIED' || !data.staff?.currentRank) {
    return (
      <section className="pro-card p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-amber-800">HRODD verification pending</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-950">Promotion routes are not available yet</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">{data?.message || 'Your authoritative staff record requires verification.'}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="pro-card min-w-0 overflow-hidden">
      <div className="border-b border-slate-200 p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-brand-primary">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Verified Staff Route
            </div>
            <h2 className="mt-3 text-xl font-semibold text-slate-950 sm:text-2xl">Start Promotion Application</h2>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            HRODD verified
          </span>
        </div>

        <dl className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Fact label="Staff number" value={data.staff.staffNumber} />
          <Fact label="Current rank" value={data.staff.currentRank.name} />
          <Fact label="Staff category" value={label(data.staff.category)} />
          <Fact label="Primary unit" value={data.staff.primaryAssignment?.name || 'Not recorded'} />
        </dl>
      </div>

      <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.72fr)]">
        <div className="min-w-0">
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-slate-600">Available Policy Route</span>
            <select value={selectedCode} onChange={(event) => setSelectedCode(event.target.value)} className="brand-input" disabled={saving || data.routes.length === 0}>
              {data.routes.length === 0 ? (
                <option value="">No route configured</option>
              ) : (
                data.routes.map((route) => (
                  <option key={route.code} value={route.code}>
                    {route.currentRank.name} to {route.targetRank.name}{route.canStart ? '' : ' - unavailable'}
                  </option>
                ))
              )}
            </select>
          </label>

          {selectedRoute && (
            <div className="mt-5 border-t border-slate-200 pt-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">{selectedRoute.code}</span>
                <span className="rounded-md bg-brand-primarySoft px-2.5 py-1 text-xs font-bold text-brand-primary">{selectedRoute.policy.trackCode}</span>
                <span className="text-xs font-semibold text-slate-500">{selectedRoute.policy.version}</span>
              </div>
              <h3 className="mt-3 text-lg font-semibold text-slate-950">{selectedRoute.name}</h3>
              <dl className="mt-4 grid gap-3 sm:grid-cols-3">
                <Fact label="Completed years" value={selectedRoute.completedYearsInRank} />
                <Fact label="Minimum years" value={selectedRoute.minimumYearsInRank ?? 'Route specific'} />
                <Fact label="Final authority" value={label(selectedRoute.finalAuthority)} />
              </dl>
              {selectedRoute.warnings.length > 0 && (
                <div className={`mt-4 rounded-lg border p-3 text-sm leading-6 ${selectedRoute.canStart ? 'border-amber-200 bg-amber-50 text-amber-950' : 'border-rose-200 bg-rose-50 text-rose-900'}`}>
                  {selectedRoute.warnings.map((warning) => <p key={warning}>{warning}</p>)}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border-l-0 border-slate-200 lg:border-l lg:pl-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Clock3 className="h-4 w-4 text-brand-primary" aria-hidden="true" />
            Preliminary controls
          </div>
          <div className="mt-4 space-y-3">
            <ControlState label="Time in rank" passed={Boolean(selectedRoute?.timeRequirementMet)} />
            <ControlState label="Retirement cutoff" passed={Boolean(selectedRoute?.retirementRequirementMet)} />
            <ControlState label="Verified assignment" passed={Boolean(data.staff.primaryAssignment)} />
          </div>

          <button type="button" onClick={startApplication} disabled={saving || !selectedRoute?.canStart} className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-primaryDark disabled:cursor-not-allowed disabled:bg-slate-300">
            {saving ? 'Creating Application...' : 'Start Application'}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
          {error && <p role="alert" className="mt-3 text-sm font-semibold leading-6 text-rose-700">{error}</p>}
        </div>
      </div>
    </section>
  );
}

function Fact({ label: factLabel, value }: { label: string; value: string | number }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{factLabel}</dt>
      <dd className="mt-1 break-words text-sm font-semibold text-slate-950">{value}</dd>
    </div>
  );
}

function ControlState({ label: controlLabel, passed }: { label: string; passed: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 text-sm">
      <span className="font-medium text-slate-700">{controlLabel}</span>
      <span className={`font-bold ${passed ? 'text-emerald-700' : 'text-rose-700'}`}>{passed ? 'Passed' : 'Blocked'}</span>
    </div>
  );
}
