import { forwardRef, useId, type TextareaHTMLAttributes } from 'react';

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  helperText?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      helperText,
      error,
      id,
      className = '',
      required,
      rows = 3,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const textareaId = id ?? generatedId;
    const errorId = `${textareaId}-error`;
    const helperId = `${textareaId}-helper`;

    return (
      <div className="flex flex-col gap-1.5 w-full">
        <label
          htmlFor={textareaId}
          className="text-xs font-medium text-slate-700 select-none"
        >
          {label}
          {required && (
            <span className="text-rose-600 ml-0.5" aria-hidden="true">
              *
            </span>
          )}
        </label>

        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={
            error ? errorId : helperText ? helperId : undefined
          }
          className={[
            'w-full rounded-lg bg-white px-3 py-2 text-sm text-slate-900',
            'placeholder:text-slate-400 resize-y min-h-[76px]',
            'border transition-[border-color,box-shadow] duration-150 ease-[var(--ease-out)]',
            'focus:outline-none focus:ring-2',
            'disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed',
            error
              ? 'border-rose-500 focus:border-rose-600 focus:ring-rose-500/20'
              : 'border-slate-300 hover:border-slate-400 focus:border-blue-600 focus:ring-blue-600/20',
            className,
          ].join(' ')}
          {...props}
        />

        {error ? (
          <p id={errorId} className="text-xs text-rose-600" role="alert">
            {error}
          </p>
        ) : helperText ? (
          <p id={helperId} className="text-xs text-slate-500">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
