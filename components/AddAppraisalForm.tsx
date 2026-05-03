'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import Toast from './Toast';

type LecturerOption = {
  id: number;
  name: string;
  department: string;
  rank: string;
};

type ExistingAppraisal = {
  id: number;
  lecturer_id: number;
  lecturer_name: string;
  department: string;
  rank: string;
  teaching_score: number;
  research_score: number;
  service_score: number;
  appraisal_date: string;
  reviewed_by?: string | null;
  comments?: string | null;
};

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

type AddAppraisalFormProps = {
  onSuccess?: () => void;
};

export default function AddAppraisalForm({ onSuccess }: AddAppraisalFormProps) {
  const [lecturers, setLecturers] = useState<LecturerOption[]>([]);
  const [loadingLecturers, setLoadingLecturers] = useState(true);
  const [loadingExistingAppraisal, setLoadingExistingAppraisal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
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

  const [lecturer_id, setLecturer_id] = useState('');
  const [editingAppraisalId, setEditingAppraisalId] = useState<number | null>(null);
  const [teachingScore, setTeachingScore] = useState('');
  const [researchScore, setResearchScore] = useState('');
  const [serviceScore, setServiceScore] = useState('');
  const [appraisalDate, setAppraisalDate] = useState(new Date().toISOString().slice(0, 10));
  const [reviewedBy, setReviewedBy] = useState('');
  const [comments, setComments] = useState('');

  useEffect(() => {
    async function fetchLecturers() {
      try {
        const response = await fetch('/api/lecturers?active=true');
        const payload = (await response.json()) as ApiResponse<LecturerOption[]>;

        if (!response.ok || !payload.success) {
          throw new Error(payload.error || 'Failed to load lecturers');
        }

        const options = (payload.data || []).map((lecturer) => ({
          id: Number(lecturer.id),
          name: lecturer.name,
          department: lecturer.department,
          rank: lecturer.rank,
        }));

        setLecturers(options);
      } catch (fetchError) {
        setToast({
          open: true,
          title: 'Unable to Load Lecturers',
          description: fetchError instanceof Error ? fetchError.message : 'Failed to load lecturers',
          variant: 'error',
        });
      } finally {
        setLoadingLecturers(false);
      }
    }

    fetchLecturers();
  }, []);

  useEffect(() => {
    if (!lecturer_id) {
      setEditingAppraisalId(null);
      return;
    }

    async function fetchExistingAppraisal() {
      setLoadingExistingAppraisal(true);
      setEditingAppraisalId(null);

      try {
        const response = await fetch(`/api/appraisals?lecturer_id=${lecturer_id}`);
        const payload = (await response.json()) as ApiResponse<ExistingAppraisal | null>;

        if (!response.ok || !payload.success) {
          throw new Error(payload.error || 'Failed to load existing appraisal');
        }

        const existingAppraisal = payload.data;

        if (existingAppraisal) {
          setEditingAppraisalId(existingAppraisal.id);
          setTeachingScore(String(existingAppraisal.teaching_score));
          setResearchScore(String(existingAppraisal.research_score));
          setServiceScore(String(existingAppraisal.service_score));
          setAppraisalDate(existingAppraisal.appraisal_date);
          setReviewedBy(existingAppraisal.reviewed_by ?? '');
          setComments(existingAppraisal.comments ?? '');
        } else {
          setEditingAppraisalId(null);
          setTeachingScore('');
          setResearchScore('');
          setServiceScore('');
          setAppraisalDate(new Date().toISOString().slice(0, 10));
          setReviewedBy('');
          setComments('');
        }
      } catch (loadError) {
        setToast({
          open: true,
          title: 'Unable to Load Appraisal',
          description: loadError instanceof Error ? loadError.message : 'Failed to load existing appraisal',
          variant: 'error',
        });
      } finally {
        setLoadingExistingAppraisal(false);
      }
    }

    fetchExistingAppraisal();
  }, [lecturer_id]);

  const computedPreview = useMemo(() => {
    const t = Number(teachingScore);
    const r = Number(researchScore);
    const s = Number(serviceScore);

    if ([t, r, s].some((value) => Number.isNaN(value))) {
      return null;
    }

    const total = Math.round((t * 0.5 + r * 0.3 + s * 0.2) * 100) / 100;
    const category = total >= 80 ? 'Excellent' : total >= 70 ? 'Good' : total >= 50 ? 'Average' : 'Poor';
    const recommendation = total >= 80 ? 'Recommended for Promotion' : 'Not Recommended';
    const decisionBand = total >= 80 ? 'Advance' : total >= 70 ? 'Observe' : total >= 50 ? 'Develop' : 'Intervene';
    const priorityAction =
      total >= 80
        ? 'Prioritize succession planning and promotion review.'
        : total >= 70
        ? 'Maintain targeted support and track quarterly progress.'
        : total >= 50
        ? 'Create a formal improvement plan with measurable goals.'
        : 'Initiate intensive mentoring and immediate follow-up review.';

    return { total, category, recommendation, decisionBand, priorityAction };
  }, [teachingScore, researchScore, serviceScore]);

  const resetForm = () => {
    setLecturer_id('');
    setEditingAppraisalId(null);
    setTeachingScore('');
    setResearchScore('');
    setServiceScore('');
    setAppraisalDate(new Date().toISOString().slice(0, 10));
    setReviewedBy('');
    setComments('');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setToast((previous) => ({ ...previous, open: false }));
    setSubmitting(true);
    const wasEditing = editingAppraisalId !== null;

    try {
      const response = await fetch('/api/appraisals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lecturer_id: Number(lecturer_id),
          teaching_score: Number(teachingScore),
          research_score: Number(researchScore),
          service_score: Number(serviceScore),
          appraisal_date: appraisalDate,
          reviewed_by: reviewedBy.trim() || undefined,
          comments: comments.trim() || undefined,
        }),
      });

      const payload = (await response.json()) as ApiResponse<Record<string, unknown>>;
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Failed to save appraisal');
      }

      const savedId = Number(payload.data && typeof payload.data === 'object' ? payload.data.id : undefined);

      setToast({
        open: true,
        title: wasEditing ? 'Appraisal Updated' : 'Appraisal Saved',
        description: wasEditing ? 'Existing appraisal was updated successfully.' : 'Performance record has been stored and list refreshed.',
        variant: 'success',
      });

      resetForm();

      onSuccess?.();
    } catch (submissionError) {
      setToast({
        open: true,
        title: 'Unable to Save Appraisal',
        description: submissionError instanceof Error ? submissionError.message : 'Failed to save appraisal',
        variant: 'error',
      });
    } finally {
      setSubmitting(false);
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

      <div className="brand-surface-medium p-6">
        <div className="mb-5 rounded-xl border border-amber-200 bg-gradient-to-r from-blue-50 to-amber-50 p-4">
          <h2 className="text-2xl font-bold text-slate-900">Decision Input</h2>
          <p className="mt-1 text-sm text-slate-700">Capture weighted evidence for promotion, development, and support decisions.</p>
          <p className="mt-2 text-xs font-medium text-blue-800">Weighting policy: Teaching 50% • Research 30% • Service 20%</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="lecturer" className="mb-1 block text-sm font-medium text-slate-700">Lecturer</label>
            <select
              id="lecturer"
              value={lecturer_id}
              onChange={(event) => setLecturer_id(event.target.value)}
              className="brand-input"
              required
              disabled={loadingLecturers || loadingExistingAppraisal}
            >
              <option value="">Select lecturer</option>
              {lecturers.map((lecturer) => (
                <option key={lecturer.id} value={String(lecturer.id)}>
                  {lecturer.name} ({lecturer.department})
                </option>
              ))}
            </select>
            {editingAppraisalId && (
              <p className="mt-2 text-xs font-medium text-blue-800">
                Existing appraisal loaded. Update the values below to edit the same lecturer record.
              </p>
            )}
          </div>

          <div className="brand-muted-panel p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">Scoring Inputs</p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <ScoreInput label="Teaching (50%)" value={teachingScore} onChange={setTeachingScore} />
              <ScoreInput label="Research (30%)" value={researchScore} onChange={setResearchScore} />
              <ScoreInput label="Service (20%)" value={serviceScore} onChange={setServiceScore} />
            </div>
          </div>

          <div>
            <label htmlFor="appraisalDate" className="mb-1 block text-sm font-medium text-slate-700">Appraisal Date</label>
            <input
              id="appraisalDate"
              type="date"
              value={appraisalDate}
              onChange={(event) => setAppraisalDate(event.target.value)}
              className="brand-input"
              required
            />
          </div>

          <div>
            <label htmlFor="reviewedBy" className="mb-1 block text-sm font-medium text-slate-700">Reviewed By (Optional)</label>
            <input
              id="reviewedBy"
              type="text"
              value={reviewedBy}
              onChange={(event) => setReviewedBy(event.target.value)}
              placeholder="E.g. Department Head"
              className="brand-input"
            />
          </div>

          <div>
            <label htmlFor="comments" className="mb-1 block text-sm font-medium text-slate-700">Decision Notes (Optional)</label>
            <textarea
              id="comments"
              value={comments}
              onChange={(event) => setComments(event.target.value)}
              rows={3}
              placeholder="Add evidence, concerns, or improvement actions for this decision."
              className="brand-input"
            />
          </div>

          {computedPreview && (
            <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-4 text-sm text-blue-950">
              <p><strong>Total Score:</strong> {computedPreview.total}</p>
              <p><strong>Category:</strong> {computedPreview.category}</p>
              <p><strong>Recommendation:</strong> {computedPreview.recommendation}</p>
              <p><strong>Decision Band:</strong> {computedPreview.decisionBand}</p>
              <p className="mt-2 text-blue-800"><strong>Priority Action:</strong> {computedPreview.priorityAction}</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 border-t border-slate-200 pt-1 sm:grid-cols-2">
            <button
              type="submit"
              disabled={submitting || loadingLecturers || loadingExistingAppraisal}
              className="w-full rounded-xl bg-gradient-to-r from-blue-700 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:from-blue-800 hover:to-blue-700 disabled:opacity-60"
            >
              {submitting ? 'Saving Appraisal...' : editingAppraisalId ? 'Update Appraisal' : 'Save Appraisal'}
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => {
                setToast((previous) => ({ ...previous, open: false }));
                resetForm();
              }}
              className="w-full rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-blue-50 disabled:opacity-60"
            >
              Clear
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

type ScoreInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

function ScoreInput({ label, value, onChange }: ScoreInputProps) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <input
        type="number"
        min={0}
        max={100}
        step={0.1}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="brand-input"
        required
      />
    </div>
  );
}
