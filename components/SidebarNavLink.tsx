'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type SidebarNavLinkProps = {
  href: string;
  icon: string;
  children: ReactNode;
  subtitle?: ReactNode;
  onNavigate?: () => void;
};

export default function SidebarNavLink({ href, icon, children, subtitle, onNavigate }: SidebarNavLinkProps) {
  const pathname = usePathname();
  const normalizedHref = href.split('#')[0].split('?')[0];
  const isActive = pathname === normalizedHref || pathname.startsWith(`${normalizedHref}/`);

  return (
    <li>
      <Link
        href={href}
        aria-current={isActive ? 'page' : undefined}
        onClick={onNavigate}
        className={[
          'group flex items-center gap-3 rounded-lg px-3 py-3 transition',
          'text-slate-300 hover:bg-white/[0.06] hover:text-white',
          isActive ? 'bg-teal-500/16 text-white ring-1 ring-teal-300/20' : '',
        ].join(' ')}
      >
        <span
          className={[
            'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md text-[11px] font-bold tracking-wide',
            isActive ? 'bg-teal-400 text-slate-950' : 'bg-white/8 text-teal-100 group-hover:bg-white/12',
          ].join(' ')}
          aria-hidden="true"
        >
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold leading-tight">{children}</span>
          {subtitle && <span className="mt-0.5 block truncate text-xs text-slate-400 group-hover:text-slate-300">{subtitle}</span>}
        </div>
      </Link>
    </li>
  );
}