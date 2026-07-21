'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { ChevronRight, Printer } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { EmptyState as UiEmptyState, ErrorState as UiErrorState, LoadingState as UiLoadingState } from './ui/feedback';
import { cn } from '../lib/utils';

type Tone = 'green' | 'amber' | 'red' | 'blue' | 'slate';

const toneMap: Record<Tone, { card: string; icon: string; bar: string }> = {
  green: { card: 'border-green-100 bg-green-50 text-green-950', icon: 'bg-green-100 text-green-700', bar: 'bg-brand-success' },
  amber: { card: 'border-amber-100 bg-amber-50 text-amber-950', icon: 'bg-amber-100 text-amber-800', bar: 'bg-brand-warning' },
  red: { card: 'border-red-100 bg-red-50 text-red-950', icon: 'bg-red-100 text-red-700', bar: 'bg-brand-danger' },
  blue: { card: 'border-brand-primary/15 bg-brand-primarySoft text-brand-text', icon: 'bg-white text-brand-primary', bar: 'bg-brand-primary' },
  slate: { card: 'border-brand-border bg-white text-brand-text', icon: 'bg-slate-100 text-slate-700', bar: 'bg-slate-700' },
};

export function DashboardCard({ label, value, description, code, tone = 'green' }: { label: string; value: ReactNode; description?: string; code?: string; tone?: Tone }) {
  const styles = toneMap[tone];
  return (
    <article className={cn('rounded-xl border p-5 shadow-enterprise-soft', styles.card)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] opacity-70">{label}</p>
          <div className="mt-3 text-3xl font-semibold tracking-tight">{value}</div>
          {description && <p className="mt-1 text-xs opacity-70">{description}</p>}
        </div>
        {code && <span className={cn('rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em]', styles.icon)}>{code}</span>}
      </div>
    </article>
  );
}

export function SectionCard({ title, description, action, children }: { title: string; description?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <Card className="p-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <h2 className="text-lg font-semibold text-brand-text">{title}</h2>
          {description && <p className="mt-1 text-sm leading-6 text-brand-muted">{description}</p>}
        </div>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </Card>
  );
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return <UiEmptyState title={title} description={description} action={action} />;
}

export function LoadingState({ label = 'Loading data...' }: { label?: string }) {
  return <UiLoadingState label={label} />;
}

export function ErrorState({ message }: { message: string }) {
  return <UiErrorState message={message} />;
}

export function QuickLinksCard({ links }: { links: Array<{ label: string; href: string; description?: string; code?: string }> }) {
  return (
    <SectionCard title="Quick Links" description="Common actions for this workspace.">
      <div className="grid gap-2">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="flex items-center justify-between gap-3 rounded-lg border border-brand-border bg-brand-background px-3 py-3 text-sm font-semibold text-brand-text transition hover:border-brand-primary/25 hover:bg-brand-primarySoft hover:text-brand-primary">
            <span>
              <span className="block">{link.label}</span>
              {link.description && <span className="mt-0.5 block text-xs font-normal text-brand-muted">{link.description}</span>}
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-brand-primary">
              {link.code || 'Open'}
              <ChevronRight className="h-3 w-3" aria-hidden="true" />
            </span>
          </Link>
        ))}
      </div>
    </SectionCard>
  );
}

export function SimpleBarChart({ rows }: { rows: Array<{ label: string; value: number; tone?: Tone }> }) {
  const max = Math.max(...rows.map((row) => row.value), 1);
  return (
    <div className="space-y-3">
      {rows.map((row) => {
        const styles = toneMap[row.tone || 'green'];
        return (
          <div key={row.label}>
            <div className="flex items-center justify-between text-xs font-semibold text-brand-muted">
              <span>{row.label}</span>
              <span>{row.value}</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className={cn('h-full rounded-full', styles.bar)} style={{ width: `${Math.max(4, Math.round((row.value / max) * 100))}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function PrintSummaryButton({ label = 'Print Summary' }: { label?: string }) {
  return (
    <Button type="button" variant="secondary" onClick={() => window.print()}>
      <Printer className="h-4 w-4" aria-hidden="true" />
      {label}
    </Button>
  );
}