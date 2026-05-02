'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import LogoutButton from './LogoutButton';
import SidebarNavLink from './SidebarNavLink';

type AppShellProps = {
  children: ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAuthPage = pathname === '/login' || pathname.startsWith('/login/');

  if (isAuthPage) {
    return <div className="min-h-screen lpads-fade-in">{children}</div>;
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[linear-gradient(180deg,#eef4ff_0%,#f8fbff_100%)] lg:flex">
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-30 bg-slate-950/45 lg:hidden"
        />
      )}

      <nav
        className={[
          'fixed inset-y-0 left-0 z-40 w-72 transform overflow-y-auto border-r border-blue-950/60',
          'bg-gradient-to-b from-blue-950 via-blue-900 to-slate-950 text-white shadow-2xl transition-transform duration-300 lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <div className="border-b border-white/10 p-6">
          <div className="inline-flex rounded-full border border-amber-300/30 bg-amber-400/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-amber-200">
            Admin Console
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight">GCTU PS</h1>
          <p className="mt-1 text-sm text-blue-100/80">GCTU Promotion System</p>
        </div>

        <ul className="space-y-1 px-3 py-5">
          <SidebarNavLink href="/dashboard" icon="📊">
            Dashboard
          </SidebarNavLink>
          <SidebarNavLink href="/lecturers" icon="👥">
            Lecturers
          </SidebarNavLink>
          <SidebarNavLink href="/appraisals" icon="📋">
            Appraisals
          </SidebarNavLink>
          <SidebarNavLink href="/analytics" icon="📈">
            Analytics
          </SidebarNavLink>
          <SidebarNavLink href="/audit" icon="🧾">
            Audit Logs
          </SidebarNavLink>
          <SidebarNavLink href="/promotions" icon="🏆">
            Promotions
          </SidebarNavLink>
        </ul>

        <div className="mx-4 mt-5 rounded-2xl border border-amber-300/20 bg-gradient-to-br from-amber-400/15 to-blue-400/10 p-4 text-xs text-blue-50/90 shadow-lg">
          <p className="font-medium text-amber-100">Secure area</p>
          <p className="mt-1 leading-relaxed">Authenticated administrators only.</p>
        </div>

        <div className="mt-4 border-t border-white/10 p-4 text-xs text-blue-100/80">
          <p>© 2026 GCTU PS</p>
          <p>Final Year Project</p>
        </div>
      </nav>

      <div className="flex min-w-0 flex-1 flex-col lg:ml-72">
        <header className="fixed left-0 right-0 top-0 z-20 flex items-center justify-between border-b border-blue-800/30 bg-gradient-to-r from-blue-950 via-blue-900 to-amber-700 px-3 py-3 text-white shadow-[0_10px_30px_rgba(15,23,42,0.35)] backdrop-blur sm:px-4 md:px-8 lg:left-72 lg:py-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen((previous) => !previous)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-blue-200/40 bg-white/10 text-white hover:bg-white/20 lg:hidden"
              aria-label="Toggle navigation menu"
            >
              ☰
            </button>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-blue-100">Promotion Administration</p>
              <h2 className="hidden truncate bg-gradient-to-r from-white to-amber-200 bg-clip-text text-sm font-bold text-transparent sm:block md:text-base lg:text-lg">
                GCTU Promotion Analysis and Decision Support System
              </h2>
              <h2 className="truncate bg-gradient-to-r from-white to-amber-200 bg-clip-text text-sm font-bold text-transparent sm:hidden">
                GCTU Promotion Console
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden rounded-full border border-amber-200/70 bg-gradient-to-r from-amber-300 to-amber-200 px-3 py-1 text-sm font-semibold text-amber-950 shadow-sm sm:block">Admin Panel</div>
            <LogoutButton />
          </div>
        </header>

        <main className="min-w-0 flex-1 overflow-x-hidden px-3 pb-6 pt-24 lpads-fade-in sm:px-4 md:px-8 md:pt-28">{children}</main>

        <footer className="lpads-surface border-t border-white/60 px-4 py-4 text-center text-xs text-slate-600 md:px-8">
          <p>GCTU Promotion System v1.0 | University Promotion Management Platform</p>
        </footer>
      </div>
    </div>
  );
}
