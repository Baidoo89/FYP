'use client';

type ProgressStepperProps = {
  currentStep: number;
  steps: string[];
  status?: string;
};

function stateForStep(stepNumber: number, currentStep: number, status?: string) {
  if (status === 'REJECTED') return stepNumber <= currentStep ? 'rejected' : 'pending';
  if (status === 'RETURNED_FOR_CORRECTION') return stepNumber === currentStep ? 'returned' : stepNumber < currentStep ? 'complete' : 'pending';
  if (stepNumber < currentStep) return 'complete';
  if (stepNumber === currentStep) return 'current';
  return 'pending';
}

const stateStyles = {
  complete: {
    circle: 'border-emerald-600 bg-emerald-600 text-white',
    label: 'text-slate-950',
    meta: 'Completed',
    line: 'bg-emerald-600',
  },
  current: {
    circle: 'border-teal-700 bg-white text-teal-700 ring-4 ring-teal-100',
    label: 'text-teal-900',
    meta: 'In progress',
    line: 'bg-teal-300',
  },
  pending: {
    circle: 'border-slate-200 bg-white text-slate-400',
    label: 'text-slate-600',
    meta: 'Pending',
    line: 'bg-slate-200',
  },
  returned: {
    circle: 'border-orange-400 bg-orange-100 text-orange-700 ring-4 ring-orange-100',
    label: 'text-orange-900',
    meta: 'Correction required',
    line: 'bg-orange-300',
  },
  rejected: {
    circle: 'border-rose-500 bg-rose-100 text-rose-700 ring-4 ring-rose-100',
    label: 'text-rose-900',
    meta: 'Rejected',
    line: 'bg-rose-300',
  },
};

export default function ProgressStepper({ currentStep, steps, status }: ProgressStepperProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="overflow-x-auto pb-1">
        <div className="grid min-w-[760px]" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
          {steps.map((step, index) => {
            const stepNumber = index + 1;
            const state = stateForStep(stepNumber, currentStep, status) as keyof typeof stateStyles;
            const styles = stateStyles[state];
            const isLast = index === steps.length - 1;

            return (
              <div key={step} className="relative flex flex-col items-center text-center">
                {!isLast && (
                  <div className={`absolute left-1/2 top-5 h-0.5 w-full ${styles.line}`} aria-hidden="true" />
                )}
                <div className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-black ${styles.circle}`}>
                  {state === 'complete' ? 'OK' : stepNumber}
                </div>
                <p className={`mt-3 px-2 text-xs font-bold leading-5 sm:text-sm ${styles.label}`}>{step}</p>
                <p className="mt-1 text-[11px] font-medium text-slate-500">{styles.meta}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}