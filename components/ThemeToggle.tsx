'use client';

import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

type ThemeToggleProps = {
  compact?: boolean;
};

const STORAGE_KEY = 'gctu-theme';

function getPreferredTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === 'dark' || stored === 'light') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.documentElement.style.colorScheme = theme;
}

export default function ThemeToggle({ compact = false }: ThemeToggleProps) {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const preferred = getPreferredTheme();
    setTheme(preferred);
    applyTheme(preferred);
    setMounted(true);
  }, []);

  function toggleTheme() {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
    applyTheme(nextTheme);
  }

  const isDark = theme === 'dark';
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode';

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={toggleTheme}
      className={[
        'theme-toggle inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-950',
        compact ? 'h-10 w-10' : 'h-10 gap-2 px-3',
      ].join(' ')}
    >
      <span className="sr-only">{label}</span>
      <span className="relative flex h-5 w-5 items-center justify-center" aria-hidden="true">
        {mounted && isDark ? <MoonIcon /> : <SunIcon />}
      </span>
      {!compact && <span className="hidden text-xs font-semibold sm:inline">{mounted && isDark ? 'Dark' : 'Light'}</span>}
    </button>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.99 12.65A8.5 8.5 0 1 1 11.35 3.01 6.5 6.5 0 0 0 20.99 12.65Z" />
    </svg>
  );
}
