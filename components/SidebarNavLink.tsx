 'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type SidebarNavLinkProps = {
	href: string;
	icon: string;
	children: ReactNode;
	onNavigate?: () => void;
};

export default function SidebarNavLink({ href, icon, children, onNavigate }: SidebarNavLinkProps) {
	const pathname = usePathname();
	const isActive = pathname === href || pathname.startsWith(`${href}/`);

	return (
		<li>
			<Link
				href={href}
				aria-current={isActive ? 'page' : undefined}
				onClick={onNavigate}
				className={[
					'group flex items-center gap-3 rounded-xl px-4 py-3 transition hover:translate-x-0.5',
					'text-blue-100/90 hover:bg-white/10 hover:text-white',
					isActive ? 'border border-amber-300/25 bg-gradient-to-r from-blue-500/25 to-amber-400/10 text-white shadow-[0_10px_28px_rgba(15,23,42,0.25)]' : '',
				].join(' ')}
			>
				<span className="text-lg" aria-hidden="true">{icon}</span>
				<span className="font-medium tracking-wide">{children}</span>
			</Link>
		</li>
	);
}
