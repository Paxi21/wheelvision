'use client';

import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface TextRevealProps {
  text: string;
  className?: string;
  delay?: number;
}

export function TextReveal({ text, className, delay = 0 }: TextRevealProps) {
  const words = text.split(' ');

  return (
    <motion.p
      className={cn('flex flex-wrap gap-x-2', className)}
      initial="hidden"
      animate="visible"
    >
      {words.map((word, i) => (
        <motion.span
          key={i}
          variants={{
            hidden: { opacity: 0, y: 20, filter: 'blur(4px)' },
            visible: {
              opacity: 1,
              y: 0,
              filter: 'blur(0px)',
              transition: { duration: 0.5, delay: delay + i * 0.1 },
            },
          }}
        >
          {word}
        </motion.span>
      ))}
    </motion.p>
  );
}
