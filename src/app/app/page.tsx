'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Upload, Car, CircleDot, Sparkles, Download, RefreshCw, X } from 'lucide-react';

// ─── Watermark ────────────────────────────────────────────────────────────────
// Loads the AI result through our same-origin proxy, then burns "WheelVision"
// watermarks onto a canvas so the downloaded file also contains them.
async function applyWatermark(imageUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width  = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d')!;

      // Draw original image
      ctx.drawImage(img, 0, 0);

      // Single diagonal watermark across the center
      const fontSize = Math.max(32, Math.floor(img.naturalWidth * 0.07));
      ctx.font         = `bold ${fontSize}px Arial, sans-serif`;
      ctx.textBaseline = 'middle';
      ctx.textAlign    = 'center';

      ctx.save();
      ctx.translate(img.naturalWidth * 0.5, img.naturalHeight * 0.5);
      ctx.rotate(-Math.PI / 5); // −36° bottom-left to top-right

      // Dark outline for contrast on light areas
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.lineWidth   = fontSize * 0.08;
      ctx.strokeText('WheelVision', 0, 0);

      // White semi-transparent fill
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillText('WheelVision', 0, 0);
      ctx.restore();

      resolve(canvas.toDataURL('image/jpeg', 0.92));
    };

    // If canvas load fails, resolve with original URL (degraded, no watermark)
    img.onerror = () => resolve(imageUrl);

    // Route through same-origin proxy so canvas is not CORS-tainted
    img.src = `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`;
  });
}

