'use client';

type ProgressStepperProps = {
  currentStep: number;
  steps: string[];
};

export default function ProgressStepper({ currentStep, steps }: ProgressStepperProps) {
  return (
    <div className="rounded-2xl border border-blue-100 bg-white/90 p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isComplete = stepNumber < currentStep;

          return (
            <div key={step} className="flex min-w-[150px] flex-1 items-center gap-3">
              <div
                className={[
                  'flex h-10 w-10 items-center justify-center rounded-full border text-sm font-bold',
                  isComplete ? 'border-blue-200 bg-blue-100 text-blue-900' : '',
                  isActive ? 'border-yellow-400 bg-yellow-400 text-blue-950 shadow-md' : '',
                  !isActive && !isComplete ? 'border-blue-100 bg-white text-blue-400' : '',
                ].join(' ')}
              >
                {stepNumber}
              </div>
              <div>
                <div className="text-sm font-semibold text-blue-950">{step}</div>
                <div className="text-xs text-blue-500">
                  {isActive ? 'Current step' : isComplete ? 'Completed' : 'Pending'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
