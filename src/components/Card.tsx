import { type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { type ReactNode } from 'react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import { clsx } from 'clsx';

interface CardProps {
  className?: string;
  children: ReactNode;
  hoverable?: boolean;
}

export function Card({ className, children, hoverable = false }: CardProps) {
  return (
    <div
      className={cn(
        'bg-[#171717] border border-[#262626] rounded-lg p-4',
        hoverable && 'transition-colors hover:bg-[#262626]',
        className
      )}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  className?: string;
  children: ReactNode;
}

export function CardHeader({ className, children }: CardHeaderProps) {
  return <div className={cn('flex flex-col gap-1', className)}>{children}</div>;
}

interface CardTitleProps {
  className?: string;
  children: ReactNode;
}

export function CardTitle({ className, children }: CardTitleProps) {
  return <h3 className={cn('text-lg font-semibold', className)}>{children}</h3>;
}

interface CardDescriptionProps {
  className?: string;
  children: ReactNode;
}

export function CardDescription({ className, children }: CardDescriptionProps) {
  return <p className={cn('text-sm text-[#a3a3a3]', className)}>{children}</p>;
}

interface CardContentProps {
  className?: string;
  children: ReactNode;
}

export function CardContent({ className, children }: CardContentProps) {
  return <div className={cn('', className)}>{children}</div>;
}

interface CardFooterProps {
  className?: string;
  children: ReactNode;
}

export function CardFooter({ className, children }: CardFooterProps) {
  return (
    <div
      className={cn(
        'flex items-center pt-4 mt-4 border-t border-[#262626]',
        className
      )}
    >
      {children}
    </div>
  );
}
