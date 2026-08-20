'use client';

import { ClipboardList } from 'lucide-react';
import { useRouter } from 'next/navigation';
import PolicyPromotionStart from '../../../components/promotion/PolicyPromotionStart';

export default function StartPromotionApplicationPage() {
  const router = useRouter();

  return (
    <div className="min-w-0 space-y-5">
      <header className="border-b border-slate-200 pb-5">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-brand-primary">
          <ClipboardList className="h-4 w-4" aria-hidden="true" />
          Applicant Case Builder
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-950 sm:text-3xl">Start Promotion Application</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Select an available route calculated from your HRODD-verified rank, service dates, staff category, and current policy version.</p>
      </header>

      <PolicyPromotionStart onCreated={() => router.push('/lecturer-portal/evidence')} />
    </div>
  );
}
