import { OnboardingForm } from '../../components/auth/OnboardingForm';

export default function OnboardingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-6 sm:px-6 sm:py-8 md:px-8 md:py-10 lg:px-10 lpads-fade-in bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.16),transparent_80%),linear-gradient(135deg,_#eef4ff_0%,_#f8fbff_100%)]">
      <div className="w-full">
        <OnboardingForm />
      </div>
    </div>
  );
}
