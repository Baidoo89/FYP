'use client';

import { useMemo, useState } from 'react';

type DocumentUploadCardProps = {
  requestId: number;
  category: 'RESEARCH' | 'TEACHING' | 'SERVICE';
  title: string;
  description: string;
  onUploaded?: () => void;
};

export default function DocumentUploadCard({ requestId, category, title, description, onUploaded }: DocumentUploadCardProps) {
  const [file, setFile] = useState<File | null>(null);
  const [documentTitle, setDocumentTitle] = useState(title);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const previewUrl = useMemo(() => {
    if (!file) {
      return '';
    }

    return URL.createObjectURL(file);
  }, [file]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (!file) {
        throw new Error('Select a PDF file first');
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);
      formData.append('title', documentTitle.trim());

      const response = await fetch(`/api/promotion-requests/${requestId}/documents`, {
        method: 'POST',
        body: formData,
      });

      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Upload failed');
      }

      setMessage('Document uploaded successfully');
      setFile(null);
      onUploaded?.();
    } catch (uploadError) {
      setMessage(uploadError instanceof Error ? uploadError.message : 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-700">{category}</div>
          <h3 className="mt-1 text-lg font-bold text-slate-900">{title}</h3>
          <p className="mt-1 text-sm text-slate-600">{description}</p>
        </div>
        <div className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">PDF only</div>
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">Document title</label>
          <input
            value={documentTitle}
            onChange={(event) => setDocumentTitle(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">Upload PDF</label>
          <input
            type="file"
            accept="application/pdf"
            onChange={(event) => setFile(event.target.files?.[0] || null)}
            className="block w-full rounded-xl border border-dashed border-blue-200 bg-blue-50/50 px-4 py-3 text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
            required
          />
        </div>

        {file && previewUrl && (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
            <div className="border-b border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Preview</div>
            <iframe title={`${category} preview`} src={previewUrl} className="h-64 w-full" />
          </div>
        )}

        {message && <p className="text-sm font-medium text-slate-700">{message}</p>}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-blue-700 to-blue-600 px-4 py-3 text-sm font-semibold text-white hover:from-blue-800 hover:to-blue-700 disabled:opacity-60"
        >
          {loading ? 'Uploading...' : 'Upload PDF'}
        </button>
      </div>
    </form>
  );
}
