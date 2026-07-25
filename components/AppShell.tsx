'use client';

import type { ReactNode, RefObject } from 'react';
import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, ChevronDown, HelpCircle, KeyRound, Menu, Settings, UserRound } from 'lucide-react';
import LogoutButton from './LogoutButton';
import SidebarNavLink from './SidebarNavLink';
import LecturerHeader from './LecturerHeader';
import ThemeToggle from './ThemeToggle';
import BottomNavigation from './BottomNavigation';

type AppShellProps = {
  children: ReactNode;
};

type AuthRole = 'LECTURER' | 'HOD_DEAN' | 'HR_ADMIN' | 'COMMITTEE_REVIEWER' | 'SYSTEM_ADMIN';

type NavItem = {
  href: string;
  icon: string;
  label: string;
  subtitle?: string;
};

type SessionUser = {
  id: number;
  name: string;
  email: string;
  department?: string | null;
};

const PORTAL_ROLE_STORAGE_KEY = 'gctu-portal-role';

const baseNavItems: NavItem[] = [
  { href: '/dashboard', icon: 'DB', label: 'Dashboard', subtitle: 'Role overview' },
  { href: '/promotions', icon: 'PR', label: 'Promotion Requests', subtitle: 'Workflow queue' },
  { href: '/lecturers', icon: 'SR', label: 'Staff Records', subtitle: 'Academic profiles' },
  { href: '/analytics', icon: 'RP', label: 'Reports', subtitle: 'Promotion analytics' },
  { href: '/audit', icon: 'AU', label: 'Audit Trail', subtitle: 'System activity' },
  { href: '/notifications', icon: 'NT', label: 'Notifications', subtitle: 'Updates' },
];

function isAuthRole(value: string | null): value is AuthRole {
  return Boolean(value && ['LECTURER', 'HOD_DEAN', 'HR_ADMIN', 'COMMITTEE_REVIEWER', 'SYSTEM_ADMIN'].includes(value));
}

function getExplicitPortalRole(pathname: string): AuthRole | null {
  if (pathname.startsWith('/lecturer-portal')) return 'LECTURER';
  if (pathname.startsWith('/hr')) return 'HR_ADMIN';
  if (pathname.startsWith('/system-admin')) return 'SYSTEM_ADMIN';
  if (pathname.startsWith('/committee')) return 'COMMITTEE_REVIEWER';
  if (pathname.startsWith('/hod')) return 'HOD_DEAN';
  return null;
}

