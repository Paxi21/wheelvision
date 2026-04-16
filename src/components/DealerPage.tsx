'use client';

import { useState, useRef } from 'react';
import { Camera, ImageIcon, Check, Loader2, MessageCircle, X, RefreshCw, Download, ChevronRight } from 'lucide-react';
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
    const res  = await fetch(`/api/proxy-image?url=${encodeURIComponent(url)}`);
    const blob = await res.blob();
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(blob);
    a.download = 'wheelvision-sonuc.jpg';
    a.click();
    URL.revokeObjectURL(a.href);
  } catch {
    window.open(url, '_blank');
  }
}

/* ─── WhatsApp SVG icon ───────────────────────────────────────────────── */
function WhatsAppIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

/* ─── Before / After slider ───────────────────────────────────────────── */
function BeforeAfter({ before, after }: { before: string; after: string }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-[var(--border-color)]">
      <div className="grid grid-cols-2">
        {/* Before */}
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={before} alt="Önce" className="w-full aspect-square object-cover" />
          <div className="absolute bottom-0 left-0 right-0 py-1.5 text-center text-xs font-bold tracking-widest"
            style={{ background: 'rgba(0,0,0,0.55)', color: '#A0A0B0' }}>
            ÖNCE
          </div>
        </div>
        {/* Divider */}
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={after} alt="Sonra" className="w-full aspect-square object-cover" />
          <div className="absolute bottom-0 left-0 right-0 py-1.5 text-center text-xs font-bold tracking-widest"
            style={{ background: 'rgba(247,37,133,0.55)', color: '#fff' }}>
            SONRA
          </div>
          {/* Center divider line */}
          <div className="absolute inset-y-0 left-0 w-px bg-white/40" />
        </div>
      </div>
    </div>
  );
}

