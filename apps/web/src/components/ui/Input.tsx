import { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, className = '', id, ...rest }, ref) => {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-text-1">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={`h-10 rounded-sm border bg-surface px-3 text-sm text-text-1 placeholder:text-text-3 transition-colors duration-150 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15 ${error ? 'border-error' : 'border-border'} ${className}`}
        {...rest}
      />
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
