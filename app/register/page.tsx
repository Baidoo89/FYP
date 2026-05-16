import { RegisterForm } from '../../components/auth/RegisterForm';

export default function RegisterPage() {
  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 sm:py-8 md:px-8 md:py-10 lg:px-10 lpads-fade-in bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.16),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(29,78,216,0.22),_transparent_28%),linear-gradient(135deg,_#eef4ff_0%,_#f8fbff_100%)]">
      <div className="mx-auto flex w-full max-w-md items-center justify-center">
        <RegisterForm />
      </div>
    </div>
  );
}