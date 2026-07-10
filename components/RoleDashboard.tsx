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
  blue: 'border-teal-100 bg-teal-50 text-teal-950',
  amber: 'border-amber-100 bg-amber-50 text-amber-950',
  green: 'border-emerald-100 bg-emerald-50 text-emerald-950',
  red: 'border-rose-100 bg-rose-50 text-rose-950',
  slate: 'border-slate-200 bg-white text-slate-950',
};

export function RoleDashboard(props: {
  eyebrow: string;
  title: string;
  description: string;
  metrics: Metric[];
  actions: Action[];
}) {
  return (
    <main className="min-h-screen bg-slate-50 px-0 py-2 sm:py-4">
      <section className="mx-auto max-w-7xl">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">{props.eyebrow}</p>
          <div className="mt-3 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">{props.title}</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{props.description}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {props.actions.map((action) => (
                <a
                  key={action.href}
                  href={action.href}
                  className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800"
                >
                  {action.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {props.metrics.map((metric) => (
            <article
              key={metric.label}
              className={`rounded-xl border p-5 shadow-sm ${toneClasses[metric.tone || 'slate']}`}
            >
              <p className="text-sm font-medium opacity-75">{metric.label}</p>
              <p className="mt-3 text-3xl font-semibold tracking-tight">{metric.value}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}