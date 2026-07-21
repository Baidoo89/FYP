'use client';

type ProgressStepperProps = {
  currentStep: number;
  steps: string[];
  status?: string;
};

function stateForStep(stepNumber: number, currentStep: number, status?: string) {
  if (status === 'REJECTED' || status === 'NOT_RECOMMENDED') return stepNumber <= currentStep ? 'rejected' : 'pending';
  if (status === 'RETURNED_FOR_CORRECTION') return stepNumber === currentStep ? 'returned' : stepNumber < currentStep ? 'complete' : 'pending';
  if (stepNumber < currentStep) return 'complete';
  if (stepNumber === currentStep) return 'current';
  return 'pending';
}

const stateStyles = {
  complete: {
    circle: 'border-green-600 bg-green-600 text-white shadow-sm',
    label: 'text-gray-950',
    meta: 'Completed',
    line: 'bg-green-600',
  },
  current: {
    circle: 'border-brand-primary bg-white text-brand-primary ring-4 ring-brand-primary/10 shadow-sm',
    label: 'text-brand-primary',
    meta: 'In progress',
    line: 'bg-brand-primary/30',
  },
  pending: {
    circle: 'border-gray-200 bg-white text-gray-400',
    label: 'text-gray-600',
    meta: 'Pending',
    line: 'bg-gray-200',
  },
  returned: {
    circle: 'border-amber-400 bg-amber-50 text-amber-800 ring-4 ring-amber-100 shadow-sm',
    label: 'text-amber-950',
    meta: 'Correction required',
    line: 'bg-amber-300',
  },
  rejected: {
    circle: 'border-rose-500 bg-rose-50 text-rose-800 ring-4 ring-rose-100 shadow-sm',
    label: 'text-rose-950',
    meta: 'Stopped',
    line: 'bg-rose-300',
  },
};

export default function ProgressStepper({ currentStep, steps, status }: ProgressStepperProps) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5 print:shadow-none">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-base font-bold text-gray-950">Promotion Workflow</h3>
          <p className="mt-1 text-sm text-gray-600">Draft to final administrative completion.</p>
        </div>
        {status && <span className="w-fit rounded-full bg-gray-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-gray-600">{status.replace(/_/g, ' ')}</span>}
      </div>
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
                  {state === 'complete' ? <CheckIcon /> : stepNumber}
                </div>
                <p className={`mt-3 px-2 text-xs font-bold leading-5 sm:text-sm ${styles.label}`}>{step}</p>
                <p className="mt-1 text-[11px] font-medium text-gray-500">{styles.meta}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}
