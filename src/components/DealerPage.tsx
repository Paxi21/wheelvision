'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Camera, ImageIcon, Check, Loader2,
  X, RefreshCw, Download, ChevronRight, ChevronDown, ChevronLeft, Sparkles, Zap,
} from 'lucide-react';
import type { Dealer, Wheel } from '@/app/d/[slug]/page';

const CLOUD_NAME    = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;

/* Cloudinary URL optimizer — injects f_auto,q_auto,w_{size} transforms */
function cdnUrl(url: string, w: number): string {
  if (!url.includes('cloudinary.com/')) return url;
  return url.replace('/upload/', `/upload/f_auto,q_auto:good,w_${w}/`);
}

/* Skeleton shimmer */
function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded bg-white/8 ${className}`}
      style={{ background: 'linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.09) 50%,rgba(255,255,255,0.04) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
  );
}

/* Wheel image with skeleton + fade-in */
function WheelImg({ src, alt, priority = false, className = '' }: { src: string; alt: string; priority?: boolean; className?: string }) {
  const [loaded, setLoaded] = useState(false);
  const opt = cdnUrl(src, priority ? 600 : 400);
  return (
    <div className={`relative w-full h-full ${className}`}>
      {!loaded && <Skeleton className="absolute inset-0 rounded-none" />}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={opt}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        onLoad={() => setLoaded(true)}
        className={`w-full h-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        draggable={false}
      />
    </div>
  );
}

const GENERATION_STEPS = [
  'Araç analiz ediliyor...',
  'Jant yerleştiriliyor...',
  'Işık ve gölge uyumu...',
  'Renk eşleştirme yapılıyor...',
  'Son rötuşlar uygulanıyor...',
  'Görsel hazırlanıyor...',
];

/* ─── Cloudinary upload ───────────────────────────────────────────────────── */
async function uploadToCloudinary(file: File): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', UPLOAD_PRESET);
  fd.append('folder', 'dealer-cars');
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST', body: fd,
  });
  if (!res.ok) throw new Error('Upload failed');
  return (await res.json() as { secure_url: string }).secure_url;
}

