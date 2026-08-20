import { ShieldCheck } from 'lucide-react';
import AuthPageShell from '../../components/auth/AuthPageShell';
import LogoutButton from '../../components/LogoutButton';

export default function OnboardingPage() {
  return (
    <AuthPageShell>
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-800">
          <ShieldCheck className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-amber-800">HRODD Verification Required</p>
          <h1 className="mt-2 text-2xl font-semibold text-brand-text dark:text-white">Staff record not provisioned</h1>
        </div>
      </div>
      <p className="mt-5 text-sm leading-6 text-brand-muted dark:text-[#b7c6da]">
        Applicant identity, rank, service dates, and organizational assignment must come from an authoritative HRODD record. Contact HRODD to have verified staff access issued.
      </p>
      <LogoutButton className="mt-6 w-full" />
    </AuthPageShell>
  );
}
