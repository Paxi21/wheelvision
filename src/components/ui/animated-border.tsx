'use client';

import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

interface AnimatedBorderProps {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  duration?: number;
}

export function AnimatedBorder({
  children,
  className,
  containerClassName,
  duration = 4,
}: AnimatedBorderProps) {
  return (
    <div className={cn('relative p-[1px] rounded-2xl overflow-hidden', containerClassName)}>
      <motion.div
        className="absolute inset-0 rounded-2xl"
        style={{
          background:
            'conic-gradient(from 0deg, #FF6B35, #F72585, #7209B7, #FF6B35)',
        }}
        animate={{ rotate: 360 }}
        transition={{ duration, repeat: Infinity, ease: 'linear' }}
      />
      <div className={cn('relative rounded-2xl bg-[#12121A] z-10', className)}>
        {children}
      </div>
    </div>
  );
}
