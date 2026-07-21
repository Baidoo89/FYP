'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const BREADCRUMB_MAP: Record<string, { label: string; code: string }> = {
  '/lecturer-portal': { label: 'Dashboard', code: 'DB' },
  '/lecturer-portal/application': { label: 'Promotion Requests', code: 'PR' },
  '/lecturer-portal/applications': { label: 'My Applications', code: 'AP' },
  '/lecturer-portal/evidence': { label: 'Evidence Portfolio', code: 'EV' },
  '/lecturer-portal/eligibility': { label: 'Eligibility Status', code: 'EL' },
  '/lecturer-portal/queries': { label: 'Feedback & Remarks', code: 'FB' },
  '/lecturer-portal/notifications': { label: 'Notifications', code: 'NT' },
  '/lecturer-portal/profile': { label: 'Profile', code: 'PF' },
  '/lecturer-portal/help': { label: 'Help Center', code: 'HC' },
  '/lecturer-portal/settings': { label: 'Settings', code: 'SE' },
};

export default function LecturerHeader() {
  const pathname = usePathname();
  const currentPage = BREADCRUMB_MAP[pathname] || { label: 'Lecturer Workspace', code: 'LP' };

  return (
    <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
      <nav className="flex min-w-0 items-center gap-2 text-sm" aria-label="Lecturer portal breadcrumb">
        <Link href="/lecturer-portal" className="inline-flex items-center gap-2 rounded-md text-slate-600 outline-none transition hover:text-brand-primary focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2">
          <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg border border-brand-primary/20 bg-white p-0.5 shadow-sm">
            <img src="/gctu-logo.jpg" alt="GCTU logo" className="h-full w-full object-contain" />
          </span>
          <span className="hidden font-semibold sm:inline">GCTU Promotion System</span>
          <span className="font-semibold sm:hidden">GCTU</span>
        </Link>

        {pathname !== '/lecturer-portal' && (
          <>
            <span className="text-slate-300">/</span>
            <span className="inline-flex min-w-0 items-center gap-2 font-semibold text-slate-950">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand-primarySoft text-[10px] font-bold text-brand-primary">
                {currentPage.code}
              </span>
              <span className="truncate">{currentPage.label}</span>
            </span>
          </>
        )}
      </nav>

      <div className="hidden shrink-0 items-center gap-3 md:flex">
        <div className="text-right">
          <p className="text-sm font-semibold leading-tight text-slate-950">Lecturer Portal</p>
          <p className="text-xs text-slate-500">{currentPage.label}</p>
        </div>
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-brand-primary/25 bg-brand-primarySoft text-xs font-black text-brand-primary shadow-sm">
          {currentPage.code}
        </span>
      </div>
    </div>
  );
}
