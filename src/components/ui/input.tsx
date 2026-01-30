import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, disabled, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        disabled={disabled}
        className={cn(
          [
            // Base styles
            "w-full",
            "h-10 px-3 py-2",
            "bg-bg-primary",
            "rounded-md",
            "text-sm text-text-primary",
            "placeholder:text-text-muted",
            "border border-border-subtle",
            
            // Transitions
            "transition-all duration-200",
            
            // Focus state
            "focus:outline-none",
            "focus:border-accent",
            "focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)]",
            
            // Disabled state
            "disabled:opacity-50",
            "disabled:cursor-not-allowed",
            
            // Error state
            error && "border-status-error focus:border-status-error focus:shadow-[0_0_0_3px_rgba(239,68,68,0.1)]",
          ].join(" "),
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

// Textarea component with same styling
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, disabled, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        disabled={disabled}
        className={cn(
          [
            // Base styles
            "w-full",
            "min-h-[80px] px-3 py-2",
            "bg-bg-primary",
            "rounded-md",
            "text-sm text-text-primary",
            "placeholder:text-text-muted",
            "border border-border-subtle",
            "resize-vertical",
            
            // Transitions
            "transition-all duration-200",
            
            // Focus state
            "focus:outline-none",
            "focus:border-accent",
            "focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)]",
            
            // Disabled state
            "disabled:opacity-50",
            "disabled:cursor-not-allowed",
            
            // Error state
            error && "border-status-error focus:border-status-error focus:shadow-[0_0_0_3px_rgba(239,68,68,0.1)]",
          ].join(" "),
          className
        )}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

// Select component
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, disabled, children, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          ref={ref}
          disabled={disabled}
          className={cn(
            [
              // Base styles
              "w-full",
              "h-10 px-3 py-2",
              "bg-bg-primary",
              "rounded-md",
              "text-sm text-text-primary",
              "border border-border-subtle",
              
              // Transitions
              "transition-all duration-200",
              
              // Focus state
              "focus:outline-none",
              "focus:border-accent",
              "focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)]",
              
              // Disabled state
              "disabled:opacity-50",
              "disabled:cursor-not-allowed",
              
              // Error state
              error && "border-status-error focus:border-status-error",
            ].join(" "),
            className
          )}
          {...props}
        >
          {children}
        </select>
        {/* Dropdown arrow */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M2.5 4.5L6 8L9.5 4.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    );
  }
);
Select.displayName = "Select";

export { Input, Textarea, Select };