/* ─── Main component ──────────────────────────────────────────────────── */
export default function DealerPage({ dealer, wheels }: { dealer: Dealer; wheels: Wheel[] }) {

  const [carPreview,      setCarPreview]      = useState<string | null>(null);
  const [carImageUrl,     setCarImageUrl]     = useState<string | null>(null);
  const [uploading,       setUploading]       = useState(false);
  const [selectedWheel,   setSelectedWheel]   = useState<Wheel | null>(null);
  const [generating,      setGenerating]      = useState(false);
  const [resultUrl,       setResultUrl]       = useState<string | null>(null);
  const [error,           setError]           = useState<string | null>(null);
  const [uploadSheet,     setUploadSheet]     = useState(false);   // bottom sheet

  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef  = useRef<HTMLInputElement>(null);

  const limitReached = dealer.kullanilan >= dealer.aylik_limit;
  const canGenerate  = !!carImageUrl && !!selectedWheel && !limitReached && !generating;

  /* ── File handling ─────────────────────────────────────────────────── */
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

  /* ── Generate ──────────────────────────────────────────────────────── */
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

  /* ── WhatsApp ──────────────────────────────────────────────────────── */
  const waPhone = dealer.whatsapp.replace(/\D/g, '');
  const waText  = selectedWheel
    ? encodeURIComponent(
        `Merhaba ${dealer.firma_adi},\n`
        + `${selectedWheel.jant_adi}`
        + (selectedWheel.ebat ? ` (${selectedWheel.ebat})` : '')
        + ` için fiyat almak istiyorum.`
      )
    : encodeURIComponent(`Merhaba ${dealer.firma_adi}, jant fiyatı hakkında bilgi almak istiyorum.`);
  const waUrl = `https://wa.me/${waPhone}?text=${waText}`;

  /* ── Render ────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[var(--bg-dark)] text-white flex flex-col">

      {/* ══════════════════ HEADER ══════════════════ */}
      {/* B2B NOTU: Buraya her dealer'ın firma adı / logosu gelir */}
      <header className="sticky top-0 z-40 bg-[var(--bg-dark)]/95 backdrop-blur-md border-b border-[var(--border-color)]">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">

          {/* ← FİRMA ADI / LOGOSU — her müşteri için farklı → */}
          {dealer.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={dealer.logo_url}
              alt={dealer.firma_adi}
              className="h-9 w-auto object-contain max-w-[160px]"
            />
          ) : (
            <div>
              <p className="font-extrabold text-lg leading-tight tracking-tight">
                {dealer.firma_adi}
                {/* ↑ MÜŞTERİNİN FİRMA ADI */}
              </p>
              <p className="text-[10px] text-[var(--text-secondary)] leading-tight">Jant Showroom</p>
            </div>
          )}

          {/* WheelVision branding */}
          <div className="text-right">
            <p className="text-[10px] text-[var(--text-secondary)]">Powered by</p>
            <p className="text-xs font-bold gradient-text">WheelVision</p>
          </div>
        </div>
      </header>

      {/* ══════════════════ CONTENT ══════════════════ */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 pt-5 pb-28 space-y-4">

        {/* Limit uyarısı */}
        {limitReached && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
            Bu ay için görsel hakkı dolmuştur.
          </div>
        )}

        {/* ══ SONUÇ EKRANI ══════════════════════════════════════════════ */}
        {resultUrl && carPreview && (
          <div className="space-y-4">

            {/* Before / After */}
            <div>
              <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-widest mb-2">
                Karşılaştırma
              </p>
              <BeforeAfter before={carPreview} after={resultUrl} />
            </div>

            {/* Seçilen jant bilgisi */}
            {selectedWheel && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">
                <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={selectedWheel.jant_foto_url} alt={selectedWheel.jant_adi} className="w-full h-full object-cover" />
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

            {/* CTA Butonları */}
            <div className="grid grid-cols-2 gap-3">
              {/* WhatsApp — Fiyat Al */}
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-sm text-white transition-all active:scale-95 hover:brightness-110"
                style={{ background: '#25D366' }}
              >
                <WhatsAppIcon size={18} />
                Fiyat Al
              </a>

              {/* İndir */}
              <button
                onClick={() => downloadImage(resultUrl)}
                className="btn-secondary flex items-center justify-center gap-2 py-4 text-sm font-bold rounded-xl"
              >
                <Download className="w-4 h-4" />
                İndir
              </button>
            </div>

            {/* Yeni görsel */}
            <button
              onClick={handleReset}
              className="btn-secondary w-full flex items-center justify-center gap-2 py-3.5 text-sm rounded-xl"
            >
              <RefreshCw className="w-4 h-4" />
              Yeni Görsel Oluştur
            </button>
          </div>
        )}

        {/* ══ ADIMLAR (sonuç yokken) ════════════════════════════════════ */}
        {!resultUrl && (
          <>
            {/* ── Adım 1: Araç Fotoğrafı ── */}
            <div className="card !p-4">
              <div className="flex items-center gap-2.5 mb-3">
                <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: 'var(--gradient-primary)' }}>
                  1
                </span>
                <div>
                  <h2 className="font-bold text-sm">Araç Fotoğrafı</h2>
                  <p className="text-[11px] text-[var(--text-secondary)]">Müşterinin aracının fotoğrafını ekleyin</p>
                </div>
              </div>

              {carPreview ? (
                /* Önizleme */
                <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={carPreview} alt="Araç" className="w-full h-full object-cover" />

                  {uploading && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-8 h-8 animate-spin text-white" />
                      <p className="text-white text-xs font-medium">Yükleniyor...</p>
                    </div>
                  )}
                  {!uploading && carImageUrl && (
                    <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}

                  {/* Değiştir butonu */}
                  {!uploading && (
                    <button
                      onClick={() => setUploadSheet(true)}
                      className="absolute bottom-2 right-2 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold"
                      style={{ background: 'rgba(0,0,0,0.7)', color: '#fff' }}
                    >
                      <Camera className="w-3 h-3" />
                      Değiştir
                    </button>
                  )}

                  <button
                    onClick={clearCar}
                    className="absolute top-2 left-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ) : (
                /* Upload butonu */
                <button
                  onClick={() => setUploadSheet(true)}
                  className="upload-zone w-full flex flex-col items-center py-10 rounded-xl"
                >
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
                    style={{ background: 'rgba(255,107,53,0.12)' }}>
                    <Camera className="w-7 h-7 text-[var(--accent-orange)]" />
                  </div>
                  <p className="font-semibold text-sm text-white">Fotoğraf Ekle</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    Kamera veya galeriden seçin
                  </p>
                  <div className="flex items-center gap-1.5 mt-3 text-[var(--accent-orange)] text-xs font-medium">
                    <span>Başlamak için dokun</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </button>
              )}
            </div>

            {/* ── Adım 2: Jant Seçimi ── */}
            <div className="card !p-4">
              <div className="flex items-center gap-2.5 mb-3">
                <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: 'var(--gradient-primary)' }}>
                  2
                </span>
                <div>
                  <h2 className="font-bold text-sm">Jant Seçin</h2>
                  {/* ↓ KATALOG ADI — her dealer'ın stoku buraya yansır */}
                  <p className="text-[11px] text-[var(--text-secondary)]">{dealer.firma_adi} stoğundan seçin</p>
                </div>
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
                          background:  isSelected ? 'rgba(255,107,53,0.08)' : 'var(--bg-card)',
                          borderColor: isSelected ? 'var(--accent-orange)'   : 'var(--border-color)',
                          boxShadow:   isSelected ? '0 0 0 1px var(--accent-orange)' : 'none',
                        }}
                      >
                        {/* Jant görseli */}
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-[var(--bg-dark)] flex-shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={wheel.jant_foto_url}
                            alt={wheel.jant_adi}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Bilgiler */}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm leading-tight truncate">{wheel.jant_adi}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            {wheel.marka && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--border-color)] text-[var(--text-secondary)] font-medium">
                                {wheel.marka}
                              </span>
                            )}
                            {wheel.ebat && (
                              <span className="text-[10px] text-[var(--text-secondary)]">{wheel.ebat}</span>
                            )}
                          </div>
                          {wheel.fiyat != null && (
                            <p className="text-sm font-extrabold text-[var(--accent-orange)] mt-1">
                              ₺{wheel.fiyat.toLocaleString('tr-TR')}
                            </p>
                          )}
                        </div>

                        {/* Seçim */}
                        <div
                          className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center transition-all"
                          style={{ background: isSelected ? 'var(--accent-orange)' : 'var(--border-color)' }}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
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

      {/* ══════════════════ STICKY GENERATE BUTTON ══════════════════════ */}
      {!resultUrl && (
        <div
          className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-4"
          style={{ background: 'linear-gradient(to top, var(--bg-dark) 65%, transparent)' }}
        >
          <div className="max-w-2xl mx-auto">
            <button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className="btn-primary w-full py-4 text-base font-extrabold rounded-2xl flex items-center justify-center gap-2.5 disabled:opacity-35 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Görsel oluşturuluyor... (15–30 sn)
                </>
              ) : (
                <>
                  Görselleştir
                  {canGenerate && <ChevronRight className="w-5 h-5" />}
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════ UPLOAD BOTTOM SHEET ═════════════════════════ */}
      {uploadSheet && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => setUploadSheet(false)}
          />

          {/* Sheet */}
          <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl border-t border-[var(--border-color)]"
            style={{ background: 'var(--bg-card)' }}>
            <div className="max-w-2xl mx-auto px-4 pt-4 pb-8">

              {/* Handle */}
              <div className="w-12 h-1 rounded-full bg-[var(--border-color)] mx-auto mb-5" />

              <h3 className="font-bold text-base text-center mb-5">Fotoğraf Ekle</h3>

              <div className="space-y-3">
                {/* Kamera */}
                <button
                  onClick={() => cameraRef.current?.click()}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl border border-[var(--border-color)] hover:border-[var(--accent-orange)] transition-colors active:scale-[0.98]"
                  style={{ background: 'var(--bg-dark)' }}
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(255,107,53,0.12)' }}>
                    <Camera className="w-6 h-6 text-[var(--accent-orange)]" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-sm">Kamera ile Çek</p>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                      Şu an orada olan aracı fotoğraflayın
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--text-secondary)] ml-auto" />
                </button>

                {/* Galeri */}
                <button
                  onClick={() => galleryRef.current?.click()}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl border border-[var(--border-color)] hover:border-[var(--accent-orange)] transition-colors active:scale-[0.98]"
                  style={{ background: 'var(--bg-dark)' }}
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(247,37,133,0.12)' }}>
                    <ImageIcon className="w-6 h-6 text-[var(--accent-pink)]" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-sm">Galeriden Seç</p>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                      Telefondaki fotoğraflardan yükleyin
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--text-secondary)] ml-auto" />
                </button>
              </div>

              <button
                onClick={() => setUploadSheet(false)}
                className="w-full mt-4 py-3 rounded-xl text-sm text-[var(--text-secondary)] font-medium"
              >
                İptal
              </button>
            </div>
          </div>
        </>
      )}

      {/* Hidden file inputs */}
      <input ref={galleryRef} type="file" accept="image/*"            className="hidden" onChange={handleFileChange} />
      <input ref={cameraRef}  type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />

    </div>
  );
}
