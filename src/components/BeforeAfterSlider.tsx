'use client';

import Image from 'next/image';
import { useRef, useState, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';

interface BeforeAfterSliderProps {
  before: string;
  after: string;
}

export default function BeforeAfterSlider({ before, after }: BeforeAfterSliderProps) {
  const t = useTranslations('hero');
  const containerRef = useRef<HTMLDivElement>(null);
  const [pct, setPct] = useState(50);
  const dragging = useRef(false);

  const setPosition = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    let p = ((clientX - rect.left) / rect.width) * 100;
    p = Math.max(2, Math.min(98, p));
    setPct(p);
  }, []);

  const onDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      dragging.current = true;
      const x = 'touches' in e ? e.touches[0].clientX : e.clientX;
      setPosition(x);
    },
    [setPosition],
  );

  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!dragging.current) return;
      const x = 'touches' in e ? e.touches[0].clientX : e.clientX;
      setPosition(x);
    };
    const onUp = () => {
      dragging.current = false;
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchend', onUp);
    };
  }, [setPosition]);

  return (
    <div className="w-full">
      {/* Glow */}
      <div className="relative">
        <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-[#ec4899]/15 via-[#8b5cf6]/15 to-[#ec4899]/15 blur-2xl pointer-events-none" />

        {/* Animated gradient border */}
        <div
          className="relative p-[2px] rounded-2xl slider-border"
          style={{
            background: 'linear-gradient(135deg, #ec4899, #8b5cf6, #ec4899)',
            backgroundSize: '200% 200%',
            animation: 'sliderBorderShift 4s linear infinite',
          }}
        >
          {/* Slider container */}
          <div
            ref={containerRef}
            onMouseDown={onDown}
            onTouchStart={onDown}
            className="relative select-none overflow-hidden rounded-[14px] bg-black cursor-ew-resize"
            style={{ aspectRatio: '16/10' }}
          >
            {/* Before image (full) */}
            <Image
              src={before}
              alt={t('before')}
              fill
              priority
              sizes="(max-width: 640px) 100vw, 900px"
              className="object-cover pointer-events-none"
              draggable={false}
            />

            {/* After image (clipped) */}
            <Image
              src={after}
              alt={t('after')}
              fill
              priority
              sizes="(max-width: 640px) 100vw, 900px"
              className="object-cover pointer-events-none"
              style={{ clipPath: `inset(0 0 0 ${pct}%)` }}
              draggable={false}
            />

            {/* Before label */}
            <span className="absolute top-3 left-3 px-3 py-1.5 rounded-full backdrop-blur-md bg-black/55 border border-white/15 text-[11px] font-bold uppercase tracking-wider text-white/80 pointer-events-none z-[5]">
              {t('before')}
            </span>

            {/* After label */}
            <span
              className="absolute top-3 right-3 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/20 text-[11px] font-bold uppercase tracking-wider text-white pointer-events-none z-[5]"
              style={{
                background: 'linear-gradient(135deg, rgba(236,72,153,0.85), rgba(139,92,246,0.85))',
              }}
            >
              {t('after')} ✨
            </span>

            {/* Divider line */}
            <div
              className="absolute top-0 w-[3px] h-full bg-white/90 -translate-x-1/2 z-10"
              style={{
                left: `${pct}%`,
                boxShadow: '0 0 12px rgba(255,255,255,0.25)',
              }}
            />

            {/* Drag handle */}
            <div
              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 z-[11] w-11 h-11 rounded-full bg-white/95 flex items-center justify-center"
              style={{
                left: `${pct}%`,
                boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#09090b"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M7 4l-4 4 4 4" />
                <path d="M17 4l4 4-4 4" />
                <line x1="3" y1="8" x2="21" y2="8" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Hint text */}
      <p className="text-center mt-3 text-xs text-[#52525b] flex items-center justify-center gap-1.5">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M7 4l-4 4 4 4M17 4l4 4-4 4" />
        </svg>
        {t('sliderHint')}
      </p>

      <style>{`
        @keyframes sliderBorderShift {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @media (max-width: 640px), (prefers-reduced-motion: reduce) {
          .slider-border { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
