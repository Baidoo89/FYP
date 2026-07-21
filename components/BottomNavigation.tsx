'use client';

import Link from 'next/link';
import { Bell, BriefcaseBusiness, FileText, LayoutDashboard, UserRound } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '../lib/utils';

type BottomNavigationProps = {
  role: 'LECTURER' | 'HOD_DEAN' | 'HR_ADMIN' | 'COMMITTEE_REVIEWER' | 'SYSTEM_ADMIN' | null;
};

const lecturerItems = [
  { href: '/lecturer-portal', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/lecturer-portal/evidence', label: 'Evidence', icon: FileText },
  { href: '/lecturer-portal/application', label: 'My Application', icon: BriefcaseBusiness },
  { href: '/lecturer-portal/notifications', label: 'Notifications', icon: Bell },
  { href: '/lecturer-portal/profile', label: 'Profile', icon: UserRound },
];

export default function BottomNavigation({ role }: BottomNavigationProps) {
  const pathname = usePathname();

  if (role !== 'LECTURER') return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-brand-border bg-white/95 px-2 py-1.5 shadow-[0_-8px_24px_rgba(17,24,39,0.08)] backdrop-blur lg:hidden" aria-label="Primary mobile navigation">
      <div className="grid grid-cols-5 gap-1">
        {lecturerItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className={cn('flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg px-1 text-[11px] font-semibold text-brand-muted transition', active && 'bg-brand-primarySoft text-brand-primary')}>
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
