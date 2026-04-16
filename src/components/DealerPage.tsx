'use client';

import { useState, useRef } from 'react';
import { Camera, Check, Loader2, MessageCircle, X, RefreshCw } from 'lucide-react';
import type { Dealer, Wheel } from '@/app/d/[slug]/page';

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;

async function uploadToCloudinary(file: File): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', UPLOAD_PRESET);
  fd.append('folder', 'dealer-cars');
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: fd }
  );
  if (!res.ok) throw new Error('Upload failed');
  const data = await res.json() as { secure_url: string };
  return data.secure_url;
}

export default function DealerPage({ dealer, wheels }: { dealer: Dealer; wheels: Wheel[] }) {
  const [carPreview, setCarPreview]     = useState<string | null>(null);
  const [carImageUrl, setCarImageUrl]   = useState<string | null>(null);
  const [uploading, setUploading]       = useState(false);
  const [selectedWheel, setSelectedWheel] = useState<Wheel | null>(null);
  const [generating, setGenerating]     = useState(false);
  const [resultUrl, setResultUrl]       = useState<string | null>(null);
  const [error, setError]               = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const limitReached = dealer.kullanilan >= dealer.aylik_limit;
  const canGenerate  = !!carImageUrl && !!selectedWheel && !limitReached && !generating;

  /* ── Car photo ──────────────────────────────────────────────────────── */
  const handleCarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCarPreview(URL.createObjectURL(file));
    setCarImageUrl(null);
    setResultUrl(null);
    setError(null);
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

  const clearCar = () => {
    setCarPreview(null);
    setCarImageUrl(null);
    setResultUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /* ── Generate ───────────────────────────────────────────────────────── */
  const handleGenerate = async () => {
    if (!canGenerate) return;
    setGenerating(true);
    setError(null);
    setResultUrl(null);
    try {
      const res = await fetch('/api/dealer/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealer_id: dealer.id,
          slug: dealer.slug,
          car_image: carImageUrl,
          wheel_id: selectedWheel!.id,
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

  /* ── Reset ──────────────────────────────────────────────────────────── */
  const handleReset = () => {
    setResultUrl(null);
    setSelectedWheel(null);
    clearCar();
  };

  /* ── WhatsApp ───────────────────────────────────────────────────────── */
  const waPhone = dealer.whatsapp.replace(/\D/g, '');
  const waText  = selectedWheel
    ? encodeURIComponent(
        `Merhaba, ${dealer.firma_adi} — `
        + `${selectedWheel.jant_adi}`
        + (selectedWheel.ebat ? ` (${selectedWheel.ebat})` : '')
        + ` ile ilgileniyorum.`
      )
    : '';
  const waUrl = `https://wa.me/${waPhone}?text=${waText}`;

  /* ── Render ─────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[var(--bg-dark)] text-white">

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 border-b border-[var(--border-color)] bg-[var(--bg-dark)]/90 backdrop-blur-xl">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {dealer.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={dealer.logo_url}
                alt={dealer.firma_adi}
                className="h-9 w-auto object-contain max-w-[130px]"
              />
            ) : (
              <span className="font-bold text-lg leading-tight">{dealer.firma_adi}</span>
            )}
          </div>
          <div className="text-right">
            <p className="text-[10px] text-[var(--text-secondary)] leading-tight">Powered by</p>
            <p className="text-xs font-bold gradient-text leading-tight">WheelVision</p>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6 pb-16">

        {/* ── Limit warning ── */}
        {limitReached && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
            Bu ay için görsel hakkı dolmuştur. Daha sonra tekrar deneyiniz.
          </div>
        )}

        {/* ─────────── STEP 1: Car photo ─────────── */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-6 h-6 rounded-full bg-gradient-to-r from-[#FF6B35] to-[#F72585] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
              1
            </span>
            <h2 className="font-semibold">Arabanızın Fotoğrafını Çekin</h2>
          </div>

          {carPreview ? (
            <div className="relative rounded-xl overflow-hidden bg-[var(--bg-card)]" style={{ aspectRatio: '16/10' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={carPreview} alt="Arabanız" className="w-full h-full object-cover" />

              {uploading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-white" />
                </div>
              )}
              {!uploading && carImageUrl && (
                <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
              <button
                onClick={clearCar}
                className="absolute top-2 left-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors"
                aria-label="Fotoğrafı kaldır"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full rounded-xl border-2 border-dashed border-[var(--border-color)] flex flex-col items-center justify-center gap-3 py-12 hover:border-[var(--accent-orange)] transition-colors bg-[var(--bg-card)] active:scale-95"
            >
              <Camera className="w-10 h-10 text-[var(--text-secondary)]" />
              <div className="text-center">
                <p className="text-sm font-medium text-white">Fotoğraf çek veya seç</p>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">JPG, PNG, WEBP</p>
              </div>
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleCarSelect}
          />
        </section>

        {/* ─────────── STEP 2: Wheel selection ─────────── */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-6 h-6 rounded-full bg-gradient-to-r from-[#F72585] to-[#7209B7] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
              2
            </span>
            <h2 className="font-semibold">Jant Seçin</h2>
          </div>

          {wheels.length === 0 ? (
            <div className="py-12 text-center text-[var(--text-secondary)] text-sm">
              Henüz jant eklenmemiş.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {wheels.map((wheel) => {
                const isSelected = selectedWheel?.id === wheel.id;
                return (
                  <button
                    key={wheel.id}
                    onClick={() => { setSelectedWheel(wheel); setResultUrl(null); setError(null); }}
                    className={`rounded-xl overflow-hidden border-2 text-left transition-all active:scale-95 bg-[var(--bg-card)] ${
                      isSelected
                        ? 'border-[var(--accent-orange)] shadow-[0_0_20px_rgba(255,107,53,0.25)]'
                        : 'border-[var(--border-color)] hover:border-[var(--accent-orange)]/50'
                    }`}
                  >
                    <div className="aspect-square relative overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={wheel.jant_foto_url}
                        alt={wheel.jant_adi}
                        className="w-full h-full object-cover"
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-[var(--accent-orange)]/10 flex items-end justify-end p-2">
                          <div className="w-5 h-5 rounded-full bg-[var(--accent-orange)] flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-2.5">
                      <p className="text-xs font-semibold leading-tight line-clamp-2">{wheel.jant_adi}</p>
                      {wheel.ebat && (
                        <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">{wheel.ebat}</p>
                      )}
                      {wheel.fiyat != null && (
                        <p className="text-xs font-bold text-[var(--accent-orange)] mt-1">
                          ₺{wheel.fiyat.toLocaleString('tr-TR')}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* ─────────── Error ─────────── */}
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* ─────────── Generate button ─────────── */}
        {!resultUrl && (
          <button
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="w-full py-4 rounded-full font-bold text-base transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            style={canGenerate ? {
              background: 'linear-gradient(135deg, #FF6B35, #F72585, #7209B7)',
            } : {
              border: '1px solid var(--border-color)',
            }}
          >
            {generating ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Görsel oluşturuluyor... (15–30 sn)
              </span>
            ) : (
              'Görselleştir'
            )}
          </button>
        )}

        {/* ─────────── Result ─────────── */}
        {resultUrl && (
          <section className="space-y-3">
            <div className="rounded-xl overflow-hidden shadow-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={resultUrl} alt="AI Sonucu" className="w-full" />
            </div>

            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2.5 w-full py-4 rounded-full font-bold text-base text-white transition-all hover:brightness-110 active:scale-95"
              style={{ background: '#25D366' }}
            >
              <MessageCircle className="w-5 h-5" />
              Bu Jantı İstiyorum
            </a>

            <button
              onClick={handleReset}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-full border border-[var(--border-color)] text-sm font-medium text-[var(--text-secondary)] hover:text-white hover:border-white/30 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Yeni Görsel Oluştur
            </button>
          </section>
        )}

        {/* Footer */}
        <p className="text-center text-[10px] text-[var(--text-secondary)]/40 pt-2">
          Powered by <span className="gradient-text font-semibold">WheelVision</span>
        </p>
      </main>
    </div>
  );
}
