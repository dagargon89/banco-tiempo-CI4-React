import { forwardRef, type TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  maxChars?: number;
  currentLength?: number;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, maxChars, currentLength, className = '', id, ...rest }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-text-1">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={`min-h-[100px] rounded-sm border bg-surface px-3 py-2.5 text-sm text-text-1 placeholder:text-text-3 transition-colors duration-150 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15 ${error ? 'border-error' : 'border-border'} ${className}`}
          {...rest}
        />
        <div className="flex justify-between">
          {error && <p className="text-xs text-error">{error}</p>}
          {maxChars != null && (
            <p className={`ml-auto text-xs ${(currentLength ?? 0) > maxChars ? 'text-error' : 'text-text-3'}`}>
              {currentLength ?? 0}/{maxChars}
            </p>
          )}
        </div>
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';
export default Textarea;
