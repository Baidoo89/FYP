'use client';

import type { ReactNode } from 'react';
import ThemeToggle from '../ThemeToggle';

type AuthPageShellProps = {
  children: ReactNode;
  active?: 'login' | 'register';
};

const tabBase = 'rounded-lg px-4 py-2.5 text-center text-sm font-semibold outline-none transition duration-200 focus-visible:ring-2 focus-visible:ring-[#0b2d5b] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950';

export default function AuthPageShell({ children, active = 'login' }: AuthPageShellProps) {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-5 text-slate-950 dark:bg-slate-950 dark:text-white sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-6xl flex-col">
        <header className="flex items-center justify-between gap-4">
          <a href="/login" className="flex min-w-0 items-center gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[#0b2d5b] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm dark:border-slate-800">
              <img src="/gctu-logo.jpg" alt="GCTU logo" className="h-full w-full object-contain" />
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-bold uppercase tracking-[0.16em] text-[#0b2d5b] dark:text-yellow-100">GCTU</span>
              <span className="mt-0.5 block truncate text-sm font-semibold text-slate-900 dark:text-white sm:text-base">Digital Staff Promotion Support System</span>
            </span>
          </a>
          <ThemeToggle compact />
        </header>

        <section className="flex flex-1 items-center justify-center py-8 sm:py-10">
          <div className="w-full max-w-[460px]">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20 sm:p-7">
              <nav aria-label="Authentication" className="mb-7 grid grid-cols-2 rounded-xl bg-slate-100 p-1 text-slate-600 dark:bg-slate-950 dark:text-slate-300">
                <a
                  href="/login"
                  aria-current={active === 'login' ? 'page' : undefined}
                  className={`${tabBase} ${active === 'login' ? 'bg-white text-[#0b2d5b] shadow-sm dark:bg-slate-800 dark:text-white' : 'hover:bg-white/70 hover:text-slate-950 dark:hover:bg-slate-800/70 dark:hover:text-white'}`}
                >
                  Sign In
                </a>
                <a
                  href="/register"
                  aria-current={active === 'register' ? 'page' : undefined}
                  className={`${tabBase} ${active === 'register' ? 'bg-white text-[#0b2d5b] shadow-sm dark:bg-slate-800 dark:text-white' : 'hover:bg-white/70 hover:text-slate-950 dark:hover:bg-slate-800/70 dark:hover:text-white'}`}
                >
                  Create Account
                </a>
              </nav>

              {children}
            </div>

            <footer className="mt-5 flex flex-col items-center justify-center gap-1 text-center text-xs text-slate-500 dark:text-slate-400 sm:flex-row sm:gap-3">
              <span>&copy; 2026 Ghana Communication Technology University</span>
              <a href="/lecturer-portal/help" className="rounded-sm font-medium text-[#0b2d5b] outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[#0b2d5b] focus-visible:ring-offset-2 dark:text-slate-200 dark:focus-visible:ring-offset-slate-950">
                Help Centre
              </a>
            </footer>
          </div>
        </section>
      </div>
    </main>
  );
}
