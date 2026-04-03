'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
  const [carBrand, setCarBrand] = useState('');
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
          car_brand: carBrand.trim() || null,
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
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Jant <span className="gradient-text">Görselleştirici</span>
            </h1>
            <p className="text-[var(--text-secondary)]">
              Araba ve jant fotoğraflarını yükleyin, AI gerisini halleder
            </p>
          </div>

          {/* Upload Section */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Car Upload */}
            <div className="card">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[var(--accent-orange)] to-[var(--accent-pink)] flex items-center justify-center">
                  <Car className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">Araba Fotoğrafı</h3>
                  <p className="text-sm text-[var(--text-secondary)]">Jantları değiştirilecek araba</p>
                </div>
              </div>

              {carImage ? (
                <div className="relative">
                  <img
                    src={carImage}
                    alt="Araba"
                    className="w-full aspect-video object-cover rounded-xl"
                  />
                  <button
                    onClick={() => { setCarImage(null); setCarFile(null); setResultImage(null); }}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="upload-zone block cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCarUpload}
                    className="hidden"
                  />
                  <Upload className="w-10 h-10 mx-auto mb-3 text-[var(--text-secondary)]" />
                  <p className="text-[var(--text-secondary)]">
                    Tıklayın veya sürükleyin
                  </p>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">
                    PNG, JPG, WEBP
                  </p>
                </label>
              )}
              {/* Car brand input */}
              <div className="mt-4">
                <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">
                  Araç Markası <span className="text-[var(--accent-orange)]">(opsiyonel — jant logosu için)</span>
                </label>
                <input
                  type="text"
                  value={carBrand}
                  onChange={(e) => setCarBrand(e.target.value)}
                  placeholder="örn. BMW, Mercedes, Audi..."
                  className="w-full bg-[var(--bg-dark)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[var(--text-secondary)] outline-none focus:border-[var(--accent-orange)] transition-colors"
                />
              </div>
            </div>

            {/* Wheel Upload */}
            <div className="card">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[var(--accent-pink)] to-[var(--accent-purple)] flex items-center justify-center">
                  <CircleDot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">Jant Fotoğrafı</h3>
                  <p className="text-sm text-[var(--text-secondary)]">Takılacak jant modeli</p>
                </div>
              </div>

              {wheelImage ? (
                <div className="relative">
                  <img
                    src={wheelImage}
                    alt="Jant"
                    className="w-full aspect-video object-contain rounded-xl bg-[var(--bg-dark)]"
                  />
                  <button
                    onClick={() => { setWheelImage(null); setWheelFile(null); setResultImage(null); }}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="upload-zone block cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleWheelUpload}
                    className="hidden"
                  />
                  <Upload className="w-10 h-10 mx-auto mb-3 text-[var(--text-secondary)]" />
                  <p className="text-[var(--text-secondary)]">
                    Tıklayın veya sürükleyin
                  </p>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">
                    PNG, JPG, WEBP
                  </p>
                </label>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-center">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <button
              onClick={handleGenerate}
              disabled={!carImage || !wheelImage || loading}
              className="btn-primary px-8 py-4 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Oluşturuluyor...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Jantları Değiştir
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-white/20 text-sm">
                    1 Kredi
                  </span>
                </>
              )}
            </button>

            {(carImage || wheelImage || resultImage) && (
              <button
                onClick={handleReset}
                className="btn-secondary px-6 py-4 flex items-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                Sıfırla
              </button>
            )}
          </div>

          {/* Result Section */}
          {(loading || resultImage) && (
            <div className="gradient-border p-6 md:p-8">
              <h3 className="text-xl font-semibold mb-4 text-center">
                {loading ? 'AI Çalışıyor...' : 'Sonuç'}
              </h3>

              {loading ? (
                <div className="aspect-video max-w-3xl mx-auto bg-[var(--bg-dark)] rounded-xl flex flex-col items-center justify-center gap-6 relative overflow-hidden">
                  {/* Animated gradient background */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent-orange)] via-[var(--accent-pink)] to-[var(--accent-purple)] animate-pulse" />
                  </div>
                  {/* Spinning rings */}
                  <div className="relative w-20 h-20">
                    <div className="absolute inset-0 border-4 border-[var(--accent-orange)] border-t-transparent rounded-full animate-spin" />
                    <div className="absolute inset-2 border-4 border-[var(--accent-pink)] border-b-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
                    <div className="absolute inset-4 border-4 border-[var(--accent-purple)] border-t-transparent rounded-full animate-spin" style={{ animationDuration: '1.2s' }} />
                  </div>
                  <div className="text-center relative z-10">
                    <p className="font-medium text-white mb-1">AI Jantları Değiştiriyor</p>
                    <p className="text-sm text-[var(--text-secondary)]">15-30 saniye sürebilir...</p>
                  </div>
                  {/* Progress dots */}
                  <div className="flex gap-2 relative z-10">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-2 h-2 rounded-full bg-[var(--accent-orange)]"
                        style={{ animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite` }}
                      />
                    ))}
                  </div>
                </div>
              ) : resultImage && (
                <div className="space-y-4">
                  <img
                    src={resultImage}
                    alt="Sonuç"
                    className="w-full max-w-3xl mx-auto rounded-xl"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="flex flex-col items-center gap-3">
                    <button
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = resultImage;
                        link.download = 'wheelvision-result.jpg';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="btn-secondary flex items-center gap-2"
                    >
                      <Download className="w-5 h-5" />
                      İndir
                    </button>
                    <p className="text-xs text-[var(--text-secondary)]">
                      Filigransız indirmek için{' '}
                      <a href="/pricing" className="text-[var(--accent-orange)] hover:underline">
                        ücretli plana geçin
                      </a>
                    </p>
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
