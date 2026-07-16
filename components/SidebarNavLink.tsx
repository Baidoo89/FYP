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
          'group flex items-center gap-3 rounded-lg px-3 py-2.5 transition',
          'text-blue-50/82 hover:bg-white/[0.08] hover:text-white',
          isActive ? 'bg-white/[0.13] text-white shadow-[inset_3px_0_0_rgba(250,204,21,0.92)]' : '',
        ].join(' ')}
      >
        <span
          className={[
            'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md text-[10px] font-bold tracking-wide',
            isActive ? 'bg-yellow-200 text-slate-950' : 'bg-white/[0.08] text-blue-100 group-hover:bg-white/[0.14]',
          ].join(' ')}
          aria-hidden="true"
        >
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold leading-tight">{children}</span>
          {subtitle && <span className="mt-0.5 block truncate text-[11px] text-blue-100/62 group-hover:text-blue-50/85">{subtitle}</span>}
        </div>
      </Link>
    </li>
  );
}
