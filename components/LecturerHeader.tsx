'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const BREADCRUMB_MAP: Record<string, { label: string; icon: string }> = {
  '/lecturer-portal': { label: 'Overview Dashboard', icon: '📊' },
  '/lecturer-portal/application': { label: 'Active Application', icon: '📋' },
  '/lecturer-portal/evidence': { label: 'Evidence Portfolio', icon: '📁' },
  '/lecturer-portal/queries': { label: 'HR Feedback', icon: '🔔' },
  '/lecturer-portal/profile': { label: 'Academic Profile', icon: '👤' },
};

export default function LecturerHeader() {
  const pathname = usePathname();
  const currentPage = BREADCRUMB_MAP[pathname] || { label: 'Dashboard', icon: '📊' };

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-sm">
        <Link
          href="/lecturer-portal"
          className="font-medium text-blue-100 hover:text-white transition flex items-center gap-1"
        >
          <span>🏠</span>
          <span>Dashboard</span>
        </Link>
        {pathname !== '/lecturer-portal' && (
          <>
            <span className="text-blue-400/60">/</span>
            <span className="font-semibold text-white flex items-center gap-1">
              <span>{currentPage.icon}</span>
              <span>{currentPage.label}</span>
            </span>
          </>
        )}
      </nav>

      {/* Page Title */}
      <div className="hidden sm:block">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-blue-200">Current Section</p>
        <p className="text-sm font-semibold text-white mt-0.5">{currentPage.label}</p>
      </div>
    </div>
  );
}
