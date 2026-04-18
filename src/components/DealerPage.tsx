'use client';

import { useState, useRef, useCallback } from 'react';
import {
  Camera, ImageIcon, Check, Loader2, MessageCircle,
  X, RefreshCw, Download, ChevronRight, ChevronDown,
} from 'lucide-react';
import type { Dealer, Wheel } from '@/app/d/[slug]/page';

const CLOUD_NAME    = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;

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

/* ─── Download with diagonal watermark ───────────────────────────────────── */
async function downloadWithWatermark(imageUrl: string, slug: string) {
  const res  = await fetch(`/api/proxy-image?url=${encodeURIComponent(imageUrl)}`);
  const blob = await res.blob();
  const bmp  = await createImageBitmap(blob);

  const canvas = document.createElement('canvas');
  canvas.width  = bmp.width;
  canvas.height = bmp.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bmp, 0, 0);

  // Diagonal slug watermark
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
  // Second pass slightly offset for visibility
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

/* ─── WhatsApp SVG ────────────────────────────────────────────────────────── */
function WAIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

/* ─── Interactive Before/After Slider ────────────────────────────────────── */
function BeforeAfterSlider({ before, after }: { before: string; after: string }) {
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const moveTo = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pct  = Math.max(2, Math.min(98, ((clientX - rect.left) / rect.width) * 100));
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
      <div className="absolute -inset-3 rounded-3xl bg-gradient-to-r from-[#ec4899]/20 via-[#8b5cf6]/20 to-[#ec4899]/20 blur-2xl pointer-events-none" />
      <div className="relative p-[2px] rounded-2xl"
        style={{ background: 'linear-gradient(135deg,#FF6B35,#F72585,#7209B7)' }}>
        <div
          ref={containerRef}
          className="relative select-none cursor-col-resize overflow-hidden rounded-[14px] bg-black"
          style={{ touchAction: 'none', aspectRatio: '4/3' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
        >
          {/* After (background) */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={after} alt="Sonra" className="absolute inset-0 w-full h-full object-cover pointer-events-none" draggable={false} />

          {/* Before (clipped) */}
          <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={before} alt="Önce" className="w-full h-full object-cover pointer-events-none" draggable={false} />
          </div>

          {/* Labels */}
          <div className="absolute top-3 left-3 px-3 py-1.5 rounded-full backdrop-blur-md bg-black/50 border border-white/15 text-xs font-semibold text-white/80 pointer-events-none">
            ÖNCE
          </div>
          <div className="absolute top-3 right-3 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/20 text-xs font-bold text-white pointer-events-none"
            style={{ background: 'linear-gradient(135deg,rgba(255,107,53,0.85),rgba(247,37,133,0.85))' }}>
            SONRA ✨
          </div>

          {/* Divider line */}
          <div className="absolute top-0 bottom-0 w-[2px] pointer-events-none"
            style={{ left: `${position}%`, background: 'linear-gradient(to bottom,transparent,rgba(255,255,255,0.95) 15%,rgba(255,255,255,0.95) 85%,transparent)' }} />

          {/* Handle */}
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none z-10"
            style={{ left: `${position}%` }}>
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
function WheelModal({ wheel, onClose, onSelect }: {
  wheel: Wheel;
  onClose: () => void;
  onSelect: (w: Wheel) => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-x-4 bottom-0 sm:inset-auto sm:left-1/2 sm:-translate-x-1/2 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:w-[360px] z-50 rounded-t-3xl sm:rounded-2xl border border-[var(--border-color)] overflow-hidden"
        style={{ background: 'var(--bg-card)' }}>

        {/* Handle (mobile only) */}
        <div className="sm:hidden w-12 h-1 rounded-full bg-[var(--border-color)] mx-auto mt-3 mb-0" />

        {/* Jant görseli */}
        <div className="relative w-full aspect-square bg-[var(--bg-dark)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={wheel.jant_foto_url} alt={wheel.jant_adi} className="w-full h-full object-cover" />
        </div>

        {/* Bilgiler */}
        <div className="p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <h3 className="font-bold text-base leading-tight">{wheel.jant_adi}</h3>
            {wheel.marka && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--border-color)] text-[var(--text-secondary)] flex-shrink-0">
                {wheel.marka}
              </span>
            )}
          </div>

          <div className="space-y-2 mb-5">
            {wheel.ebat && (
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-secondary)]">Ebat</span>
                <span className="font-medium">{wheel.ebat}</span>
              </div>
            )}
            {wheel.fiyat != null && (
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-secondary)]">Fiyat</span>
                <span className="font-extrabold text-[var(--accent-orange)]">
                  ₺{wheel.fiyat.toLocaleString('tr-TR')}
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={onClose}
              className="btn-secondary py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
              <X className="w-4 h-4" /> İptal
            </button>
            <button onClick={() => onSelect(wheel)}
              className="btn-primary py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
              <Check className="w-4 h-4" /> Seç
            </button>
          </div>

          <p className="text-center text-[10px] text-[var(--text-secondary)]/50 mt-4 italic">
            Bu görseller demo amaçlıdır.
          </p>
        </div>
      </div>
    </>
  );
}

