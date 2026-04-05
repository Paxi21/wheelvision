'use client';

import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import { ArrowRight, Sparkles, Zap, Shield, ChevronDown, Upload, Disc3, Eye, Play } from 'lucide-react';
import { motion } from 'motion/react';
import { Spotlight } from '@/components/ui/spotlight';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { AnimatedBorder } from '@/components/ui/animated-border';
import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase';

// ─── Before/After Slider ────────────────────────────────────────────────────
const BEFORE_IMG = '/demo-before.jpg';
const AFTER_IMG  = '/demo-after.jpg';

function BeforeAfterSlider() {
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

  return (
    <div className="relative w-full">
      {/* Glow behind slider */}
      <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-[#ec4899]/20 via-[#8b5cf6]/20 to-[#ec4899]/20 blur-2xl pointer-events-none" />

      {/* Gradient border */}
      <div className="relative p-[2px] rounded-2xl"
           style={{ background: 'linear-gradient(135deg, #ec4899, #8b5cf6, #ec4899)', backgroundSize: '200% 200%', animation: 'gradientShift 4s linear infinite' }}>
        <div
          ref={containerRef}
          className="relative select-none cursor-col-resize overflow-hidden rounded-[14px] aspect-[16/9] bg-black"
          style={{ touchAction: 'none' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
        >
          {/* AFTER */}
          <Image src={AFTER_IMG} alt="Jant değişimi sonrası - AI görselleştirme" fill
                 priority sizes="(max-width: 768px) 100vw, 900px"
                 className="object-cover pointer-events-none" draggable={false} />

          {/* BEFORE — clipped left */}
          <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
            <Image src={BEFORE_IMG} alt="Jant değişimi öncesi - orijinal araba" fill
                   sizes="(max-width: 768px) 100vw, 900px"
                   className="object-cover pointer-events-none" draggable={false} />
          </div>

          {/* Labels */}
          <div className="absolute top-3 left-3 px-3 py-1.5 rounded-full backdrop-blur-md bg-black/50 border border-white/15 text-xs font-semibold text-white/80 pointer-events-none">
            Önce
          </div>
          <div className="absolute top-3 right-3 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/20 text-xs font-bold text-white pointer-events-none"
               style={{ background: 'linear-gradient(135deg, rgba(236,72,153,0.85), rgba(139,92,246,0.85))' }}>
            Sonra ✨
          </div>

          {/* Divider line */}
          <div className="absolute top-0 bottom-0 w-[2px] pointer-events-none"
               style={{ left: `${position}%`, background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.95) 15%, rgba(255,255,255,0.95) 85%, transparent)' }} />

          {/* Handle */}
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none z-10"
               style={{ left: `${position}%` }}>
            <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center border-2 border-white/90"
                 style={{ boxShadow: '0 0 0 4px rgba(139,92,246,0.3), 0 4px 20px rgba(0,0,0,0.4)' }}>
              <div className="flex items-center gap-0.5">
                <svg width="8" height="12" viewBox="0 0 8 12" fill="none">
                  <path d="M6 1L1 6L6 11" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <svg width="8" height="12" viewBox="0 0 8 12" fill="none">
                  <path d="M2 1L7 6L2 11" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes gradientShift {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
}

// ─── Steps ───────────────────────────────────────────────────────────────────
const steps = [
  { icon: Upload, title: 'Araba Yükle',  desc: 'Arabanızın fotoğrafını seçin', time: '5 sn',  gradient: 'from-[#FF6B35] to-[#F72585]', featured: false },
  { icon: Disc3,  title: 'Jant Seç',     desc: 'Denemek istediğiniz jantı yükleyin', time: '3 sn', gradient: 'from-[#F72585] to-[#7209B7]', featured: false },
  { icon: Eye,    title: 'Sonucu Gör',   desc: 'AI jantları arabanıza yerleştiriyor', time: '~30 sn', gradient: 'from-[#8b5cf6] to-[#ec4899]', featured: true },
];

// ─── Page ────────────────────────────────────────────────────────────────────
export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });
  }, [supabase]);

  const ctaHref = isLoggedIn ? '/app' : '/register';

  return (
    <>
      <Navbar />

      {/* ── Hero ── */}
      <section className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden pt-20 pb-12 px-4 sm:px-6">
        <Spotlight className="-top-40 left-1/2 -translate-x-1/2" fill="rgba(139, 92, 246, 0.25)" />

        {/* Background glows */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full blur-[200px] opacity-20"
               style={{ background: 'radial-gradient(circle, #ec4899, transparent)' }} />
          <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] rounded-full blur-[200px] opacity-20"
               style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)' }} />
        </div>

        <div className="relative z-10 w-full max-w-[1100px] mx-auto flex flex-col items-center text-center">

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#8b5cf6]/40 bg-[#8b5cf6]/10 text-sm text-[#c4b5fd] font-medium mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-[#8b5cf6] animate-pulse" />
            Yapay Zeka ile Jant Görselleştirme — Ücretsiz Dene
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl xl:text-7xl font-bold leading-[1.1] tracking-tight mb-4 sm:mb-5"
          >
            O Jant Arabana
            <br />
            <span style={{ background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #06b6d4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Yakışıyor mu?
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-lg md:text-xl text-[#a1a1aa] mb-6 sm:mb-8 max-w-2xl"
          >
            Binlerce lira harcamadan önce gör.
            Arabanın fotoğrafını yükle, jantı seç — AI <span className="text-white font-semibold">30 saniyede</span> arabana yerleştiriyor.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-3 mb-5"
          >
            <Link href={ctaHref}>
              <ShimmerButton className="text-base md:text-lg px-8 py-4">
                🚀 {isLoggedIn ? 'Uygulamaya Git' : 'Ücretsiz Başla'}
                <ArrowRight className="w-5 h-5" />
              </ShimmerButton>
            </Link>
            <a
              href="#nasil-calisir"
              className="flex items-center gap-2 px-6 py-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white text-base font-medium transition-all duration-200 hover:border-white/20"
            >
              <Play className="w-4 h-4 text-[#8b5cf6]" />
              Nasıl Çalışır?
            </a>
          </motion.div>

          {/* Trust strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-[#71717a] mb-10"
          >
            <span className="flex items-center gap-1.5">
              <span className="text-yellow-400">★★★★★</span>
              <span>500+ araç sahibi denedi</span>
            </span>
            <span className="w-px h-4 bg-white/10 hidden sm:block" />
            <span>💳 Kart gerekmez</span>
            <span className="w-px h-4 bg-white/10 hidden sm:block" />
            <span>⚡ 30 sn&apos;de sonuç</span>
            <span className="w-px h-4 bg-white/10 hidden sm:block" />
            <span>🎁 2 kredi ücretsiz</span>
          </motion.div>

          {/* Slider — centrepiece */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.45 }}
            className="w-full max-w-[900px]"
          >
            <BeforeAfterSlider />
            <p className="text-center text-xs text-[#52525b] mt-3 flex items-center justify-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3"/></svg>
              Kaydırarak orijinal ve AI sonucunu karşılaştırın
            </p>
          </motion.div>

        </div>
      </section>

      {/* ── Steps ── */}
      <section id="nasil-calisir" className="py-14 sm:py-24 relative">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              3 Adımda <span className="gradient-text">Hazır</span>
            </h2>
            <p className="text-[var(--text-secondary)]">
              Sadece 38 saniye — jant kararınızı kolaylaştırın
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-[4.5rem] left-[calc(100%/6)] right-[calc(100%/6)] h-px"
                 style={{ background: 'linear-gradient(90deg, rgba(255,107,53,0.4) 0%, rgba(139,92,246,0.6) 50%, rgba(236,72,153,0.4) 100%)' }} />
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
                    AI Sihri ✨
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

          {/* CTA below steps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-center mt-12"
          >
            <Link href={ctaHref}>
              <ShimmerButton className="text-base px-8 py-4 mx-auto">
                Hemen Dene — Ücretsiz
                <ArrowRight className="w-4 h-4" />
              </ShimmerButton>
            </Link>
            <p className="text-xs text-[#52525b] mt-3">Kredi kartı gerekmez · 2 ücretsiz görselleştirme</p>
          </motion.div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20 relative">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              Neden <span className="gradient-text">WheelVision</span>?
            </h2>
            <p className="text-[var(--text-secondary)] max-w-lg mx-auto">
              Yanlış jant almak pahalıya patlar. Biz bunu önlemek için buradayız.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Zap,      title: 'Anında Sonuç',    desc: '~30 saniyede yüksek kaliteli AI görselleştirme. Bekleme yok.',   gradient: 'from-[#FF6B35] to-[#F72585]' },
              { icon: Sparkles, title: 'Gerçekçi AI',     desc: 'Işık, gölge ve yansımalar otomatik eşleştirilir. Gerçek gibi görünür.',  gradient: 'from-[#F72585] to-[#7209B7]' },
              { icon: Shield,   title: 'Güvenli & Gizli', desc: 'Görselleriniz şifrelenir, hiçbir zaman üçüncü tarafla paylaşılmaz.', gradient: 'from-[#7209B7] to-[#3A0CA3]' },
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ y: -6, transition: { duration: 0.25, ease: 'easeOut' } }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                viewport={{ once: true }}
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

      {/* ── Social Proof / CTA ── */}
      <section className="py-24 relative">
        <div className="max-w-[760px] mx-auto px-6">
          <AnimatedBorder containerClassName="w-full" duration={5}>
            <div className="p-8 md:p-12 text-center">
              {/* Stars */}
              <div className="flex justify-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400 text-xl">★</span>
                ))}
              </div>
              <p className="text-[#a1a1aa] italic mb-6 max-w-lg mx-auto text-base">
                &ldquo;Jant almadan önce arabamda nasıl durduğunu görmek müthişti. Sonunda doğru jantı aldım.&rdquo;
              </p>
              <p className="text-sm text-[#52525b] mb-8">— Murat K., BMW E46 sahibi</p>

              <h2 className="text-3xl md:text-4xl font-bold mb-2">
                Sıradaki Doğru Jantı Bul
              </h2>
              <p className="text-[var(--text-secondary)] mb-2">
                2 ücretsiz kredi ile başla, beğenirsen devam et.
              </p>
              <p className="text-sm text-[var(--accent-orange)] mb-8">
                💡 Ücretli plana geçtiğinde tüm filigranlar otomatik kalkar
              </p>
              <Link href={ctaHref}>
                <ShimmerButton className="text-lg px-10 py-4 mx-auto">
                  🚀 {isLoggedIn ? 'Uygulamaya Git' : 'Ücretsiz Başla'}
                  <ArrowRight className="w-5 h-5" />
                </ShimmerButton>
              </Link>
              <p className="text-xs text-[#52525b] mt-3">Kredi kartı gerekmez · 30 saniyede üye ol</p>
            </div>
          </AnimatedBorder>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 border-t border-[var(--border-color)]">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[var(--accent-orange)] to-[var(--accent-pink)] flex items-center justify-center">
              <span className="text-white font-bold text-sm">W</span>
            </div>
            <span className="font-semibold">WheelVision</span>
          </div>
          <p className="text-sm text-[var(--text-secondary)]">
            © 2026 WheelVision. Tüm hakları saklıdır.
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-[var(--text-secondary)]">
            <Link href="/pricing" className="hover:text-white transition-colors">Fiyatlar</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Gizlilik</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Kullanım Şartları</Link>
            <Link href="/login" className="hover:text-white transition-colors">Giriş</Link>
          </div>
        </div>
      </footer>
    </>
  );
}