/* ─── Download with watermark ─────────────────────────────────────────────── */
async function downloadWithWatermark(imageUrl: string, slug: string) {
  const res  = await fetch(`/api/proxy-image?url=${encodeURIComponent(imageUrl)}`);
  const blob = await res.blob();
  const bmp  = await createImageBitmap(blob);
  const canvas = document.createElement('canvas');
  canvas.width  = bmp.width;
  canvas.height = bmp.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bmp, 0, 0);
  const text     = slug.toUpperCase();
  const fontSize = Math.max(48, Math.floor(bmp.width / 8));
  ctx.save();
  ctx.translate(bmp.width / 2, bmp.height / 2);
  ctx.rotate(-Math.PI / 5);
  ctx.font      = `bold ${fontSize}px Outfit, Arial, sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, 0);
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.fillText(text, 2, 2);
  ctx.restore();
  canvas.toBlob((b) => {
    if (!b) return;
    const a = document.createElement('a');
    a.href     = URL.createObjectURL(b);
    a.download = `${slug}-wheelvision.jpg`;
    a.click();
    URL.revokeObjectURL(a.href);
  }, 'image/jpeg', 0.92);
}

/* ─── WhatsApp icon ───────────────────────────────────────────────────────── */
function WAIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

/* ─── Before / After Slider ───────────────────────────────────────────────── */
function BeforeAfterSlider({ before, after, onAfterLoad }: { before: string; after: string; onAfterLoad?: () => void }) {
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const moveTo = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setPosition(Math.max(2, Math.min(98, ((clientX - rect.left) / rect.width) * 100)));
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
    <div className="relative w-full h-full">
      <div className="absolute -inset-3 rounded-3xl bg-gradient-to-r from-[#ec4899]/20 via-[#8b5cf6]/20 to-[#ec4899]/20 blur-2xl pointer-events-none" />
      <div className="relative h-full p-[2px] rounded-2xl" style={{ background: 'linear-gradient(135deg,#FF6B35,#F72585,#7209B7)' }}>
        <div
          ref={containerRef}
          className="relative select-none cursor-col-resize overflow-hidden rounded-[14px] bg-black h-full"
          style={{ touchAction: 'none' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cdnUrl(after, 1200)} alt="Sonra" onLoad={onAfterLoad} className="absolute inset-0 w-full h-full object-cover pointer-events-none" draggable={false} />
          <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={before} alt="Önce" className="w-full h-full object-cover pointer-events-none" draggable={false} />
          </div>
          <div className="absolute top-3 left-3 px-3 py-1.5 rounded-full backdrop-blur-md bg-black/50 border border-white/15 text-xs font-semibold text-white/80 pointer-events-none">ÖNCE</div>
          <div className="absolute top-3 right-3 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/20 text-xs font-bold text-white pointer-events-none"
            style={{ background: 'linear-gradient(135deg,rgba(255,107,53,0.85),rgba(247,37,133,0.85))' }}>SONRA ✨</div>
          <div className="absolute top-0 bottom-0 w-[2px] pointer-events-none"
            style={{ left: `${position}%`, background: 'linear-gradient(to bottom,transparent,rgba(255,255,255,0.95) 15%,rgba(255,255,255,0.95) 85%,transparent)' }} />
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none z-10" style={{ left: `${position}%` }}>
            <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center border-2 border-white/90"
              style={{ boxShadow: '0 0 0 4px rgba(247,37,133,0.3),0 4px 20px rgba(0,0,0,0.4)' }}>
              <div className="flex items-center gap-0.5">
                <svg width="8" height="12" viewBox="0 0 8 12" fill="none"><path d="M6 1L1 6L6 11" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                <svg width="8" height="12" viewBox="0 0 8 12" fill="none"><path d="M2 1L7 6L2 11" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Wheel Detail Modal ──────────────────────────────────────────────────── */
function WheelModal({ wheel, onClose, onSelect }: { wheel: Wheel; onClose: () => void; onSelect: (w: Wheel) => void }) {
  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-x-4 bottom-0 sm:inset-auto sm:left-1/2 sm:-translate-x-1/2 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:w-[380px] z-50 rounded-t-3xl sm:rounded-2xl border border-[var(--border-color)] overflow-hidden"
        style={{ background: 'var(--bg-card)' }}>
        <div className="sm:hidden w-12 h-1 rounded-full bg-[var(--border-color)] mx-auto mt-3" />
        <div className="relative w-full aspect-square bg-[var(--bg-dark)]">
          <WheelImg src={wheel.jant_foto_url} alt={wheel.jant_adi} priority />
        </div>
        <div className="p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <h3 className="font-bold text-base leading-tight">{wheel.jant_adi}</h3>
            {wheel.marka && <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--border-color)] text-[var(--text-secondary)] flex-shrink-0">{wheel.marka}</span>}
          </div>
          <div className="space-y-2 mb-5">
            {wheel.ebat && <div className="flex justify-between text-sm"><span className="text-[var(--text-secondary)]">Ebat</span><span className="font-medium">{wheel.ebat}</span></div>}
            {wheel.fiyat != null && (
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-secondary)]">Fiyat</span>
                <span className="font-extrabold text-[var(--accent-orange)]">₺{wheel.fiyat.toLocaleString('tr-TR')}</span>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={onClose} className="btn-secondary py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"><X className="w-4 h-4" /> İptal</button>
            <button onClick={() => onSelect(wheel)} className="btn-primary py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"><Check className="w-4 h-4" /> Seç</button>
          </div>
          <p className="text-center text-[10px] text-[var(--text-secondary)]/50 mt-4 italic">Bu görseller demo amaçlıdır.</p>
        </div>
      </div>
    </>
  );
}

/* ─── Shared Header ───────────────────────────────────────────────────────── */
function DealerHeader({ dealer, onBack }: { dealer: Dealer; onBack?: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <header
      className="sticky top-0 z-40 backdrop-blur-md border-b transition-all"
      style={{
        background: scrolled ? 'rgba(10,10,15,0.98)' : 'rgba(10,10,15,0.85)',
        borderColor: scrolled ? 'rgba(42,42,53,0.9)' : 'rgba(42,42,53,0.4)',
      }}
    >
      <div className="max-w-6xl mx-auto px-4 lg:px-8 py-3 flex items-center gap-3">
        {onBack && (
          <button onClick={onBack}
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors hover:bg-white/10 active:scale-95"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <ChevronLeft className="w-4 h-4 text-[var(--text-secondary)]" />
          </button>
        )}
        <div className="flex-1 flex items-center justify-between">
          {dealer.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={dealer.logo_url} alt={dealer.firma_adi} className="h-9 w-auto object-contain max-w-[160px]" />
          ) : (
            <div>
              <p className="font-extrabold text-base leading-tight">{dealer.firma_adi}</p>
              <p className="text-[10px] text-[var(--text-secondary)]">Jant Showroom</p>
            </div>
          )}
          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--border-color)] bg-[var(--bg-card)]">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-[var(--text-secondary)]">Demo aktif</span>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-[var(--text-secondary)]">Powered by</p>
              <p className="text-xs font-bold gradient-text">WheelVision</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

/* ─── Welcome Screen ──────────────────────────────────────────────────────── */
function WelcomeScreen({ dealer, wheels, onStart }: { dealer: Dealer; wheels: Wheel[]; onStart: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef  = useRef({ x: -1000, y: -1000 });
  const [glowPos, setGlowPos] = useState({ x: -1000, y: -1000 });

  /* Particle system */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize, { passive: true });
    const count = window.innerWidth < 768 ? 30 : 60;
    const COLORS = ['#FF6B35', '#F72585', '#7209B7'];
    type P = { x: number; y: number; vx: number; vy: number; r: number; c: string };
    const pts: P[] = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      r: 0.5 + Math.random() * 2,
      c: COLORS[Math.floor(Math.random() * 3)],
    }));
    let raf = 0;
    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const mx = mouseRef.current.x, my = mouseRef.current.y;
      for (const p of pts) {
        const dx = p.x - mx, dy = p.y - my, d2 = dx * dx + dy * dy;
        if (d2 < 150 * 150 && d2 > 0) {
          const d = Math.sqrt(d2), f = (150 - d) / 150 * 0.5;
          p.vx += dx / d * f; p.vy += dy / d * f;
        }
        p.vx *= 0.99; p.vy *= 0.99;
        const spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (spd > 2) { p.vx = p.vx / spd * 2; p.vy = p.vy / spd * 2; }
        p.x = (p.x + p.vx + canvas.width)  % canvas.width;
        p.y = (p.y + p.vy + canvas.height) % canvas.height;
        ctx.globalAlpha = 0.6;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.c; ctx.fill();
      }
      for (let i = 0; i < pts.length - 1; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 120) {
            ctx.globalAlpha = (1 - d / 120) * 0.15;
            ctx.strokeStyle = pts[i].c; ctx.lineWidth = 0.5;
            ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y); ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  /* Mouse glow (desktop) */
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      setGlowPos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg-dark)] text-white flex flex-col relative overflow-hidden">
      {/* Canvas particles */}
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }} />

      {/* Grid */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)', backgroundSize: '60px 60px' }} />

      {/* Orbs */}
      <div className="fixed pointer-events-none" style={{ zIndex: 0, right: '-100px', top: '-100px', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(255,107,53,0.07) 0%,transparent 70%)', filter: 'blur(40px)', animation: 'orbFloat1 8s ease-in-out infinite' }} />
      <div className="fixed pointer-events-none" style={{ zIndex: 0, left: '-150px', bottom: '-100px', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(247,37,133,0.06) 0%,transparent 70%)', filter: 'blur(40px)', animation: 'orbFloat2 10s ease-in-out infinite' }} />
      <div className="fixed pointer-events-none" style={{ zIndex: 0, left: '50%', top: '50%', width: '800px', height: '800px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(114,9,183,0.04) 0%,transparent 70%)', filter: 'blur(60px)', transform: 'translate(-50%,-50%)', animation: 'orbFloat3 12s ease-in-out infinite' }} />

      {/* Mouse glow */}
      <div className="fixed pointer-events-none hidden lg:block" style={{ zIndex: 1, left: glowPos.x - 200, top: glowPos.y - 200, width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(247,37,133,0.08) 0%,rgba(114,9,183,0.04) 50%,transparent 70%)', filter: 'blur(20px)', transition: 'left 0.15s ease-out,top 0.15s ease-out' }} />

      {/* Noise overlay */}
      <svg className="fixed inset-0 pointer-events-none w-full h-full" style={{ zIndex: 0, opacity: 0.015 }} aria-hidden>
        <filter id="wv-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#wv-noise)" />
      </svg>

      {/* Header */}
      <div style={{ position: 'relative', zIndex: 10 }}>
        <DealerHeader dealer={dealer} />
      </div>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 lg:px-8 py-10 lg:py-16" style={{ position: 'relative', zIndex: 10 }}>
        <div className="lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center">

          {/* ── Left: Hero ── */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left">

            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--border-color)] mb-6"
              style={{ background: 'rgba(18,18,26,0.8)', backdropFilter: 'blur(12px)', animation: 'fadeSlideDown 0.5s ease-out forwards' }}
            >
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--accent-orange)', boxShadow: '0 0 6px rgba(255,107,53,0.8)' }} />
              <span className="text-xs text-[var(--text-secondary)]">✦ AI Destekli Jant Görselleştirme</span>
            </div>

            {/* Heading */}
            <h1 className="font-black leading-tight mb-4"
              style={{ fontSize: 'clamp(36px,5vw,52px)', letterSpacing: '-0.02em', animation: 'fadeSlideUp 0.5s ease-out 0.1s both' }}>
              Hayal Et, Gör, Sahip Ol<br />
              <span className="gradient-text">Jantını Şimdi Dene</span>
            </h1>

            {/* Subtitle */}
            <p className="text-[var(--text-secondary)] leading-relaxed mb-8 max-w-sm lg:max-w-none"
              style={{ fontSize: '15px', animation: 'fadeSlideUp 0.5s ease-out 0.2s both' }}>
              Fotoğrafını yükle, kataloğdan jantı seç —{' '}
              <span className="font-bold" style={{ color: 'var(--accent-orange)' }}>yapay zeka 30 saniyede</span>{' '}
              aracına montajlasın. Satın almadan önce gör.
            </p>

            {/* 3 step cards */}
            <div className="w-full max-w-sm lg:max-w-none space-y-3 mb-8">
              {[
                { icon: '📸', label: 'Araç fotoğrafı yükle', sub: 'Kamera veya galeriden',    delay: '0.3s', accent: '#FF6B35', bg: 'rgba(255,107,53,0.15)' },
                { icon: '⚡', label: 'Katalogdan jant seç',  sub: `${wheels.length} model mevcut`, delay: '0.4s', accent: '#F72585', bg: 'rgba(247,37,133,0.12)' },
                { icon: '✨', label: 'AI sonucunu gör',      sub: 'Kaydırarak karşılaştır',   delay: '0.5s', accent: '#7209B7', bg: 'rgba(114,9,183,0.12)' },
              ].map(({ icon, label, sub, delay, accent, bg }, i) => (
                <div key={i}
                  className="flex items-center gap-4 p-3.5 rounded-2xl border border-[var(--border-color)]"
                  style={{ background: 'var(--bg-card)', animation: `fadeSlideUp 0.5s ease-out ${delay} both`, transition: 'transform 0.2s ease,border-color 0.2s ease' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateX(-8px)'; el.style.borderColor = accent; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = ''; el.style.borderColor = ''; }}
                >
                  <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-lg" style={{ background: bg }}>{icon}</div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-sm text-white">{label}</p>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">{sub}</p>
                  </div>
                  <div className="w-6 h-6 rounded-full border border-[var(--border-color)] flex items-center justify-center text-xs font-bold text-[var(--text-secondary)] flex-shrink-0">{i + 1}</div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <button onClick={onStart}
              className="relative overflow-hidden w-full max-w-sm lg:max-w-xs py-5 lg:py-4 rounded-2xl font-extrabold text-lg text-white flex items-center justify-center gap-2.5 active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg,#FF6B35,#F72585,#7209B7)', boxShadow: '0 8px 32px rgba(247,37,133,0.35)', transition: 'transform 0.2s ease,box-shadow 0.2s ease', animation: 'fadeSlideUp 0.5s ease-out 0.55s both' }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(-3px) scale(1.02)'; el.style.boxShadow = '0 16px 48px rgba(247,37,133,0.5)'; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = ''; el.style.boxShadow = '0 8px 32px rgba(247,37,133,0.35)'; }}
            >
              <span aria-hidden style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '40%', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)', animation: 'shimmerBtn 3s linear infinite' }} />
              ⚡ Jantları Dene →
            </button>

            <p className="text-xs text-[var(--text-secondary)] mt-4" style={{ animation: 'fadeSlideUp 0.5s ease-out 0.6s both' }}>
              Ücretsiz · Kayıt gerekmez · 30 saniye
            </p>

            {/* Stats bar */}
            <div className="flex items-center gap-6 mt-8 pt-8 border-t border-[var(--border-color)] w-full max-w-sm lg:max-w-none"
              style={{ animation: 'fadeSlideUp 0.5s ease-out 0.65s both' }}>
              {[{ v: '30sn', l: 'Üretim Süresi' }, { v: 'AI', l: 'Yapay Zeka' }, { v: 'HD', l: 'Yüksek Kalite' }].map(({ v, l }) => (
                <div key={l} className="text-center flex-1">
                  <p className="font-extrabold text-xl gradient-text">{v}</p>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">{l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: Wheel showcase (desktop only) ── */}
          {wheels.length > 0 && (
            <div className="hidden lg:block">
              <div className="grid grid-cols-3 gap-[14px]">
                {wheels.slice(0, 9).map((w, i) => (
                  <div key={w.id} onClick={onStart}
                    className="relative cursor-pointer group"
                    style={{ aspectRatio: '1', borderRadius: '18px', overflow: 'hidden', border: '1px solid var(--border-color)', background: 'var(--bg-card)', transition: 'transform 0.2s ease,border-color 0.2s ease,box-shadow 0.2s ease', animation: `fadeScale 0.4s ease-out ${i * 0.1}s both` }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(-4px) scale(1.02)'; el.style.borderColor = '#F72585'; el.style.boxShadow = '0 8px 24px rgba(247,37,133,0.25)'; }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = ''; el.style.borderColor = ''; el.style.boxShadow = ''; }}
                  >
                    <WheelImg src={w.jant_foto_url} alt={w.jant_adi} priority={i < 3} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="absolute bottom-2 left-2 right-2">
                        <p className="text-xs font-bold text-white truncate">{w.jant_adi}</p>
                        {w.fiyat != null && <p className="text-[10px] text-[var(--accent-orange)] font-bold">₺{w.fiyat.toLocaleString('tr-TR')}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {wheels.length > 9 && (
                <p className="text-center text-xs text-[var(--text-secondary)] mt-3">+{wheels.length - 9} model daha</p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

/* ─── Main component ──────────────────────────────────────────────────────── */
export default function DealerPage({ dealer, wheels }: { dealer: Dealer; wheels: Wheel[] }) {
  const [showApp,       setShowApp]       = useState(false);
  const [carPreview,    setCarPreview]    = useState<string | null>(null);
  const [carImageUrl,   setCarImageUrl]   = useState<string | null>(null);
  const [uploading,     setUploading]     = useState(false);
  const [selectedWheel, setSelectedWheel] = useState<Wheel | null>(null);
  const [modalWheel,    setModalWheel]    = useState<Wheel | null>(null);
  const [generating,    setGenerating]    = useState(false);
  const [genStep,       setGenStep]       = useState(0);
  const [resultUrl,     setResultUrl]     = useState<string | null>(null);
  const [resultLoaded,  setResultLoaded]  = useState(false);
  const [error,         setError]         = useState<string | null>(null);
  const [uploadSheet,   setUploadSheet]   = useState(false);

  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef  = useRef<HTMLInputElement>(null);
  const catalogRef = useRef<HTMLDivElement>(null);

  /* Cycle generation step text every 4 s while generating */
  useEffect(() => {
    if (!generating) { setGenStep(0); return; }
    const id = setInterval(() => setGenStep(s => (s + 1) % GENERATION_STEPS.length), 4000);
    return () => clearInterval(id);
  }, [generating]);

  if (!showApp) {
    return <WelcomeScreen dealer={dealer} wheels={wheels} onStart={() => setShowApp(true)} />;
  }

  const limitReached = dealer.kullanilan >= dealer.aylik_limit;
  const canGenerate  = !!carImageUrl && !!selectedWheel && !limitReached && !generating;

  const processFile = async (file: File) => {
    setCarPreview(URL.createObjectURL(file));
    setCarImageUrl(null);
    setResultUrl(null);
    setError(null);
    setUploadSheet(false);
    setUploading(true);
    try {
      setCarImageUrl(await uploadToCloudinary(file));
    } catch {
      setError('Fotoğraf yüklenemedi. Tekrar deneyin.');
      setCarPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const clearCar = () => {
    setCarPreview(null);
    setCarImageUrl(null);
    setResultUrl(null);
    if (galleryRef.current) galleryRef.current.value = '';
    if (cameraRef.current)  cameraRef.current.value  = '';
  };

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setGenerating(true);
    setError(null);
    setResultUrl(null);
    try {
      const res  = await fetch('/api/dealer/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealer_id: dealer.id, slug: dealer.slug, car_image: carImageUrl, wheel_id: selectedWheel!.id }),
      });
      const data = await res.json() as { output_url?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Görsel oluşturulamadı');
      setResultLoaded(false);
      setResultUrl(data.output_url!);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setGenerating(false);
    }
  };

  const handleReset = () => {
    setResultUrl(null);
    setSelectedWheel(null);
    clearCar();
    setError(null);
  };

  const handleWheelSelect = (wheel: Wheel) => {
    setSelectedWheel(wheel);
    setModalWheel(null);
    setResultUrl(null);
    setError(null);
  };

  const waPhone = dealer.whatsapp.replace(/\D/g, '');
  const waText  = encodeURIComponent(
    `Merhaba ${dealer.firma_adi},\n`
    + (selectedWheel ? `${selectedWheel.jant_adi}${selectedWheel.ebat ? ` (${selectedWheel.ebat})` : ''} ` : '')
    + `için fiyat ve sipariş bilgisi almak istiyorum.`
  );
  const waUrl = `https://wa.me/${waPhone}?text=${waText}`;

  return (
    <div className="min-h-screen bg-[var(--bg-dark)] text-white flex flex-col">
      <DealerHeader dealer={dealer} onBack={() => setShowApp(false)} />

      {limitReached && (
        <div className="max-w-6xl mx-auto w-full px-4 lg:px-8 pt-4">
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
            Bu ay için görsel hakkı dolmuştur.
          </div>
        </div>
      )}

      {/* ══ RESULT SCREEN ═══════════════════════════════════════════════════ */}
      {resultUrl && carPreview && (
        <main className="flex-1 max-w-6xl mx-auto w-full px-4 lg:px-8 pt-5 pb-8">
          <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-widest mb-4">
            Sonuç — Kaydırarak karşılaştırın
          </p>

          <div className="lg:grid lg:grid-cols-[1fr_340px] lg:gap-6 space-y-4 lg:space-y-0">
            {/* Slider — skeleton until result image loads */}
            <div className="relative" style={{ height: 'min(calc(100svh - 220px), 640px)', minHeight: '280px' }}>
              {!resultLoaded && (
                <div className="absolute inset-0 z-10 rounded-2xl overflow-hidden">
                  <Skeleton className="w-full h-full rounded-2xl" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-orange)]" />
                    <p className="text-sm text-[var(--text-secondary)]">Görsel yükleniyor...</p>
                  </div>
                </div>
              )}
              <div className={`w-full h-full transition-opacity duration-700 ${resultLoaded ? 'opacity-100' : 'opacity-0'}`}>
                <BeforeAfterSlider
                  before={carPreview}
                  after={resultUrl}
                  onAfterLoad={() => setResultLoaded(true)}
                />
              </div>
            </div>

            {/* Actions panel */}
            <div className="flex flex-col gap-3 lg:py-1">
              {/* Wheel info */}
              {selectedWheel && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-[var(--border-color)]"
                  style={{ background: 'var(--bg-card)' }}>
                  <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
                    <WheelImg src={selectedWheel.jant_foto_url} alt={selectedWheel.jant_adi} priority />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{selectedWheel.jant_adi}</p>
                    {selectedWheel.marka && <p className="text-xs text-[var(--text-secondary)]">{selectedWheel.marka}{selectedWheel.ebat ? ` · ${selectedWheel.ebat}` : ''}</p>}
                  </div>
                  {selectedWheel.fiyat != null && (
                    <p className="font-extrabold text-base text-[var(--accent-orange)] flex-shrink-0">
                      ₺{selectedWheel.fiyat.toLocaleString('tr-TR')}
                    </p>
                  )}
                </div>
              )}

              {/* Divider (desktop) */}
              <div className="hidden lg:block h-px bg-[var(--border-color)]" />

              {/* CTA buttons */}
              <a href={waUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2.5 py-4 rounded-2xl font-bold text-sm text-white transition-all hover:brightness-110 active:scale-95"
                style={{ background: '#25D366', boxShadow: '0 4px 16px rgba(37,211,102,0.3)' }}>
                <WAIcon size={20} />
                Sipariş Ver / Fiyat Al
              </a>

              <button onClick={() => downloadWithWatermark(resultUrl, dealer.slug)}
                className="btn-secondary flex items-center justify-center gap-2 py-4 text-sm font-bold rounded-2xl">
                <Download className="w-4 h-4" />
                Görseli İndir
              </button>

              <div className="hidden lg:block h-px bg-[var(--border-color)]" />

              <button onClick={handleReset}
                className="flex items-center justify-center gap-2 py-3.5 text-sm rounded-2xl border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-white hover:border-white/20 transition-colors"
                style={{ background: 'var(--bg-card)' }}>
                <RefreshCw className="w-4 h-4" />
                Yeni Görsel Oluştur
              </button>

              {/* Desktop info card */}
              <div className="hidden lg:block mt-auto p-4 rounded-2xl border border-[var(--border-color)] text-center"
                style={{ background: 'var(--bg-card)' }}>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Bu görsel yapay zeka ile oluşturulmuştur.<br />Gerçek montaj sonucu farklılık gösterebilir.
                </p>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* ══ APP SCREEN (no result) ══════════════════════════════════════════ */}
      {!resultUrl && (
        <main className="flex-1 max-w-6xl mx-auto w-full px-4 lg:px-8 pt-5 pb-32 lg:pb-8">
          <div className="lg:grid lg:grid-cols-[360px_1fr] lg:gap-8">

            {/* ── LEFT PANEL (mobile: full width / desktop: fixed sidebar) ── */}
            <div className="lg:sticky lg:top-[65px] lg:h-[calc(100vh-65px)] lg:overflow-y-auto lg:pb-6 space-y-4">

              {/* Car upload */}
              <div className="card !p-4">
                <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-3">
                  1 · Araç Fotoğrafı
                </p>
                {carPreview ? (
                  <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: '4/3' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={carPreview} alt="Araç" className="w-full h-full object-cover" />
                    {uploading && (
                      <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-7 h-7 animate-spin text-white" />
                        <p className="text-white text-xs">Yükleniyor...</p>
                      </div>
                    )}
                    {!uploading && carImageUrl && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shadow">
                        <Check className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                    {!uploading && (
                      <>
                        <button onClick={() => setUploadSheet(true)}
                          className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg text-xs font-semibold"
                          style={{ background: 'rgba(0,0,0,0.7)', color: '#fff' }}>
                          Değiştir
                        </button>
                        <button onClick={clearCar}
                          className="absolute top-2 left-2 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center">
                          <X className="w-3.5 h-3.5 text-white" />
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <button onClick={() => setUploadSheet(true)}
                    className="upload-zone w-full flex flex-col items-center py-10 rounded-xl">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
                      style={{ background: 'rgba(255,107,53,0.12)' }}>
                      <Camera className="w-7 h-7 text-[var(--accent-orange)]" />
                    </div>
                    <p className="font-semibold text-sm text-white">Fotoğraf Ekle</p>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">Kamera veya galeriden yükleyin</p>
                  </button>
                )}
              </div>

              {/* Selected wheel */}
              <div className="card !p-4">
                <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-3">
                  2 · Seçilen Jant
                </p>
                {selectedWheel ? (
                  <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: '4/3' }}>
                    <WheelImg src={selectedWheel.jant_foto_url} alt={selectedWheel.jant_adi} priority />
                    <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                      <p className="text-sm font-bold text-white truncate">{selectedWheel.jant_adi}</p>
                      {selectedWheel.fiyat != null && (
                        <p className="text-xs text-[var(--accent-orange)] font-bold mt-0.5">₺{selectedWheel.fiyat.toLocaleString('tr-TR')}</p>
                      )}
                    </div>
                    <button onClick={() => { setSelectedWheel(null); catalogRef.current?.scrollIntoView({ behavior: 'smooth' }); }}
                      className="absolute top-2 left-2 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center">
                      <X className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => catalogRef.current?.scrollIntoView({ behavior: 'smooth' })}
                    className="upload-zone w-full flex flex-col items-center py-10 rounded-xl border-dashed">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
                      style={{ background: 'rgba(247,37,133,0.1)' }}>
                      <ChevronDown className="w-7 h-7 text-[var(--accent-pink)]" />
                    </div>
                    <p className="font-semibold text-sm text-white">Jant Seçin</p>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">Katalogdan bir jant seçin</p>
                  </button>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start gap-2">
                  <X className="w-4 h-4 flex-shrink-0 mt-0.5" />{error}
                </div>
              )}

              {/* Generate button — desktop inline */}
              <button onClick={handleGenerate} disabled={!canGenerate}
                className="hidden lg:flex btn-primary w-full py-4 text-base font-extrabold rounded-2xl items-center justify-center gap-2.5 disabled:opacity-35 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none">
                {generating ? (
                  <><Loader2 className="w-5 h-5 animate-spin flex-shrink-0" /><span className="truncate text-sm">{GENERATION_STEPS[genStep]}</span></>
                ) : (
                  <><span>Görsel Oluştur</span>{canGenerate && <ChevronRight className="w-5 h-5" />}</>
                )}
              </button>
              {!canGenerate && !generating && (
                <p className="hidden lg:block text-center text-xs text-[var(--text-secondary)]">
                  {!carImageUrl && !selectedWheel ? 'Araç fotoğrafı ve jant seçin' : !carImageUrl ? 'Araç fotoğrafı ekleyin' : 'Katalogdan jant seçin'}
                </p>
              )}
            </div>

            {/* ── RIGHT PANEL: Catalog ── */}
            <div ref={catalogRef} className="mt-4 lg:mt-0">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-bold text-base lg:text-lg">Jant Kataloğu</h2>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">Janta tıklayarak detay ve seçim yapın</p>
                </div>
                {wheels.length > 0 && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)]">
                    {wheels.length} model
                  </span>
                )}
              </div>

              {wheels.length === 0 ? (
                <p className="py-12 text-center text-sm text-[var(--text-secondary)]">Henüz jant eklenmemiş.</p>
              ) : (
                <div className="grid grid-cols-3 lg:grid-cols-4 gap-3">
                  {wheels.map((wheel) => {
                    const isSelected = selectedWheel?.id === wheel.id;
                    return (
                      <button key={wheel.id} onClick={() => setModalWheel(wheel)}
                        className="rounded-xl overflow-hidden border-2 transition-all active:scale-95 hover:border-white/20 relative text-left"
                        style={{
                          borderColor: isSelected ? 'var(--accent-orange)' : 'var(--border-color)',
                          boxShadow: isSelected ? '0 0 14px rgba(255,107,53,0.4)' : 'none',
                          background: 'var(--bg-card)',
                        }}>
                        <div className="aspect-square w-full overflow-hidden">
                          <WheelImg src={wheel.jant_foto_url} alt={wheel.jant_adi} priority={wheels.indexOf(wheel) < 6} />
                        </div>
                        <div className="px-2.5 py-2">
                          <p className="text-[11px] lg:text-xs font-semibold leading-tight line-clamp-2">{wheel.jant_adi}</p>
                          {wheel.marka && <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">{wheel.marka}</p>}
                          {wheel.fiyat != null && (
                            <p className="text-[10px] lg:text-xs font-bold text-[var(--accent-orange)] mt-1">
                              ₺{wheel.fiyat.toLocaleString('tr-TR')}
                            </p>
                          )}
                        </div>
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[var(--accent-orange)] flex items-center justify-center shadow">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
              <p className="text-[10px] text-[var(--text-secondary)]/40 italic text-center mt-3">
                Bu görseller demo amaçlıdır.
              </p>
            </div>
          </div>
        </main>
      )}

      {/* ══ STICKY GENERATE BUTTON (mobile only) ═══════════════════════════ */}
      {!resultUrl && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-3"
          style={{ background: 'var(--bg-dark)', borderTop: '1px solid var(--border-color)' }}>
          <button onClick={handleGenerate} disabled={!canGenerate}
            className="btn-primary w-full py-4 text-base font-extrabold rounded-2xl flex items-center justify-center gap-2.5 disabled:opacity-35 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none">
            {generating ? (
              <><Loader2 className="w-5 h-5 animate-spin flex-shrink-0" /><span className="truncate text-sm">{GENERATION_STEPS[genStep]}</span></>
            ) : (
              <><span>Görsel Oluştur</span>{canGenerate && <ChevronRight className="w-5 h-5" />}</>
            )}
          </button>
          {!carImageUrl && !selectedWheel && (
            <p className="text-center text-xs text-[var(--text-secondary)] mt-2">Araç fotoğrafı ve jant seçin</p>
          )}
        </div>
      )}

      {/* ══ UPLOAD BOTTOM SHEET ═════════════════════════════════════════════ */}
      {uploadSheet && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setUploadSheet(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl border-t border-[var(--border-color)]"
            style={{ background: 'var(--bg-card)' }}>
            <div className="max-w-lg mx-auto px-4 pt-4 pb-10">
              <div className="w-12 h-1 rounded-full bg-[var(--border-color)] mx-auto mb-5" />
              <h3 className="font-bold text-base text-center mb-5">Fotoğraf Ekle</h3>
              <div className="space-y-3">
                <button onClick={() => cameraRef.current?.click()}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl border border-[var(--border-color)] hover:border-[var(--accent-orange)] transition-colors"
                  style={{ background: 'var(--bg-dark)' }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,107,53,0.12)' }}>
                    <Camera className="w-6 h-6 text-[var(--accent-orange)]" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-sm">Kamera ile Çek</p>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">O an olan aracı fotoğraflayın</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--text-secondary)] ml-auto" />
                </button>
                <button onClick={() => galleryRef.current?.click()}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl border border-[var(--border-color)] hover:border-[var(--accent-orange)] transition-colors"
                  style={{ background: 'var(--bg-dark)' }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(247,37,133,0.1)' }}>
                    <ImageIcon className="w-6 h-6 text-[var(--accent-pink)]" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-sm">Galeriden Seç</p>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">Telefondaki fotoğraflardan yükleyin</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--text-secondary)] ml-auto" />
                </button>
              </div>
              <button onClick={() => setUploadSheet(false)}
                className="w-full mt-4 py-3 rounded-xl text-sm text-[var(--text-secondary)] font-medium">
                İptal
              </button>
            </div>
          </div>
        </>
      )}

      {/* ══ WHEEL DETAIL MODAL ══════════════════════════════════════════════ */}
      {modalWheel && (
        <WheelModal wheel={modalWheel} onClose={() => setModalWheel(null)} onSelect={handleWheelSelect} />
      )}

      <input ref={galleryRef} type="file" accept="image/*"                       className="hidden" onChange={handleFileChange} />
      <input ref={cameraRef}  type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
    </div>
  );
}
