'use client';

import Link from 'next/link';
import { Bell, BriefcaseBusiness, Building2, ClipboardList, FileText, LayoutDashboard, Settings, UserRound, UsersRound } from 'lucide-react';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '../lib/utils';

type PortalRole = 'LECTURER' | 'HOD_DEAN' | 'HR_ADMIN' | 'COMMITTEE_REVIEWER' | 'SYSTEM_ADMIN';

type BottomNavigationProps = {
  role: PortalRole | null;
  notificationCount?: number;
};

type BottomNavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  key?: string;
};

const itemsByRole: Partial<Record<PortalRole, BottomNavItem[]>> = {
  LECTURER: [
    { href: '/lecturer-portal', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/lecturer-portal/evidence', label: 'Evidence', icon: FileText },
    { href: '/lecturer-portal/application', label: 'Promotion', icon: BriefcaseBusiness },
    { href: '/lecturer-portal/notifications', label: 'Alerts', icon: Bell },
    { href: '/lecturer-portal/profile', label: 'Profile', icon: UserRound },
  ],
  HR_ADMIN: [
    { href: '/hr/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/hr/verify?segment=pending', label: 'Verify', icon: ClipboardList },
    { href: '/hr/requests', label: 'Files', icon: BriefcaseBusiness },
    { href: '/notifications', label: 'Alerts', icon: Bell },
    { href: '/hr/profile', label: 'Profile', icon: UserRound },
  ],
  COMMITTEE_REVIEWER: [
    { href: '/committee/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/committee/review?segment=pending', label: 'Queue', icon: ClipboardList, key: 'review-queue' },
    { href: '/committee/review?segment=all', label: 'Files', icon: BriefcaseBusiness, key: 'applications' },
    { href: '/notifications', label: 'Alerts', icon: Bell },
    { href: '/committee/profile', label: 'Profile', icon: UserRound },
  ],
  HOD_DEAN: [
    { href: '/hod/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/hod/review-queue', label: 'Review', icon: ClipboardList, key: 'review-workspace' },
    { href: '/analytics', label: 'Reports', icon: FileText },
    { href: '/notifications', label: 'Alerts', icon: Bell },
    { href: '/hod/profile', label: 'Profile', icon: UserRound },
  ],
  SYSTEM_ADMIN: [
    { href: '/system-admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/system-admin/users', label: 'Users', icon: UsersRound },
    { href: '/system-admin/structure', label: 'Structure', icon: Building2 },
    { href: '/system-admin/criteria', label: 'Rules', icon: ClipboardList },
    { href: '/system-admin/settings', label: 'Settings', icon: Settings },
  ],
};

function normalizedPath(href: string) {
  return href.split('#')[0].split('?')[0];
}

function isActive(role: PortalRole | null, item: BottomNavItem, pathname: string, segment: string | null) {
  const path = normalizedPath(item.href);

  if (role === 'COMMITTEE_REVIEWER' && path === '/committee/review') {
    if (item.key === 'applications') return pathname === path && segment === 'all';
    return pathname === path && segment !== 'all';
  }

  return pathname === path || pathname.startsWith(`${path}/`);
}

export default function BottomNavigation({ role, notificationCount = 0 }: BottomNavigationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const items = role ? itemsByRole[role] : null;

  if (!items) return null;

  const segment = searchParams.get('segment');

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-brand-border bg-white/95 px-2 py-1.5 shadow-[0_-8px_24px_rgba(17,24,39,0.08)] backdrop-blur lg:hidden" aria-label="Primary mobile navigation">
      <div className="grid min-w-0 grid-cols-5 gap-1">
        {items.map((item) => {
          const active = isActive(role, item, pathname, segment);
          const Icon = item.icon;
          const badge = item.href.includes('notifications') && notificationCount > 0 ? (notificationCount > 9 ? '9+' : String(notificationCount)) : null;
          return (
            <Link key={`${item.href}-${item.label}`} href={item.href} aria-current={active ? 'page' : undefined} className={cn('relative flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-1 text-[11px] font-semibold text-brand-muted transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2', active && 'bg-brand-primarySoft text-brand-primary')}>
              <span className="relative">
                <Icon className="h-5 w-5" aria-hidden="true" />
                {badge && <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[9px] font-black leading-none text-white ring-2 ring-white">{badge}</span>}
              </span>
              <span className="block w-full min-w-0 truncate text-center leading-3">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
