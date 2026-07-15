import type { InputHTMLAttributes } from 'react';
import { useId } from 'react';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function TextField({ label, error, id, className = '', ...rest }: TextFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={fieldId} className="font-body text-sm font-medium text-ink-800">
        {label}
      </label>
      <input
        id={fieldId}
        aria-invalid={!!error}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        className={`rounded-lg border px-3.5 py-2.5 font-body text-ink-950 outline-none transition-colors ${
          error
            ? 'border-red-400 focus:border-red-500'
            : 'border-paper-300 focus:border-amber-600'
        } ${className}`}
        {...rest}
      />
      {error && (
        <p id={`${fieldId}-error`} className="font-body text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
