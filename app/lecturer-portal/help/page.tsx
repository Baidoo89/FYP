'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ErrorState, LoadingState, QuickLinksCard, SectionCard } from '../../../components/enterprise-ui';

type ProfileData = {
  profile: {
    name: string;
    email: string;
    department: string;
    currentRank: string;
    staffId: string | null;
  };
};

function label(value?: string | null) {
  if (!value) return 'Not available';
  return value.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase());
}

const workflowSteps = [
  { code: '01', title: 'Upload Evidence', detail: 'Add teaching, research, service, publication, and professional development documents as required for your target rank.' },
  { code: '02', title: 'Submit Application', detail: 'Submit the draft once your evidence portfolio is complete enough for department review.' },
  { code: '03', title: 'Respond to Feedback', detail: 'If HR returns a document, read the comment and replace it from the Evidence Portfolio.' },
  { code: '04', title: 'Track Decision', detail: 'Follow department, HR, committee, recommendation, and final authority stages from My Applications.' },
];

export default function HelpCenterPage() {
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch('/api/lecturer/profile', { cache: 'no-store' });
        const payload = await response.json();

        if (!response.ok || !payload.success) {
          throw new Error(payload.error || 'Failed to load profile');
        }

        setData(payload.data);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load help context');
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  if (loading) return <LoadingState label="Loading help center..." />;
  if (error) return <ErrorState message={error} />;

  const profile = data?.profile;

  return (
    <div className="space-y-6">
      <section className="pro-hero px-6 py-8">
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="pro-eyebrow">Lecturer Support</div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">Help Center</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-600">
              Official support guidance for promotion evidence, application tracking, HR feedback, and account issues.
            </p>
          </div>
          <div className="rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-950">
            <p className="font-semibold">{profile?.name || 'Lecturer'}</p>
            <p className="mt-1 text-xs text-teal-800">{profile?.department || 'Academic department'} | {label(profile?.currentRank)}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <QuickLinksCard
          links={[
            { label: 'Upload Evidence', href: '/lecturer-portal/evidence', description: 'Add or replace promotion documents', code: 'EV' },
            { label: 'Track Application', href: '/lecturer-portal/application', description: 'View workflow status and summary', code: 'TR' },
            { label: 'View Feedback', href: '/lecturer-portal/queries', description: 'Read HR correction comments', code: 'FB' },
            { label: 'Eligibility Status', href: '/lecturer-portal/eligibility', description: 'Check verified requirements', code: 'EL' },
          ]}
        />

        <SectionCard title="Promotion Workflow Guide" description="Use this sequence when preparing and tracking a promotion request.">
          <div className="grid gap-3 md:grid-cols-2">
            {workflowSteps.map((step) => (
              <div key={step.code} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <span className="rounded-md bg-teal-100 px-2.5 py-1 text-[10px] font-black text-teal-800">{step.code}</span>
                <h3 className="mt-3 font-semibold text-gray-950">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">{step.detail}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <SupportCard title="HR Office" detail="For evidence verification, returned document comments, application status, and formal promotion records." contact="hr@gctu.edu.gh" meta="Administration Building, Room 201" />
        <SupportCard title="Department Office" detail="For department review questions, recommendation comments, and forwarding status." contact="Contact your HOD office" meta={profile?.department || 'Academic department'} />
        <SupportCard title="System Support" detail="For login problems, email verification, profile access, and notification issues." contact="support@gctu.edu.gh" meta="Weekdays, 9:00 AM - 4:00 PM" />
      </section>

      <SectionCard title="Before Contacting Support" description="These checks usually resolve the most common promotion portal issues.">
        <div className="grid gap-3 md:grid-cols-3">
          <ChecklistItem title="Use PDF files" detail="Evidence upload accepts PDF documents only and each file must stay within the configured size limit." />
          <ChecklistItem title="Read HR comments" detail="Returned documents include a correction note. Replace the document from the matching category." />
          <ChecklistItem title="Check notifications" detail="Workflow changes, verification decisions, and review updates are recorded in Notifications." />
        </div>
      </SectionCard>

      <div className="flex flex-wrap gap-3">
        <Link href="/notifications" className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800">Open Notifications</Link>
        <Link href="/lecturer-portal/profile" className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50">View Profile</Link>
      </div>
    </div>
  );
}

function SupportCard({ title, detail, contact, meta }: { title: string; detail: string; contact: string; meta: string }) {
  return (
    <div className="pro-card p-5">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-700">Support Channel</p>
      <h2 className="mt-3 text-lg font-semibold text-gray-950">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-gray-600">{detail}</p>
      <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm">
        <p className="font-semibold text-gray-950">{contact}</p>
        <p className="mt-1 text-xs text-gray-500">{meta}</p>
      </div>
    </div>
  );
}

function ChecklistItem({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="font-semibold text-gray-950">{title}</p>
      <p className="mt-2 text-sm leading-6 text-gray-600">{detail}</p>
    </div>
  );
}
