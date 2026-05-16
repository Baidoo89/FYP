'use client';

import { useEffect, useState } from 'react';

interface AcademicHeaderProps {
  name: string;
  staffId: string;
  currentRank: string;
  department: string;
}

export function AcademicHeader({ name, staffId, currentRank, department }: AcademicHeaderProps) {
  return (
    <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-slate-50 p-6 shadow-sm">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Full Name</p>
          <p className="mt-2 text-lg font-bold text-slate-900">{name}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Staff ID</p>
          <p className="mt-2 font-mono text-sm font-bold text-blue-700">{staffId}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Current Rank</p>
          <p className="mt-2 text-lg font-bold text-slate-900">{currentRank}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Department</p>
          <p className="mt-2 text-lg font-bold text-slate-900">{department}</p>
        </div>
      </div>
    </div>
  );
}

interface PromotionReadinessGaugeProps {
  percentage: number;
  targetRank: string;
  status: string;
}

export function PromotionReadinessGauge({ percentage, targetRank, status }: PromotionReadinessGaugeProps) {
  const getColor = (pct: number) => {
    if (pct === 0) return '#ef4444';
    if (pct < 30) return '#f97316';
    if (pct < 60) return '#eab308';
    if (pct < 90) return '#84cc16';
    return '#22c55e';
  };

  const getStatusText = (s: string) => {
    switch (s) {
      case 'APPROVED':
        return 'Approved for Promotion';
      case 'REJECTED':
        return 'Not Eligible';
      case 'UNDER_REVIEW':
        return 'Under Review';
      case 'SUBMITTED':
        return 'Awaiting Review';
      default:
        return 'Draft';
    }
  };

  return (
    <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Promotion Readiness</p>
          <p className="mt-2 text-sm text-slate-600">Targeting: <span className="font-semibold text-slate-900">{targetRank}</span></p>
        </div>

        <div className="text-center">
          <div className="relative h-32 w-32">
            <svg className="h-full w-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="8" />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke={getColor(percentage)}
                strokeWidth="8"
                strokeDasharray={`${(percentage / 100) * 283} 283`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 0.3s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-slate-900">{percentage}%</span>
              <span className="text-xs font-medium text-slate-500">Complete</span>
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Current Status</p>
          <p className="mt-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-900 inline-block">
            {getStatusText(status)}
          </p>
        </div>
      </div>
    </div>
  );
}

interface RecentActivityProps {
  documents: Array<{
    title: string;
    category: string;
    verificationStatus: string;
    uploadedAt: string;
  }>;
}

export function RecentActivity({ documents }: RecentActivityProps) {
  return (
    <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-bold text-slate-900">Recent Activity</h3>
      <p className="mt-1 text-sm text-slate-600">Latest document updates</p>

      <div className="mt-4 space-y-3">
        {documents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            No recent activity yet.
          </div>
        ) : (
          documents.map((doc, idx) => (
            <div key={idx} className="flex items-start gap-3 rounded-xl border border-slate-200 p-3">
              <div className="mt-1">
                {doc.verificationStatus === 'VERIFIED' && (
                  <span className="text-lg">✓</span>
                )}
                {doc.verificationStatus === 'REJECTED' && (
                  <span className="text-lg">✗</span>
                )}
                {doc.verificationStatus === 'PENDING' && (
                  <span className="text-lg">⏳</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900 truncate">{doc.title}</p>
                <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-blue-700">{doc.category}</span>
                  <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
