'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import LogoutButton from './LogoutButton';
import SidebarNavLink from './SidebarNavLink';
import LecturerHeader from './LecturerHeader';
import ThemeToggle from './ThemeToggle';

type AppShellProps = {
  children: ReactNode;
};

type NavItem = {
  href: string;
  icon: string;
  label: string;
  subtitle?: string;
};

const baseNavItems: NavItem[] = [
  { href: '/dashboard', icon: 'DB', label: 'Dashboard' },
  { href: '/lecturers', icon: 'LC', label: 'Lecturers' },
  { href: '/appraisals', icon: 'AP', label: 'Appraisals' },
  { href: '/analytics', icon: 'AN', label: 'Analytics' },
  { href: '/audit', icon: 'AU', label: 'Audit Logs' },
  { href: '/promotions', icon: 'PR', label: 'Promotions' },
  { href: '/notifications', icon: 'NT', label: 'Notifications' },
];

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAuthPage =
    pathname === '/login' ||
    pathname.startsWith('/login/') ||
    pathname === '/register' ||
    pathname.startsWith('/register/') ||
    pathname === '/check-email' ||
    pathname.startsWith('/check-email/') ||
    pathname === '/verify-email' ||
    pathname.startsWith('/verify-email/') ||
    pathname === '/onboarding' ||
    pathname.startsWith('/onboarding/');
  const isLecturerPortal = pathname.startsWith('/lecturer-portal');
  const isHrPortal = pathname.startsWith('/hr');
  const isSystemAdminPortal = pathname.startsWith('/system-admin');
  const isCommitteePortal = pathname.startsWith('/committee');
  const isHodPortal = pathname.startsWith('/hod');

  const portalTitle = isLecturerPortal
    ? 'Lecturer Portal'
    : isHrPortal
      ? 'HR Admin Portal'
      : isSystemAdminPortal
        ? 'System Admin'
        : isCommitteePortal
          ? 'Committee Portal'
          : isHodPortal
            ? 'HOD / Dean Portal'
            : 'Admin Console';
  const portalSubtitle = isLecturerPortal
    ? 'Promotion workspace'
    : isHrPortal
      ? 'Verification and audit'
      : isSystemAdminPortal
        ? 'Configuration and governance'
        : isCommitteePortal
          ? 'Committee review workspace'
          : isHodPortal
            ? 'Department review workspace'
            : 'Promotion administration';

  const navItems: NavItem[] = isLecturerPortal
    ? [
        { href: '/lecturer-portal', icon: 'DB', label: 'Dashboard', subtitle: 'Readiness overview' },
        { href: '/lecturer-portal/application', icon: 'PR', label: 'Promotion Requests', subtitle: 'Track application' },
        { href: '/lecturer-portal/evidence', icon: 'EV', label: 'Evidence Portfolio', subtitle: 'Documents' },
        { href: '/lecturer-portal/application', icon: 'AP', label: 'My Applications', subtitle: 'Status history' },
        { href: '/lecturer-portal/queries', icon: 'FB', label: 'Feedback & Remarks', subtitle: 'HR comments' },
        { href: '/lecturer-portal/application', icon: 'EL', label: 'Eligibility Status', subtitle: 'Criteria outcome' },
        { href: '/notifications', icon: 'NT', label: 'Notifications', subtitle: 'Updates' },
        { href: '/lecturer-portal/profile', icon: 'PF', label: 'Profile', subtitle: 'Academic record' },
        { href: '/lecturer-portal/profile', icon: 'HC', label: 'Help Center', subtitle: 'Support' },
        { href: '/lecturer-portal/profile', icon: 'SE', label: 'Settings', subtitle: 'Account' },
      ]
    : isHrPortal
      ? [
          { href: '/hr/dashboard', icon: 'DB', label: 'Dashboard', subtitle: 'Workload overview' },
          { href: '/hr/requests', icon: 'AA', label: 'All Applications', subtitle: 'Master queue' },
          { href: '/hr/verify', icon: 'VQ', label: 'Verification Queue', subtitle: 'Evidence review' },
          { href: '/lecturers', icon: 'SR', label: 'Staff Records', subtitle: 'Lecturer profiles' },
          { href: '/hr/requests', icon: 'ER', label: 'Eligibility Review', subtitle: 'Criteria outcome' },
          { href: '/analytics', icon: 'RP', label: 'Reports', subtitle: 'Analytics' },
          { href: '/hr/logs', icon: 'AU', label: 'Audit Logs', subtitle: 'Activity trail' },
          { href: '/notifications', icon: 'NT', label: 'Notifications', subtitle: 'Updates' },
          { href: '/hr/dashboard', icon: 'SE', label: 'Settings', subtitle: 'Preferences' },
        ]
      : isSystemAdminPortal
        ? [
            { href: '/system-admin/dashboard', icon: 'DB', label: 'Dashboard', subtitle: 'System overview' },
            { href: '/system-admin/users', icon: 'US', label: 'Users', subtitle: 'Account control' },
            { href: '/system-admin/users', icon: 'RL', label: 'Roles', subtitle: 'Access levels' },
            { href: '/system-admin/structure', icon: 'DP', label: 'Departments', subtitle: 'Academic units' },
            { href: '/system-admin/structure', icon: 'FC', label: 'Faculties', subtitle: 'School structure' },
            { href: '/system-admin/criteria', icon: 'RK', label: 'Rank Levels', subtitle: 'Promotion ranks' },
            { href: '/system-admin/criteria', icon: 'CR', label: 'Promotion Criteria', subtitle: 'Eligibility rules' },
            { href: '/system-admin/settings', icon: 'DC', label: 'Document Categories', subtitle: 'Evidence types' },
            { href: '/audit', icon: 'AU', label: 'Audit Logs', subtitle: 'System activity' },
            { href: '/system-admin/settings', icon: 'SE', label: 'System Settings', subtitle: 'Configuration' },
          ]
        : isCommitteePortal
          ? [
              { href: '/committee/dashboard', icon: 'DB', label: 'Dashboard', subtitle: 'Assigned work' },
              { href: '/committee/review', icon: 'AS', label: 'Assigned Applications', subtitle: 'Review queue' },
              { href: '/committee/review', icon: 'RC', label: 'Review Cases', subtitle: 'Evidence review' },
              { href: '/committee/review', icon: 'RM', label: 'Recommendations', subtitle: 'Decisions' },
              { href: '/analytics', icon: 'ER', label: 'Eligibility Reports', subtitle: 'Outcomes' },
              { href: '/audit', icon: 'RH', label: 'Review History', subtitle: 'Audit trail' },
              { href: '/notifications', icon: 'NT', label: 'Notifications', subtitle: 'Updates' },
              { href: '/lecturer-portal/profile', icon: 'PF', label: 'Profile', subtitle: 'Account' },
            ]
          : isHodPortal
            ? [
                { href: '/hod/dashboard', icon: 'DB', label: 'Dashboard', subtitle: 'Department overview' },
                { href: '/hod/applications', icon: 'DA', label: 'Department Applications', subtitle: 'Department queue' },
                { href: '/hod/applications', icon: 'RR', label: 'Review Requests', subtitle: 'Pending decisions' },
                { href: '/hod/applications', icon: 'RC', label: 'Recommendations', subtitle: 'Comments' },
                { href: '/hod/applications', icon: 'FW', label: 'Forwarded Applications', subtitle: 'Sent to HR' },
                { href: '/analytics', icon: 'RP', label: 'Reports', subtitle: 'Department reports' },
                { href: '/notifications', icon: 'NT', label: 'Notifications', subtitle: 'Updates' },
                { href: '/lecturer-portal/profile', icon: 'PF', label: 'Profile', subtitle: 'Account' },
              ]
            : baseNavItems;

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (isAuthPage) {
    return (
      <div className="relative min-h-screen bg-slate-50 lpads-fade-in">
        <div className="fixed right-4 top-4 z-50">
          <ThemeToggle compact />
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 lg:flex">
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-30 bg-slate-950/50 lg:hidden"
        />
      )}

      <nav
        className={[
          'fixed inset-y-0 left-0 z-40 w-72 transform overflow-y-auto border-r border-emerald-950 bg-[linear-gradient(180deg,#063f36_0%,#02362f_46%,#012821_100%)] text-white shadow-2xl transition-transform duration-300 lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <div className="border-b border-white/10 px-5 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-teal-200/25 bg-white p-1 shadow-lg shadow-emerald-950/30">
              <img src="/gctu-logo.jpg" alt="GCTU logo" className="h-full w-full object-contain" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold tracking-tight">GCTU</h1>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-teal-100/80">Promotion System</p>
            </div>
          </div>
          <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-100">{portalTitle}</p>
            <p className="mt-1 text-sm text-emerald-50/75">{portalSubtitle}</p>
          </div>
        </div>

        <ul className="space-y-1 px-3 py-4">
          {navItems.map((item) => (
            <SidebarNavLink key={item.href} href={item.href} icon={item.icon} subtitle={item.subtitle} onNavigate={() => setMobileOpen(false)}>
              {item.label}
            </SidebarNavLink>
          ))}
        </ul>

        <div className="mx-4 mt-4 rounded-lg border border-white/10 bg-white/[0.06] p-4 text-xs text-emerald-50/75">
          <p className="font-semibold text-white">Need help?</p>
          <p className="mt-1 leading-5">Contact support for account, evidence, and workflow assistance.</p>
        </div>

        <div className="mt-4 border-t border-white/10 p-4 text-xs text-emerald-100/45">
          <p>GCTU Promotion System v1.0</p>
          <p>2026 GCTU. All rights reserved.</p>
        </div>
      </nav>

      <div className="flex min-w-0 flex-1 flex-col lg:ml-72">
        <header className="fixed left-0 right-0 top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/95 px-3 py-3 shadow-sm backdrop-blur sm:px-4 md:px-8 lg:left-72 lg:py-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen((previous) => !previous)}
              className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 lg:hidden"
              aria-label="Toggle navigation menu"
            >
              <span className="h-0.5 w-5 bg-current shadow-[0_6px_0_currentColor,0_-6px_0_currentColor]" />
            </button>
            {isLecturerPortal ? (
              <LecturerHeader />
            ) : (
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-teal-700">{portalTitle}</p>
                <h2 className="truncate text-base font-semibold text-slate-950 md:text-lg">{portalSubtitle}</h2>
              </div>
            )}
          </div>
          <div className="flex flex-shrink-0 items-center gap-2 sm:gap-3">
            <div className="hidden w-64 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 xl:flex">
              Search anything...
            </div>
            <ThemeToggle compact />
            <a href="/notifications" className="relative hidden h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-600 shadow-sm hover:bg-slate-50 sm:flex">
              NT
              <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-rose-500 ring-2 ring-white" />
            </a>
            {!isLecturerPortal && (
              <div className="hidden rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 sm:block">
                {isHrPortal ? 'HR Panel' : 'Control Panel'}
              </div>
            )}
            <LogoutButton />
          </div>
        </header>

        <main className="min-w-0 flex-1 overflow-x-hidden px-3 pb-6 pt-24 lpads-fade-in sm:px-4 md:px-8 md:pt-24">{children}</main>

        <footer className="border-t border-slate-200 bg-white px-4 py-4 text-center text-xs text-slate-500 md:px-8">
          <p>GCTU Promotion System v1.0 | University Promotion Management Platform</p>
        </footer>
      </div>
    </div>
  );
}
