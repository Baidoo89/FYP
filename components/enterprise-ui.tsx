'use client';

import type { ReactNode } from 'react';

type Tone = 'green' | 'amber' | 'red' | 'blue' | 'slate';

const toneMap: Record<Tone, { card: string; icon: string; bar: string }> = {
  green: { card: 'border-emerald-100 bg-emerald-50 text-emerald-950', icon: 'bg-emerald-100 text-emerald-800', bar: 'bg-emerald-600' },
  amber: { card: 'border-amber-100 bg-amber-50 text-amber-950', icon: 'bg-amber-100 text-amber-800', bar: 'bg-amber-500' },
  red: { card: 'border-rose-100 bg-rose-50 text-rose-950', icon: 'bg-rose-100 text-rose-800', bar: 'bg-rose-600' },
  blue: { card: 'border-sky-100 bg-sky-50 text-sky-950', icon: 'bg-sky-100 text-sky-800', bar: 'bg-sky-600' },
  slate: { card: 'border-slate-200 bg-white text-slate-950', icon: 'bg-slate-100 text-slate-700', bar: 'bg-slate-700' },
};

export function DashboardCard({ label, value, description, code, tone = 'green' }: { label: string; value: ReactNode; description?: string; code?: string; tone?: Tone }) {
  const styles = toneMap[tone];
  return (
    <article className={`rounded-xl border p-5 shadow-sm ${styles.card}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] opacity-70">{label}</p>
          <div className="mt-3 text-3xl font-semibold tracking-tight">{value}</div>
          {description && <p className="mt-1 text-xs opacity-70">{description}</p>}
        </div>
        {code && <span className={`rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${styles.icon}`}>{code}</span>}
      </div>
    </article>
  );
}

export function SectionCard({ title, description, action, children }: { title: string; description?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
          {description && <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>}
        </div>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
      <p className="font-semibold text-slate-950">{title}</p>
      {description && <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function LoadingState({ label = 'Loading data...' }: { label?: string }) {
  return <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">{label}</div>;
}

export function ErrorState({ message }: { message: string }) {
  return <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-900">{message}</div>;
}

export function QuickLinksCard({ links }: { links: Array<{ label: string; href: string; description?: string; code?: string }> }) {
  return (
    <SectionCard title="Quick Links" description="Common actions for this workspace.">
      <div className="grid gap-2">
        {links.map((link) => (
          <a key={link.href} href={link.href} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-700 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800">
            <span>
              <span className="block">{link.label}</span>
              {link.description && <span className="mt-0.5 block text-xs font-normal text-slate-500">{link.description}</span>}
            </span>
            <span className="rounded-md bg-white px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-teal-700">{link.code || 'Open'}</span>
          </a>
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
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
              <span>{row.label}</span>
              <span>{row.value}</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className={`h-full rounded-full ${styles.bar}`} style={{ width: `${Math.max(4, Math.round((row.value / max) * 100))}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function PrintSummaryButton({ label = 'Print Summary' }: { label?: string }) {
  return (
    <button type="button" onClick={() => window.print()} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800">
      {label}
    </button>
  );
}