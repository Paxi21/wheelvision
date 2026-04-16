'use client';

import { useState, useRef } from 'react';
import {
  Camera, Check, Loader2, MessageCircle, X,
  RefreshCw, Download, ImagePlus, ChevronRight,
} from 'lucide-react';
import type { Dealer, Wheel } from '@/app/d/[slug]/page';

const CLOUD_NAME   = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
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

async function downloadImage(url: string, filename = 'wheelvision.jpg') {
  try {
    const res = await fetch(`/api/proxy-image?url=${encodeURIComponent(url)}`);
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  } catch {
    window.open(url, '_blank');
  }
}

/* ─── Step indicator ────────────────────────────────────────────────────── */
function StepBadge({ n, active, done }: { n: number; active: boolean; done: boolean }) {
  return (
    <span
      className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-all duration-300"
      style={{
        background: done
          ? '#22C55E'
          : active
          ? 'linear-gradient(135deg,#8B5CF6,#EC4899)'
          : '#E5E7EB',
        color: done || active ? '#fff' : '#9CA3AF',
      }}
    >
      {done ? <Check className="w-4 h-4" /> : n}
    </span>
  );
}

/* ─── Main component ────────────────────────────────────────────────────── */
export default function DealerPage({ dealer, wheels }: { dealer: Dealer; wheels: Wheel[] }) {
  const [carPreview,    setCarPreview]    = useState<string | null>(null);
  const [carImageUrl,   setCarImageUrl]   = useState<string | null>(null);
  const [uploading,     setUploading]     = useState(false);
  const [selectedWheel, setSelectedWheel] = useState<Wheel | null>(null);
  const [generating,    setGenerating]    = useState(false);
  const [resultUrl,     setResultUrl]     = useState<string | null>(null);
  const [error,         setError]         = useState<string | null>(null);
  const [dragOver,      setDragOver]      = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const limitReached = dealer.kullanilan >= dealer.aylik_limit;
  const step1Done    = !!carImageUrl;
  const step2Done    = !!selectedWheel;
  const canGenerate  = step1Done && step2Done && !limitReached && !generating;

  /* ── Car photo handlers ─────────────────────────────────────────────── */
  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setCarPreview(URL.createObjectURL(file));
    setCarImageUrl(null);
    setResultUrl(null);
    setError(null);
    setUploading(true);
    try {
      setCarImageUrl(await uploadToCloudinary(file));
    } catch {
      setError('Fotoğraf yüklenemedi. Lütfen tekrar deneyin.');
      setCarPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleCarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
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
    <div className="min-h-screen" style={{ background: '#F3F4F6' }}>

      {/* ── Header ── */}
      <header style={{ background: 'linear-gradient(135deg,#8B5CF6 0%,#EC4899 100%)' }}>
        <div
          className="max-w-lg mx-auto px-4 py-5 flex flex-col items-center justify-center text-center gap-1"
        >
          {dealer.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={dealer.logo_url}
              alt={dealer.firma_adi}
              className="h-12 w-auto object-contain max-w-[180px] mb-1"
            />
          ) : (
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              {dealer.firma_adi}
            </h1>
          )}
          <p className="text-white/70 text-xs font-medium">
            Powered by{' '}
            <span className="font-bold text-white">WheelVision</span>
          </p>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-5 space-y-4 pb-20">

        {/* ── Limit warning ── */}
        {limitReached && (
          <div
            className="p-4 rounded-2xl text-sm text-center font-medium"
            style={{ background: '#FEE2E2', color: '#DC2626', border: '1px solid #FECACA' }}
          >
            Bu ay için görsel hakkı dolmuştur. Daha sonra tekrar deneyiniz.
          </div>
        )}

        {/* ── Result (full screen card) ── */}
        {resultUrl && (
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: '#fff',
              boxShadow: '0 8px 32px rgba(139,92,246,0.15)',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={resultUrl} alt="AI Sonucu" className="w-full block" />

            <div className="p-4 grid grid-cols-2 gap-3">
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm text-white transition-all active:scale-95 hover:brightness-110"
                style={{ background: '#22C55E' }}
              >
                <MessageCircle className="w-4 h-4" />
                Bu Jantı İstiyorum
              </a>
              <button
                onClick={() => downloadImage(resultUrl)}
                className="flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm text-white transition-all active:scale-95 hover:brightness-110"
                style={{ background: '#3B82F6' }}
              >
                <Download className="w-4 h-4" />
                İndir
              </button>
            </div>

            <div className="px-4 pb-4">
              <button
                onClick={handleReset}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-medium transition-colors"
                style={{ background: '#F3F4F6', color: '#6B7280' }}
              >
                <RefreshCw className="w-4 h-4" />
                Yeni Görsel Oluştur
              </button>
            </div>
          </div>
        )}

        {/* ── Steps (hidden after result) ── */}
        {!resultUrl && (
          <>
            {/* ── STEP 1: Car photo ── */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
            >
              <div className="px-4 pt-4 pb-3 flex items-center gap-3">
                <StepBadge n={1} active={!step1Done} done={step1Done} />
                <div>
                  <p className="font-bold text-gray-900 text-sm">Arabanızın Fotoğrafı</p>
                  <p className="text-xs text-gray-400">JPG, PNG veya WEBP</p>
                </div>
                {step1Done && !uploading && (
                  <button
                    onClick={clearCar}
                    className="ml-auto text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors"
                  >
                    <X className="w-3 h-3" /> Değiştir
                  </button>
                )}
              </div>

              <div className="px-4 pb-4">
                {carPreview ? (
                  <div
                    className="relative rounded-xl overflow-hidden bg-gray-100"
                    style={{ aspectRatio: '16/9' }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={carPreview}
                      alt="Arabanız"
                      className="w-full h-full object-cover"
                    />
                    {uploading && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2"
                        style={{ background: 'rgba(0,0,0,0.55)' }}>
                        <Loader2 className="w-8 h-8 animate-spin text-white" />
                        <p className="text-white text-xs font-medium">Yükleniyor...</p>
                      </div>
                    )}
                    {!uploading && carImageUrl && (
                      <div
                        className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center shadow-lg"
                        style={{ background: '#22C55E' }}
                      >
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    className="w-full rounded-xl flex flex-col items-center justify-center gap-3 py-10 transition-all active:scale-95"
                    style={{
                      border: `2px dashed ${dragOver ? '#8B5CF6' : '#D1D5DB'}`,
                      background: dragOver ? '#F5F3FF' : '#F9FAFB',
                    }}
                  >
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg,#8B5CF6,#EC4899)' }}
                    >
                      <Camera className="w-7 h-7 text-white" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-gray-800">
                        Fotoğraf çek veya seç
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        veya sürükle bırak
                      </p>
                    </div>
                  </button>
                )}
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCarSelect}
            />

            {/* ── STEP 2: Wheel selection ── */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
            >
              <div className="px-4 pt-4 pb-3 flex items-center gap-3">
                <StepBadge n={2} active={step1Done && !step2Done} done={step2Done} />
                <div>
                  <p className="font-bold text-gray-900 text-sm">Jant Seçin</p>
                  <p className="text-xs text-gray-400">{wheels.length} model mevcut</p>
                </div>
              </div>

              <div className="px-4 pb-4">
                {wheels.length === 0 ? (
                  <div className="py-10 text-center text-gray-400 text-sm">
                    <ImagePlus className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    Henüz jant eklenmemiş.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {wheels.map((wheel) => {
                      const isSelected = selectedWheel?.id === wheel.id;
                      return (
                        <button
                          key={wheel.id}
                          onClick={() => {
                            setSelectedWheel(wheel);
                            setResultUrl(null);
                            setError(null);
                          }}
                          className="rounded-xl overflow-hidden text-left transition-all duration-200 active:scale-95"
                          style={{
                            border: isSelected
                              ? '2.5px solid #8B5CF6'
                              : '2px solid #E5E7EB',
                            background: '#fff',
                            boxShadow: isSelected
                              ? '0 0 0 4px rgba(139,92,246,0.12)'
                              : '0 1px 4px rgba(0,0,0,0.05)',
                          }}
                        >
                          <div className="aspect-square relative overflow-hidden bg-gray-50">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={wheel.jant_foto_url}
                              alt={wheel.jant_adi}
                              className="w-full h-full object-cover"
                            />
                            {isSelected && (
                              <div
                                className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center shadow"
                                style={{ background: '#8B5CF6' }}
                              >
                                <Check className="w-3.5 h-3.5 text-white" />
                              </div>
                            )}
                          </div>
                          <div className="p-2.5 space-y-0.5">
                            <p className="text-xs font-bold text-gray-900 leading-tight line-clamp-2">
                              {wheel.jant_adi}
                            </p>
                            {wheel.ebat && (
                              <p className="text-[11px] text-gray-400">{wheel.ebat}</p>
                            )}
                            {wheel.fiyat != null && (
                              <p
                                className="text-xs font-extrabold mt-1"
                                style={{ color: '#8B5CF6' }}
                              >
                                ₺{wheel.fiyat.toLocaleString('tr-TR')}
                              </p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* ── Error ── */}
            {error && (
              <div
                className="p-4 rounded-2xl text-sm flex items-start gap-2"
                style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}
              >
                <X className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            {/* ── Generate button ── */}
            <button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className="w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-95 flex items-center justify-center gap-2.5"
              style={
                canGenerate
                  ? {
                      background: 'linear-gradient(135deg,#8B5CF6 0%,#EC4899 100%)',
                      color: '#fff',
                      boxShadow: '0 4px 20px rgba(139,92,246,0.4)',
                    }
                  : {
                      background: '#E5E7EB',
                      color: '#9CA3AF',
                      cursor: 'not-allowed',
                    }
              }
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Görsel oluşturuluyor<span className="animate-pulse">...</span></span>
                </>
              ) : (
                <>
                  Görselleştir
                  {canGenerate && <ChevronRight className="w-5 h-5" />}
                </>
              )}
            </button>

            {generating && (
              <p className="text-center text-xs text-gray-400 -mt-2 animate-pulse">
                Bu işlem 15–30 saniye sürebilir
              </p>
            )}
          </>
        )}

        {/* Footer */}
        <p className="text-center text-[11px] text-gray-300 pt-2">
          Powered by{' '}
          <span
            className="font-bold"
            style={{ background: 'linear-gradient(135deg,#8B5CF6,#EC4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
          >
            WheelVision
          </span>
        </p>
      </main>
    </div>
  );
}
