import * as React from "react";
import { cn } from "@/lib/utils";

// Card component with elevation and hover states
const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        [
          "bg-secondary",
          "border border-border-subtle",
          "rounded-lg",
          "transition-all duration-200",
          "hover:border-border-medium",
          "hover:shadow-low",
        ].join(" "),
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        ["flex flex-col space-y-1.5 p-6"],
        className
      )}
      {...props}
    />
  )
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn(
        [
          "text-xl font-semibold",
          "text-text-primary",
          "leading-none tracking-tight",
        ].join(" "),
        className
      )}
      {...props}
    />
  )
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn(
        ["text-sm text-text-muted"],
        className
      )}
      {...props}
    />
  )
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        ["p-6 pt-0"],
        className
      )}
      {...props}
    />
  )
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        ["flex items-center p-6 pt-0"],
        className
      )}
      {...props}
    />
  )
);
CardFooter.displayName = "CardFooter";

// Elevated card variant with stronger shadow
const CardElevated = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        [
          "bg-secondary",
          "border border-border-subtle",
          "rounded-lg",
          "transition-all duration-200",
          "hover:border-border-medium",
          "hover:shadow-medium",
          "hover:-translate-y-0.5",
        ].join(" "),
        className
      )}
      {...props}
    />
  )
);
CardElevated.displayName = "CardElevated";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  CardElevated,
};
