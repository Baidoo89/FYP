'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminSetup() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!username || !password || !email) {
      setError('All fields are required');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/admin/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create admin account');
        setLoading(false);
        return;
      }

      setSuccess('Admin account created successfully! Redirecting to login...');
      setUsername('');
      setPassword('');
      setConfirmPassword('');
      setEmail('');

      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.14),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(29,78,216,0.2),_transparent_28%),linear-gradient(135deg,_#0f172a_0%,_#102a56_42%,_#0f172a_100%)] px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-8 text-center">
          <p className="inline-block rounded-full border border-yellow-300/40 bg-yellow-400/20 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-yellow-100 sm:text-xs">Initial Configuration</p>
          <h1 className="mt-4 text-3xl font-bold text-white sm:text-4xl">Admin Setup</h1>
          <p className="mt-2 text-sm text-blue-100 sm:text-base">Create the first school management account to access the system.</p>
        </div>

        <div className="rounded-2xl border border-blue-100/70 bg-white/95 p-6 shadow-[0_28px_90px_rgba(15,23,42,0.35)] sm:p-8">
          {error && (
            <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm font-medium text-yellow-900">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-800">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="school@example.com"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-yellow-400 to-yellow-500 px-4 py-3 text-sm font-bold text-slate-900 shadow-lg transition hover:from-yellow-500 hover:to-yellow-600 disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Create Admin Account'}
            </button>
          </form>

          <div className="mt-6 border-t border-slate-200 pt-6">
            <p className="text-center text-xs text-slate-500">
              This is the initial admin setup. After creating this account, you can create additional admins from the admin panel.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
