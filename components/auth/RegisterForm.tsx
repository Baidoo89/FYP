'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { registerSchema } from '../../lib/validation/auth.schema';
import GctuBrandMark from '../GctuBrandMark';

export function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verificationUrl, setVerificationUrl] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate with Zod
      const validation = registerSchema.safeParse(formData);
      if (!validation.success) {
        setError(validation.error.issues[0]?.message || 'Validation failed');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validation.data),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || 'Registration failed');
        setLoading(false);
        return;
      }

      if (data.verificationUrl) {
        setVerificationUrl(data.verificationUrl);
      }

      router.push('/check-email');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg shadow-slate-200/70 border border-slate-200">
      <GctuBrandMark
        align="center"
        size="lg"
        title="GCTU Staff Sign Up"
        subtitle="Create your official staff promotion account using your university email address."
        className="mb-6"
      />

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
          {error}
        </div>
      )}

      {verificationUrl && (
        <div className="mb-4 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Development verification link:{' '}
          <button
            type="button"
            onClick={() => router.push(verificationUrl.replace(window.location.origin, ''))}
            className="font-semibold text-teal-700 underline"
          >
            verify account
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Official Email
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="john.smith@gctu.edu.gh"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Use your official @gctu.edu.gh or @artlive.gctu.edu.gh email
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder=""
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Minimum 8 characters
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Confirm Password
          </label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder=""
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-teal-700 text-white font-semibold rounded-lg hover:bg-teal-700 disabled:bg-gray-400 transition-colors"
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>

      <p className="text-center text-sm text-gray-600 mt-6">
        Already have an account?{' '}
        <button
          onClick={() => router.push('/login')}
          className="text-teal-700 hover:text-teal-700 font-medium"
        >
          Sign in
        </button>
      </p>
    </div>
  );
}


