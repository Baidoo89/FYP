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
        { href: '/lecturer-portal', icon: 'OV', label: 'Overview', subtitle: 'Career progress' },
        { href: '/lecturer-portal/application', icon: 'RQ', label: 'Application', subtitle: 'Promotion status' },
        { href: '/lecturer-portal/evidence', icon: 'EV', label: 'Evidence', subtitle: 'Documents' },
        { href: '/lecturer-portal/queries', icon: 'FB', label: 'Feedback', subtitle: 'HR comments' },
        { href: '/notifications', icon: 'NT', label: 'Notifications', subtitle: 'Updates' },
        { href: '/lecturer-portal/profile', icon: 'PF', label: 'Profile', subtitle: 'Academic record' },
      ]
    : isHrPortal
      ? [
          { href: '/hr/dashboard', icon: 'DB', label: 'Dashboard', subtitle: 'Workload overview' },
          { href: '/hr/requests', icon: 'RQ', label: 'Requests', subtitle: 'Application queue' },
          { href: '/hr/verify', icon: 'VR', label: 'Verification', subtitle: 'Evidence review' },
          { href: '/notifications', icon: 'NT', label: 'Notifications', subtitle: 'Updates' },
          { href: '/hr/logs', icon: 'AU', label: 'Audit Logs', subtitle: 'Activity trail' },
        ]
      : isSystemAdminPortal
        ? [
            { href: '/system-admin/dashboard', icon: 'DB', label: 'Dashboard', subtitle: 'System overview' },
            { href: '/system-admin/criteria', icon: 'CR', label: 'Criteria', subtitle: 'Eligibility rules' },
            { href: '/system-admin/structure', icon: 'ST', label: 'Structure', subtitle: 'Faculties and departments' },
            { href: '/system-admin/users', icon: 'UR', label: 'Users and Roles', subtitle: 'Access control' },
            { href: '/system-admin/settings', icon: 'SE', label: 'Settings', subtitle: 'Configuration' },
            { href: '/audit', icon: 'AU', label: 'Audit Logs', subtitle: 'System activity' },
            { href: '/notifications', icon: 'NT', label: 'Notifications', subtitle: 'Updates' },
          ]
        : isCommitteePortal
          ? [
              { href: '/committee/dashboard', icon: 'DB', label: 'Dashboard', subtitle: 'Assigned work' },
              { href: '/committee/review', icon: 'RV', label: 'Review Board', subtitle: 'Recommendations' },
              { href: '/notifications', icon: 'NT', label: 'Notifications', subtitle: 'Updates' },
            ]
          : isHodPortal
            ? [
                { href: '/hod/dashboard', icon: 'DB', label: 'Dashboard', subtitle: 'Department overview' },
                { href: '/hod/applications', icon: 'AP', label: 'Applications', subtitle: 'Department queue' },
                { href: '/notifications', icon: 'NT', label: 'Notifications', subtitle: 'Updates' },
              ]
            : baseNavItems;

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (isAuthPage) {
    return <div className="min-h-screen bg-slate-50 lpads-fade-in">{children}</div>;
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
          'fixed inset-y-0 left-0 z-40 w-72 transform overflow-y-auto border-r border-slate-800 bg-[#172033] text-white shadow-xl transition-transform duration-300 lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <div className="border-b border-white/10 px-5 py-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-teal-500 text-sm font-bold text-white shadow-lg shadow-teal-950/20">
            GP
          </div>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-teal-200">{portalTitle}</p>
          <h1 className="mt-2 text-xl font-semibold tracking-tight">GCTU Promotion System</h1>
          <p className="mt-1 text-sm text-slate-300">{portalSubtitle}</p>
        </div>

        <ul className="space-y-1 px-3 py-4">
          {navItems.map((item) => (
            <SidebarNavLink key={item.href} href={item.href} icon={item.icon} subtitle={item.subtitle} onNavigate={() => setMobileOpen(false)}>
              {item.label}
            </SidebarNavLink>
          ))}
        </ul>

        <div className="mx-4 mt-4 rounded-lg border border-white/10 bg-white/[0.04] p-4 text-xs text-slate-300">
          <p className="font-semibold text-white">Secure workspace</p>
          <p className="mt-1 leading-5">Role-based access, audit trails, and verified promotion evidence.</p>
        </div>

        <div className="mt-4 border-t border-white/10 p-4 text-xs text-slate-400">
          <p>GCTU Promotion System</p>
          <p>Final Year Project</p>
        </div>
      </nav>

      <div className="flex min-w-0 flex-1 flex-col lg:ml-72">
        <header className="fixed left-0 right-0 top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/95 px-3 py-3 shadow-sm backdrop-blur sm:px-4 md:px-8 lg:left-72 lg:py-4">
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
            {!isLecturerPortal && (
              <div className="hidden rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700 sm:block">
                {isHrPortal ? 'HR Panel' : 'Control Panel'}
              </div>
            )}
            <LogoutButton />
          </div>
        </header>

        <main className="min-w-0 flex-1 overflow-x-hidden px-3 pb-6 pt-24 lpads-fade-in sm:px-4 md:px-8 md:pt-28">{children}</main>

        <footer className="border-t border-slate-200 bg-white px-4 py-4 text-center text-xs text-slate-500 md:px-8">
          <p>GCTU Promotion System v1.0 | University Promotion Management Platform</p>
        </footer>
      </div>
    </div>
  );
}