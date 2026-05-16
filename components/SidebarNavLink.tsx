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
					'group flex items-start gap-3 rounded-xl px-3 py-3 transition hover:translate-x-0.5',
					'text-blue-100/80 hover:bg-white/10 hover:text-white',
					isActive ? 'border border-amber-300/25 bg-gradient-to-r from-blue-500/25 to-amber-400/15 text-white shadow-[0_10px_28px_rgba(15,23,42,0.25)]' : '',
				].join(' ')}
			>
				<span className="mt-0.5 text-xl flex-shrink-0" aria-hidden="true">{icon}</span>
				<div className="min-w-0 flex-1">
					<span className="block font-semibold tracking-tight text-base leading-tight">{children}</span>
					{subtitle && <span className="block text-xs text-blue-200/60 mt-0.5">{subtitle}</span>}
				</div>
			</Link>
		</li>
	);
}
