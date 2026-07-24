'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { EmptyState, ErrorState, LoadingState } from '../../../components/enterprise-ui';
import StatusBadge from '../../../components/promotion/StatusBadge';
import StartPromotionRequestCard from '../../../components/promotion/StartPromotionRequestCard';
import { useToast } from '../../../components/Toast';

type DocumentCategory =
  | 'TEACHING'
  | 'RESEARCH'
  | 'SERVICE'
  | 'QUALIFICATIONS'
  | 'PUBLICATIONS'
  | 'PROFESSIONAL_DEVELOPMENT'
  | 'OTHER_SUPPORTING_EVIDENCE';

type EvidenceDocument = {
  id: number;
  category: DocumentCategory;
  title: string;
  fileUrl: string;
  fileName?: string | null;
  mimeType?: string | null;
  verificationStatus: string;
  verificationComment?: string | null;
  uploadedAt: string;
  verifiedAt?: string | null;
  size?: number | null;
  required?: boolean;
  verifiedBy?: {
    name?: string | null;
    role?: string | null;
  } | null;
};

type EvidenceData = {
  request?: {
    id: number;
    currentRank: string;
    targetRank: string;
    status: string;
    eligibilityStatus: string;
    eligibilityReason?: string | null;
    totalScore?: number | null;
    updatedAt?: string;
  } | null;
  currentRank: string;
  targetRank: string | null;
  criteria?: {
    minimumYearsInCurrentRank?: number | null;
    minimumTotalScore?: number | null;
    publicationRequirement?: string | null;
    professionalDevelopmentRequirement?: string | null;
  } | null;
  categories: DocumentCategory[];
  requiredCategories: DocumentCategory[];
  categoryStatus: Array<{
    category: DocumentCategory;
    required: boolean;
    uploaded: boolean;
    status: string;
    document?: EvidenceDocument | null;
  }>;
  documents: EvidenceDocument[];
  grouped: Record<DocumentCategory, EvidenceDocument[]>;
  stats: {
    totalDocuments: number;
    requiredCategories: number;
    requiredUploadedCount: number;
    requiredVerifiedCount: number;
    verifiedCount: number;
    pendingCount: number;
    returnedCount: number;
    rejectedCount: number;
  };
};

type EvidenceResponse = {
  success: boolean;
  data?: EvidenceData;
  error?: string;
};

const MAX_CLIENT_PDF_SIZE = 10 * 1024 * 1024;

const CATEGORY_ORDER: DocumentCategory[] = [
  'TEACHING',
  'RESEARCH',
  'SERVICE',
  'QUALIFICATIONS',
  'PUBLICATIONS',
  'PROFESSIONAL_DEVELOPMENT',
  'OTHER_SUPPORTING_EVIDENCE',
];

const CATEGORY_INFO: Record<DocumentCategory, { title: string; code: string; description: string; examples: string }> = {
  TEACHING: {
    title: 'Teaching Evidence',
    code: 'TEA',
    description: 'Teaching performance, course delivery, course design, assessment quality, and student learning evidence.',
    examples: 'Student evaluations, course outlines, assessment samples, supervision records.',
  },
  RESEARCH: {
    title: 'Research Evidence',
    code: 'RES',
    description: 'Scholarly output and research contribution that supports promotion readiness.',
    examples: 'Journal articles, conference papers, books, funded research records.',
  },
  SERVICE: {
    title: 'Service Evidence',
    code: 'SRV',
    description: 'University, faculty, department, professional, and community service contributions.',
    examples: 'Committee appointments, leadership letters, service reports, outreach records.',
  },
  QUALIFICATIONS: {
    title: 'Qualifications',
    code: 'QLF',
    description: 'Academic and professional credentials relevant to the promotion application.',
    examples: 'Certificates, transcripts, professional memberships, licenses.',
  },
  PUBLICATIONS: {
    title: 'Publications',
    code: 'PUB',
    description: 'Publication-specific documentation where criteria require separate publication evidence.',
    examples: 'Publication list, indexed publication proof, acceptance letters, citations.',
  },
  PROFESSIONAL_DEVELOPMENT: {
    title: 'Professional Development',
    code: 'PDV',
    description: 'Training, workshops, conferences, certifications, and capacity-building activities.',
    examples: 'Workshop certificates, CPD records, conference participation, training reports.',
  },
  OTHER_SUPPORTING_EVIDENCE: {
    title: 'Other Supporting Evidence',
    code: 'OTH',
    description: 'Additional documents that strengthen the promotion file but are not part of the core categories.',
    examples: 'Awards, letters, commendations, special assignments, additional proof.',
  },
};

