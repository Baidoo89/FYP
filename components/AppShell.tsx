'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import LogoutButton from './LogoutButton';
import SidebarNavLink from './SidebarNavLink';
import LecturerHeader from './LecturerHeader';

type AppShellProps = {
  children: ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAuthPage =
    pathname === '/login' ||
    pathname.startsWith('/login/') ||
    pathname === '/register' ||
    pathname.startsWith('/register/') ||
    pathname === '/onboarding' ||
    pathname.startsWith('/onboarding/');
  const isLecturerPortal = pathname.startsWith('/lecturer-portal');
  const isHrPortal = pathname.startsWith('/hr');
  const portalTitle = isLecturerPortal ? 'Lecturer Portal' : isHrPortal ? 'HR Admin Portal' : 'Admin Console';
  const portalSubtitle = isLecturerPortal
    ? 'Lecturer Promotion Workspace'
    : isHrPortal
      ? 'Verification & Audit Suite'
      : 'GCTU Promotion System';
  const navItems = isLecturerPortal
    ? [
        { href: '/lecturer-portal', icon: '📊', label: 'Overview Dashboard', subtitle: 'Career Progress' },
        { href: '/lecturer-portal/application', icon: '📋', label: 'Active Application', subtitle: 'Promotion Status' },
        { href: '/lecturer-portal/evidence', icon: '📁', label: 'Evidence Portfolio', subtitle: 'Document Management' },
        { href: '/lecturer-portal/queries', icon: '🔔', label: 'HR Feedback', subtitle: 'Flagged Items' },
        { href: '/lecturer-portal/profile', icon: '👤', label: 'Academic Profile', subtitle: 'Account Settings' },
      ]
    : isHrPortal
      ? [
          { href: '/hr/dashboard', icon: '📊', label: 'Command Center', subtitle: 'Dashboard & Stats' },
          { href: '/hr/requests', icon: '🗂️', label: 'Master Queue', subtitle: 'All Requests' },
          { href: '/hr/verify', icon: '🕵️', label: 'Verification Workspace', subtitle: 'Document Review' },
          { href: '/hr/logs', icon: '🧾', label: 'Audit Logs', subtitle: 'Activity Trail' },
        ]
      : [
          { href: '/dashboard', icon: '📊', label: 'Dashboard' },
          { href: '/lecturers', icon: '👥', label: 'Lecturers' },
          { href: '/appraisals', icon: '📋', label: 'Appraisals' },
          { href: '/analytics', icon: '📈', label: 'Analytics' },
          { href: '/audit', icon: '🧾', label: 'Audit Logs' },
          { href: '/promotions', icon: '🏆', label: 'Promotions' },
        ];

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (isAuthPage) {
    return <div className="min-h-screen lpads-fade-in">{children}</div>;
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[linear-gradient(180deg,#eef4ff_0%,#ffffff_58%,#fef8e7_100%)] lg:flex">
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
          isLecturerPortal
            ? 'bg-gradient-to-b from-blue-950 via-blue-900 to-blue-800 text-white shadow-2xl transition-transform duration-300 lg:translate-x-0'
            : 'bg-gradient-to-b from-blue-950 via-blue-900 to-yellow-700 text-white shadow-2xl transition-transform duration-300 lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <div className="border-b border-white/10 p-6">
          <div className="inline-flex rounded-full border border-yellow-300/35 bg-yellow-300/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-yellow-100">
            {portalTitle}
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight">GCTU Promotion System</h1>
          <p className="mt-1 text-sm text-blue-100/80">{portalSubtitle}</p>
          {isLecturerPortal && (
            <div className="mt-4 rounded-lg border border-yellow-300/25 bg-blue-500/10 px-3 py-2">
              <p className="text-xs font-semibold text-yellow-200">🎓 Academic Portal</p>
              <p className="mt-1 text-xs text-blue-100/70">Manage your promotion journey and career advancement</p>
            </div>
          )}
        </div>

        <ul className="space-y-1 px-3 py-5">
          {navItems.map((item) => (
            <SidebarNavLink key={item.href} href={item.href} icon={item.icon} subtitle={item.subtitle} onNavigate={() => setMobileOpen(false)}>
              {item.label}
            </SidebarNavLink>
          ))}
        </ul>

        <div className="mx-4 mt-5 rounded-2xl border border-yellow-300/20 bg-gradient-to-br from-yellow-300/15 to-blue-400/10 p-4 text-xs text-blue-50/90 shadow-lg">
          {isLecturerPortal ? (
            <>
              <p className="font-semibold text-yellow-100">📌 Quick Tips</p>
              <ul className="mt-2 space-y-1 text-blue-100/80">
                <li>• Keep evidence documents organized</li>
                <li>• Review HR feedback promptly</li>
                <li>• Track your promotion progress</li>
              </ul>
            </>
          ) : isHrPortal ? (
            <>
              <p className="font-medium text-amber-100">Secure area</p>
              <p className="mt-1">HR administrators only.</p>
            </>
          ) : (
            <>
              <p className="font-medium text-amber-100">Secure area</p>
              <p className="mt-1">Authenticated administrators only.</p>
            </>
          )}
        </div>

        <div className="mt-4 border-t border-white/10 p-4 text-xs text-blue-100/80">
          <p>© 2026 GCTU PS</p>
          <p>Final Year Project</p>
        </div>
      </nav>

      <div className="flex min-w-0 flex-1 flex-col lg:ml-72">
        <header className="fixed left-0 right-0 top-0 z-20 flex items-center justify-between border-b border-blue-800/30 bg-gradient-to-r from-blue-950 via-blue-900 to-amber-700 px-3 py-3 text-white shadow-[0_10px_30px_rgba(15,23,42,0.35)] backdrop-blur sm:px-4 md:px-8 lg:left-72 lg:py-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button
              type="button"
              onClick={() => setMobileOpen((previous) => !previous)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-blue-200/40 bg-white/10 text-white hover:bg-white/20 lg:hidden flex-shrink-0"
              aria-label="Toggle navigation menu"
            >
              ☰
            </button>
            {isLecturerPortal ? (
              <LecturerHeader />
            ) : (
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-blue-100">
                  {isHrPortal ? 'HR Admin Dashboard' : 'Promotion Administration'}
                </p>
                <h2 className="hidden truncate bg-gradient-to-r from-white to-yellow-200 bg-clip-text text-sm font-bold text-transparent sm:block md:text-base lg:text-lg">
                  {portalSubtitle}
                </h2>
                <h2 className="truncate bg-gradient-to-r from-white to-yellow-200 bg-clip-text text-sm font-bold text-transparent sm:hidden">
                  {portalSubtitle}
                </h2>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {!isLecturerPortal && (
              <div className="hidden rounded-full border border-yellow-200/70 bg-gradient-to-r from-yellow-300 to-yellow-200 px-3 py-1 text-sm font-semibold text-blue-950 shadow-sm sm:block">
                {isHrPortal ? 'HR Panel' : 'Admin Panel'}
              </div>
            )}
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