/* ─── Main component ──────────────────────────────────────────────────────── */
export default function DealerPage({ dealer, wheels }: { dealer: Dealer; wheels: Wheel[] }) {

  const [carPreview,    setCarPreview]    = useState<string | null>(null);
  const [carImageUrl,   setCarImageUrl]   = useState<string | null>(null);
  const [uploading,     setUploading]     = useState(false);
  const [selectedWheel, setSelectedWheel] = useState<Wheel | null>(null);
  const [modalWheel,    setModalWheel]    = useState<Wheel | null>(null);
  const [generating,    setGenerating]    = useState(false);
  const [resultUrl,     setResultUrl]     = useState<string | null>(null);
  const [error,         setError]         = useState<string | null>(null);
  const [uploadSheet,   setUploadSheet]   = useState(false);

  const galleryRef  = useRef<HTMLInputElement>(null);
  const cameraRef   = useRef<HTMLInputElement>(null);
  const catalogRef  = useRef<HTMLDivElement>(null);

  const limitReached = dealer.kullanilan >= dealer.aylik_limit;
  const canGenerate  = !!carImageUrl && !!selectedWheel && !limitReached && !generating;

  /* ── File ──────────────────────────────────────────────────────────────── */
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

  /* ── Generate ──────────────────────────────────────────────────────────── */
  const handleGenerate = async () => {
    if (!canGenerate) return;
    setGenerating(true);
    setError(null);
    setResultUrl(null);
    try {
      const res  = await fetch('/api/dealer/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealer_id: dealer.id,
          slug:      dealer.slug,
          car_image: carImageUrl,
          wheel_id:  selectedWheel!.id,
        }),
      });
      const data = await res.json() as { output_url?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Görsel oluşturulamadı');
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

  /* ── Wheel selection ───────────────────────────────────────────────────── */
  const handleWheelSelect = (wheel: Wheel) => {
    setSelectedWheel(wheel);
    setModalWheel(null);
    setResultUrl(null);
    setError(null);
  };

  /* ── WhatsApp ──────────────────────────────────────────────────────────── */
  const waPhone = dealer.whatsapp.replace(/\D/g, '');
  const waText  = encodeURIComponent(
    `Merhaba ${dealer.firma_adi},\n`
    + (selectedWheel ? `${selectedWheel.jant_adi}${selectedWheel.ebat ? ` (${selectedWheel.ebat})` : ''} ` : '')
    + `için fiyat ve sipariş bilgisi almak istiyorum.`
  );
  const waUrl = `https://wa.me/${waPhone}?text=${waText}`;

  /* ── Render ────────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[var(--bg-dark)] text-white flex flex-col">

      {/* ══ HEADER ══════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-40 bg-[var(--bg-dark)]/95 backdrop-blur-md border-b border-[var(--border-color)]">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          {dealer.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={dealer.logo_url} alt={dealer.firma_adi}
              className="h-9 w-auto object-contain max-w-[160px]" />
          ) : (
            <div>
              <p className="font-extrabold text-base leading-tight">{dealer.firma_adi}</p>
              <p className="text-[10px] text-[var(--text-secondary)]">Jant Showroom</p>
            </div>
          )}
          <div className="text-right">
            <p className="text-[10px] text-[var(--text-secondary)]">Powered by</p>
            <p className="text-xs font-bold gradient-text">WheelVision</p>
          </div>
        </div>
      </header>

      {/* ══ CONTENT ═════════════════════════════════════════════════════════ */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 pt-5 pb-32 space-y-5">

        {/* Limit uyarısı */}
        {limitReached && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
            Bu ay için görsel hakkı dolmuştur.
          </div>
        )}

        {/* ══ SONUÇ EKRANI ════════════════════════════════════════════════ */}
        {resultUrl && carPreview && (
          <div className="space-y-4">
            <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-widest">
              Sonuç — Kaydırarak karşılaştırın
            </p>
            <BeforeAfterSlider before={carPreview} after={resultUrl} />

            {/* Seçilen jant özeti */}
            {selectedWheel && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">
                <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={selectedWheel.jant_foto_url} alt={selectedWheel.jant_adi}
                    className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{selectedWheel.jant_adi}</p>
                  {selectedWheel.ebat && (
                    <p className="text-xs text-[var(--text-secondary)]">{selectedWheel.ebat}</p>
                  )}
                </div>
                {selectedWheel.fiyat != null && (
                  <p className="font-extrabold text-base text-[var(--accent-orange)] flex-shrink-0">
                    ₺{selectedWheel.fiyat.toLocaleString('tr-TR')}
                  </p>
                )}
              </div>
            )}

            {/* CTA butonları */}
            <div className="grid grid-cols-2 gap-3">
              <a href={waUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-sm text-white active:scale-95 transition-all hover:brightness-110"
                style={{ background: '#25D366' }}>
                <WAIcon size={18} />
                Sipariş Ver
              </a>
              <button
                onClick={() => downloadWithWatermark(resultUrl, dealer.slug)}
                className="btn-secondary flex items-center justify-center gap-2 py-4 text-sm font-bold rounded-xl">
                <Download className="w-4 h-4" />
                İndir
              </button>
            </div>

            <button onClick={handleReset}
              className="btn-secondary w-full flex items-center justify-center gap-2 py-3.5 text-sm rounded-xl">
              <RefreshCw className="w-4 h-4" />
              Yeni Görsel Oluştur
            </button>
          </div>
        )}

        {/* ══ ADIMLAR (sonuç yokken) ══════════════════════════════════════ */}
        {!resultUrl && (
          <>
            {/* ── Araç + Jant Seçimi yan yana ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Sol: Araç yükleme */}
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
                    className="upload-zone w-full flex flex-col items-center py-8 rounded-xl">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-2"
                      style={{ background: 'rgba(255,107,53,0.12)' }}>
                      <Camera className="w-6 h-6 text-[var(--accent-orange)]" />
                    </div>
                    <p className="font-semibold text-sm text-white">Fotoğraf Ekle</p>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">Kamera veya galeri</p>
                  </button>
                )}
              </div>

              {/* Sağ: Seçilen jant */}
              <div className="card !p-4">
                <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-3">
                  2 · Seçilen Jant
                </p>

                {selectedWheel ? (
                  <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: '4/3' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={selectedWheel.jant_foto_url} alt={selectedWheel.jant_adi}
                      className="w-full h-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                      <p className="text-xs font-bold text-white truncate">{selectedWheel.jant_adi}</p>
                      {selectedWheel.fiyat != null && (
                        <p className="text-xs text-[var(--accent-orange)] font-bold">
                          ₺{selectedWheel.fiyat.toLocaleString('tr-TR')}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setSelectedWheel(null);
                        catalogRef.current?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="absolute top-2 left-2 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center">
                      <X className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => catalogRef.current?.scrollIntoView({ behavior: 'smooth' })}
                    className="upload-zone w-full flex flex-col items-center py-8 rounded-xl border-dashed">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-2"
                      style={{ background: 'rgba(247,37,133,0.1)' }}>
                      <ChevronDown className="w-6 h-6 text-[var(--accent-pink)]" />
                    </div>
                    <p className="font-semibold text-sm text-white">Jant Seçin</p>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">Aşağıdan katalogdan seçin</p>
                  </button>
                )}
              </div>
            </div>

            {/* ── Jant Kataloğu ── */}
            <div ref={catalogRef}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-sm">Jant Kataloğu</h2>
                {wheels.length > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)]">
                    {wheels.length} model
                  </span>
                )}
              </div>

              {wheels.length === 0 ? (
                <p className="py-8 text-center text-sm text-[var(--text-secondary)]">Henüz jant eklenmemiş.</p>
              ) : (
                <div
                  className="flex gap-3 overflow-x-auto pb-3"
                  style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
                >
                  {wheels.map((wheel) => {
                    const isSelected = selectedWheel?.id === wheel.id;
                    return (
                      <button
                        key={wheel.id}
                        onClick={() => setModalWheel(wheel)}
                        className="flex-shrink-0 rounded-2xl overflow-hidden border-2 transition-all active:scale-95 relative"
                        style={{
                          width: '140px',
                          scrollSnapAlign: 'start',
                          borderColor: isSelected ? 'var(--accent-orange)' : 'var(--border-color)',
                          boxShadow: isSelected ? '0 0 16px rgba(255,107,53,0.35)' : 'none',
                          background: 'var(--bg-card)',
                        }}
                      >
                        <div style={{ width: '140px', height: '140px' }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={wheel.jant_foto_url} alt={wheel.jant_adi}
                            className="w-full h-full object-cover" />
                        </div>
                        <div className="px-2 py-2">
                          <p className="text-xs font-semibold leading-tight line-clamp-2 text-left">
                            {wheel.jant_adi}
                          </p>
                          {wheel.fiyat != null && (
                            <p className="text-xs font-bold text-[var(--accent-orange)] mt-1 text-left">
                              ₺{wheel.fiyat.toLocaleString('tr-TR')}
                            </p>
                          )}
                        </div>
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[var(--accent-orange)] flex items-center justify-center shadow">
                            <Check className="w-3.5 h-3.5 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
              <p className="text-[10px] text-[var(--text-secondary)]/40 italic text-center mt-2">
                Bu görseller demo amaçlıdır.
              </p>
            </div>

            {/* Hata */}
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start gap-2">
                <X className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {error}
              </div>
            )}
          </>
        )}
      </main>

      {/* ══ STICKY GENERATE BUTTON ══════════════════════════════════════════ */}
      {!resultUrl && (
        <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-4"
          style={{ background: 'linear-gradient(to top,var(--bg-dark) 65%,transparent)' }}>
          <div className="max-w-2xl mx-auto">
            <button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className="btn-primary w-full py-4 text-base font-extrabold rounded-2xl flex items-center justify-center gap-2.5 disabled:opacity-35 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
            >
              {generating ? (
                <><Loader2 className="w-5 h-5 animate-spin" />Görsel oluşturuluyor... (15–30 sn)</>
              ) : (
                <><span>Görsel Oluştur</span>{canGenerate && <ChevronRight className="w-5 h-5" />}</>
              )}
            </button>
            {!carImageUrl && !selectedWheel && (
              <p className="text-center text-xs text-[var(--text-secondary)] mt-2">
                Araç fotoğrafı ve jant seçin
              </p>
            )}
          </div>
        </div>
      )}

      {/* ══ UPLOAD BOTTOM SHEET ═════════════════════════════════════════════ */}
      {uploadSheet && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setUploadSheet(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl border-t border-[var(--border-color)]"
            style={{ background: 'var(--bg-card)' }}>
            <div className="max-w-2xl mx-auto px-4 pt-4 pb-10">
              <div className="w-12 h-1 rounded-full bg-[var(--border-color)] mx-auto mb-5" />
              <h3 className="font-bold text-base text-center mb-5">Fotoğraf Ekle</h3>
              <div className="space-y-3">
                <button onClick={() => cameraRef.current?.click()}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl border border-[var(--border-color)] hover:border-[var(--accent-orange)] transition-colors active:scale-[0.98]"
                  style={{ background: 'var(--bg-dark)' }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(255,107,53,0.12)' }}>
                    <Camera className="w-6 h-6 text-[var(--accent-orange)]" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-sm">Kamera ile Çek</p>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">O an olan aracı fotoğraflayın</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--text-secondary)] ml-auto" />
                </button>
                <button onClick={() => galleryRef.current?.click()}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl border border-[var(--border-color)] hover:border-[var(--accent-orange)] transition-colors active:scale-[0.98]"
                  style={{ background: 'var(--bg-dark)' }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(247,37,133,0.1)' }}>
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
        <WheelModal
          wheel={modalWheel}
          onClose={() => setModalWheel(null)}
          onSelect={handleWheelSelect}
        />
      )}

      {/* Hidden file inputs */}
      <input ref={galleryRef} type="file" accept="image/*"                       className="hidden" onChange={handleFileChange} />
      <input ref={cameraRef}  type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
    </div>
  );
}
