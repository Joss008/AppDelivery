import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  helperText?: string;
  error?: string;
  leftAdornment?: ReactNode;
  rightAdornment?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      error,
      leftAdornment,
      rightAdornment,
      id,
      className = '',
      required,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    return (
      <div className="flex flex-col gap-1.5 w-full">
        <label
          htmlFor={inputId}
          className="text-xs font-medium text-slate-700 select-none"
        >
          {label}
          {required && (
            <span className="text-rose-600 ml-0.5" aria-hidden="true">
              *
            </span>
          )}
        </label>

        <div className="relative flex items-center">
          {leftAdornment && (
            <span className="absolute left-3.5 text-slate-400 pointer-events-none inline-flex">
              {leftAdornment}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            required={required}
            aria-invalid={Boolean(error)}
            aria-describedby={
              error ? errorId : helperText ? helperId : undefined
            }
            className={[
              'w-full h-11 rounded-xl bg-white px-3.5 text-sm text-slate-900',
              'placeholder:text-slate-400',
              'border transition-[border-color,box-shadow] duration-150 ease-[var(--ease-out)]',
              'focus:outline-none focus:ring-2',
              'disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed',
              leftAdornment ? 'pl-10' : '',
              rightAdornment ? 'pr-10' : '',
              error
                ? 'border-rose-500 focus:border-rose-600 focus:ring-rose-500/20'
                : 'border-slate-300 hover:border-slate-400 focus:border-blue-600 focus:ring-blue-600/20',
              className,
            ].join(' ')}
            {...props}
          />

          {rightAdornment && (
            <span className="absolute right-3 text-slate-500 inline-flex">
              {rightAdornment}
            </span>
          )}
        </div>

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

Input.displayName = 'Input';
