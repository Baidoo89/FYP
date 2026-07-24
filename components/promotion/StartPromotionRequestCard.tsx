'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BriefcaseBusiness, GraduationCap } from 'lucide-react';
import { formatAcademicRank, getPromotionTargetOptions } from '../../lib/promotion-ranks';
import { useToast } from '../Toast';

type CreatedRequest = {
  id: number;
  currentRank: string;
  targetRank: string;
  status: string;
};

type Props = {
  currentRank?: string | null;
  onCreated?: (request: CreatedRequest) => void | Promise<void>;
  compact?: boolean;
};

export default function StartPromotionRequestCard({ currentRank, onCreated, compact = false }: Props) {
  const toast = useToast();
  const targetOptions = useMemo(() => getPromotionTargetOptions(currentRank), [currentRank]);
  const [targetRank, setTargetRank] = useState(targetOptions[0]?.value || '');
  const [yearsInCurrentRank, setYearsInCurrentRank] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setTargetRank(targetOptions[0]?.value || '');
  }, [targetOptions]);

  async function startApplication() {
    setMessage('');

    if (!currentRank) {
      const warning = 'Complete your staff profile before starting a promotion application.';
      setMessage(warning);
      toast.warning('Profile required', warning);
      return;
    }

    if (!targetRank) {
      const warning = 'No approved target rank is available for your current rank. Contact HR for guidance.';
      setMessage(warning);
      toast.warning('Target rank unavailable', warning);
      return;
    }

    setSaving(true);

    try {
      const response = await fetch('/api/promotion-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetRank,
          yearsInCurrentRank: yearsInCurrentRank === '' ? 0 : Number(yearsInCurrentRank),
        }),
      });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Unable to start promotion application');
      }

      const success = `Application started for ${formatAcademicRank(payload.data.targetRank)}. You can now upload evidence.`;
      setMessage(success);
      toast.success('Promotion application started', success);
      await onCreated?.(payload.data as CreatedRequest);
    } catch (error) {
      const failure = error instanceof Error ? error.message : 'Unable to start promotion application';
      setMessage(failure);
      toast.error('Application start failed', failure);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={`pro-card min-w-0 ${compact ? 'p-5' : 'p-5 sm:p-6'}`}>
      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(17rem,24rem)] lg:items-center">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-brand-primary">
            <BriefcaseBusiness className="h-4 w-4" aria-hidden="true" />
            Promotion Application
          </div>
          <h2 className="mt-3 break-words text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">Select the rank you are applying for</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Your staff profile stores your current rank. Each promotion application must separately record the target rank so eligibility, review, and final decisions are based on the correct promotion level.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
            <GraduationCap className="h-4 w-4 text-brand-primary" aria-hidden="true" />
            Current rank: {formatAcademicRank(currentRank)}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Promotion Applying For</span>
            <select
              value={targetRank}
              onChange={(event) => setTargetRank(event.target.value)}
              className="brand-input"
              disabled={targetOptions.length === 0 || saving}
            >
              {targetOptions.length === 0 ? (
                <option value="">No target rank available</option>
              ) : (
                targetOptions.map((rank) => (
                  <option key={rank.value} value={rank.value}>
                    {formatAcademicRank(currentRank)} to {rank.label}
                  </option>
                ))
              )}
            </select>
          </label>

          <label className="mt-3 block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Years In Current Rank</span>
            <input
              type="number"
              min={0}
              max={60}
              value={yearsInCurrentRank}
              onChange={(event) => setYearsInCurrentRank(event.target.value)}
              className="brand-input"
              placeholder="Example: 4"
              disabled={saving}
            />
          </label>

          <button
            type="button"
            onClick={startApplication}
            disabled={saving || targetOptions.length === 0}
            className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-brand-primaryDark disabled:cursor-not-allowed disabled:bg-slate-300 disabled:hover:translate-y-0"
          >
            {saving ? 'Starting Application...' : 'Start Promotion Application'}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>

          {message && (
            <p className={`mt-3 text-sm font-semibold ${message.includes('started') ? 'text-emerald-700' : 'text-amber-800'}`}>
              {message}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
