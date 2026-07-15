'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type DocumentCategory = 'RESEARCH' | 'TEACHING' | 'SERVICE';

interface Document {
  id: number;
  category: DocumentCategory;
  title: string;
  fileUrl: string;
  verificationStatus: string;
  uploadedAt: string;
  size?: number;
}

interface EvidenceData {
  documents: Document[];
  grouped: {
    RESEARCH: Document[];
    TEACHING: Document[];
    SERVICE: Document[];
  };
  stats: {
    totalDocuments: number;
    verifiedCount: number;
    pendingCount: number;
    rejectedCount: number;
  };
}

const CATEGORY_INFO = {
  RESEARCH: {
    title: 'Research Evidence',
    icon: '',
    description: 'Refereed journals, books, conference papers, and scholarly publications.',
  },
  TEACHING: {
    title: 'Teaching Evidence',
    icon: '',
    description: 'Student evaluations, course materials, course design innovations.',
  },
  SERVICE: {
    title: 'Service Evidence',
    icon: '',
    description: 'Committee appointments, community service, leadership activities.',
  },
};

export default function EvidencePage() {
  const [data, setData] = useState<EvidenceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory>('RESEARCH');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');

  async function loadEvidence() {
    try {
      const response = await fetch('/api/lecturer/evidence');
      const payload = await response.json();

      if (!response.ok || !payload.success) {
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
    if (typeof window === 'undefined') {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const categoryParam = params.get('category');
    const titleParam = params.get('title');

    if (categoryParam && ['RESEARCH', 'TEACHING', 'SERVICE'].includes(categoryParam)) {
      setSelectedCategory(categoryParam as DocumentCategory);
    }

    if (titleParam) {
      setUploadTitle(titleParam);
      setUploadMessage('');
    }
  }, []);

  async function handleUpload() {
    if (!uploadTitle.trim()) {
      setUploadMessage('Please enter a document title.');
      return;
    }

    if (!uploadFile) {
      setUploadMessage('Please select a PDF file to upload.');
      return;
    }

    setUploading(true);
    setUploadMessage('');

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

      setUploadMessage('Evidence uploaded successfully.');
      setUploadTitle('');
      setUploadFile(null);
      await loadEvidence();
    } catch (uploadError) {
      setUploadMessage(uploadError instanceof Error ? uploadError.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600 shadow-sm">
          Loading evidence portfolio...
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center font-medium text-slate-900 shadow-sm">
          {error || 'Failed to load evidence portfolio'}
        </div>
      </div>
    );
  }

  const docs = data.grouped[selectedCategory];
  const categoryInfo = CATEGORY_INFO[selectedCategory];

  return (
    <div className="space-y-6">
      <section className="pro-hero px-6 py-8">
        <div>
          <div className="pro-eyebrow">
            Evidence Portfolio
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Categorized Document Upload</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
            Organize your evidence into three categories and track verification status for each document.
          </p>
        </div>
      </section>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 shadow-sm">
          <div className="text-3xl"></div>
          <div className="mt-3 text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Total</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{data.stats.totalDocuments}</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 shadow-sm">
          <div className="text-3xl"></div>
          <div className="mt-3 text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Verified</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{data.stats.verifiedCount}</div>
        </div>

        <div className="rounded-2xl border border-yellow-100 bg-gradient-to-br from-yellow-100 to-yellow-50/40 p-6 shadow-sm">
          <div className="text-3xl"></div>
          <div className="mt-3 text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Pending</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{data.stats.pendingCount}</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 shadow-sm">
          <div className="text-3xl"></div>
          <div className="mt-3 text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Rejected</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{data.stats.rejectedCount}</div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1 sm:grid-cols-3 sm:gap-3">
        {(['RESEARCH', 'TEACHING', 'SERVICE'] as DocumentCategory[]).map((category) => (
          <button
            key={category}
            onClick={() => {
              setSelectedCategory(category);
              setUploadMessage('');
            }}
            className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition ${
              selectedCategory === category
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {CATEGORY_INFO[category as DocumentCategory].icon} {CATEGORY_INFO[category as DocumentCategory].title}
          </button>
        ))}
      </div>

      {/* Category Description */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <p className="text-sm text-slate-900">{categoryInfo.description}</p>
        </div>

      {/* Upload Zone */}
      <div className="rounded-2xl border-2 border-dashed border-teal-200 bg-slate-50 p-8 text-center">
        <div className="text-4xl mb-3">{categoryInfo.icon}</div>
        <p className="font-semibold text-slate-950">Upload {categoryInfo.title}</p>
        <p className="mt-2 text-sm text-slate-700">Upload one document per category. A new upload replaces the previous file in the same category.</p>

        <div className="mx-auto mt-5 grid max-w-2xl gap-3 text-left">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
              Document Title
            </label>
            <input
              value={uploadTitle}
              onChange={(event) => setUploadTitle(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-yellow-400"
              placeholder={`Enter ${categoryInfo.title.toLowerCase()} title`}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
              Upload PDF
            </label>
            <input
              type="file"
              accept="application/pdf"
              onChange={(event) => setUploadFile(event.target.files?.[0] || null)}
              className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 file:mr-3 file:rounded-lg file:border-0 file:bg-teal-700 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
            />
          </div>
        </div>

        <button
          onClick={handleUpload}
          disabled={uploading}
          className="mt-4 rounded-xl bg-teal-700 px-6 py-2 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {uploading ? 'Uploading...' : `Upload ${selectedCategory} Evidence`}
        </button>

        {uploadMessage && (
          <p className={`mt-3 text-sm ${uploadMessage.includes('successfully') ? 'text-teal-700' : 'text-yellow-800'}`}>
            {uploadMessage}
          </p>
        )}

        <p className="mt-3 text-xs text-slate-500">Accepted format: PDF (Max 10MB)</p>
      </div>

      {/* Documents List */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-950">Uploaded Documents</h2>
          <p className="mt-1 text-sm text-slate-700">{docs.length} file(s) in this category</p>
        </div>

        {docs.length === 0 ? (
          <div className="p-6 text-center text-slate-600">
            No documents uploaded in this category yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.14em] text-teal-700 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Document Name</th>
                  <th className="px-6 py-3">Upload Date</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {docs.map((doc, idx) => (
                  <tr key={idx} className="border-t border-slate-200 hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-950 truncate">{doc.title}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {new Date(doc.uploadedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      {doc.verificationStatus === 'VERIFIED' && (
                        <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                           Verified
                        </span>
                      )}
                      {doc.verificationStatus === 'PENDING' && (
                        <span className="inline-flex rounded-full border border-yellow-200 bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-800">
                           Pending
                        </span>
                      )}
                      {doc.verificationStatus === 'REJECTED' && (
                        <span className="inline-flex rounded-full border border-slate-200 bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
                           Rejected
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-teal-700 hover:text-slate-700">
                        View 
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Back Link */}
      <Link href="/lecturer-portal" className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50">
         Back to Dashboard
      </Link>
    </div>
  );
}
