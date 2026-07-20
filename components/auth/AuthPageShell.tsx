'use client';

import type { ReactNode } from 'react';
import ThemeToggle from '../ThemeToggle';

type AuthPageShellProps = {
  children: ReactNode;
  active?: 'login' | 'register';
};

export default function AuthPageShell({ children }: AuthPageShellProps) {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-5 text-slate-950 dark:bg-slate-950 dark:text-white sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-6xl flex-col">
        <div className="flex justify-end">
          <ThemeToggle compact />
        </div>

        <section className="flex flex-1 items-center justify-center py-8 sm:py-10">
          <div className="w-full max-w-[440px]">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20 sm:p-7">
              <a href="/login" className="mb-7 flex items-center gap-3 rounded-lg border-b border-slate-100 pb-5 outline-none focus-visible:ring-2 focus-visible:ring-[#0b2d5b] focus-visible:ring-offset-2 dark:border-slate-800 dark:focus-visible:ring-offset-slate-900">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm dark:border-slate-800">
                  <img src="/gctu-logo.jpg" alt="GCTU logo" className="h-full w-full object-contain" />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-bold uppercase tracking-[0.16em] text-[#0b2d5b] dark:text-yellow-100">GCTU</span>
                  <span className="mt-1 block text-base font-semibold leading-tight text-slate-950 dark:text-white">Digital Staff Promotion Support System</span>
                  <span className="mt-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Official staff promotion platform</span>
                </span>
              </a>

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
