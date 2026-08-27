'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpenCheck,
  BriefcaseBusiness,
  FileCheck2,
  Files,
  Gauge,
  MessageSquareText,
} from 'lucide-react';
import { cn } from '../../lib/utils';

const academicDossierItem = {
  href: '/lecturer-portal/academic-dossier',
  label: 'Academic Dossier',
  icon: BookOpenCheck,
};

const items = [
  { href: '/lecturer-portal/application', label: 'Overview', icon: BriefcaseBusiness },
  { href: '/lecturer-portal/official-forms', label: 'Official Form', icon: FileCheck2 },
  { href: '/lecturer-portal/evidence', label: 'Evidence', icon: Files },
  academicDossierItem,
  { href: '/lecturer-portal/eligibility', label: 'Eligibility', icon: Gauge },
  { href: '/lecturer-portal/queries', label: 'Feedback', icon: MessageSquareText },
];

const closedStatuses = new Set(['REJECTED', 'COMPLETED']);

export const APPLICANT_WORKSPACE_PATHS = [
  '/lecturer-portal/start-application',
  ...items.map((item) => item.href),
];

export function isApplicantWorkspacePath(pathname: string) {
  return APPLICANT_WORKSPACE_PATHS.some((path) => pathname === path || pathname.startsWith(path + '/'));
}

export default function ApplicantApplicationNav() {
  const pathname = usePathname();
  const [showAcademicDossier, setShowAcademicDossier] = useState(pathname === academicDossierItem.href);

  useEffect(() => {
    let cancelled = false;

    async function resolveTrack() {
      try {
        const response = await fetch('/api/promotion-requests?scope=lecturer', { cache: 'no-store' });
        const payload = await response.json();
        if (!response.ok || !payload.success) return;
        const requests = Array.isArray(payload.data) ? payload.data : [];
        const active = requests.find((request: { status?: string }) => !closedStatuses.has(request.status || '')) || requests[0] || null;
        if (!cancelled) setShowAcademicDossier(Boolean(active?.promotionRoute?.code?.startsWith('J-')));
      } catch {
        // Keep the route-specific tab hidden when the application context is unavailable.
      }
    }

    void resolveTrack();
    return () => {
      cancelled = true;
    };
  }, []);

  const visibleItems = showAcademicDossier
    ? items
    : items.filter((item) => item.href !== academicDossierItem.href);

  return (
    <nav aria-label="Application workspace" className="mb-5 min-w-0 overflow-x-auto border-b border-gray-200">
      <div className="flex min-w-max gap-1">
        {visibleItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'inline-flex min-h-11 shrink-0 items-center gap-2 border-b-2 px-3 py-2 text-sm font-semibold transition',
                active
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-950',
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
