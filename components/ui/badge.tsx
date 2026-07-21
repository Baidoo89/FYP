import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva('inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold', {
  variants: {
    variant: {
      default: 'border-brand-border bg-slate-50 text-brand-muted',
      primary: 'border-brand-primary/20 bg-brand-primarySoft text-brand-primary',
      accent: 'border-brand-accent/30 bg-brand-accentSoft text-amber-800',
      success: 'border-green-200 bg-green-50 text-green-700',
      warning: 'border-amber-200 bg-amber-50 text-amber-800',
      danger: 'border-red-200 bg-red-50 text-red-700',
    },
  },
  defaultVariants: { variant: 'default' },
});

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}