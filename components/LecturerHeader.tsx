'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const BREADCRUMB_MAP: Record<string, { label: string; code: string }> = {
  '/lecturer-portal': { label: 'Overview', code: 'OV' },
  '/lecturer-portal/application': { label: 'Application', code: 'AP' },
  '/lecturer-portal/evidence': { label: 'Evidence', code: 'EV' },
  '/lecturer-portal/queries': { label: 'Feedback', code: 'FB' },
  '/lecturer-portal/profile': { label: 'Profile', code: 'PF' },
};

export default function LecturerHeader() {
  const pathname = usePathname();
  const currentPage = BREADCRUMB_MAP[pathname] || { label: 'Overview', code: 'OV' };

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <nav className="flex min-w-0 items-center gap-2 text-sm">
        <Link
          href="/lecturer-portal"
          className="inline-flex items-center gap-2 rounded-md text-slate-600 transition hover:text-teal-700"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-teal-50 text-[10px] font-bold text-teal-700">
            LP
          </span>
          <span className="font-medium">Lecturer Portal</span>
        </Link>
        {pathname !== '/lecturer-portal' && (
          <>
            <span className="text-slate-300">/</span>
            <span className="inline-flex min-w-0 items-center gap-2 font-semibold text-slate-950">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-100 text-[10px] font-bold text-slate-700">
                {currentPage.code}
              </span>
              <span className="truncate">{currentPage.label}</span>
            </span>
          </>
        )}
      </nav>

      <div className="hidden shrink-0 text-right sm:block">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-teal-700">Current section</p>
        <p className="mt-0.5 text-sm font-semibold text-slate-800">{currentPage.label}</p>
      </div>
    </div>
  );
}