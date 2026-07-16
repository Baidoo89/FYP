import type { ReactNode } from 'react';

type AuthPageShellProps = {
  children: ReactNode;
  active?: 'login' | 'register';
};

const trustSignals = [
  { label: 'Lecturer evidence upload', value: 'Portfolio' },
  { label: 'HOD and Dean review', value: 'Review' },
  { label: 'HR verification and audit', value: 'Control' },
  { label: 'Committee recommendation', value: 'Decision' },
];

export default function AuthPageShell({ children, active = 'login' }: AuthPageShellProps) {
  return (
    <main className="min-h-screen bg-[#eef3f0] px-4 py-5 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-2.5rem)] w-full max-w-7xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/80 lg:grid-cols-[1.02fr_0.98fr]">
        <section className="relative hidden overflow-hidden bg-[#043f34] px-10 py-10 text-white lg:flex lg:flex-col lg:justify-between xl:px-12">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,_rgba(255,255,255,0.12),_transparent_42%),radial-gradient(circle_at_82%_12%,_rgba(16,185,129,0.24),_transparent_30%),linear-gradient(180deg,_#075344_0%,_#022f29_100%)]" />
          <div className="relative">
            <div className="flex items-center gap-5">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/35 bg-white p-3 shadow-xl shadow-emerald-950/25">
                <img src="/gctu-logo.jpg" alt="GCTU logo" className="h-full w-full object-contain" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-100">Ghana Communication Technology University</p>
                <h1 className="mt-2 max-w-xl text-3xl font-semibold leading-tight tracking-tight xl:text-4xl">
                  GCTU Digital Staff Promotion Support System
                </h1>
              </div>
            </div>

            <div className="mt-12 max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-100">Official promotion management platform</p>
              <h2 className="mt-4 text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">
                Secure promotion requests, evidence verification, and institutional decisions.
              </h2>
              <p className="mt-5 max-w-xl text-sm leading-6 text-emerald-50/85">
                Built for GCTU lecturers, departments, HR administrators, promotion committees, and system administrators.
              </p>
            </div>
          </div>

          <div className="relative grid grid-cols-2 gap-3">
            {trustSignals.map((item) => (
              <div key={item.label} className="rounded-xl border border-white/15 bg-white/[0.07] px-4 py-3 shadow-sm shadow-emerald-950/10">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-100/80">{item.value}</p>
                <p className="mt-1 text-sm font-semibold text-white">{item.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-center bg-white px-5 py-8 sm:px-8 lg:px-12">
          <div className="w-full max-w-md">
            <div className="mb-7 rounded-2xl border border-emerald-100 bg-[#f4faf7] p-4 shadow-sm lg:hidden">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-emerald-100 bg-white p-2 shadow-sm">
                  <img src="/gctu-logo.jpg" alt="GCTU logo" className="h-full w-full object-contain" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">GCTU</p>
                  <h1 className="mt-1 text-base font-bold leading-tight text-slate-950">Digital Staff Promotion Support System</h1>
                </div>
              </div>
            </div>

            <div className="mb-6 flex rounded-xl border border-slate-200 bg-slate-50 p-1 text-xs font-semibold text-slate-600">
              <a
                href="/login"
                className={`flex-1 rounded-lg px-3 py-2 text-center transition ${active === 'login' ? 'bg-white text-emerald-800 shadow-sm' : 'hover:text-slate-950'}`}
              >
                Sign in
              </a>
              <a
                href="/register"
                className={`flex-1 rounded-lg px-3 py-2 text-center transition ${active === 'register' ? 'bg-white text-emerald-800 shadow-sm' : 'hover:text-slate-950'}`}
              >
                Sign up
              </a>
            </div>

            {children}

            <p className="mt-7 text-center text-[11px] font-medium leading-5 text-slate-500">
              2026 Ghana Communication Technology University. Official staff promotion workflow access.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
