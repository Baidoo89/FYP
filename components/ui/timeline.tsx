import type { LucideIcon } from 'lucide-react';
import { CheckCircle2, Circle, Clock3, RotateCcw, XCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

type TimelineTone = 'success' | 'current' | 'pending' | 'warning' | 'danger';

const toneMap: Record<TimelineTone, { dot: string; line: string; icon: LucideIcon }> = {
  success: { dot: 'border-green-200 bg-green-50 text-green-700', line: 'bg-green-200', icon: CheckCircle2 },
  current: { dot: 'border-brand-primary/30 bg-brand-primarySoft text-brand-primary', line: 'bg-brand-primary/30', icon: Clock3 },
  pending: { dot: 'border-slate-200 bg-slate-50 text-slate-400', line: 'bg-slate-200', icon: Circle },
  warning: { dot: 'border-amber-200 bg-amber-50 text-amber-800', line: 'bg-amber-200', icon: RotateCcw },
  danger: { dot: 'border-red-200 bg-red-50 text-red-700', line: 'bg-red-200', icon: XCircle },
};

export function Timeline({ items }: { items: Array<{ title: string; description?: string; meta?: string; tone?: TimelineTone }> }) {
  return (
    <div className="space-y-0">
      {items.map((item, index) => {
        const tone = toneMap[item.tone || 'pending'];
        const Icon = tone.icon;
        return (
          <div key={`${item.title}-${index}`} className="relative flex gap-3 pb-5 last:pb-0">
            {index < items.length - 1 && <div className={cn('absolute left-5 top-10 h-[calc(100%-2.5rem)] w-px', tone.line)} aria-hidden="true" />}
            <span className={cn('relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border', tone.dot)}>
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0 pt-1">
              <p className="font-semibold text-brand-text">{item.title}</p>
              {descriptionLine(item.description)}
              {item.meta && <p className="mt-1 text-xs font-medium text-brand-muted">{item.meta}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function descriptionLine(description?: string) {
  if (!description) return null;
  return <p className="mt-1 text-sm leading-6 text-brand-muted">{description}</p>;
}