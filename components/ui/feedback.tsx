import type { ReactNode } from 'react';
import { AlertCircle, Inbox, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export function LoadingSkeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-xl border border-brand-border bg-white p-6 shadow-enterprise-soft', className)} />;
}

export function LoadingState({ label = 'Loading data...' }: { label?: string }) {
  return (
    <div className="flex min-h-24 items-center gap-3 rounded-xl border border-brand-border bg-white p-5 text-sm font-medium text-brand-muted shadow-enterprise-soft">
      <Loader2 className="h-4 w-4 animate-spin text-brand-primary" aria-hidden="true" />
      {label}
    </div>
  );
}

export function EmptyState({ title, description, action, className }: { title: string; description?: string; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-xl border border-dashed border-brand-border bg-white p-6 text-center shadow-enterprise-soft', className)}>
      <Inbox className="mx-auto h-8 w-8 text-brand-primary" aria-hidden="true" />
      <p className="mt-3 font-semibold text-brand-text">{title}</p>
      {description && <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-brand-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      {message}
    </div>
  );
}