function getStoredPortalRole() {
  if (typeof window === 'undefined') return null;
  const stored = window.localStorage.getItem(PORTAL_ROLE_STORAGE_KEY);
  return isAuthRole(stored) ? stored : null;
}

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sessionRole, setSessionRole] = useState<AuthRole | null>(getStoredPortalRole);
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
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

  const explicitPortalRole = getExplicitPortalRole(pathname);
  const effectivePortalRole = explicitPortalRole || sessionRole;
  const isLecturerNav = effectivePortalRole === 'LECTURER';
  const isHrNav = effectivePortalRole === 'HR_ADMIN';
  const isSystemAdminNav = effectivePortalRole === 'SYSTEM_ADMIN';
  const isCommitteeNav = effectivePortalRole === 'COMMITTEE_REVIEWER';
  const isHodNav = effectivePortalRole === 'HOD_DEAN';

  const portalTitle = isLecturerNav
    ? 'Lecturer Portal'
    : isHrNav
      ? 'HR Admin Portal'
      : isSystemAdminNav
        ? 'System Admin'
        : isCommitteeNav
          ? 'Committee Portal'
          : isHodNav
            ? 'HOD / Dean Portal'
            : 'GCTU Promotion System';
  const portalSubtitle = isLecturerNav
    ? 'Promotion workspace'
    : isHrNav
      ? 'Verification and audit'
      : isSystemAdminNav
        ? 'Configuration and governance'
        : isCommitteeNav
          ? 'Committee review workspace'
          : isHodNav
            ? 'Department review workspace'
            : 'University promotion workspace';

  const navItems: NavItem[] = isLecturerNav
    ? [
        { href: '/lecturer-portal', icon: 'DB', label: 'Dashboard', subtitle: 'Readiness overview' },
        { href: '/lecturer-portal/application', icon: 'PR', label: 'My Application', subtitle: 'Workflow tracker' },
        { href: '/lecturer-portal/evidence', icon: 'EV', label: 'Evidence Portfolio', subtitle: 'Upload documents' },
        { href: '/lecturer-portal/queries', icon: 'FB', label: 'Feedback', subtitle: 'Returned evidence' },
        { href: '/lecturer-portal/eligibility', icon: 'EL', label: 'Eligibility', subtitle: 'Criteria outcome' },
        { href: '/lecturer-portal/notifications', icon: 'NT', label: 'Notifications', subtitle: 'Updates' },
        { href: '/lecturer-portal/profile', icon: 'PF', label: 'Profile', subtitle: 'Academic record' },
        { href: '/lecturer-portal/help', icon: 'HC', label: 'Help Center', subtitle: 'Support' },
        { href: '/lecturer-portal/settings', icon: 'SE', label: 'Settings', subtitle: 'Account' },
      ]
    : isHrNav
      ? [
          { href: '/hr/dashboard', icon: 'DB', label: 'Dashboard', subtitle: 'Workload overview' },
          { href: '/hr/requests', icon: 'AA', label: 'Application Registry', subtitle: 'All promotion files' },
          { href: '/hr/verify', icon: 'VQ', label: 'Verification Queue', subtitle: 'Evidence review' },
          { href: '/lecturers', icon: 'SR', label: 'Staff Records', subtitle: 'Lecturer profiles' },
          { href: '/analytics', icon: 'RP', label: 'Reports & Analytics', subtitle: 'Dashboards' },
          { href: '/hr/logs', icon: 'AU', label: 'Audit Trail', subtitle: 'Activity history' },
          { href: '/notifications', icon: 'NT', label: 'Notifications', subtitle: 'Updates' },
          { href: '/hr/profile', icon: 'PF', label: 'Profile', subtitle: 'Account' },
        ]
      : isSystemAdminNav
        ? [
            { href: '/system-admin/dashboard', icon: 'DB', label: 'Dashboard', subtitle: 'Governance overview' },
            { href: '/system-admin/users', icon: 'US', label: 'Users & Access', subtitle: 'Accounts, roles, status' },
            { href: '/system-admin/structure', icon: 'ST', label: 'Institution Structure', subtitle: 'Faculties & departments' },
            { href: '/system-admin/criteria', icon: 'CR', label: 'Promotion Rules', subtitle: 'Ranks, criteria, evidence' },
            { href: '/audit', icon: 'AU', label: 'Audit Trail', subtitle: 'Governance activity' },
            { href: '/system-admin/settings', icon: 'SE', label: 'Platform Settings', subtitle: 'General configuration' },
          ]
        : isCommitteeNav
          ? [
              { href: '/committee/dashboard', icon: 'DB', label: 'Dashboard', subtitle: 'Assigned work' },
              { href: '/committee/review?segment=pending', icon: 'RQ', label: 'Review Queue', subtitle: 'Pending decisions' },
              { href: '/committee/review?segment=all', icon: 'AP', label: 'Applications', subtitle: 'Committee files' },
              { href: '/committee/review?segment=decided', icon: 'RM', label: 'Recommendations', subtitle: 'Decisions' },
              { href: '/analytics', icon: 'ER', label: 'Eligibility Reports', subtitle: 'Outcomes' },
              { href: '/audit', icon: 'AU', label: 'Audit Trail', subtitle: 'Review history' },
              { href: '/notifications', icon: 'NT', label: 'Notifications', subtitle: 'Updates' },
              { href: '/committee/profile', icon: 'PF', label: 'Profile', subtitle: 'Account' },
            ]
          : isHodNav
            ? [
                { href: '/hod/dashboard', icon: 'DB', label: 'Dashboard', subtitle: 'Department overview' },
                { href: '/hod/review-queue', icon: 'RQ', label: 'Review Queue', subtitle: 'Academic action' },
                { href: '/hod/records', icon: 'DR', label: 'Department Records', subtitle: 'Scoped files' },
                { href: '/hod/returned', icon: 'RT', label: 'Returned Files', subtitle: 'Corrections' },
                { href: '/hod/forwarded', icon: 'FW', label: 'Forwarded Files', subtitle: 'Sent to HR' },
                { href: '/analytics', icon: 'RP', label: 'Reports & Analytics', subtitle: 'Department reports' },
                { href: '/notifications', icon: 'NT', label: 'Notifications', subtitle: 'Updates' },
                { href: '/hod/profile', icon: 'PF', label: 'Profile', subtitle: 'Account' },
              ]
            : baseNavItems;

  useEffect(() => {
    setMobileOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (explicitPortalRole && typeof window !== 'undefined') {
      window.localStorage.setItem(PORTAL_ROLE_STORAGE_KEY, explicitPortalRole);
      setSessionRole(explicitPortalRole);
    }
  }, [explicitPortalRole]);

  useEffect(() => {
    if (isAuthPage) {
      return;
    }

    let cancelled = false;

    async function loadSessionRole() {
      try {
        const response = await fetch('/api/auth/me', { cache: 'no-store' });
        const payload = await response.json();
        const role = payload?.role;

        if (!cancelled && payload?.user) {
          setSessionUser(payload.user);
        }

        if (!cancelled && isAuthRole(role)) {
          setSessionRole(role);
          window.localStorage.setItem(PORTAL_ROLE_STORAGE_KEY, role);
        }
      } catch {
        // Keep the stored portal role as a fallback for shared pages.
      }
    }

    loadSessionRole();

    return () => {
      cancelled = true;
    };
  }, [isAuthPage]);

  useEffect(() => {
    if (!profileOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setProfileOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [profileOpen]);

  useEffect(() => {
    if (isAuthPage) {
      setNotificationCount(0);
      return;
    }

    let cancelled = false;

    async function loadNotificationCount() {
      try {
        const response = await fetch('/api/notifications?unread=true&take=1', { cache: 'no-store' });
        if (!response.ok) {
          if (!cancelled) setNotificationCount(0);
          return;
        }
        const payload = await response.json();
        const unread = Number(payload?.data?.summary?.unread || 0);
        if (!cancelled) setNotificationCount(unread);
      } catch {
        if (!cancelled) setNotificationCount(0);
      }
    }

    loadNotificationCount();

    return () => {
      cancelled = true;
    };
  }, [isAuthPage, pathname]);

  if (isAuthPage) {
    return <div className="relative min-h-screen bg-brand-background lpads-fade-in">{children}</div>;
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-brand-background lg:flex">
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
          'fixed inset-y-0 left-0 z-40 w-72 transform overflow-y-auto border-r border-[#102a54] bg-[linear-gradient(180deg,#183A72_0%,#102A54_60%,#0B1F3E_100%)] text-white shadow-2xl transition-transform duration-300 lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <div className="border-b border-white/10 px-5 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-yellow-200/30 bg-white p-1 shadow-lg shadow-slate-950/30">
              <img src="/gctu-logo.jpg" alt="GCTU logo" className="h-full w-full object-contain" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold tracking-tight">GCTU</h1>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-yellow-100/85">Promotion System</p>
            </div>
          </div>
          <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-yellow-100">{portalTitle}</p>
            <p className="mt-1 text-sm text-blue-50/80">{portalSubtitle}</p>
          </div>
        </div>

        <Suspense fallback={<div className="px-3 py-4" aria-hidden="true" />}>
          <ul className="space-y-1 px-3 py-4">
            {navItems.map((item) => (
              <SidebarNavLink key={`${item.href}-${item.label}`} href={item.href} icon={item.icon} subtitle={item.subtitle} onNavigate={() => setMobileOpen(false)}>
                {item.label}
              </SidebarNavLink>
            ))}
          </ul>
        </Suspense>

        <div className="mx-4 mt-4 rounded-lg border border-white/10 bg-white/[0.06] p-4 text-xs text-blue-50/80">
          <p className="font-semibold text-white">Need help?</p>
          <p className="mt-1 leading-5">Contact support for account, evidence, and workflow assistance.</p>
        </div>

        <div className="mx-4 mt-3 lg:hidden">
          <LogoutButton className="w-full border-white/10 bg-white/10 text-white hover:border-white/20 hover:bg-white/15 hover:text-white" />
        </div>

        <div className="mt-4 border-t border-white/10 p-4 text-xs text-blue-50/55">
          <p>&copy; 2026 Ghana Communication Technology University</p>
          <p>Digital Staff Promotion Support System</p>
          <p>Version 1.0</p>
        </div>
      </nav>

      <div className="flex min-w-0 flex-1 flex-col lg:ml-72">
        <header className="fixed left-0 right-0 top-0 z-20 flex items-center justify-between border-b border-brand-border bg-white/95 px-3 py-3 shadow-sm backdrop-blur sm:px-4 md:px-8 lg:left-72 lg:py-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen((previous) => !previous)}
              className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md border border-brand-border bg-white text-brand-muted shadow-sm hover:bg-brand-background lg:hidden"
              aria-label="Toggle navigation menu"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
            {isLecturerNav ? (
              <LecturerHeader />
            ) : (
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-primary">{portalTitle}</p>
                <h2 className="truncate text-base font-semibold text-brand-text md:text-lg">{portalSubtitle}</h2>
              </div>
            )}
          </div>
          <div className="flex flex-shrink-0 items-center gap-2 sm:gap-3">
            <div className="hidden w-64 items-center rounded-lg border border-brand-border bg-brand-background px-3 py-2 text-sm text-brand-muted xl:flex">
              Search anything...
            </div>
            <ThemeToggle compact />
            <a href={isLecturerNav ? "/lecturer-portal/notifications" : "/notifications"} className="relative hidden h-10 w-10 items-center justify-center rounded-lg border border-brand-border bg-white text-sm font-bold text-brand-muted shadow-sm hover:bg-brand-background sm:flex" aria-label={`${notificationCount} unread notifications`}>
              <Bell className="h-4 w-4" aria-hidden="true" />
              {notificationCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-black text-white ring-2 ring-white">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </a>
            <HeaderProfileMenu
              user={sessionUser}
              role={effectivePortalRole}
              open={profileOpen}
              onToggle={() => setProfileOpen((previous) => !previous)}
              onClose={() => setProfileOpen(false)}
              menuRef={profileMenuRef}
            />
          </div>
        </header>

        <main className="min-w-0 flex-1 overflow-x-hidden px-3 pb-24 pt-24 lpads-fade-in sm:px-4 md:px-8 md:pt-24 lg:pb-6">
          <Suspense fallback={<div className="pro-card p-5 text-sm font-semibold text-brand-muted">Loading workspace...</div>}>
            {children}
          </Suspense>
        </main>

        <footer className="border-t border-brand-border bg-white px-4 py-4 pb-20 text-center text-xs text-brand-muted md:px-8 lg:pb-4">
          <p>&copy; 2026 Ghana Communication Technology University</p>
          <p className="mt-1">Digital Staff Promotion Support System | Version 1.0</p>
        </footer>
        <Suspense fallback={null}>
          <BottomNavigation role={effectivePortalRole} notificationCount={notificationCount} />
        </Suspense>
      </div>
    </div>
  );
}


function HeaderProfileMenu({
  user,
  role,
  open,
  onToggle,
  onClose,
  menuRef,
}: {
  user: SessionUser | null;
  role: AuthRole | null;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  menuRef: RefObject<HTMLDivElement | null>;
}) {
  const displayName = user?.name || rolePanelLabel(role);
  const roleText = rolePanelLabel(role);
  const initials = initialsFor(displayName);
  const profileUrl = profileHref(role);
  const settingsUrl = settingsHref(role);
  const helpUrl = helpHref(role);

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={onToggle}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex min-h-10 min-w-0 items-center gap-2 rounded-xl border border-brand-border bg-white px-1.5 py-1.5 text-left shadow-sm transition hover:border-brand-primary/25 hover:bg-brand-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 sm:px-2"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-primary text-xs font-black text-white shadow-sm sm:h-9 sm:w-9">
          {initials || <UserRound className="h-4 w-4" aria-hidden="true" />}
        </span>
        <span className="hidden min-w-0 lg:block">
          <span className="block max-w-36 truncate text-sm font-semibold leading-4 text-brand-text">{displayName}</span>
          <span className="mt-0.5 block max-w-36 truncate text-[11px] font-medium text-brand-muted">{user?.department || roleText}</span>
        </span>
        <ChevronDown className={`hidden h-4 w-4 shrink-0 text-brand-muted transition sm:block ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {open && (
        <div role="menu" className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-xl border border-brand-border bg-white shadow-[0_18px_48px_rgba(15,23,42,0.16)]">
          <div className="border-b border-brand-border bg-brand-background px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-primary text-sm font-black text-white">
                {initials || <UserRound className="h-5 w-5" aria-hidden="true" />}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-brand-text">{displayName}</p>
                <p className="mt-0.5 truncate text-xs text-brand-muted">{user?.email || roleText}</p>
                <p className="mt-1 w-fit rounded-full border border-brand-border bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-brand-muted">{roleText}</p>
              </div>
            </div>
          </div>

          <div className="p-2">
            <ProfileMenuLink href={profileUrl} label="Profile" detail="View staff account" icon={<UserRound className="h-4 w-4" aria-hidden="true" />} onClick={onClose} />
            <ProfileMenuLink href={settingsUrl} label="Settings" detail="Account preferences" icon={<Settings className="h-4 w-4" aria-hidden="true" />} onClick={onClose} />
            <ProfileMenuLink href="/account/security" label="Account Security" detail="Change password" icon={<KeyRound className="h-4 w-4" aria-hidden="true" />} onClick={onClose} />
            <ProfileMenuLink href={helpUrl} label="Help Centre" detail="Support and guidance" icon={<HelpCircle className="h-4 w-4" aria-hidden="true" />} onClick={onClose} />
            <div className="mt-2 border-t border-brand-border pt-2">
              <LogoutButton className="w-full justify-center border-transparent bg-brand-background shadow-none hover:border-brand-primary/20 hover:bg-brand-primarySoft hover:text-brand-primary" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileMenuLink({ href, label, detail, icon, onClick }: { href: string; label: string; detail: string; icon: ReactNode; onClick: () => void }) {
  return (
    <Link href={href} onClick={onClick} role="menuitem" className="flex min-w-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-brand-text transition hover:bg-brand-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-brand-border bg-white text-brand-primary">{icon}</span>
      <span className="min-w-0">
        <span className="block font-semibold">{label}</span>
        <span className="block truncate text-xs text-brand-muted">{detail}</span>
      </span>
    </Link>
  );
}

function initialsFor(name?: string | null) {
  return (name || '')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function profileHref(role: AuthRole | null) {
  if (role === 'LECTURER') return '/lecturer-portal/profile';
  if (role === 'HR_ADMIN') return '/hr/profile';
  if (role === 'SYSTEM_ADMIN') return '/system-admin/dashboard';
  if (role === 'COMMITTEE_REVIEWER') return '/committee/profile';
  if (role === 'HOD_DEAN') return '/hod/profile';
  return '/dashboard';
}

function settingsHref(role: AuthRole | null) {
  if (role === 'LECTURER') return '/lecturer-portal/settings';
  if (role === 'SYSTEM_ADMIN') return '/system-admin/settings';
  if (role === 'HR_ADMIN') return '/hr/profile';
  if (role === 'COMMITTEE_REVIEWER') return '/committee/profile';
  if (role === 'HOD_DEAN') return '/hod/profile';
  return '/dashboard';
}

function helpHref(role: AuthRole | null) {
  if (role === 'LECTURER') return '/lecturer-portal/help';
  return '/notifications';
}
function rolePanelLabel(role: AuthRole | null) {
  if (role === 'LECTURER') return 'Lecturer';
  if (role === 'HR_ADMIN') return 'HR Admin';
  if (role === 'SYSTEM_ADMIN') return 'System Admin';
  if (role === 'COMMITTEE_REVIEWER') return 'Committee Reviewer';
  if (role === 'HOD_DEAN') return 'HOD / Dean';
  return 'Staff Portal';
}
