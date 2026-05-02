'use client';

import { useEffect } from 'react';

type ToastVariant = 'success' | 'error' | 'info';

type ToastProps = {
  open: boolean;
  title: string;
  description?: string;
  variant?: ToastVariant;
  onClose: () => void;
  durationMs?: number;
};

const variantClasses: Record<ToastVariant, string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  error: 'border-rose-200 bg-rose-50 text-rose-900',
  info: 'border-sky-200 bg-sky-50 text-sky-900',
};

export default function Toast({
  open,
  title,
  description,
  variant = 'info',
  onClose,
  durationMs = 2800,
}: ToastProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const timeout = setTimeout(() => {
      onClose();
    }, durationMs);

    return () => clearTimeout(timeout);
  }, [durationMs, onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed right-4 top-4 z-50 w-[min(92vw,360px)]">
      <div
        role="status"
        aria-live="polite"
        className={`rounded-lg border px-4 py-3 shadow-lg backdrop-blur ${variantClasses[variant]}`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold">{title}</p>
            {description && <p className="mt-1 text-xs opacity-90">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close notification"
            className="text-xs opacity-70 hover:opacity-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
