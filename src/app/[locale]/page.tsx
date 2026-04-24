'use client';

import Image from 'next/image';
import Navbar from '@/components/Navbar';
import {
  ArrowRight, Sparkles, Zap, Shield, Upload, Disc3, Eye, Play,
  Smartphone, Gift, Building2, MessageCircle, CheckCircle2, Mail,
} from 'lucide-react';

function IGIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  );
}
import { motion } from 'motion/react';
import { Spotlight } from '@/components/ui/spotlight';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { AnimatedBorder } from '@/components/ui/animated-border';
import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

const BEFORE_IMG = '/demo-before.jpg';
const AFTER_IMG  = '/demo-after.jpg';

// ─── Before/After Slider ────────────────────────────────────────────────────
type SliderSize = 'large' | 'small';

type PlateRect = { left: string; top: string; width: string; height: string };

function BeforeAfterSlider({ size = 'large', beforeSrc, afterSrc, plateCensors, suppressWatermark }: {
  size?: SliderSize;
  beforeSrc?: string;
  afterSrc?: string;
  plateCensors?: PlateRect[];
  suppressWatermark?: boolean;
}) {
  const t = useTranslations('hero');
  const before = beforeSrc ?? BEFORE_IMG;
  const after  = afterSrc  ?? AFTER_IMG;
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const moveTo = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pct = Math.max(2, Math.min(98, ((clientX - rect.left) / rect.width) * 100));
    setPosition(pct);
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    moveTo(e.clientX);
  }, [moveTo]);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.buttons === 0) return;
    moveTo(e.clientX);
  }, [moveTo]);

  const isLarge = size === 'large';

  return (
    <div className="relative w-full">
      {isLarge && (
        <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-[#ec4899]/20 via-[#8b5cf6]/20 to-[#ec4899]/20 blur-2xl pointer-events-none" />
      )}
      <div
        className={`relative p-[2px] rounded-2xl${isLarge ? ' slider-border' : ''}`}
        style={isLarge
          ? { background: 'linear-gradient(135deg, #ec4899, #8b5cf6, #ec4899)', backgroundSize: '200% 200%', animation: 'gradientShift 4s linear infinite' }
          : { background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)' }
        }
      >
        <div
          ref={containerRef}
          className="relative select-none cursor-col-resize overflow-hidden rounded-[14px] bg-black"
          style={{ touchAction: 'none', aspectRatio: isLarge ? '16/9' : '4/3' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
        >
          <Image
            src={after} alt="Sonra" fill
            priority={isLarge}
            sizes={isLarge
              ? '(max-width: 390px) 390px, (max-width: 640px) 640px, (max-width: 1024px) 828px, 900px'
              : '(max-width: 640px) 50vw, 400px'}
            className="object-cover pointer-events-none" draggable={false}
          />
          {suppressWatermark && (
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'rgba(5,5,10,0.18)', mixBlendMode: 'multiply' }} />
          )}
          <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
            <Image
              src={before} alt="Önce" fill
              priority={isLarge}
              sizes={isLarge
                ? '(max-width: 390px) 390px, (max-width: 640px) 640px, (max-width: 1024px) 828px, 900px'
                : '(max-width: 640px) 50vw, 400px'}
              className="object-cover pointer-events-none" draggable={false}
            />
          </div>
          {plateCensors?.map((r, i) => (
            <div key={i} className="absolute pointer-events-none rounded-sm z-10"
                 style={{ left: r.left, top: r.top, width: r.width, height: r.height, backdropFilter: 'blur(10px) brightness(0.4)', background: 'rgba(0,0,0,0.45)' }} />
          ))}
          <div className="absolute top-2 left-2 px-2 py-1 rounded-full backdrop-blur-md bg-black/50 border border-white/15 text-[10px] font-semibold text-white/80 pointer-events-none">
            {t('before')}
          </div>
          <div
            className="absolute top-2 right-2 px-2 py-1 rounded-full backdrop-blur-md border border-white/20 text-[10px] font-bold text-white pointer-events-none"
            style={{ background: 'linear-gradient(135deg, rgba(236,72,153,0.85), rgba(139,92,246,0.85))' }}
          >
            {t('after')} ✨
          </div>
          <div
            className="absolute top-0 bottom-0 w-[2px] pointer-events-none"
            style={{ left: `${position}%`, background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.95) 15%, rgba(255,255,255,0.95) 85%, transparent)' }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none z-10"
            style={{ left: `${position}%` }}
          >
            <div
              className="w-8 h-8 rounded-full bg-white flex items-center justify-center border-2 border-white/90"
              style={{ boxShadow: '0 0 0 3px rgba(139,92,246,0.3), 0 4px 16px rgba(0,0,0,0.4)' }}
            >
              <div className="flex items-center gap-0.5">
                <svg width="6" height="10" viewBox="0 0 8 12" fill="none"><path d="M6 1L1 6L6 11" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <svg width="6" height="10" viewBox="0 0 8 12" fill="none"><path d="M2 1L7 6L2 11" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            </div>
          </div>
        </div>
      </div>
      {isLarge && (
        <style>{`
          @keyframes gradientShift {
            0%   { background-position: 0% 50%; }
            50%  { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          @media (max-width: 640px), (prefers-reduced-motion: reduce) {
            .slider-border { animation: none !important; }
          }
        `}</style>
      )}
    </div>
  );
}

