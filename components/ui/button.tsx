'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-lg text-sm font-semibold outline-none transition duration-200 focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-55 active:scale-[0.99]',
  {
    variants: {
      variant: {
        primary: 'bg-brand-primary px-5 text-white shadow-enterprise-soft hover:-translate-y-0.5 hover:bg-brand-primaryDark hover:shadow-enterprise',
        secondary: 'border border-brand-border bg-white px-5 text-brand-text shadow-enterprise-soft hover:border-brand-primary/30 hover:bg-brand-primarySoft hover:text-brand-primary',
        ghost: 'px-4 text-brand-muted hover:bg-brand-primarySoft hover:text-brand-primary',
        danger: 'bg-brand-danger px-5 text-white shadow-enterprise-soft hover:bg-red-700',
      },
      size: {
        sm: 'min-h-10 px-3 text-xs',
        md: 'min-h-12 px-5',
        lg: 'min-h-14 px-6 text-base',
        icon: 'h-12 min-h-12 w-12 px-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, loading, children, disabled, ...props }, ref) => (
  <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} disabled={disabled || loading} {...props}>
    {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
    {children}
  </button>
));
Button.displayName = 'Button';

export { buttonVariants };