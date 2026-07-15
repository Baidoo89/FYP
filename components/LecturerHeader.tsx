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
    <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
      <nav className="flex min-w-0 items-center gap-2 text-sm">
        <Link href="/lecturer-portal" className="inline-flex items-center gap-2 rounded-md text-slate-600 transition hover:text-teal-700">
          <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg border border-teal-100 bg-white p-0.5">
            <img src="/gctu-logo.jpg" alt="GCTU logo" className="h-full w-full object-contain" />
          </span>
          <span className="hidden font-semibold sm:inline">GCTU Promotion System</span>
          <span className="font-semibold sm:hidden">Portal</span>
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

      <div className="hidden shrink-0 items-center gap-3 md:flex">
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-700 shadow-sm">
          AM
        </span>
        <div className="text-right">
          <p className="text-sm font-semibold leading-tight text-slate-950">Lecturer Portal</p>
          <p className="text-xs text-slate-500">{currentPage.label}</p>
        </div>
      </div>
    </div>
  );
}
