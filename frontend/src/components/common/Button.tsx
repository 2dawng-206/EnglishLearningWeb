import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  isLoading?: boolean;
  children: ReactNode;
}

const baseClasses =
  'inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 font-body font-medium ' +
  'transition-colors disabled:cursor-not-allowed disabled:opacity-60';

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-amber-400 text-ink-950 hover:bg-amber-300 active:bg-amber-600',
  secondary: 'bg-transparent text-paper-100 border border-ink-600 hover:bg-ink-800',
};

export function Button({
  variant = 'primary',
  isLoading = false,
  disabled,
  children,
  className = '',
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...rest}
    >
      {isLoading ? 'Please wait…' : children}
    </button>
  );
}
