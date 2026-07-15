'use client';

import { useState } from 'react';
import AddAppraisalForm from '../../components/AddAppraisalForm';
import AppraisalList from '../../components/AppraisalList';

export default function AppraisalsPage() {
  const [refreshToken, setRefreshToken] = useState(0);

  return (
    <div className="space-y-6">
      <div className="pro-hero px-6 py-7 lg:px-8 lg:py-8">
        <h1 className="text-3xl font-bold">Promotion Decision Workspace</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Use weighted evidence to guide promotion decisions, identify development priorities, and maintain transparent performance governance.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-700">Teaching 50%</span>
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-700">Research 30%</span>
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-700">Service 20%</span>
          <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-800">Promotion Threshold: 80+</span>
        </div>
        <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.14em]">
          <span className="rounded-full border border-slate-200/40 bg-teal-100 px-3 py-1 text-slate-600">Step 1: Capture Assessment</span>
          <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-800">Step 2: Review Decision Records</span>
        </div>
      </div>

      <section className="pro-tile p-4 sm:p-5">
        <div className="mb-4 px-1">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-900">Step 1: Capture Assessment</h2>
          <p className="mt-1 text-xs text-slate-700">Submit structured appraisal inputs and decision context.</p>
        </div>
        <div className="mx-auto max-w-6xl">
          <AddAppraisalForm onSuccess={() => setRefreshToken((value) => value + 1)} />
        </div>
      </section>

      <section className="pro-card p-4 sm:p-5">
        <div className="mb-4 px-1">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-900">Step 2: Decision Records</h2>
          <p className="mt-1 text-xs text-slate-700">Review filters, recommendation bands, and outcome trends.</p>
        </div>
        <AppraisalList refreshToken={refreshToken} />
      </section>
    </div>
  );
}
