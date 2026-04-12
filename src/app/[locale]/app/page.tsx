'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Navbar from '@/components/Navbar';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Upload, Car, CircleDot, Sparkles, Download, RefreshCw, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { applyWatermark } from '@/lib/watermark';

export default function AppPage() {
  const t = useTranslations('app');
  const { session, user, loading: authLoading, refreshUser } = useAuth();
  const [localCredits, setLocalCredits] = useState<number | null>(null);
  const [carImage, setCarImage] = useState<string | null>(null);
  const [wheelImage, setWheelImage] = useState<string | null>(null);
  const [carFile, setCarFile] = useState<File | null>(null);
  const [wheelFile, setWheelFile] = useState<File | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // Cache in-flight upload promises so generate doesn't re-upload the same file
  const carUploadRef = useRef<Promise<string> | null>(null);
  const wheelUploadRef = useRef<Promise<string> | null>(null);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (!authLoading && !session) {
      router.push('/login');
    }
  }, [authLoading, session, router]);

  useEffect(() => {
    if (user) setLocalCredits(user.credits);
  }, [user]);

  const displayUser = user ? { ...user, credits: localCredits ?? user.credits } : null;
  const pageLoading = authLoading;

  const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  const MAX_FILE_SIZE_MB = 10;

  const uploadToCloudinary = useCallback(async (file: File): Promise<string> => {
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      throw new Error('Desteklenmeyen dosya türü. Sadece JPG, PNG, WEBP yükleyebilirsiniz.');
    }
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

    if (!response.ok) throw new Error('Görsel yükleme başarısız. Lütfen tekrar deneyin.');

    const data = await response.json();
    if (!data.secure_url) throw new Error('Görsel yükleme başarısız.');
    return data.secure_url;
  }, []);

  const handleCarUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCarFile(file);
      setCarImage(prev => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(file); });
      setResultImage(null);
      // Start Cloudinary upload immediately in background
      carUploadRef.current = uploadToCloudinary(file);
    }
  }, [uploadToCloudinary]);

  const handleWheelUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setWheelFile(file);
      setWheelImage(prev => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(file); });
      setResultImage(null);
      // Start Cloudinary upload immediately in background
      wheelUploadRef.current = uploadToCloudinary(file);
    }
  }, [uploadToCloudinary]);

  const handleGenerate = async () => {
    if (!carFile || !wheelFile || !displayUser) return;

    if ((localCredits ?? 0) < 1) {
      setError(t('insufficientCredits'));
      return;
    }

    setLoading(true);
    setError('');
    setResultImage(null);

    // Helper: reuse in-progress upload if available, otherwise upload fresh
    const resolveUpload = async (ref: React.MutableRefObject<Promise<string> | null>, file: File) => {
      if (ref.current) {
        try { return await ref.current; } catch { /* fall through to fresh upload */ }
      }
      return uploadToCloudinary(file);
    };

    try {
      const [carUrl, wheelUrl] = await Promise.all([
        resolveUpload(carUploadRef, carFile),
        resolveUpload(wheelUploadRef, wheelFile),
      ]);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error(t('sessionExpired'));
      }

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ car_image: carUrl, wheel_image: wheelUrl }),
      });

      const data: Record<string, unknown> = await response.json();

      if (!response.ok || data.error) {
        throw new Error((data.error as string) || `Sunucu hatası: ${response.status}`);
      }

      const imageUrl = data.output_url as string | undefined;

      if (imageUrl) {
        // Show result immediately — don't wait for watermark
        setResultImage(imageUrl);
        setLocalCredits((prev) => (prev !== null ? prev - 1 : 0));
        void refreshUser(); // sync Navbar credit count in background
        // Apply watermark async, update result when done
        applyWatermark(imageUrl).then((wm) => setResultImage(wm)).catch(() => {});
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

  const handleDownload = useCallback(async () => {
    if (!resultImage) return;

    try {
      let blob: Blob;

      if (resultImage.startsWith('data:')) {
        // Canvas data URL — convert directly without fetch (works in all browsers)
        const [header, base64] = resultImage.split(',');
        const mime = header.match(/:(.*?);/)![1];
        const binary = atob(base64);
        const buffer = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) buffer[i] = binary.charCodeAt(i);
        blob = new Blob([buffer], { type: mime });
      } else {
        // Remote URL — route through proxy to avoid CORS
        const res = await fetch(`/api/proxy-image?url=${encodeURIComponent(resultImage)}`);
        if (!res.ok) throw new Error('proxy error');
        blob = await res.blob();
      }

      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `wheelvision-result-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
    } catch {
      // Last resort: open in new tab
      window.open(resultImage, '_blank');
    }
  }, [resultImage]);

  const handleReset = useCallback(() => {
    setCarImage(prev => { if (prev) URL.revokeObjectURL(prev); return null; });
    setWheelImage(prev => { if (prev) URL.revokeObjectURL(prev); return null; });
    setCarFile(null);
    setWheelFile(null);
    setResultImage(null);
    setError('');
    carUploadRef.current = null;
    wheelUploadRef.current = null;
  }, []);

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--accent-orange)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!authLoading && !session) return null;

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
          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-1">
              {t('title').split(' ')[0]} <span className="gradient-text">{t('title').split(' ').slice(1).join(' ')}</span>
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">{t('subtitle')}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {/* Car Upload */}
            <div className="card">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[var(--accent-orange)] to-[var(--accent-pink)] flex items-center justify-center">
                  <Car className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-medium text-sm">{t('carPhoto')}</h3>
              </div>
              {carImage ? (
                <div className="relative">
                  <img src={carImage} alt="Car" className="w-full aspect-video object-cover rounded-lg" />
                  <button
                    onClick={() => { setCarImage(null); setCarFile(null); setResultImage(null); carUploadRef.current = null; }}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <label className="upload-zone block cursor-pointer">
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleCarUpload} className="hidden" />
                  <Upload className="w-8 h-8 mx-auto mb-2 text-[var(--text-secondary)]" />
                  <p className="text-sm text-[var(--text-secondary)]">{t('uploadClick')}</p>
                  <p className="text-xs text-[var(--text-secondary)]/60 mt-1">{t('uploadFormats')}</p>
                </label>
              )}
            </div>

            {/* Wheel Upload */}
            <div className="card">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[var(--accent-pink)] to-[var(--accent-purple)] flex items-center justify-center">
                  <CircleDot className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-medium text-sm">{t('wheelPhoto')}</h3>
              </div>
              {wheelImage ? (
                <div className="relative">
                  <img src={wheelImage} alt="Wheel" className="w-full aspect-video object-contain rounded-lg bg-[var(--bg-dark)]" />
                  <button
                    onClick={() => { setWheelImage(null); setWheelFile(null); setResultImage(null); wheelUploadRef.current = null; }}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <label className="upload-zone block cursor-pointer">
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleWheelUpload} className="hidden" />
                  <Upload className="w-8 h-8 mx-auto mb-2 text-[var(--text-secondary)]" />
                  <p className="text-sm text-[var(--text-secondary)]">{t('uploadClick')}</p>
                  <p className="text-xs text-[var(--text-secondary)]/60 mt-1">{t('uploadFormats')}</p>
                </label>
              )}
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <div className="flex items-center justify-center gap-3 mb-8">
            <button
              onClick={handleGenerate}
              disabled={!carImage || !wheelImage || loading}
              className="btn-primary px-8 py-3 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t('processing')}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  {t('generate')}
                </>
              )}
            </button>

            {(carImage || wheelImage || resultImage) && (
              <button onClick={handleReset} className="btn-secondary px-5 py-3 flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                {t('clear')}
              </button>
            )}
          </div>

          {(loading || resultImage) && (
            <div className="gradient-border p-4 md:p-6">
              {loading ? (
                <div className="max-w-3xl mx-auto bg-[var(--bg-dark)] rounded-xl py-16 md:py-24 flex flex-col items-center gap-8">
                  {/* Spinner */}
                  <div className="relative w-20 h-20 md:w-28 md:h-28">
                    <div className="absolute inset-0 rounded-full border-4 border-[var(--accent-orange)]/20 border-t-[var(--accent-orange)] animate-spin" />
                    <div className="absolute inset-3 rounded-full border-4 border-[var(--accent-purple)]/20 border-b-[var(--accent-purple)] animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.8s' }} />
                  </div>
                  {/* Labels */}
                  <div className="text-center">
                    <p className="text-xl md:text-2xl font-semibold text-white mb-2">{t('visualizing')}</p>
                    <p className="text-sm text-[var(--text-secondary)]">{t('timeTip')}</p>
                  </div>
                </div>
              ) : resultImage && (
                <div className="space-y-4">
                  <img src={resultImage} alt="Visualization result" className="w-full max-w-3xl mx-auto rounded-xl block" loading="lazy" decoding="async" />
                  <div className="flex justify-center">
                    <button
                      onClick={handleDownload}
                      className="btn-secondary flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      {t('download')}
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
