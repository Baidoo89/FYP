'use client';

import type { ReactNode } from 'react';
import ThemeToggle from '../ThemeToggle';

type AuthPageShellProps = {
  children: ReactNode;
  active?: 'login' | 'register';
};

const trustItems = [
  { label: 'Secure authentication', icon: 'lock' },
  { label: 'Role-based access', icon: 'shield' },
  { label: 'Official university records', icon: 'record' },
];

export function AuthTrustStrip() {
  return (
    <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
      {trustItems.map((item) => (
        <div key={item.label} className="flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 transition duration-200 hover:border-blue-200 hover:bg-blue-50/60">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-blue-900 shadow-sm" aria-hidden="true">
            <AuthIcon name={item.icon} />
          </span>
          <span className="leading-4">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function AuthPageShell({ children, active = 'login' }: AuthPageShellProps) {
  return (
    <main className="min-h-screen bg-[#f6f8fb] px-4 py-5 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-5xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/70 lg:grid-cols-[0.88fr_1.12fr]">
          <aside className="hidden bg-[linear-gradient(180deg,#0b2d5b_0%,#071f3f_100%)] px-8 py-8 text-white lg:flex lg:flex-col lg:justify-between">
            <div>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/25 bg-white p-2.5 shadow-lg shadow-slate-950/25">
                    <img src="/gctu-logo.jpg" alt="GCTU logo" className="h-full w-full object-contain" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-yellow-100">GCTU</p>
                    <h1 className="mt-2 max-w-xs text-2xl font-semibold leading-tight tracking-tight">
                      Digital Staff Promotion Support System
                    </h1>
                    <p className="mt-2 text-sm font-medium text-blue-50/85">Official Staff Promotion Platform</p>
                  </div>
                </div>
                <ThemeToggle compact />
              </div>

              <div className="mt-8 rounded-xl border border-white/12 bg-white/[0.06] px-4 py-3 text-sm text-blue-50/85">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-yellow-100" aria-hidden="true">
                    <AuthIcon name="lock" />
                  </span>
                  <div>
                    <p className="font-semibold text-white">Secure GCTU Staff Access</p>
                    <p className="mt-1 text-xs leading-5">Your credentials are encrypted, and access is protected through role-based authentication.</p>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs leading-5 text-blue-50/65">
              Official access for promotion requests, evidence verification, review, and decision support.
            </p>
          </aside>

          <section className="flex items-center justify-center px-5 py-7 sm:px-8 sm:py-8 lg:px-12">
            <div className="w-full max-w-md animate-[lpadsFade_0.35s_ease-out]">
              <div className="mb-6 rounded-2xl border border-blue-100 bg-slate-50 p-4 shadow-sm lg:hidden">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-blue-100 bg-white p-2 shadow-sm">
                      <img src="/gctu-logo.jpg" alt="GCTU logo" className="h-full w-full object-contain" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-800">GCTU</p>
                      <h1 className="mt-1 text-base font-bold leading-tight text-slate-950">Digital Staff Promotion Support System</h1>
                      <p className="mt-1 text-xs font-semibold text-slate-600">Official Staff Promotion Platform</p>
                    </div>
                  </div>
                  <ThemeToggle compact />
                </div>
                <div className="mt-4 rounded-xl border border-blue-100 bg-white px-3 py-2 text-xs leading-5 text-slate-600">
                  <span className="font-semibold text-blue-900">Secure GCTU Staff Access.</span> Role-based authentication protects official university records.
                </div>
              </div>

              <nav aria-label="Authentication" className="mb-6 rounded-full border border-slate-200 bg-slate-50 p-1 text-sm font-semibold text-slate-600 shadow-sm">
                <div className="grid grid-cols-2 gap-1">
                  <a
                    href="/login"
                    aria-current={active === 'login' ? 'page' : undefined}
                    className={`rounded-full px-4 py-2.5 text-center outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-blue-800 focus-visible:ring-offset-2 active:scale-[0.98] ${active === 'login' ? 'bg-white text-blue-900 shadow-md shadow-slate-200/80 ring-1 ring-slate-200' : 'hover:bg-white/70 hover:text-slate-950 dark:hover:bg-slate-800/80 dark:hover:text-white'}`}
                  >
                    Sign In
                  </a>
                  <a
                    href="/register"
                    aria-current={active === 'register' ? 'page' : undefined}
                    className={`rounded-full px-4 py-2.5 text-center outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-blue-800 focus-visible:ring-offset-2 active:scale-[0.98] ${active === 'register' ? 'bg-white text-blue-900 shadow-md shadow-slate-200/80 ring-1 ring-slate-200' : 'hover:bg-white/70 hover:text-slate-950 dark:hover:bg-slate-800/80 dark:hover:text-white'}`}
                  >
                    Create Account
                  </a>
                </div>
              </nav>

              {children}

              <footer className="mt-7 border-t border-slate-200 pt-5 text-center text-xs leading-6 text-slate-500">
                <p>&copy; 2026 Ghana Communication Technology University</p>
                <p className="font-medium text-slate-600">Official Digital Staff Promotion Support System</p>
                <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
                  <a href="#" className="rounded-sm outline-none transition hover:text-blue-900 focus-visible:ring-2 focus-visible:ring-blue-800 focus-visible:ring-offset-2 dark:hover:text-blue-200">Privacy Policy</a>
                  <a href="#" className="rounded-sm outline-none transition hover:text-blue-900 focus-visible:ring-2 focus-visible:ring-blue-800 focus-visible:ring-offset-2 dark:hover:text-blue-200">Terms of Use</a>
                  <a href="/lecturer-portal/help" className="rounded-sm outline-none transition hover:text-blue-900 focus-visible:ring-2 focus-visible:ring-blue-800 focus-visible:ring-offset-2 dark:hover:text-blue-200">Help Centre</a>
                </div>
              </footer>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function AuthIcon({ name }: { name: string }) {
  if (name === 'shield') {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    );
  }

  if (name === 'record') {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
        <path d="M14 2v6h6" />
        <path d="M8 13h8" />
        <path d="M8 17h5" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
