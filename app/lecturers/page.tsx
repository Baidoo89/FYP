'use client';

import { useState } from 'react';
import AddLecturerForm from '../../components/AddLecturerForm';
import LecturerList from '../../components/LecturerList';

export default function LecturersPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleFormSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      <div className="brand-hero px-6 py-7 lg:px-8 lg:py-8">
        <h1 className="mb-2 text-3xl font-bold">Lecturer Management</h1>
        <p className="max-w-3xl text-sm text-blue-100/95 sm:text-base">
          Manage lecturer profiles and maintain high-quality data for analytics, appraisals, and decision workflows.
        </p>
        <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.14em]">
          <span className="rounded-full border border-blue-200/40 bg-blue-300/20 px-3 py-1 text-blue-50">Step 1: Add Lecturer</span>
          <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-blue-100">Step 2: Review Directory Records</span>
        </div>
      </div>

      <section className="brand-surface-medium p-4 sm:p-5">
        <div className="mb-4 px-1">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-900">Step 1: Add Lecturer</h2>
          <p className="mt-1 text-xs text-slate-600">Create and maintain complete lecturer records.</p>
        </div>
        <div className="mx-auto max-w-5xl">
          <AddLecturerForm onSuccess={handleFormSuccess} />
        </div>
      </section>

      <section className="brand-surface-soft p-4 sm:p-5">
        <div className="mb-4 px-1">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-900">Step 2: Directory Records</h2>
          <p className="mt-1 text-xs text-slate-600">Search and filter lecturers for operations and reporting.</p>
        </div>
        <LecturerList refreshTrigger={refreshTrigger} />
      </section>
    </div>
  );
}
