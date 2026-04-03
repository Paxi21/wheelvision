'use client';

import { cn } from '@/lib/utils';
import React from 'react';

interface ShimmerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  children: React.ReactNode;
}

export function ShimmerButton({ className, children, ...props }: ShimmerButtonProps) {
  return (
    <button
      className={cn(
        'relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full',
        'bg-gradient-to-r from-[#FF6B35] via-[#F72585] to-[#7209B7]',
        'px-6 py-3 font-semibold text-white',
        'transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(247,37,133,0.5)]',
        'before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2.5s_infinite]',
        'before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent',
        className
      )}
      {...props}
    >
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  );
}
