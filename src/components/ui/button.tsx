import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Button variants using design system
const buttonVariants = cva(
  [
    "inline-flex items-center justify-center whitespace-nowrap",
    "font-medium text-sm transition-all duration-200",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary",
    "disabled:pointer-events-none disabled:opacity-50",
  ].join(" "),
  {
    variants: {
      variant: {
        // Primary button (accent) - most common action
        default: [
          "bg-accent text-white",
          "border border-transparent",
          "hover:bg-accent-hover hover:shadow-glow hover:-translate-y-0.5",
          "active:bg-accent/80 active:translate-y-0",
        ].join(" "),
        // Secondary button - default state
        secondary: [
          "bg-tertiary text-text-primary",
          "border border-border-subtle",
          "hover:bg-elevated hover:border-border-medium hover:shadow-low hover:-translate-y-0.5",
          "active:bg-tertiary/80 active:translate-y-0",
        ].join(" "),
        // Ghost button - minimal visual
        ghost: [
          "bg-transparent text-text-primary",
          "border border-transparent",
          "hover:bg-tertiary/50",
          "active:bg-tertiary/80",
        ].join(" "),
        // Outline button
        outline: [
          "bg-transparent text-text-primary",
          "border border-border-subtle",
          "hover:bg-tertiary hover:border-border-medium hover:-translate-y-0.5",
          "active:bg-tertiary/80 active:translate-y-0",
        ].join(" "),
        // Danger/Destructive
        destructive: [
          "bg-status-error text-white",
          "border border-transparent",
          "hover:bg-red-600 hover:-translate-y-0.5",
          "active:bg-red-700 active:translate-y-0",
        ].join(" "),
        // Link button
        link: [
          "bg-transparent text-accent",
          "border border-transparent",
          "underline-offset-4 hover:underline",
          "active:text-accent-hover",
        ].join(" "),
        // Success button
        success: [
          "bg-status-success text-white",
          "border border-transparent",
          "hover:bg-green-600 hover:-translate-y-0.5",
          "active:bg-green-700 active:translate-y-0",
        ].join(" "),
      },
      size: {
        default: "h-10 px-4 py-2 rounded-md",
        sm: "h-9 px-3 rounded-sm",
        lg: "h-11 px-8 rounded-md",
        icon: "h-10 w-10 rounded-md",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Loading...</span>
          </span>
        ) : (
          children
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
