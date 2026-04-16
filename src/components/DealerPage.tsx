'use client';

import { useState, useRef } from 'react';
import { Camera, Check, Loader2, MessageCircle, X, RefreshCw, Download } from 'lucide-react';
import type { Dealer, Wheel } from '@/app/d/[slug]/page';

const CLOUD_NAME    = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
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

async function downloadImage(url: string) {
  try {
    const res = await fetch(`/api/proxy-image?url=${encodeURIComponent(url)}`);
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'wheelvision.jpg';
    a.click();
    URL.revokeObjectURL(a.href);
  } catch {
    window.open(url, '_blank');
  }
}

export default function DealerPage({ dealer, wheels }: { dealer: Dealer; wheels: Wheel[] }) {
  const [carPreview,    setCarPreview]    = useState<string | null>(null);
  const [carImageUrl,   setCarImageUrl]   = useState<string | null>(null);
  const [uploading,     setUploading]     = useState(false);
  const [selectedWheel, setSelectedWheel] = useState<Wheel | null>(null);
  const [generating,    setGenerating]    = useState(false);
  const [resultUrl,     setResultUrl]     = useState<string | null>(null);
  const [error,         setError]         = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const limitReached = dealer.kullanilan >= dealer.aylik_limit;
  const canGenerate  = !!carImageUrl && !!selectedWheel && !limitReached && !generating;

  /* ── Handlers ──────────────────────────────────────────────────────── */
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
  };

  /* ── WhatsApp ──────────────────────────────────────────────────────── */
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

  /* ── Render ────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[var(--bg-dark)] text-white flex flex-col">

      {/* ── Sticky header ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-[var(--bg-dark)]/95 backdrop-blur-md border-b border-[var(--border-color)]">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          {dealer.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={dealer.logo_url}
              alt={dealer.firma_adi}
              className="h-8 w-auto object-contain max-w-[140px]"
            />
          ) : (
            <span className="font-bold text-base">{dealer.firma_adi}</span>
          )}
          <div className="text-right">
            <p className="text-[10px] text-[var(--text-secondary)]">Powered by</p>
            <p className="text-xs font-bold gradient-text">WheelVision</p>
          </div>
        </div>
      </header>

      {/* ── Main scroll area ──────────────────────────────────────────── */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-5 space-y-4 pb-28">

        {/* Limit uyarısı */}
        {limitReached && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
            Bu ay için görsel hakkı dolmuştur. Daha sonra tekrar deneyiniz.
          </div>
        )}

        {/* ── SONUÇ ekranı ── */}
        {resultUrl && (
          <div className="space-y-3">
            <div className="rounded-2xl overflow-hidden border border-[var(--border-color)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={resultUrl} alt="AI Sonucu" className="w-full block" />
            </div>

            {/* WhatsApp + İndir */}
            <div className="grid grid-cols-2 gap-3">
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm text-white transition-all active:scale-95"
                style={{ background: '#25D366' }}
              >
                <MessageCircle className="w-4 h-4" />
                Bu Jantı İstiyorum
              </a>
              <button
                onClick={() => downloadImage(resultUrl)}
                className="btn-secondary flex items-center justify-center gap-2 py-3.5 text-sm font-bold rounded-xl"
              >
                <Download className="w-4 h-4" />
                İndir
              </button>
            </div>

            <button
              onClick={handleReset}
              className="btn-secondary w-full flex items-center justify-center gap-2 py-3.5 text-sm rounded-xl"
            >
              <RefreshCw className="w-4 h-4" />
              Yeni Görsel Oluştur
            </button>
          </div>
        )}

        {/* ── Adımlar (sonuç yokken) ── */}
        {!resultUrl && (
          <>
            {/* ── Adım 1: Araba fotoğrafı ── */}
            <div className="card !p-4">
              <div className="flex items-center gap-2.5 mb-3">
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: 'var(--gradient-primary)' }}
                >
                  1
                </span>
                <h2 className="font-semibold text-sm">Arabanızın Fotoğrafını Çekin</h2>
              </div>

              {carPreview ? (
                <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={carPreview} alt="Arabanız" className="w-full h-full object-cover" />

                  {uploading && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-8 h-8 animate-spin text-white" />
                      <p className="text-white text-xs">Yükleniyor...</p>
                    </div>
                  )}
                  {!uploading && carImageUrl && (
                    <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <button
                    onClick={clearCar}
                    className="absolute top-2 left-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center"
                    aria-label="Fotoğrafı kaldır"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ) : (
                <label className="upload-zone flex flex-col items-center cursor-pointer py-10">
                  <Camera className="w-10 h-10 text-[var(--text-secondary)] mb-3" />
                  <p className="text-sm font-semibold text-white">Fotoğraf çek veya seç</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">JPG, PNG, WEBP</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCarSelect}
                  />
                </label>
              )}
            </div>

            {/* ── Adım 2: Jant seçimi ── */}
            <div className="card !p-4">
              <div className="flex items-center gap-2.5 mb-3">
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: 'var(--gradient-primary)' }}
                >
                  2
                </span>
                <h2 className="font-semibold text-sm">Jant Seçin</h2>
              </div>

              {wheels.length === 0 ? (
                <p className="py-8 text-center text-sm text-[var(--text-secondary)]">
                  Henüz jant eklenmemiş.
                </p>
              ) : (
                <div className="space-y-2">
                  {wheels.map((wheel) => {
                    const isSelected = selectedWheel?.id === wheel.id;
                    return (
                      <button
                        key={wheel.id}
                        onClick={() => { setSelectedWheel(wheel); setResultUrl(null); setError(null); }}
                        className="w-full flex items-center gap-3 p-3 rounded-xl border transition-all active:scale-[0.99] text-left"
                        style={{
                          background:   isSelected ? 'rgba(255,107,53,0.08)' : 'var(--bg-card)',
                          borderColor:  isSelected ? 'var(--accent-orange)'  : 'var(--border-color)',
                          boxShadow:    isSelected ? '0 0 0 1px var(--accent-orange)' : 'none',
                        }}
                      >
                        {/* Jant fotoğrafı */}
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-[var(--bg-dark)] flex-shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={wheel.jant_foto_url}
                            alt={wheel.jant_adi}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Bilgiler */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm leading-tight truncate">{wheel.jant_adi}</p>
                          {wheel.ebat && (
                            <p className="text-xs text-[var(--text-secondary)] mt-0.5">{wheel.ebat}</p>
                          )}
                          {wheel.fiyat != null && (
                            <p className="text-sm font-bold text-[var(--accent-orange)] mt-1">
                              ₺{wheel.fiyat.toLocaleString('tr-TR')}
                            </p>
                          )}
                        </div>

                        {/* Seçim işareti */}
                        <div
                          className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center transition-all"
                          style={{
                            background: isSelected ? 'var(--accent-orange)' : 'var(--border-color)',
                          }}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Hata mesajı */}
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start gap-2">
                <X className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {error}
              </div>
            )}
          </>
        )}

      </main>

      {/* ── Sticky bottom CTA ─────────────────────────────────────────── */}
      {!resultUrl && (
        <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-3"
          style={{
            background: 'linear-gradient(to top, var(--bg-dark) 70%, transparent)',
          }}
        >
          <div className="max-w-2xl mx-auto">
            <button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className="btn-primary w-full py-4 text-base font-bold rounded-2xl flex items-center justify-center gap-2.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Görsel oluşturuluyor... (15–30 sn)
                </>
              ) : (
                'Görselleştir'
              )}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
