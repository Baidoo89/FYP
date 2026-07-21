import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Card } from './card';

type Tone = 'default' | 'primary' | 'success' | 'warning' | 'danger';

const tones: Record<Tone, string> = {
  default: 'border-slate-200 bg-slate-50 text-slate-700',
  primary: 'border-brand-primary/20 bg-brand-primarySoft text-brand-primary',
  success: 'border-green-200 bg-green-50 text-green-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  danger: 'border-red-200 bg-red-50 text-red-700',
};

export function StatCard({ label, value, description, icon: Icon, tone = 'default', className }: { label: string; value: string | number; description?: string; icon?: LucideIcon; tone?: Tone; className?: string }) {
  return (
    <Card className={cn('p-5', className)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-muted">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-brand-text">{value}</p>
          {description && <p className="mt-1 text-xs text-brand-muted">{description}</p>}
        </div>
        {Icon && (
          <span className={cn('flex h-10 w-10 items-center justify-center rounded-lg border', tones[tone])}>
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
        )}
      </div>
    </Card>
  );
}