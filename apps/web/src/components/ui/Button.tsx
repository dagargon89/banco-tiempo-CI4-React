import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'subtle' | 'danger' | 'lime';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
  fullWidth?: boolean;
  size?: 'md' | 'lg';
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50 disabled:cursor-not-allowed';

const sizes = {
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3.5 text-base',
};

const variants: Record<Variant, string> = {
  primary: 'bg-accent text-on-accent hover:bg-accent-hover',
  secondary: 'bg-surface border border-border text-text-1 hover:bg-surface-2',
  subtle: 'bg-transparent text-text-2 hover:bg-surface-2',
  danger: 'bg-error text-on-error hover:opacity-90',
  // Reservado: el lima significa tiempo. No usar para acciones genéricas.
  lime: 'bg-lime text-lime-ink hover:opacity-90',
};

export default function Button({ variant = 'primary', size = 'md', fullWidth, className = '', children, ...rest }: ButtonProps) {
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`} {...rest}>
      {children}
    </button>
  );
}
