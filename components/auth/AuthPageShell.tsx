import type { ReactNode } from 'react';

type AuthPageShellProps = {
  children: ReactNode;
  active?: 'login' | 'register';
};

export default function AuthPageShell({ children, active = 'login' }: AuthPageShellProps) {
  return (
    <main className="min-h-screen bg-[#f6f8fb] px-4 py-5 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-5xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/70 lg:grid-cols-[0.88fr_1.12fr]">
          <aside className="hidden bg-[linear-gradient(180deg,#0b2d5b_0%,#071f3f_100%)] px-8 py-8 text-white lg:flex lg:flex-col lg:justify-between">
            <div>
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-white/25 bg-white p-3 shadow-lg shadow-slate-950/25">
                <img src="/gctu-logo.jpg" alt="GCTU logo" className="h-full w-full object-contain" />
              </div>
              <p className="mt-7 text-xs font-bold uppercase tracking-[0.2em] text-yellow-100">Ghana Communication Technology University</p>
              <h1 className="mt-3 max-w-sm text-3xl font-semibold leading-tight tracking-tight">
                Digital Staff Promotion Support System
              </h1>
              <p className="mt-4 max-w-sm text-sm leading-6 text-blue-50/85">
                Official access for staff promotion requests, evidence verification, review, and decision support.
              </p>
            </div>

            <div className="rounded-xl border border-white/12 bg-white/[0.06] px-4 py-3 text-sm text-blue-50/85">
              <p className="font-semibold text-white">Secure institutional portal</p>
              <p className="mt-1 text-xs leading-5">Use only your approved GCTU staff account.</p>
            </div>
          </aside>

          <section className="flex items-center justify-center px-5 py-8 sm:px-8 lg:px-12">
            <div className="w-full max-w-md">
              <div className="mb-7 flex items-center gap-4 rounded-2xl border border-blue-100 bg-[#f4f7fc] p-4 shadow-sm lg:hidden">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-blue-100 bg-white p-2 shadow-sm">
                  <img src="/gctu-logo.jpg" alt="GCTU logo" className="h-full w-full object-contain" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-800">GCTU</p>
                  <h1 className="mt-1 text-base font-bold leading-tight text-slate-950">Digital Staff Promotion Support System</h1>
                </div>
              </div>

              <div className="mb-6 flex rounded-xl border border-slate-200 bg-slate-50 p-1 text-xs font-semibold text-slate-600">
                <a
                  href="/login"
                  className={`flex-1 rounded-lg px-3 py-2 text-center transition ${active === 'login' ? 'bg-white text-blue-900 shadow-sm' : 'hover:text-slate-950'}`}
                >
                  Sign in
                </a>
                <a
                  href="/register"
                  className={`flex-1 rounded-lg px-3 py-2 text-center transition ${active === 'register' ? 'bg-white text-blue-900 shadow-sm' : 'hover:text-slate-950'}`}
                >
                  Sign up
                </a>
              </div>

              {children}

              <p className="mt-7 text-center text-[11px] font-medium leading-5 text-slate-500">
                2026 Ghana Communication Technology University
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}