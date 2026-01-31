import { type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { forwardRef, type InputHTMLAttributes } from 'react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import { clsx } from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || props.name;
    
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-[#f5f5f5]"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          className={cn(
            'flex h-10 w-full rounded-md bg-[#171717] px-3 py-2 text-sm text-[#f5f5f5]',
            'border border-[#262626] placeholder:text-[#737373]',
            'focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-[#ef4444] focus:ring-[#ef4444]',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <span className="text-sm text-[#ef4444]">{error}</span>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || props.name;
    
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-[#f5f5f5]"
          >
            {label}
          </label>
        )}
        <textarea
          id={inputId}
          className={cn(
            'flex min-h-[80px] w-full rounded-md bg-[#171717] px-3 py-2 text-sm text-[#f5f5f5]',
            'border border-[#262626] placeholder:text-[#737373]',
            'focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-[#ef4444] focus:ring-[#ef4444]',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <span className="text-sm text-[#ef4444]">{error}</span>
        )}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

export { Input, Textarea };
