'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { AlertTriangle, CheckCircle2, Info, Loader2, X, XCircle } from 'lucide-react';

type ToastVariant = 'success' | 'error' | 'warning' | 'info' | 'loading';

type ToastAction = {
  label: string;
  onClick: () => void;
};

type ToastOptions = {
  id?: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
  durationMs?: number | null;
  action?: ToastAction;
};

type ToastRecord = Required<Pick<ToastOptions, 'id' | 'title' | 'variant'>> &
  Omit<ToastOptions, 'id' | 'title' | 'variant'> & {
    createdAt: number;
  };

type ToastContextValue = {
  showToast: (toast: ToastOptions) => string;
  dismissToast: (id: string) => void;
  dismissAll: () => void;
  success: (title: string, description?: string, options?: Omit<ToastOptions, 'title' | 'description' | 'variant'>) => string;
  error: (title: string, description?: string, options?: Omit<ToastOptions, 'title' | 'description' | 'variant'>) => string;
  warning: (title: string, description?: string, options?: Omit<ToastOptions, 'title' | 'description' | 'variant'>) => string;
  info: (title: string, description?: string, options?: Omit<ToastOptions, 'title' | 'description' | 'variant'>) => string;
  loading: (title: string, description?: string, options?: Omit<ToastOptions, 'title' | 'description' | 'variant'>) => string;
};

type ToastProps = {
  open: boolean;
  title: string;
  description?: string;
  variant?: ToastVariant;
  onClose: () => void;
  durationMs?: number | null;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const defaultDurations: Record<ToastVariant, number | null> = {
  success: 3800,
  info: 4200,
  warning: 5600,
  error: 6500,
  loading: null,
};

const variantClasses: Record<ToastVariant, string> = {
  success: 'border-emerald-200/80 bg-emerald-50/95 text-emerald-950 shadow-emerald-950/10 dark:border-emerald-400/25 dark:bg-[#0d2a22]/95 dark:text-emerald-50',
  error: 'border-rose-200/80 bg-rose-50/95 text-rose-950 shadow-rose-950/10 dark:border-rose-400/25 dark:bg-[#321421]/95 dark:text-rose-50',
  warning: 'border-amber-200/90 bg-amber-50/95 text-amber-950 shadow-amber-950/10 dark:border-amber-300/30 dark:bg-[#322610]/95 dark:text-amber-50',
  info: 'border-sky-200/80 bg-sky-50/95 text-sky-950 shadow-sky-950/10 dark:border-sky-300/25 dark:bg-[#10243d]/95 dark:text-sky-50',
  loading: 'border-brand-primary/20 bg-white/95 text-brand-text shadow-slate-950/10 dark:border-[#30435f] dark:bg-[#0e1a2b]/95 dark:text-white',
};

const iconClasses: Record<ToastVariant, string> = {
  success: 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-emerald-950',
  error: 'bg-rose-600 text-white dark:bg-rose-400 dark:text-rose-950',
  warning: 'bg-amber-500 text-white dark:bg-amber-300 dark:text-amber-950',
  info: 'bg-brand-primary text-white dark:bg-[#93b7f0] dark:text-[#07111f]',
  loading: 'bg-brand-primarySoft text-brand-primary dark:bg-[#18345a] dark:text-[#bfd7ff]',
};

function createToastId() {
  return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function iconFor(variant: ToastVariant) {
  if (variant === 'success') return <CheckCircle2 className="h-4 w-4" aria-hidden="true" />;
  if (variant === 'error') return <XCircle className="h-4 w-4" aria-hidden="true" />;
  if (variant === 'warning') return <AlertTriangle className="h-4 w-4" aria-hidden="true" />;
  if (variant === 'loading') return <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />;
  return <Info className="h-4 w-4" aria-hidden="true" />;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  const showToast = useCallback((toast: ToastOptions) => {
    const id = toast.id || createToastId();
    const variant = toast.variant || 'info';
    const nextToast: ToastRecord = {
      ...toast,
      id,
      title: toast.title,
      variant,
      durationMs: toast.durationMs === undefined ? defaultDurations[variant] : toast.durationMs,
      createdAt: Date.now(),
    };

    setToasts((current) => [nextToast, ...current.filter((item) => item.id !== id)].slice(0, 5));
    return id;
  }, []);

  const value = useMemo<ToastContextValue>(() => ({
    showToast,
    dismissToast,
    dismissAll,
    success: (title, description, options) => showToast({ ...options, title, description, variant: 'success' }),
    error: (title, description, options) => showToast({ ...options, title, description, variant: 'error' }),
    warning: (title, description, options) => showToast({ ...options, title, description, variant: 'warning' }),
    info: (title, description, options) => showToast({ ...options, title, description, variant: 'info' }),
    loading: (title, description, options) => showToast({ ...options, title, description, variant: 'loading', durationMs: options?.durationMs ?? null }),
  }), [dismissAll, dismissToast, showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

function ToastViewport({ toasts, onDismiss }: { toasts: ToastRecord[]; onDismiss: (id: string) => void }) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-label="System notifications"
      className="pointer-events-none fixed inset-x-3 top-3 z-[90] flex flex-col gap-3 sm:inset-x-auto sm:right-4 sm:top-4 sm:w-[min(92vw,25rem)]"
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastCard({ toast, onDismiss }: { toast: ToastRecord; onDismiss: (id: string) => void }) {
  useEffect(() => {
    if (!toast.durationMs) return;

    const timeout = window.setTimeout(() => {
      onDismiss(toast.id);
    }, toast.durationMs);

    return () => window.clearTimeout(timeout);
  }, [onDismiss, toast.durationMs, toast.id]);

  const role = toast.variant === 'error' || toast.variant === 'warning' ? 'alert' : 'status';
  const live = toast.variant === 'error' || toast.variant === 'warning' ? 'assertive' : 'polite';

  return (
    <div
      role={role}
      aria-live={live}
      className={`pointer-events-auto overflow-hidden rounded-xl border p-4 shadow-2xl backdrop-blur-xl transition duration-200 lpads-fade-in ${variantClasses[toast.variant]}`}
    >
      <div className="flex items-start gap-3">
        <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconClasses[toast.variant]}`}>
          {iconFor(toast.variant)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold leading-5">{toast.title}</p>
          {toast.description && <p className="mt-1 text-xs leading-5 opacity-90">{toast.description}</p>}
          {toast.action && (
            <button
              type="button"
              onClick={toast.action.onClick}
              className="mt-3 rounded-md border border-current/20 px-2.5 py-1.5 text-xs font-bold transition hover:bg-current/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/40"
            >
              {toast.action.label}
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          aria-label="Close notification"
          className="-mr-1 -mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg opacity-70 transition hover:bg-current/10 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/35"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export default function Toast({
  open,
  title,
  description,
  variant = 'info',
  onClose,
  durationMs = 3800,
}: ToastProps) {
  const id = 'standalone-toast';

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-x-3 top-3 z-[90] sm:inset-x-auto sm:right-4 sm:top-4 sm:w-[min(92vw,25rem)]">
      <ToastCard
        toast={{ id, title, description, variant, durationMs, createdAt: Date.now() }}
        onDismiss={() => onClose()}
      />
    </div>
  );
}