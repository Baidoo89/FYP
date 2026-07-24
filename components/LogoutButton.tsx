'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '../lib/utils';
import { useToast } from './Toast';

export default function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('The server could not confirm sign out.');
      }

      toast.success('Signed out', 'Your session has been closed securely.');
    } catch (signOutError) {
      toast.warning('Session closed locally', signOutError instanceof Error ? signOutError.message : 'You have been returned to sign in.');
    } finally {
      setLoading(false);
      router.push('/login');
      router.refresh();
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className={cn(
        'inline-flex min-h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 disabled:opacity-60',
        className
      )}
    >
      {loading ? 'Signing out...' : 'Sign Out'}
    </button>
  );
}
