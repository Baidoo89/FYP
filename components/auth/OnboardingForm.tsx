'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, GraduationCap, IdCard, UserRound } from 'lucide-react';
import { onboardingSchema } from '../../lib/validation/auth.schema';
import { ACADEMIC_RANK_OPTIONS } from '../../lib/promotion-ranks';
import { GCTU_FACULTY_STRUCTURE, getDepartmentsForFaculty } from '../../lib/institution-structure';
import GctuBrandMark from '../GctuBrandMark';
import { useToast } from '../Toast';

export function OnboardingForm() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    staffId: '',
    faculty: '',
    department: '',
    currentRank: '',
  });

  const departmentOptions = useMemo(() => getDepartmentsForFaculty(formData.faculty), [formData.faculty]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'faculty' ? { department: '' } : {}),
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

      toast.success('Profile completed', 'Your GCTU promotion workspace is ready.');
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
    <div className="mx-auto w-full max-w-3xl rounded-2xl border border-brand-border bg-white p-5 shadow-enterprise dark:border-[#26364d] dark:bg-[#0e1a2b] dark:shadow-black/30 sm:p-7">
      <GctuBrandMark
        align="center"
        size="lg"
        title="Complete Your Staff Profile"
        subtitle="Confirm your official identity before starting a GCTU promotion application."
        className="mb-6"
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <ProfileCue icon={UserRound} label="Staff identity" />
        <ProfileCue icon={Building2} label="Department scope" />
        <ProfileCue icon={GraduationCap} label="Current rank" />
      </div>

      {error && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-100">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First Name" required>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="Ama"
              className="brand-input h-12 rounded-xl px-4 py-3"
              autoComplete="given-name"
              required
            />
          </Field>

          <Field label="Middle Name">
            <input
              type="text"
              name="middleName"
              value={formData.middleName}
              onChange={handleChange}
              placeholder="Optional"
              className="brand-input h-12 rounded-xl px-4 py-3"
              autoComplete="additional-name"
            />
          </Field>

          <Field label="Last Name" required>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Mensah"
              className="brand-input h-12 rounded-xl px-4 py-3"
              autoComplete="family-name"
              required
            />
          </Field>

          <Field label="Staff ID" helper="Your official university staff identification number." required>
            <input
              type="text"
              name="staffId"
              value={formData.staffId}
              onChange={handleChange}
              placeholder="GCTU/CS/2026/001"
              className="brand-input h-12 rounded-xl px-4 py-3"
              required
            />
          </Field>

          <Field label="Faculty / School" required>
            <select
              name="faculty"
              value={formData.faculty}
              onChange={handleChange}
              className="brand-input h-12 rounded-xl px-4 py-3"
              required
            >
              <option value="">Select faculty or school</option>
              {GCTU_FACULTY_STRUCTURE.map((faculty) => (
                <option key={faculty.name} value={faculty.name}>
                  {faculty.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Department" required>
            <select
              name="department"
              value={formData.department}
              onChange={handleChange}
              className="brand-input h-12 rounded-xl px-4 py-3"
              disabled={!formData.faculty}
              required
            >
              <option value="">{formData.faculty ? 'Select department' : 'Select faculty first'}</option>
              {departmentOptions.map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Current Academic Rank" helper="The target promotion rank will be selected when you start a promotion application." required>
          <select
            name="currentRank"
            value={formData.currentRank}
            onChange={handleChange}
            className="brand-input h-12 rounded-xl px-4 py-3"
            required
          >
            <option value="">Select your current rank</option>
            {ACADEMIC_RANK_OPTIONS.map((rank) => (
              <option key={rank.value} value={rank.value}>
                {rank.label}
              </option>
            ))}
          </select>
        </Field>

        <div className="rounded-lg border border-brand-primary/20 bg-brand-primarySoft p-4 dark:border-[#30435f] dark:bg-[#132239]">
          <div className="flex min-w-0 items-start gap-3">
            <IdCard className="mt-0.5 h-4 w-4 shrink-0 text-brand-primary dark:text-[#8fb8f1]" aria-hidden="true" />
            <p className="text-sm leading-6 text-brand-text dark:text-[#d7e2f0]">
              Your profile stores permanent staff information only. The promotion level you are applying for is captured separately on each application.
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-brand-primary px-4 py-3 text-base font-semibold text-white shadow-lg shadow-brand-primary/15 transition hover:-translate-y-0.5 hover:bg-brand-primaryDark focus:outline-none focus:ring-4 focus:ring-brand-primary/20 disabled:cursor-not-allowed disabled:bg-gray-400 disabled:hover:translate-y-0 dark:bg-[#315f9f] dark:hover:bg-[#244a80]"
        >
          {loading ? 'Completing Profile...' : 'Complete Profile & Continue'}
        </button>
      </form>
    </div>
  );
}

function Field({ label, helper, required, children }: { label: string; helper?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="mb-2 block text-sm font-semibold text-brand-text dark:text-white">
        {label} {required && <span className="text-red-600 dark:text-red-300">*</span>}
      </span>
      {children}
      {helper && <span className="mt-1 block text-xs leading-5 text-brand-muted dark:text-[#b7c6da]">{helper}</span>}
    </label>
  );
}

function ProfileCue({ icon: Icon, label }: { icon: typeof UserRound; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-brand-border bg-brand-background px-3 py-2 text-xs font-semibold text-brand-muted dark:border-[#26364d] dark:bg-[#101d30] dark:text-[#b7c6da]">
      <Icon className="h-4 w-4 text-brand-primary dark:text-[#8fb8f1]" aria-hidden="true" />
      {label}
    </div>
  );
}