// ─── Animated counter ────────────────────────────────────────────────────────
function CountUp({ end, suffix = '', duration = 1800, decimals = 0 }: {
  end: number; suffix?: string; duration?: number; decimals?: number;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const factor = Math.pow(10, decimals);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const startTime = performance.now();
          const animate = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * end * factor));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [end, duration, decimals]);

  const factor = Math.pow(10, decimals);
  const display = decimals > 0
    ? (count / factor).toFixed(decimals)
    : count.toLocaleString();

  return <span ref={ref}>{display}{suffix}</span>;
}

// ─── Subtle separator between sections ─────────────────────────────────────
function SectionSep() {
  return (
    <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
      <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.15), rgba(236,72,153,0.15), transparent)' }} />
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function Home() {
  const t         = useTranslations('hero');
  const tStats    = useTranslations('stats');
  const tSteps    = useTranslations('steps');
  const tFeatures = useTranslations('features');
  const tSocial   = useTranslations('social');
  const tFooter   = useTranslations('footerLinks');
  const tSP       = useTranslations('socialProof');
  const tGallery  = useTranslations('gallery');
  const tB2B      = useTranslations('b2b');
  const tTmn      = useTranslations('testimonials');
  const tCta      = useTranslations('finalCta');

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });
  }, [supabase]);

  const ctaHref = isLoggedIn ? '/app' : '/register';

  const steps = [
    { icon: Upload, title: tSteps('s1Title'), desc: tSteps('s1Desc'), time: '5s',   gradient: 'from-[#FF6B35] to-[#F72585]', featured: false },
    { icon: Disc3,  title: tSteps('s2Title'), desc: tSteps('s2Desc'), time: '3s',   gradient: 'from-[#F72585] to-[#7209B7]', featured: false },
    { icon: Eye,    title: tSteps('s3Title'), desc: tSteps('s3Desc'), time: '~30s', gradient: 'from-[#8b5cf6] to-[#ec4899]', featured: true  },
  ];

  const features = [
    { icon: Zap,        title: tFeatures('f1Title'), desc: tFeatures('f1Desc'), gradient: 'from-[#FF6B35] to-[#F72585]' },
    { icon: Sparkles,   title: tFeatures('f2Title'), desc: tFeatures('f2Desc'), gradient: 'from-[#F72585] to-[#7209B7]' },
    { icon: Shield,     title: tFeatures('f3Title'), desc: tFeatures('f3Desc'), gradient: 'from-[#7209B7] to-[#3A0CA3]' },
    { icon: Smartphone, title: tFeatures('f4Title'), desc: tFeatures('f4Desc'), gradient: 'from-[#06b6d4] to-[#8b5cf6]' },
    { icon: Gift,       title: tFeatures('f5Title'), desc: tFeatures('f5Desc'), gradient: 'from-[#FF6B35] to-[#ec4899]' },
    { icon: Building2,  title: tFeatures('f6Title'), desc: tFeatures('f6Desc'), gradient: 'from-[#8b5cf6] to-[#3A0CA3]' },
  ];

  const testimonials = [
    { quote: tTmn('q1'), author: tTmn('a1') },
    { quote: tTmn('q2'), author: tTmn('a2') },
    { quote: tTmn('q3'), author: tTmn('a3') },
  ];

  const galleryPairs = [
    {
      before: '/gallery-before-1.jpg',
      after: '/gallery-after-1.jpg',
      label: tGallery('label1'),
      suppressWatermark: true,
      plateCensors: [] as PlateRect[],
    },
    {
      before: '/gallery-before-2.jpg',
      after: '/gallery-after-2.jpg',
      label: tGallery('label2'),
      suppressWatermark: true,
      plateCensors: [] as PlateRect[],
    },
    {
      before: '/gallery-before-3.jpg',
      after: '/gallery-after-3.jpg',
      label: tGallery('label3'),
      suppressWatermark: true,
      plateCensors: [] as PlateRect[],
    },
  ];

  const b2bFeatures = [tB2B('f1'), tB2B('f2'), tB2B('f3'), tB2B('f4')];

  return (
    <>
      <Navbar />

      {/* ── Hero ── */}
      <section className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden pt-20 pb-12 px-4 sm:px-6">
        <div className="hidden sm:block">
          <Spotlight className="-top-40 left-1/2 -translate-x-1/2" fill="rgba(139, 92, 246, 0.25)" />
        </div>
        {/* Background orbs + grid */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full blur-[150px] opacity-10 hidden sm:block"
               style={{ background: 'radial-gradient(circle, #ec4899, transparent)' }} />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full blur-[150px] opacity-10 hidden sm:block"
               style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)' }} />
          <div className="absolute inset-0 opacity-[0.02]"
               style={{ backgroundImage: 'linear-gradient(var(--border-color) 1px, transparent 1px), linear-gradient(90deg, var(--border-color) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
        </div>

        <div className="relative z-10 w-full max-w-[1100px] mx-auto flex flex-col items-center text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium mb-6"
            style={{ borderColor: 'rgba(255,107,53,0.4)', background: 'rgba(255,107,53,0.08)', color: '#ffb899' }}
          >
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--accent-orange)' }} />
            {t('badge')}
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="leading-[1.05] tracking-[-0.03em] mb-4 sm:mb-5"
            style={{ fontSize: 'clamp(38px, 7.5vw, 80px)', fontWeight: 900 }}
          >
            {t('title')}
            <br />
            <span style={{ background: 'linear-gradient(135deg, #FF6B35 0%, #F72585 50%, #7209B7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              {t('titleHighlight')}
            </span>
          </motion.h1>

          {/* Subtitle with inline highlights */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="text-base sm:text-lg md:text-xl text-[#a1a1aa] mb-6 sm:mb-8 max-w-2xl"
          >
            {t('descPre')}
            <strong style={{ color: 'var(--accent-orange)', fontWeight: 700 }}>{t('descHighlight1')}</strong>
            {t('descMid')}
            <br className="hidden sm:block" />
            <span style={{ borderBottom: '2px solid rgba(247,37,133,0.5)', paddingBottom: '1px' }}>{t('descHighlight2')}</span>
            {t('descPost')}
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="flex flex-col sm:flex-row items-center gap-3 mb-5"
          >
            <Link href={ctaHref}>
              <ShimmerButton className="text-base md:text-lg px-8 py-4">
                🚀 {isLoggedIn ? t('ctaLoggedIn') : t('cta')}
                <ArrowRight className="w-5 h-5" />
              </ShimmerButton>
            </Link>
            <a
              href="#how-it-works"
              className="flex items-center gap-2 px-6 py-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white text-base font-medium transition-all duration-200 hover:border-white/20"
            >
              <Play className="w-4 h-4 text-[#8b5cf6]" />
              {t('howItWorks')}
            </a>
          </motion.div>

          {/* Trust strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-[#71717a] mb-10"
          >
            <span className="flex items-center gap-1.5">
              <span className="text-yellow-400">★★★★★</span>
              <span>{tStats('users')}</span>
            </span>
            <span className="w-px h-4 bg-white/10 hidden sm:block" />
            <span>💳 {tStats('noCard')}</span>
            <span className="w-px h-4 bg-white/10 hidden sm:block" />
            <span>⚡ {tStats('fast')}</span>
            <span className="w-px h-4 bg-white/10 hidden sm:block" />
            <span>🎁 {tStats('free')}</span>
          </motion.div>

          {/* Slider */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.45 }}
            className="w-full max-w-[900px]"
          >
            <BeforeAfterSlider size="large" />
            <p className="text-center text-xs text-[#52525b] mt-3 flex items-center justify-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3"/></svg>
              {t('compare')}
            </p>
          </motion.div>
        </div>
      </section>

      <SectionSep />

      {/* ── Social Proof Band ── */}
      <section className="py-12 relative">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl px-6 sm:px-10 py-7 flex flex-wrap items-center justify-center gap-6 sm:gap-10"
            style={{ background: 'rgba(18,18,26,0.7)', backdropFilter: 'blur(20px)', border: '1px solid var(--border-color)' }}
          >
            {[
              { icon: '⚡', label: tSP('feat1') },
              { icon: '🎯', label: tSP('feat2') },
              { icon: '💳', label: tSP('feat3') },
            ].map(({ icon, label }, i) => (
              <div key={i} className="flex items-center gap-2.5">
                {i > 0 && <span className="hidden sm:block w-px h-5 bg-[var(--border-color)]" />}
                <span className="text-xl">{icon}</span>
                <span className="text-sm font-semibold text-white">{label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      <SectionSep />

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-14 sm:py-24 relative">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              <span className="gradient-text">{tSteps('title')}</span>
            </h2>
            <p className="text-[var(--text-secondary)]">{tSteps('subtitle')}</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 relative">
            <div
              className="hidden md:block absolute top-[4.5rem] left-[calc(100%/6)] right-[calc(100%/6)] h-px"
              style={{ background: 'linear-gradient(90deg, rgba(255,107,53,0.4) 0%, rgba(139,92,246,0.6) 50%, rgba(236,72,153,0.4) 100%)' }}
            />
            <div className="hidden md:block absolute top-[4.5rem] left-1/3 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#8b5cf6] opacity-60" />
            <div className="hidden md:block absolute top-[4.5rem] right-1/3 translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#ec4899] opacity-60" />

            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                whileHover={{ y: -6, transition: { duration: 0.25, ease: 'easeOut' } }}
                className={`relative text-center rounded-2xl border p-7 transition-all duration-300 ${
                  step.featured
                    ? 'border-[#8b5cf6]/50 bg-gradient-to-b from-[#1a1a2e] to-[#0f0f1a] shadow-[0_8px_40px_rgba(139,92,246,0.3)]'
                    : 'border-[var(--border-color)] bg-gradient-to-b from-[var(--bg-card)] to-[#0f0f18] hover:border-white/10 hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)]'
                }`}
              >
                {step.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold text-white"
                       style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)' }}>
                    AI Magic ✨
                  </div>
                )}
                <div className={`w-9 h-9 rounded-full bg-gradient-to-r ${step.gradient} flex items-center justify-center text-sm font-bold text-white mx-auto mb-5 shadow-lg`}>
                  {i + 1}
                </div>
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                  <step.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] mb-5">{step.desc}</p>
                <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r ${step.gradient} text-white text-xs font-semibold shadow-md`}>
                  <Zap className="w-3 h-3" />
                  {step.time}
                </span>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-center mt-12"
          >
            <Link href={ctaHref}>
              <ShimmerButton className="text-base px-8 py-4 mx-auto">
                {isLoggedIn ? t('ctaLoggedIn') : t('cta')}
                <ArrowRight className="w-4 h-4" />
              </ShimmerButton>
            </Link>
            <p className="text-xs text-[#52525b] mt-3">{tSteps('noCard')}</p>
          </motion.div>
        </div>
      </section>

      <SectionSep />

      {/* ── Before/After Gallery — şimdilik gizli ── */}

      <SectionSep />

      {/* ── Features ── */}
      <section className="py-20 relative">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              {tFeatures('title')} <span className="gradient-text">{tFeatures('titleBrand')}</span>
            </h2>
            <p className="text-[var(--text-secondary)] max-w-lg mx-auto">{tFeatures('subtitle')}</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ y: -6, transition: { duration: 0.25, ease: 'easeOut' } }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="card text-center hover:shadow-[0_8px_32px_rgba(139,92,246,0.15)] transition-all duration-300 hover:border-white/10"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-r ${f.gradient} flex items-center justify-center mx-auto mb-4`}>
                  <f.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
                <p className="text-[var(--text-secondary)] text-sm">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <SectionSep />

      {/* ── B2B Section ── */}
      <section className="py-20 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[150px] opacity-10 pointer-events-none"
             style={{ background: 'radial-gradient(circle, #FF6B35, transparent)' }} />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full blur-[150px] opacity-[0.08] pointer-events-none"
             style={{ background: 'radial-gradient(circle, #F72585, transparent)' }} />
        <div className="absolute inset-0 pointer-events-none opacity-[0.02]"
             style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        <div className="absolute top-0 left-[10%] right-[10%] h-px pointer-events-none"
             style={{ background: 'linear-gradient(90deg, transparent, #FF6B35, #F72585, #7209B7, transparent)', opacity: 0.3 }} />
        <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <AnimatedBorder containerClassName="w-full" duration={6}>
              <div className="p-8 md:p-12 grid md:grid-cols-2 gap-10 items-center">
                {/* Left */}
                <div>
                  <div
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-5"
                    style={{ background: 'rgba(255,107,53,0.1)', border: '1px solid rgba(255,107,53,0.3)', color: 'var(--accent-orange)' }}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    {tB2B('eyebrow')}
                  </div>
                  <h2 className="text-3xl md:text-4xl font-black mb-3 leading-tight">{tB2B('title')}</h2>
                  <p className="text-lg text-[var(--text-secondary)] mb-6">{tB2B('subtitle')}</p>
                  <ul className="space-y-3 mb-8">
                    {b2bFeatures.map((f, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm">
                        <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--accent-orange)' }} />
                        <span className="text-[var(--text-secondary)]">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap gap-3">
                    <a
                      href="mailto:info@wheelvision.io"
                      onClick={e => { e.stopPropagation(); window.location.href = 'mailto:info@wheelvision.io'; }}
                      className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-white transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5 cursor-pointer"
                      style={{ background: 'linear-gradient(135deg, #FF6B35, #F72585)' }}
                    >
                      <MessageCircle className="w-4 h-4" />
                      {tB2B('cta1')}
                    </a>
                  </div>
                </div>

                {/* Right: Phone mockup — live iframe with scroll animation */}
                <div className="relative mx-auto hidden lg:block" style={{ width: 280, height: 580 }}>
                  <style>{`
                    @keyframes phoneScroll {
                      0%, 8%   { transform: scale(0.718) translateY(0px); }
                      70%, 82% { transform: scale(0.718) translateY(-620px); }
                      92%, 100%{ transform: scale(0.718) translateY(0px); }
                    }
                  `}</style>
                  {/* Telefon çerçevesi */}
                  <div
                    className="absolute inset-0 rounded-[44px] border-2 border-white/10 bg-[#0A0A0F] overflow-hidden"
                    style={{ boxShadow: '0 30px 80px rgba(0,0,0,0.5), 0 0 30px rgba(247,37,133,0.08)' }}
                  >
                    {/* Dynamic Island */}
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-5 bg-black rounded-full z-20" />
                    {/* iframe — gerçek testjant sayfası */}
                    <div className="w-full h-full overflow-hidden rounded-[42px] pt-8">
                      <iframe
                        src="/d/testjant"
                        style={{
                          width: '390px',
                          height: '1800px',
                          transform: 'scale(0.718)',
                          transformOrigin: 'top left',
                          border: 'none',
                          pointerEvents: 'none',
                          animation: 'phoneScroll 12s ease-in-out infinite',
                        }}
                        loading="lazy"
                        tabIndex={-1}
                      />
                    </div>
                    {/* Alt fade — scroll devam ediyor hissi */}
                    <div
                      className="absolute bottom-0 left-0 right-0 h-16 rounded-b-[42px] pointer-events-none z-10"
                      style={{ background: 'linear-gradient(to top, #0A0A0F, transparent)' }}
                    />
                  </div>
                  {/* Glow */}
                  <div
                    className="absolute -inset-6 rounded-[56px] pointer-events-none"
                    style={{ background: 'radial-gradient(ellipse at center, rgba(247,37,133,0.06), transparent 70%)' }}
                  />
                </div>
              </div>
            </AnimatedBorder>
          </motion.div>
        </div>
      </section>

      {/* ── Contact Modal ── */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-[#12121A] border border-white/10 rounded-2xl p-8 max-w-md w-full text-center"
               style={{ animation: 'modalIn 0.25s ease-out' }}>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg, #FF6B35, #F72585)' }}>
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Demo İçin İletişime Geçin</h3>
            <p className="text-[#A0A0B0] text-sm mb-6">
              Kendi jant showroom&apos;unuzu oluşturmak için bizimle iletişime geçin.
            </p>
            <div className="flex flex-col gap-3">
              <a
                href="mailto:info@wheelvision.io?subject=WheelVision%20Demo%20Talebi"
                className="w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #FF6B35, #F72585, #7209B7)' }}
              >
                <Mail className="w-4 h-4" />
                E-posta Gönder
              </a>
              <a
                href="https://instagram.com/wheelvisionioofficial"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 rounded-xl border border-white/10 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors hover:border-[#FF6B35]/30"
              >
                <IGIcon size={16} />
                Instagram
              </a>
              <button
                onClick={() => setShowContactModal(false)}
                className="text-[#A0A0B0] text-sm hover:text-white transition-colors mt-2"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      <SectionSep />

      {/* ── Testimonials ── */}
      <section className="py-20 relative">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-3">{tTmn('title')}</h2>
            <p className="text-[var(--text-secondary)]">{tTmn('subtitle')}</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="rounded-2xl p-6 flex flex-col gap-4 transition-all duration-300"
                style={{ background: 'rgba(18,18,26,0.6)', backdropFilter: 'blur(12px)', border: '1px solid var(--border-color)' }}
              >
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, j) => (
                    <span key={j} className="text-yellow-400 text-sm">★</span>
                  ))}
                </div>
                <p className="text-[var(--text-secondary)] italic text-sm leading-relaxed flex-1">
                  &ldquo;{item.quote}&rdquo;
                </p>
                <p className="text-xs font-semibold" style={{ color: 'var(--accent-orange)' }}>{item.author}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <SectionSep />

      {/* ── Final CTA ── */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[130px] opacity-15"
            style={{ background: 'radial-gradient(circle, #F72585, #7209B7, transparent)' }}
          />
        </div>
        <div className="max-w-[760px] mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <p className="text-base font-semibold mb-2" style={{ color: 'var(--accent-orange)' }}>{tCta('eyebrow')}</p>
            <h2 className="text-4xl md:text-5xl font-black mb-4 leading-tight">{tCta('title')}</h2>
            <p className="text-[var(--text-secondary)] mb-8 text-lg">{tCta('desc')}</p>
            <Link href={ctaHref}>
              <ShimmerButton className="text-lg px-10 py-5 mx-auto">
                🚀 {tCta('cta')}
                <ArrowRight className="w-5 h-5" />
              </ShimmerButton>
            </Link>
            <p className="text-xs text-[#52525b] mt-4">{tSocial('noCard')}</p>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-10 border-t border-[var(--border-color)]">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Logo + tagline */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[var(--accent-orange)] to-[var(--accent-pink)] flex items-center justify-center">
                  <span className="text-white font-bold text-sm">W</span>
                </div>
                <span className="font-bold text-lg">WheelVision</span>
              </div>
              <p className="text-sm text-[var(--text-secondary)] max-w-[240px]">{tFooter('tagline')}</p>
            </div>

            {/* Nav links */}
            <div className="flex flex-wrap gap-x-8 gap-y-3 md:justify-center">
              <div className="flex flex-col gap-2.5">
                <Link href="/app"     className="text-sm text-[var(--text-secondary)] hover:text-white transition-colors">{tFooter('app')}</Link>
                <Link href="/pricing" className="text-sm text-[var(--text-secondary)] hover:text-white transition-colors">{tFooter('pricing')}</Link>
                <Link href="/login"   className="text-sm text-[var(--text-secondary)] hover:text-white transition-colors">{tFooter('login')}</Link>
              </div>
              <div className="flex flex-col gap-2.5">
                <Link href="/privacy" className="text-sm text-[var(--text-secondary)] hover:text-white transition-colors">{tFooter('privacy')}</Link>
                <Link href="/terms"   className="text-sm text-[var(--text-secondary)] hover:text-white transition-colors">{tFooter('terms')}</Link>
              </div>
            </div>

            {/* Social icons */}
            <div className="flex items-start gap-3 md:justify-end">
              <a
                href="https://instagram.com/wheelvision" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:text-white transition-all hover:-translate-y-0.5"
                style={{ border: '1px solid var(--border-color)' }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
              <a
                href="https://twitter.com/wheelvision" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:text-white transition-all hover:-translate-y-0.5"
                style={{ border: '1px solid var(--border-color)' }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
            </div>
          </div>

          <div className="border-t border-[var(--border-color)] pt-6 text-center">
            <p className="text-sm text-[#52525b]">{tFooter('copyright')}</p>
          </div>
        </div>
      </footer>
    </>
  );
}
