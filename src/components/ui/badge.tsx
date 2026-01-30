import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'outline';
  size?: 'sm' | 'md';
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          [
            // Base styles
            "inline-flex items-center font-medium",
            size === 'sm' ? "text-xs px-2 py-0.5" : "text-sm px-2.5 py-1",
            "rounded-full",
            "transition-colors duration-200",
          ].join(" "),
          // Variant styles
          {
            'bg-status-success/10 text-status-success border border-status-success/20':
              variant === 'success',
            'bg-status-warning/10 text-status-warning border border-status-warning/20':
              variant === 'warning',
            'bg-status-error/10 text-status-error border border-status-error/20':
              variant === 'error',
            'bg-accent-muted text-accent border border-accent/20':
              variant === 'info',
            'bg-tertiary text-text-secondary border border-border-subtle':
              variant === 'default',
            'bg-transparent text-text-secondary border border-border-subtle':
              variant === 'outline',
          },
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";

// Status indicator dot
export interface StatusDotProps {
  status: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  size?: 'sm' | 'md';
  pulse?: boolean;
}

export function StatusDot({ status, size = 'md', pulse = false }: StatusDotProps) {
  const colors = {
    success: 'bg-status-success',
    warning: 'bg-status-warning',
    error: 'bg-status-error',
    info: 'bg-accent',
    neutral: 'bg-text-muted',
  };

  const sizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
  };

  return (
    <span
      className={cn(
        "inline-flex rounded-full",
        colors[status],
        sizes[size],
        pulse && "animate-pulse"
      )}
    />
  );
}

export { Badge };
