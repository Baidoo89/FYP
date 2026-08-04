'use client';

import { useState } from 'react';
import { GCTU_FACULTY_STRUCTURE } from '../lib/institution-structure';
import type { Lecturer, ApiResponse } from '../types';
import Toast from './Toast';

interface LecturerFormProps {
  onSuccess?: () => void;
}

export default function AddLecturerForm({ onSuccess }: LecturerFormProps) {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    open: boolean;
    title: string;
    description: string;
    variant: 'success' | 'error';
  }>({
    open: false,
    title: '',
    description: '',
    variant: 'success',
  });
  const [formData, setFormData] = useState<Lecturer>({
    name: '',
    email: '',
    department: '',
    rank: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setToast((previous) => ({ ...previous, open: false }));

    try {
      const response = await fetch('/api/lecturers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = (await response.json()) as ApiResponse<Lecturer>;

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add lecturer');
      }

      setToast({
        open: true,
        title: 'Staff Record Created',
        description: 'Staff record saved successfully and directory refreshed.',
        variant: 'success',
      });
      setFormData({
        name: '',
        email: '',
        department: '',
        rank: '',
      });
      onSuccess?.();
    } catch (err) {
      setToast({
        open: true,
        title: 'Unable to Create Staff Record',
        description: err instanceof Error ? err.message : 'An error occurred',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Toast
        open={toast.open}
        title={toast.title}
        description={toast.description}
        variant={toast.variant}
        onClose={() => setToast((previous) => ({ ...previous, open: false }))}
      />

      <div className="pro-card p-6">
        <div className="mb-5 rounded-xl border border-amber-200 bg-gradient-to-r from-slate-50 to-amber-50 p-4">
          <h2 className="text-2xl font-bold text-slate-900">Create Staff Record</h2>
          <p className="mt-1 text-sm text-slate-700">Create a lecturer profile to support promotion applications, eligibility checks, and official reporting.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-700">
            Full Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            autoComplete="name"
              className="brand-input"
            placeholder="Dr. Ama Mensah"
          />
        </div>

        {/* Email */}
        <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
            Email *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            autoComplete="email"
              className="brand-input"
            placeholder="ama.mensah@live.gctu.edu.gh"
          />
        </div>

        {/* Department */}
        <div>
            <label htmlFor="department" className="mb-1 block text-sm font-medium text-slate-700">
            Department *
          </label>
          <select
            id="department"
            name="department"
            value={formData.department}
            onChange={handleChange}
            required
              className="brand-input"
          >
            <option value="">Select Department</option>
            {GCTU_FACULTY_STRUCTURE.map((faculty) => (
              <optgroup key={faculty.name} label={faculty.name}>
                {faculty.departments.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Rank */}
        <div>
            <label htmlFor="rank" className="mb-1 block text-sm font-medium text-slate-700">
            Rank/Position *
          </label>
          <select
            id="rank"
            name="rank"
            value={formData.rank}
            onChange={handleChange}
            required
              className="brand-input"
          >
            <option value="">Select Rank</option>
            <option value="Lecturer">Lecturer</option>
            <option value="Senior Lecturer">Senior Lecturer</option>
            <option value="Associate Professor">Associate Professor</option>
            <option value="Professor">Professor</option>
          </select>
        </div>

        {/* Submit Button */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="submit"
            disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-teal-700 to-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:from-teal-800 hover:to-teal-700 disabled:opacity-60"
          >
            {loading ? 'Creating Record...' : 'Create Record'}
          </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setToast((previous) => ({ ...previous, open: false }));
                setFormData({
                  name: '',
                  email: '',
                  department: '',
                  rank: '',
                });
              }}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              Clear
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