function label(value?: string | null) {
  if (!value) return 'Not available';
  return value.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase());
}

function formatDate(value?: string | null) {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not recorded';
  return new Intl.DateTimeFormat('en-GH', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

function formatBytes(size?: number | null) {
  if (!size) return 'PDF document';
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function statusTone(status: string) {
  if (status === 'VERIFIED') return 'border-teal-200 bg-teal-50 text-teal-800';
  if (status === 'PENDING') return 'border-amber-200 bg-amber-50 text-amber-900';
  if (status === 'REQUIRES_CORRECTION') return 'border-orange-200 bg-orange-50 text-orange-900';
  if (status === 'REJECTED') return 'border-rose-200 bg-rose-50 text-rose-800';
  return 'border-gray-200 bg-gray-50 text-gray-600';
}

function categoryDocuments(data: EvidenceData, category: DocumentCategory) {
  return data.grouped?.[category] || [];
}

export default function EvidencePage() {
  const toast = useToast();
  const [data, setData] = useState<EvidenceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory>('TEACHING');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [resubmitting, setResubmitting] = useState(false);
  const [resubmitMessage, setResubmitMessage] = useState('');
  const [fileInputKey, setFileInputKey] = useState(0);

  async function loadEvidence() {
    setLoading(true);
    try {
      const response = await fetch('/api/lecturer/evidence', { cache: 'no-store' });
      const payload = (await response.json()) as EvidenceResponse;

      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.error || 'Failed to load evidence');
      }

      setData(payload.data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load evidence data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEvidence();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const categoryParam = params.get('category');
    const titleParam = params.get('title');

    if (categoryParam && CATEGORY_ORDER.includes(categoryParam as DocumentCategory)) {
      setSelectedCategory(categoryParam as DocumentCategory);
    }

    if (titleParam) {
      setUploadTitle(titleParam);
      setUploadMessage('');
    }
  }, []);

  const selectedDocs = data ? categoryDocuments(data, selectedCategory) : [];
  const latestSelectedDoc = selectedDocs[0] || null;
  const selectedInfo = CATEGORY_INFO[selectedCategory];
  const selectedRequired = Boolean(data?.requiredCategories.includes(selectedCategory));
  const readinessPercent = data?.stats.requiredCategories
    ? Math.round((data.stats.requiredVerifiedCount / data.stats.requiredCategories) * 100)
    : 0;
  const missingRequired = useMemo(() => {
    if (!data) return [];
    return data.requiredCategories.filter((category) => categoryDocuments(data, category).length === 0);
  }, [data]);
  const attentionDocuments = useMemo(() => {
    if (!data) return [];
    return data.documents.filter((document) => ['REQUIRES_CORRECTION', 'REJECTED'].includes(document.verificationStatus || ''));
  }, [data]);
  const isReturnedApplication = data?.request?.status === 'RETURNED_FOR_CORRECTION';
  const uploadLocked = Boolean(data?.request && !['DRAFT', 'RETURNED_FOR_CORRECTION'].includes(data.request.status));
  const correctionReady = Boolean(isReturnedApplication && data?.request?.id && attentionDocuments.length === 0);
  const needsAttentionCount = (data?.stats.returnedCount || 0) + (data?.stats.rejectedCount || 0);
  const needsAttentionDetail = needsAttentionCount === 0
    ? 'No document issues'
    : data?.stats.rejectedCount
      ? `${data.stats.rejectedCount} rejected, ${data.stats.returnedCount} correction`
      : `${data?.stats.returnedCount || 0} correction required`;

  async function handleUpload() {
    if (!uploadTitle.trim()) {
      const message = 'Please enter a document title.';
      setUploadMessage(message);
      toast.warning('Document title required', message);
      return;
    }

    if (!uploadFile) {
      const message = 'Please select a PDF file to upload.';
      setUploadMessage(message);
      toast.warning('PDF file required', message);
      return;
    }

    if (uploadLocked) {
      const message = 'Evidence upload is locked while this application is under review. Uploads reopen only if the file is returned for correction.';
      setUploadMessage(message);
      toast.warning('Evidence upload locked', message);
      return;
    }

    setUploading(true);
    setUploadMessage('');
    setResubmitMessage('');

    try {
      const formData = new FormData();
      formData.append('title', uploadTitle.trim());
      formData.append('category', selectedCategory);
      formData.append('file', uploadFile);

      const response = await fetch('/api/lecturer/evidence', {
        method: 'POST',
        body: formData,
      });

      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Failed to upload evidence');
      }

      const message = latestSelectedDoc ? 'Evidence replaced successfully and returned to pending verification.' : 'Evidence uploaded successfully and is pending verification.';
      setUploadMessage(message);
      toast.success(latestSelectedDoc ? 'Evidence replaced' : 'Evidence uploaded', message);
      setUploadTitle('');
      setUploadFile(null);
      setFileInputKey((key) => key + 1);
      await loadEvidence();
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : 'Upload failed';
      setUploadMessage(message);
      toast.error('Evidence upload failed', message);
    } finally {
      setUploading(false);
    }
  }

  async function handleResubmit() {
    if (!data?.request?.id) return;

    setResubmitting(true);
    setResubmitMessage('');
    setUploadMessage('');

    try {
      const response = await fetch('/api/promotion-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'submit', requestId: data.request.id }),
      });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Unable to resubmit corrected application');
      }

      const message = 'Corrected application resubmitted successfully. Department review can now continue.';
      setResubmitMessage(message);
      toast.success('Application resubmitted', message);
      await loadEvidence();
    } catch (resubmitError) {
      const message = resubmitError instanceof Error ? resubmitError.message : 'Unable to resubmit corrected application';
      setResubmitMessage(message);
      toast.error('Resubmission failed', message);
    } finally {
      setResubmitting(false);
    }
  }

  function chooseCategory(category: DocumentCategory) {
    const existing = data ? categoryDocuments(data, category)[0] : null;
    setSelectedCategory(category);
    setUploadMessage('');
    setResubmitMessage('');
    setUploadTitle(existing?.title || '');
    setUploadFile(null);
    setFileInputKey((key) => key + 1);
  }

  function handleFileSelection(file?: File | null) {
    setUploadMessage('');

    if (!file) {
      setUploadFile(null);
      return;
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      const message = 'Please choose a PDF file.';
      setUploadFile(null);
      setUploadMessage(message);
      toast.warning('Invalid file type', message);
      setFileInputKey((key) => key + 1);
      return;
    }

    if (file.size > MAX_CLIENT_PDF_SIZE) {
      const message = 'File size exceeds 10MB limit.';
      setUploadFile(null);
      setUploadMessage(message);
      toast.warning('File too large', message);
      setFileInputKey((key) => key + 1);
      return;
    }

    setUploadFile(file);
  }

  if (loading) {
    return <LoadingState label="Loading evidence portfolio..." />;
  }

  if (error || !data) {
    return <ErrorState message={error || 'Failed to load evidence portfolio'} />;
  }

  if (!data.request) {
    return (
      <div className="min-w-0 space-y-6">
        <section className="pro-hero px-4 py-6 sm:px-6 sm:py-8">
          <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="pro-eyebrow">Evidence Portfolio</div>
              <h1 className="mt-4 break-words text-2xl font-bold tracking-tight text-gray-950 sm:text-4xl">Start Your Promotion Application</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-600">
                Select the promotion rank you are applying for before uploading evidence. This keeps your workflow, eligibility rules, and HOD/Dean review aligned.
              </p>
            </div>
          </div>
        </section>

        <StartPromotionRequestCard currentRank={data.currentRank} onCreated={() => loadEvidence()} />

        <section className="pro-card p-5">
          <EmptyState
            title="Evidence upload is locked until an application is started"
            description="After you select the target promotion rank, the required evidence categories and PDF upload controls will appear here."
          />
        </section>

        <Link href="/lecturer-portal" className="inline-flex rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50">
          Back to Dashboard
        </Link>
      </div>
    );
  }
  return (
    <div className="min-w-0 space-y-6">
      <section className="pro-hero px-4 py-6 sm:px-6 sm:py-8">
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="pro-eyebrow">Evidence Portfolio</div>
            <h1 className="mt-4 break-words text-2xl font-bold tracking-tight text-gray-950 sm:text-4xl">Promotion Evidence Workspace</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-600">
              Upload, replace, and track official promotion evidence. Required categories must be verified before eligibility can be calculated.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/lecturer-portal/application" className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm hover:bg-gray-50">
              Track Application
            </Link>
            <Link href="/notifications" className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-800">
              Notifications
            </Link>
          </div>
        </div>
      </section>

      <section className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <PortfolioMetric code="REQ" label="Required verified" value={`${data.stats.requiredVerifiedCount}/${data.stats.requiredCategories}`} detail={`${readinessPercent}% readiness`} />
        <PortfolioMetric code="DOC" label="Uploaded documents" value={data.stats.totalDocuments} detail="Across active application" />
        <PortfolioMetric code="PEN" label="Pending review" value={data.stats.pendingCount} detail="Awaiting HR decision" tone="amber" />
        <PortfolioMetric code="RET" label="Needs attention" value={needsAttentionCount} detail={needsAttentionDetail} tone="rose" />
      </section>

      <section className="pro-card min-w-0 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="break-words text-lg font-bold text-gray-950">Application Evidence Readiness</h2>
            <p className="mt-1 text-sm leading-6 text-gray-600">
              {data.request ? `${label(data.request.currentRank)} to ${label(data.request.targetRank)} | ${label(data.request.status)}` : `${label(data.currentRank)} to ${label(data.targetRank)} draft evidence plan`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.request?.status && <StatusBadge status={data.request.status} />}
            {data.request?.eligibilityStatus && <StatusBadge status={data.request.eligibilityStatus} />}
          </div>
        </div>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-gray-100">
          <div className="h-full rounded-full bg-teal-700" style={{ width: `${Math.max(readinessPercent, data.stats.requiredVerifiedCount ? 8 : 0)}%` }} />
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <GuidanceTile title="Required categories" value={data.requiredCategories.map((category) => CATEGORY_INFO[category].title).join(', ')} />
          <GuidanceTile title="Minimum years" value={data.criteria?.minimumYearsInCurrentRank ?? 'Configured by HR'} />
          <GuidanceTile title="Minimum score" value={data.criteria?.minimumTotalScore ? `${data.criteria.minimumTotalScore}%` : 'Not score-based'} />
        </div>
        {missingRequired.length > 0 && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
            <p className="font-semibold">Missing required evidence</p>
            <p className="mt-1 leading-6">Upload: {missingRequired.map((category) => CATEGORY_INFO[category].title).join(', ')}.</p>
          </div>
        )}
      </section>

      {isReturnedApplication && (
        <section className={`pro-card p-5 ${correctionReady ? 'border-emerald-200 bg-emerald-50/60' : 'border-amber-200 bg-amber-50/60'}`}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className={`text-xs font-bold uppercase tracking-[0.16em] ${correctionReady ? 'text-emerald-800' : 'text-amber-800'}`}>
                Returned application
              </p>
              <h2 className="mt-2 text-xl font-bold text-gray-950">
                {correctionReady ? 'Corrections ready for resubmission' : 'Correction required before resubmission'}
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-700">
                {correctionReady
                  ? 'All returned evidence has been replaced and is pending verification. Resubmit the application so the department review can continue.'
                  : 'Replace each returned or rejected evidence file. Once all issues are cleared, you can resubmit the corrected application.'}
              </p>
            </div>
            {correctionReady && (
              <button
                type="button"
                onClick={handleResubmit}
                disabled={resubmitting}
                className="rounded-lg bg-teal-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {resubmitting ? 'Resubmitting...' : 'Resubmit Corrected Application'}
              </button>
            )}
          </div>

          {!correctionReady && attentionDocuments.length > 0 && (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {attentionDocuments.map((document) => (
                <button
                  key={document.id}
                  type="button"
                  onClick={() => chooseCategory(document.category)}
                  className="rounded-lg border border-amber-200 bg-white p-3 text-left text-sm transition hover:bg-amber-50"
                >
                  <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold text-gray-950">{document.title}</p>
                      <p className="mt-1 text-xs font-medium text-gray-600">{CATEGORY_INFO[document.category].title}</p>
                    </div>
                    <StatusBadge status={document.verificationStatus || 'PENDING'} />
                  </div>
                  {document.verificationComment && <p className="mt-2 text-xs leading-5 text-amber-950">{document.verificationComment}</p>}
                </button>
              ))}
            </div>
          )}

          {resubmitMessage && (
            <p className={`mt-4 text-sm font-semibold ${resubmitMessage.includes('successfully') ? 'text-emerald-800' : 'text-amber-900'}`}>
              {resubmitMessage}
            </p>
          )}
        </section>
      )}
      <section className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)]">
        <div className="pro-card overflow-hidden">
          <div className="border-b border-gray-200 p-5">
            <h2 className="break-words text-lg font-bold text-gray-950">Evidence Categories</h2>
            <p className="mt-1 text-sm text-gray-600">Select a category to upload, replace, or inspect evidence.</p>
          </div>
          <div className="grid gap-3 p-4 md:grid-cols-2">
            {CATEGORY_ORDER.map((category) => {
              const info = CATEGORY_INFO[category];
              const row = data.categoryStatus.find((item) => item.category === category);
              const active = selectedCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => chooseCategory(category)}
                  className={`rounded-xl border p-4 text-left transition ${active ? 'border-teal-600 bg-teal-50 shadow-sm' : 'border-gray-200 bg-white hover:border-teal-200 hover:bg-gray-50'}`}
                >
                  <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-xs font-black text-teal-800">{info.code}</span>
                      <div className="min-w-0">
                        <p className="break-words font-bold text-gray-950">{info.title}</p>
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-600">{info.description}</p>
                      </div>
                    </div>
                    {row?.required && <span className="w-fit shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-900">Required</span>}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusTone(row?.status || 'MISSING')}`}>{row?.status === 'MISSING' ? 'Missing' : label(row?.status)}</span>
                    <span className="text-xs text-gray-500">{categoryDocuments(data, category).length} file(s)</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="pro-card min-w-0 p-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div>
              <div className="flex min-w-0 items-center gap-2">
                <span className="pro-code-badge">{selectedInfo.code}</span>
                <h2 className="break-words text-lg font-bold text-gray-950">{selectedInfo.title}</h2>
              </div>
              <p className="mt-3 text-sm leading-6 text-gray-600">{selectedInfo.description}</p>
              <p className="mt-2 text-xs font-medium text-gray-500">Examples: {selectedInfo.examples}</p>
            </div>
            <span className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${selectedRequired ? 'bg-amber-100 text-amber-900' : 'bg-gray-100 text-gray-700'}`}>
              {selectedRequired ? 'Required' : 'Supporting'}
            </span>
          </div>

          {latestSelectedDoc && (
            <div className="mt-5 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Current file</p>
                  <p className="mt-1 break-words font-semibold text-gray-950">{latestSelectedDoc.title}</p>
                  <p className="mt-1 break-words text-xs text-gray-500">{formatBytes(latestSelectedDoc.size)} | Uploaded {formatDate(latestSelectedDoc.uploadedAt)}</p>
                </div>
                <StatusBadge status={latestSelectedDoc.verificationStatus || 'PENDING'} />
              </div>
              {latestSelectedDoc.verificationComment && (
                <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-950">{latestSelectedDoc.verificationComment}</p>
              )}
            </div>
          )}

          <div className="mt-5 rounded-xl border-2 border-dashed border-teal-200 bg-teal-50/50 p-5">
            <h3 className="font-bold text-gray-950">{latestSelectedDoc ? 'Replace Evidence' : 'Upload Evidence'}</h3>
            <p className="mt-1 text-sm leading-6 text-gray-600">
              {latestSelectedDoc ? 'Uploading a new PDF replaces the current file in this category and resets HR verification to pending.' : 'Upload one PDF for this category. You may replace it later if HR requests correction.'}
            </p>

            {uploadLocked && (
              <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-700">
                Evidence upload is locked while this application is under active review. If HR or the department returns the file for correction, replacement controls will reopen here.
              </div>
            )}

            <div className="mt-4 grid gap-3">
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase tracking-[0.14em] text-gray-600">Document Title</span>
                <input
                  value={uploadTitle}
                  onChange={(event) => setUploadTitle(event.target.value)}
                  disabled={uploadLocked}
                  className="brand-input disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
                  placeholder={`Enter ${selectedInfo.title.toLowerCase()} title`}
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase tracking-[0.14em] text-gray-600">PDF File</span>
                <input
                  key={fileInputKey}
                  type="file"
                  accept="application/pdf"
                  onChange={(event) => handleFileSelection(event.target.files?.[0] || null)}
                  disabled={uploadLocked}
                  className="block w-full max-w-full overflow-hidden rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-xs text-gray-900 file:mr-2 file:rounded-md file:border-0 file:bg-teal-700 file:px-2 file:py-2 file:text-xs file:font-semibold file:text-white disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 sm:text-sm sm:file:mr-3 sm:file:px-3 sm:file:text-sm"
                />
              </label>
            </div>

            <button
              type="button"
              onClick={handleUpload}
              disabled={uploading || uploadLocked}
              className="mt-4 rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {uploading ? 'Uploading...' : latestSelectedDoc ? 'Replace Evidence' : 'Upload Evidence'}
            </button>

            {uploadMessage && (
              <p className={`mt-3 text-sm font-medium ${uploadMessage.includes('successfully') ? 'text-teal-800' : 'text-amber-900'}`}>
                {uploadMessage}
              </p>
            )}

            <p className="mt-3 text-xs text-gray-500">Accepted format: PDF only. Maximum file size: 10MB.</p>
          </div>
        </div>
      </section>

      <section className="pro-card overflow-hidden">
        <div className="flex flex-col justify-between gap-3 border-b border-gray-200 p-5 sm:flex-row sm:items-end">
          <div>
            <h2 className="break-words text-lg font-bold text-gray-950">Evidence Register</h2>
            <p className="mt-1 text-sm text-gray-600">All documents currently attached to the active promotion application.</p>
          </div>
          <span className="w-fit rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-700">{data.documents.length} record(s)</span>
        </div>

        {data.documents.length === 0 ? (
          <div className="p-5">
            <EmptyState title="No evidence uploaded yet" description="Select a required category and upload the first PDF evidence file to create your draft promotion application." />
          </div>
        ) : (
          <div className="pro-scroll-x">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="brand-table-head">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-[0.14em] text-gray-600">Document</th>
                  <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-[0.14em] text-gray-600">Category</th>
                  <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-[0.14em] text-gray-600">Uploaded</th>
                  <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-[0.14em] text-gray-600">Status</th>
                  <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-[0.14em] text-gray-600">HR Comment</th>
                  <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-[0.14em] text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody>
                {data.documents.map((doc) => (
                  <tr key={doc.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-950">{doc.title}</p>
                      <p className="mt-1 break-words text-xs text-gray-500">{doc.fileName || formatBytes(doc.size)}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-800">{CATEGORY_INFO[doc.category].title}</p>
                      {doc.required && <p className="mt-1 text-xs font-semibold text-amber-800">Required evidence</p>}
                    </td>
                    <td className="px-5 py-4 text-gray-700">{formatDate(doc.uploadedAt)}</td>
                    <td className="px-5 py-4"><StatusBadge status={doc.verificationStatus || 'PENDING'} /></td>
                    <td className="max-w-xs px-5 py-4 text-xs leading-5 text-gray-600">{doc.verificationComment || 'No HR comment yet.'}</td>
                    <td className="px-5 py-4">
                      <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-teal-700 hover:text-teal-900">
                        Open PDF
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Link href="/lecturer-portal" className="inline-flex rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50">
        Back to Dashboard
      </Link>
    </div>
  );
}

function PortfolioMetric({ code, label, value, detail, tone = 'teal' }: { code: string; label: string; value: string | number; detail: string; tone?: 'teal' | 'amber' | 'rose' }) {
  const toneClass = tone === 'amber'
    ? 'border-amber-200 bg-amber-50 text-amber-900'
    : tone === 'rose'
      ? 'border-rose-200 bg-rose-50 text-rose-800'
      : 'border-teal-200 bg-teal-50 text-teal-800';

  return (
    <div className="pro-tile min-w-0 p-4 sm:p-5">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-bold uppercase tracking-[0.12em] text-gray-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-gray-950">{value}</p>
          <p className="mt-1 break-words text-xs text-gray-500">{detail}</p>
        </div>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-xs font-black ${toneClass}`}>{code}</span>
      </div>
    </div>
  );
}

function GuidanceTile({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="min-w-0 rounded-lg border border-gray-200 bg-gray-50 p-3">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">{title}</p>
      <p className="mt-1 break-words text-sm font-semibold leading-6 text-gray-950">{value}</p>
    </div>
  );
}
