import type { ReactNode } from 'react';

type GctuBrandMarkProps = {
  align?: 'left' | 'center';
  tone?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  eyebrow?: string;
  title?: string;
  subtitle?: ReactNode;
  className?: string;
};

const logoSize = {
  sm: 'h-11 w-11 rounded-lg',
  md: 'h-14 w-14 rounded-xl',
  lg: 'h-20 w-20 rounded-2xl',
};

const titleSize = {
  sm: 'text-base',
  md: 'text-xl',
  lg: 'text-2xl',
};

export default function GctuBrandMark({
  align = 'left',
  tone = 'light',
  size = 'md',
  eyebrow = 'Ghana Communication Technology University',
  title = 'GCTU Digital Staff Promotion Support System',
  subtitle,
  className = '',
}: GctuBrandMarkProps) {
  const isCenter = align === 'center';
  const dark = tone === 'dark';

  return (
    <div className={`${isCenter ? 'items-center text-center' : 'items-start text-left'} flex flex-col ${className}`}>
      <div className={`${logoSize[size]} flex items-center justify-center overflow-hidden border bg-white p-1 shadow-sm ${dark ? 'border-white/20' : 'border-brand-border'}`}>
        <img src="/gctu-logo.jpg" alt="GCTU logo" className="h-full w-full object-contain" />
      </div>
      <p className={`mt-4 text-[11px] font-bold uppercase tracking-[0.2em] ${dark ? 'text-brand-accent' : 'text-brand-primary'}`}>
        {eyebrow}
      </p>
      <h1 className={`mt-2 font-bold leading-tight tracking-tight ${titleSize[size]} ${dark ? 'text-white' : 'text-brand-text'}`}>
        {title}
      </h1>
      {subtitle && (
        <p className={`mt-2 max-w-md text-sm leading-6 ${dark ? 'text-[#b7c6da]' : 'text-brand-muted'}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
