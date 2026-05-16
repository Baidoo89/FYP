'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { onboardingSchema } from '../../lib/validation/auth.schema';

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
      // Validate with Zod
      const validation = onboardingSchema.safeParse(formData);
      if (!validation.success) {
        setError(validation.error.issues[0]?.message || 'Validation failed');
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
        setError(data.error || 'Onboarding failed');
        setLoading(false);
        return;
      }

      // Redirect to the lecturer portal after onboarding
      router.push('/lecturer-portal');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-8 bg-white rounded-lg shadow-md border border-blue-100">
      <h1 className="text-3xl font-bold text-center mb-2 text-blue-900">
        Complete Your Staff Profile
      </h1>
      <p className="text-center text-gray-600 mb-8">
        Add your department, staff ID, and current rank to finish onboarding
      </p>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Department *
          </label>
          <select
            name="department"
            value={formData.department}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select your department</option>
            {DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Your academic department
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Staff ID *
          </label>
          <input
            type="text"
            name="staffId"
            value={formData.staffId}
            onChange={handleChange}
            placeholder="GCTU/CS/2026/001"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter your official university staff ID
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Current Academic Rank *
          </label>
          <select
            name="currentRank"
            value={formData.currentRank}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select your academic rank</option>
            {ACADEMIC_RANKS.map((rank) => (
              <option key={rank.value} value={rank.value}>
                {rank.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Your current position within the university
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-8">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">Note:</span> This information will be used to evaluate your eligibility for promotion based on university standards and policies.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors text-lg mt-8"
        >
          {loading ? 'Completing Profile...' : 'Complete Profile & Continue'}
        </button>
      </form>

      <p className="text-center text-xs text-gray-500 mt-6">
        Your information is secure and will only be used for promotion evaluation purposes.
      </p>
    </div>
  );
}
