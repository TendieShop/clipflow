import { cva, type VariantProps } from 'class-variance-authority';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { forwardRef, type ButtonHTMLAttributes } from 'react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-[#3b82f6] text-white hover:bg-[#2563eb]',
        destructive: 'bg-[#ef4444] text-white hover:bg-[#dc2626]',
        outline: 'border border-[#262626] bg-[#171717] hover:bg-[#262626]',
        secondary: 'bg-[#262626] text-white hover:bg-[#333333]',
        ghost: 'hover:bg-[#262626]',
        link: 'text-[#3b82f6] underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

const IconButton = forwardRef<HTMLButtonElement, ButtonProps & { label: string }>(
  ({ className, variant, label, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size: 'icon', className }))}
        ref={ref}
        title={label}
        aria-label={label}
        {...props}
      />
    );
  }
);
IconButton.displayName = 'IconButton';

export { Button, IconButton, buttonVariants };
