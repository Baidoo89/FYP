type Metric = {
  label: string;
  value: number | string;
  tone?: 'blue' | 'amber' | 'green' | 'red' | 'slate';
};

type Action = {
  label: string;
  href: string;
};

const toneClasses = {
  blue: {
    card: 'border-sky-100 bg-sky-50/90 text-sky-950',
    badge: 'border-sky-200 bg-sky-100 text-sky-800',
    bar: 'bg-sky-600',
  },
  amber: {
    card: 'border-amber-100 bg-amber-50/90 text-amber-950',
    badge: 'border-amber-200 bg-amber-100 text-amber-800',
    bar: 'bg-amber-500',
  },
  green: {
    card: 'border-emerald-100 bg-emerald-50/90 text-emerald-950',
    badge: 'border-emerald-200 bg-emerald-100 text-emerald-800',
    bar: 'bg-emerald-600',
  },
  red: {
    card: 'border-rose-100 bg-rose-50/90 text-rose-950',
    badge: 'border-rose-200 bg-rose-100 text-rose-800',
    bar: 'bg-rose-600',
  },
  slate: {
    card: 'border-slate-200 bg-white text-slate-950',
    badge: 'border-slate-200 bg-slate-100 text-slate-700',
    bar: 'bg-slate-700',
  },
};

function numericValue(value: number | string) {
  if (typeof value === 'number') return value;
  const parsed = Number(String(value).split('/')[0].trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

export function RoleDashboard(props: {
  eyebrow: string;
  title: string;
  description: string;
  metrics: Metric[];
  actions: Action[];
}) {
  const maxMetric = Math.max(...props.metrics.map((metric) => numericValue(metric.value)), 1);
  const primaryAction = props.actions[0];
  const secondaryActions = props.actions.slice(1);

  return (
    <main className="min-h-screen bg-slate-50 px-0 py-2 sm:py-4">
      <section className="mx-auto max-w-7xl space-y-5">
        <div className="pro-hero p-5 sm:p-6">
          <div className="relative z-10 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <div className="pro-eyebrow">{props.eyebrow}</div>
              <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">{props.title}</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{props.description}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {primaryAction && (
                <a href={primaryAction.href} className="rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-950">
                  {primaryAction.label}
                </a>
              )}
              {secondaryActions.slice(0, 2).map((action) => (
                <a key={action.href} href={action.href} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-900">
                  {action.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {props.metrics.slice(0, 4).map((metric) => {
            const tone = toneClasses[metric.tone || 'slate'];
            const percent = Math.max(8, Math.round((numericValue(metric.value) / maxMetric) * 100));
            return (
              <article key={metric.label} className={`rounded-xl border p-5 shadow-sm ${tone.card}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] opacity-70">{metric.label}</p>
                    <p className="mt-3 text-3xl font-semibold tracking-tight">{metric.value}</p>
                  </div>
                  <span className={`rounded-lg border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${tone.badge}`}>Live</span>
                </div>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/70">
                  <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${percent}%` }} />
                </div>
              </article>
            );
          })}
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Operational Summary</h2>
                <p className="mt-1 text-sm text-slate-600">Current platform indicators from the live database.</p>
              </div>
              <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">Prisma live data</span>
            </div>
            <div className="mt-4 divide-y divide-slate-100 rounded-lg border border-slate-200">
              {props.metrics.map((metric) => {
                const tone = toneClasses[metric.tone || 'slate'];
                return (
                  <div key={metric.label} className="flex items-center justify-between gap-4 px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800">{metric.label}</p>
                      <p className="text-xs text-slate-500">Institutional workflow indicator</p>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${tone.badge}`}>{metric.value}</span>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">Shortcuts</h2>
            <p className="mt-1 text-sm text-slate-600">Common actions for this role.</p>
            <div className="mt-4 grid gap-2">
              {props.actions.map((action, index) => (
                <a key={`${action.href}-${index}`} href={action.href} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-900">
                  <span>{action.label}</span>
                  <span className="text-xs">Open</span>
                </a>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
