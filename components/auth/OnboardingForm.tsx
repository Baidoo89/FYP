'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { onboardingSchema } from '../../lib/validation/auth.schema';
import GctuBrandMark from '../GctuBrandMark';
import { useToast } from '../Toast';

const ACADEMIC_RANKS = [
  { value: 'ASSISTANT_LECTURER', label: 'Assistant Lecturer' },
  { value: 'LECTURER', label: 'Lecturer' },
  { value: 'SENIOR_LECTURER', label: 'Senior Lecturer' },
  { value: 'ASSOCIATE_PROFESSOR', label: 'Associate Professor' },
];

const DEPARTMENTS = [
  'Computer Science',
  'Engineering',
  'Business Administration',
  'Science',
  'Liberal Arts',
  'Education',
  'Health Sciences',
  'Agriculture',
  'Law',
  'Medicine',
];

export function OnboardingForm() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    department: '',
    staffId: '',
    currentRank: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
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
      const validation = onboardingSchema.safeParse(formData);
      if (!validation.success) {
        const message = validation.error.issues[0]?.message || 'Validation failed';
        setError(message);
        toast.warning('Complete staff profile', message);
        setLoading(false);
        return;
      }

      const response = await fetch('/api/auth/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validation.data),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        const message = data.error || 'Onboarding failed';
        setError(message);
        toast.error('Onboarding failed', message);
        setLoading(false);
        return;
      }

      toast.success('Profile completed', 'Your promotion workspace is ready. Redirecting to the lecturer portal.');
      router.push('/lecturer-portal');
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      toast.error('Onboarding issue', message);
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl rounded-2xl border border-brand-border bg-white p-6 shadow-enterprise dark:border-[#26364d] dark:bg-[#0e1a2b] dark:shadow-black/30 sm:p-8">
      <GctuBrandMark
        align="center"
        size="lg"
        title="Complete Your Staff Profile"
        subtitle="Add your department, staff ID, and current rank to finish your GCTU promotion system onboarding."
        className="mb-8"
      />

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-100">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="mb-2 block text-sm font-semibold text-brand-text dark:text-white">
            Department *
          </label>
          <select
            name="department"
            value={formData.department}
            onChange={handleChange}
            className="brand-input h-12 rounded-xl px-4 py-3"
            required
          >
            <option value="">Select your department</option>
            {DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-brand-muted dark:text-[#b7c6da]">
            Your academic department
          </p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-brand-text dark:text-white">
            Staff ID *
          </label>
          <input
            type="text"
            name="staffId"
            value={formData.staffId}
            onChange={handleChange}
            placeholder="GCTU/CS/2026/001"
            className="brand-input h-12 rounded-xl px-4 py-3"
            required
          />
          <p className="mt-1 text-xs text-brand-muted dark:text-[#b7c6da]">
            Enter your official university staff ID
          </p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-brand-text dark:text-white">
            Current Academic Rank *
          </label>
          <select
            name="currentRank"
            value={formData.currentRank}
            onChange={handleChange}
            className="brand-input h-12 rounded-xl px-4 py-3"
            required
          >
            <option value="">Select your academic rank</option>
            {ACADEMIC_RANKS.map((rank) => (
              <option key={rank.value} value={rank.value}>
                {rank.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-brand-muted dark:text-[#b7c6da]">
            Your current position within the university
          </p>
        </div>

        <div className="mt-8 rounded-lg border border-brand-border bg-brand-primarySoft p-4 dark:border-[#30435f] dark:bg-[#132239]">
          <p className="text-sm text-brand-text dark:text-[#d7e2f0]">
            <span className="font-semibold">Note:</span> This information will be used to evaluate your eligibility for promotion based on university standards and policies.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-8 w-full rounded-xl bg-brand-primary px-4 py-3 text-base font-semibold text-white shadow-lg shadow-brand-primary/15 transition hover:-translate-y-0.5 hover:bg-brand-primaryDark disabled:cursor-not-allowed disabled:bg-gray-400 disabled:hover:translate-y-0 dark:bg-[#315f9f] dark:hover:bg-[#244a80]"
        >
          {loading ? 'Completing Profile...' : 'Complete Profile & Continue'}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-brand-muted dark:text-[#b7c6da]">
        Your information is secure and will only be used for promotion evaluation purposes.
      </p>
    </div>
  );
}
