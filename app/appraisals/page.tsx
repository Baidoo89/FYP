'use client';

import { useState } from 'react';
import AddAppraisalForm from '../../components/AddAppraisalForm';
import AppraisalList from '../../components/AppraisalList';

export default function AppraisalsPage() {
  const [refreshToken, setRefreshToken] = useState(0);

  return (
    <div className="space-y-6">
      <div className="brand-hero px-6 py-7 lg:px-8 lg:py-8">
        <h1 className="text-3xl font-bold">Promotion Decision Workspace</h1>
        <p className="mt-2 max-w-3xl text-sm text-blue-100/95">
          Use weighted evidence to guide promotion decisions, identify development priorities, and maintain transparent performance governance.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
          <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1">Teaching 50%</span>
          <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1">Research 30%</span>
          <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1">Service 20%</span>
          <span className="rounded-full border border-amber-200/40 bg-amber-300/20 px-3 py-1 text-amber-100">Promotion Threshold: 80+</span>
        </div>
        <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.14em]">
          <span className="rounded-full border border-blue-200/40 bg-blue-300/20 px-3 py-1 text-blue-50">Step 1: Capture Assessment</span>
          <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-blue-100">Step 2: Review Decision Records</span>
        </div>
      </div>

      <section className="brand-surface-medium p-4 sm:p-5">
        <div className="mb-4 px-1">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-900">Step 1: Capture Assessment</h2>
          <p className="mt-1 text-xs text-slate-600">Submit structured appraisal inputs and decision context.</p>
        </div>
        <div className="mx-auto max-w-6xl">
          <AddAppraisalForm onSuccess={() => setRefreshToken((value) => value + 1)} />
        </div>
      </section>

      <section className="brand-surface-soft p-4 sm:p-5">
        <div className="mb-4 px-1">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-900">Step 2: Decision Records</h2>
          <p className="mt-1 text-xs text-slate-600">Review filters, recommendation bands, and outcome trends.</p>
        </div>
        <AppraisalList refreshToken={refreshToken} />
      </section>
    </div>
  );
}
