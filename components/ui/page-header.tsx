import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export function PageHeader({ eyebrow, title, description, actions, className }: { eyebrow?: string; title: string; description?: string; actions?: ReactNode; className?: string }) {
  return (
    <section className={cn('rounded-xl border border-brand-border bg-white p-5 shadow-enterprise-soft sm:p-6', className)}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          {eyebrow && <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-primary">{eyebrow}</p>}
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-brand-text sm:text-3xl">{title}</h1>
          {description && <p className="mt-2 max-w-3xl text-sm leading-6 text-brand-muted">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
      </div>
    </section>
  );
}