import { forwardRef, useId, type SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: SelectOption[];
  placeholder?: string;
  helperText?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      options,
      placeholder,
      helperText,
      error,
      id,
      className = '',
      required,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const selectId = id ?? generatedId;
    const errorId = `${selectId}-error`;
    const helperId = `${selectId}-helper`;

    return (
      <div className="flex flex-col gap-1.5 w-full">
        <label
          htmlFor={selectId}
          className="text-xs font-medium text-slate-700 select-none"
        >
          {label}
          {required && (
            <span className="text-rose-600 ml-0.5" aria-hidden="true">
              *
            </span>
          )}
        </label>

        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            required={required}
            aria-invalid={Boolean(error)}
            aria-describedby={
              error ? errorId : helperText ? helperId : undefined
            }
            className={[
              'w-full h-9 appearance-none rounded-lg bg-white pl-3 pr-9 text-sm text-slate-900',
              'border transition-[border-color,box-shadow] duration-150 ease-[var(--ease-out)]',
              'focus:outline-none focus:ring-2',
              'disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed',
              error
                ? 'border-rose-500 focus:border-rose-600 focus:ring-rose-500/20'
                : 'border-slate-300 hover:border-slate-400 focus:border-blue-600 focus:ring-blue-600/20',
              className,
            ].join(' ')}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option
                key={opt.value}
                value={opt.value}
                disabled={opt.disabled}
              >
                {opt.label}
              </option>
            ))}
          </select>

          <ChevronDown
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500"
            strokeWidth={1.75}
            aria-hidden="true"
          />
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

Select.displayName = 'Select';
