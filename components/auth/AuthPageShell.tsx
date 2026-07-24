'use client';

import type { ReactNode } from 'react';
import ThemeToggle from '../ThemeToggle';

type AuthPageShellProps = {
  children: ReactNode;
  active?: 'login' | 'register';
};

export default function AuthPageShell({ children }: AuthPageShellProps) {
  return (
    <main className="min-h-screen bg-brand-background px-4 py-5 text-brand-text dark:bg-[#07111f] dark:text-white sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-6xl flex-col">
        <section className="flex flex-1 items-center justify-center py-8 sm:py-10">
          <div className="w-full max-w-[440px]">
            <div className="rounded-2xl border border-brand-border bg-white p-5 shadow-enterprise dark:border-[#26364d] dark:bg-[#0e1a2b] dark:shadow-black/30 sm:p-7">
              <div className="mb-7 flex items-start justify-between gap-3 border-b border-brand-border pb-5 dark:border-[#26364d]">
                <a href="/login" className="flex min-w-0 items-center gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 dark:focus-visible:ring-[#93b7f0] dark:focus-visible:ring-offset-[#0e1a2b]">
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-brand-border bg-white p-1.5 shadow-sm dark:border-[#30435f] dark:bg-white">
                    <img src="/gctu-logo.jpg" alt="GCTU logo" className="h-full w-full object-contain" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-black uppercase tracking-[0.16em] text-brand-primary dark:text-brand-accent">GCTU</span>
                    <span className="mt-1 block text-base font-semibold leading-tight text-brand-text dark:text-white">Digital Staff Promotion Support System</span>
                    <span className="mt-1 block text-xs font-medium text-brand-muted dark:text-[#b7c6da]">Official staff promotion platform</span>
                  </span>
                </a>
                <ThemeToggle compact />
              </div>

              {children}
            </div>

            <footer className="mt-5 text-center text-xs leading-5 text-brand-muted dark:text-[#b7c6da]">
              <p>&copy; 2026 Ghana Communication Technology University</p>
              <p className="mt-1">Official Digital Staff Promotion Support System</p>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
                <a href="/lecturer-portal/help" className="rounded-sm font-medium text-brand-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 dark:text-[#bfd7ff] dark:focus-visible:ring-offset-[#07111f]">
                  Help Centre
                </a>
                <span aria-hidden="true">|</span>
                <span>Privacy Policy</span>
                <span aria-hidden="true">|</span>
                <span>Terms of Use</span>
              </div>
            </footer>
          </div>
        </section>
      </div>
    </main>
  );
}
