import React from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, helperText, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm font-semibold text-slate-200">
            {label}
          </label>
        )}
        <input
          type={type}
          className={cn(
            'input bg-slate-800/80 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-primary-500 focus:ring-primary-500',
            error && 'border-danger-500 focus:ring-danger-500',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-sm text-danger-400 font-semibold">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-sm text-slate-400">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
