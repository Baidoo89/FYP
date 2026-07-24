import { OnboardingForm } from '../../components/auth/OnboardingForm';

export default function OnboardingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-brand-background px-4 py-6 text-brand-text lpads-fade-in dark:bg-[#07111f] dark:text-white sm:px-6 sm:py-8 md:px-8 md:py-10 lg:px-10">
      <div className="w-full">
        <OnboardingForm />
      </div>
    </div>
  );
}