export default function AppPage() {
  const { session, user, loading: authLoading } = useAuth();
  const [localCredits, setLocalCredits] = useState<number | null>(null);
  const [carImage, setCarImage] = useState<string | null>(null);
  const [wheelImage, setWheelImage] = useState<string | null>(null);
  const [carFile, setCarFile] = useState<File | null>(null);
  const [wheelFile, setWheelFile] = useState<File | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !session) {
      console.log('[App] No session, redirecting to /login');
      router.push('/login');
    }
  }, [authLoading, session, router]);

  // Sync local credits from context user
  useEffect(() => {
    if (user) setLocalCredits(user.credits);
  }, [user]);

  // Derived values
  const displayUser = user ? { ...user, credits: localCredits ?? user.credits } : null;
  const pageLoading = authLoading;

  const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  const MAX_FILE_SIZE_MB = 10;

  const uploadToCloudinary = useCallback(async (file: File): Promise<string> => {
    // Validate MIME type — accept attribute is client-side only and can be bypassed
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      throw new Error('Desteklenmeyen dosya türü. Sadece JPG, PNG, WEBP yükleyebilirsiniz.');
    }
    // Validate file size — prevents DoS via oversized uploads
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      throw new Error(`Dosya boyutu çok büyük. Maksimum ${MAX_FILE_SIZE_MB}MB yükleyebilirsiniz.`);
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'wheelvision');

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: 'POST', body: formData }
    );

    if (!response.ok) {
      throw new Error('Görsel yükleme başarısız. Lütfen tekrar deneyin.');
    }

    const data = await response.json();
    if (!data.secure_url) {
      throw new Error('Görsel yükleme başarısız.');
    }
    return data.secure_url;
  }, []);

  const handleCarUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCarFile(file);
      setCarImage(prev => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(file);
      });
      setResultImage(null);
    }
  }, []);

  const handleWheelUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setWheelFile(file);
      setWheelImage(prev => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(file);
      });
      setResultImage(null);
    }
  }, []);

  const handleGenerate = async () => {
    if (!carFile || !wheelFile || !displayUser) return;

    if ((localCredits ?? 0) < 1) {
      setError('Yetersiz kredi. Lütfen kredi satın alın.');
      return;
    }

    setLoading(true);
    setError('');
    setResultImage(null);

    try {
      // 1. Upload images to Cloudinary
      const [carUrl, wheelUrl] = await Promise.all([
        uploadToCloudinary(carFile),
        uploadToCloudinary(wheelFile),
      ]);

      // 2. Get auth token for server-side verification
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Oturum süresi doldu. Lütfen tekrar giriş yapın.');
      }

      // 3. Call server-side API route (n8n URL never exposed to browser)
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          car_image: carUrl,
          wheel_image: wheelUrl,
        }),
      });

      const data: Record<string, unknown> = await response.json();

      if (!response.ok || data.error) {
        throw new Error((data.error as string) || `Sunucu hatası: ${response.status}`);
      }

      const imageUrl = data.output_url as string | undefined;

      if (imageUrl) {
        // All users get watermarked version (paid plan logic to be added later)
        const finalImage = await applyWatermark(imageUrl);

        setResultImage(finalImage);
        setLocalCredits((prev) => (prev !== null ? prev - 1 : 0));
      } else {
        throw new Error('Görsel URL bulunamadı.');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Bir hata oluştu';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = useCallback(() => {
    setCarImage(prev => { if (prev) URL.revokeObjectURL(prev); return null; });
    setWheelImage(prev => { if (prev) URL.revokeObjectURL(prev); return null; });
    setCarFile(null);
    setWheelFile(null);
    setResultImage(null);
    setError('');
  }, []);

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--accent-orange)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!authLoading && !session) return null; // redirecting

  if (!displayUser && !authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-[var(--text-secondary)] mb-4">Kullanıcı verisi yüklenemedi.</p>
          <button onClick={() => router.push('/login')} className="btn-primary">Giriş Yap</button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-12 px-4">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-1">
              Jant <span className="gradient-text">Görselleştirici</span>
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Araba ve jant fotoğrafını yükleyin
            </p>
          </div>

          {/* Upload Section */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {/* Car Upload */}
            <div className="card">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[var(--accent-orange)] to-[var(--accent-pink)] flex items-center justify-center">
                  <Car className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-medium text-sm">Araba Fotoğrafı</h3>
              </div>

              {carImage ? (
                <div className="relative">
                  <img src={carImage} alt="Araba" className="w-full aspect-video object-cover rounded-lg" />
                  <button
                    onClick={() => { setCarImage(null); setCarFile(null); setResultImage(null); }}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <label className="upload-zone block cursor-pointer">
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleCarUpload} className="hidden" />
                  <Upload className="w-8 h-8 mx-auto mb-2 text-[var(--text-secondary)]" />
                  <p className="text-sm text-[var(--text-secondary)]">Tıklayın veya sürükleyin</p>
                  <p className="text-xs text-[var(--text-secondary)]/60 mt-1">JPG, PNG, WEBP</p>
                </label>
              )}
            </div>

            {/* Wheel Upload */}
            <div className="card">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[var(--accent-pink)] to-[var(--accent-purple)] flex items-center justify-center">
                  <CircleDot className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-medium text-sm">Jant Fotoğrafı</h3>
              </div>

              {wheelImage ? (
                <div className="relative">
                  <img src={wheelImage} alt="Jant" className="w-full aspect-video object-contain rounded-lg bg-[var(--bg-dark)]" />
                  <button
                    onClick={() => { setWheelImage(null); setWheelFile(null); setResultImage(null); }}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <label className="upload-zone block cursor-pointer">
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleWheelUpload} className="hidden" />
                  <Upload className="w-8 h-8 mx-auto mb-2 text-[var(--text-secondary)]" />
                  <p className="text-sm text-[var(--text-secondary)]">Tıklayın veya sürükleyin</p>
                  <p className="text-xs text-[var(--text-secondary)]/60 mt-1">JPG, PNG, WEBP</p>
                </label>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <button
              onClick={handleGenerate}
              disabled={!carImage || !wheelImage || loading}
              className="btn-primary px-8 py-3 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  İşleniyor...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Görselleştir
                </>
              )}
            </button>

            {(carImage || wheelImage || resultImage) && (
              <button onClick={handleReset} className="btn-secondary px-5 py-3 flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Temizle
              </button>
            )}
          </div>

          {/* Result */}
          {(loading || resultImage) && (
            <div className="gradient-border p-4 md:p-6">
              {loading ? (
                <div className="aspect-video max-w-3xl mx-auto bg-[var(--bg-dark)] rounded-xl flex flex-col items-center justify-center gap-5">
                  {/* Logo + dönen halka */}
                  <div className="relative flex items-center justify-center">
                    <div className="absolute w-24 h-24 border-4 border-[var(--accent-orange)]/30 border-t-[var(--accent-orange)] rounded-full animate-spin" />
                    <div className="absolute w-32 h-32 border-4 border-[var(--accent-purple)]/20 border-b-[var(--accent-purple)] rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.8s' }} />
                    <div className="relative z-10 animate-pulse">
                      <Image src="/logo.png" alt="WheelVision" width={100} height={25} className="h-6 w-auto" style={{ mixBlendMode: 'screen' }} />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-white">Görselleştiriliyor...</p>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">15–30 saniye sürebilir</p>
                  </div>
                </div>
              ) : resultImage && (
                <div className="space-y-4">
                  <img
                    src={resultImage}
                    alt="Görselleştirme sonucu"
                    className="w-full max-w-3xl mx-auto rounded-xl block"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="flex justify-center">
                    <button
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = resultImage;
                        link.download = 'wheelvision.jpg';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="btn-secondary flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      İndir
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
