'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  Bell,
  BookOpenCheck,
  Building2,
  BriefcaseBusiness,
  ClipboardCheck,
  ClipboardList,
  FileCheck2,
  FileText,
  Gauge,
  HelpCircle,
  History,
  LayoutDashboard,
  ListChecks,
  MessageSquareText,
  ScrollText,
  Settings,
  ShieldCheck,
  Square,
  UserCog,
  UserRound,
  UsersRound,
} from 'lucide-react';
import { cn } from '../lib/utils';

type SidebarNavLinkProps = {
  href: string;
  icon: string;
  children: ReactNode;
  subtitle?: ReactNode;
  onNavigate?: () => void;
};

const iconMap = {
  AA: ClipboardList,
  AP: BriefcaseBusiness,
  AS: ClipboardCheck,
  AU: History,
  CR: ListChecks,
  DA: ClipboardCheck,
  DB: LayoutDashboard,
  DC: FileText,
  DP: UsersRound,
  EL: Gauge,
  ER: Gauge,
  EV: FileCheck2,
  FB: MessageSquareText,
  FC: UsersRound,
  FW: ScrollText,
  HC: HelpCircle,
  NT: Bell,
  PF: UserRound,
  PR: BriefcaseBusiness,
  RC: MessageSquareText,
  RH: History,
  RK: BookOpenCheck,
  RL: ShieldCheck,
  RM: ClipboardCheck,
  RP: ScrollText,
  RQ: ClipboardList,
  RR: ClipboardList,
  SE: Settings,
  SR: UsersRound,
  ST: Building2,
  US: UserCog,
  VQ: FileCheck2,
} as const;

export default function SidebarNavLink({ href, icon, children, onNavigate }: SidebarNavLinkProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const normalizedHref = href.split('#')[0].split('?')[0];
  const hrefQuery = href.includes('?') ? new URLSearchParams(href.split('?')[1].split('#')[0]) : null;
  const hasSpecificQuery = hrefQuery && Array.from(hrefQuery.keys()).length > 0;
  const queryMatches = hasSpecificQuery
    ? Array.from(hrefQuery.entries()).every(([key, value]) => searchParams.get(key) === value)
    : true;
  const isActive = hasSpecificQuery
    ? pathname === normalizedHref && queryMatches
    : pathname === normalizedHref || pathname.startsWith(`${normalizedHref}/`);
  const Icon = iconMap[icon as keyof typeof iconMap] || Square;

  return (
    <li>
      <Link
        href={href}
        aria-current={isActive ? 'page' : undefined}
        onClick={onNavigate}
        className={cn(
          'group flex items-center gap-3 rounded-lg px-3 py-2.5 transition duration-200',
          'text-blue-50/85 hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 focus-visible:ring-offset-brand-primary',
          isActive && 'bg-white/[0.13] text-white shadow-[inset_3px_0_0_rgba(212,175,55,0.98)]'
        )}
      >
        <span
          className={cn(
            'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md',
            isActive ? 'bg-brand-accent text-slate-950' : 'bg-white/[0.08] text-blue-50/85 group-hover:bg-white/[0.14]'
          )}
          aria-hidden="true"
        >
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold leading-tight">{children}</span>
        </div>
      </Link>
    </li>
  );
}
