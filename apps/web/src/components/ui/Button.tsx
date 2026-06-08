import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'subtle' | 'danger' | 'lime';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
  fullWidth?: boolean;
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-sm px-4 py-2.5 text-sm font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/20 disabled:opacity-50 disabled:cursor-not-allowed';

const variants: Record<Variant, string> = {
  primary: 'bg-accent text-white hover:bg-accent-hover',
  secondary: 'bg-surface border border-border text-text-1 hover:bg-surface-2',
  subtle: 'bg-transparent text-text-2 hover:bg-surface-2',
  danger: 'bg-error text-white hover:opacity-90',
  lime: 'bg-lime text-lime-ink hover:opacity-90',
};

export default function Button({ variant = 'primary', fullWidth, className = '', children, ...rest }: ButtonProps) {
  return (
    <button className={`${base} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`} {...rest}>
      {children}
    </button>
  );
}
