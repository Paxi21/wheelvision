'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import Navbar from '@/components/Navbar';
import { createClient } from '@/lib/supabase';
import { Download, Car, ArrowRight, X, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { applyWatermark } from '@/lib/watermark';

interface Generation {
  id: string;
  user_email: string;
  result_image_url: string;
  created_at: string;
}

interface UserData {
  email: string;
  plan: string;
}

function isPaidPlan(plan: string): boolean {
  return plan === 'starter' || plan === 'standard' || plan === 'pro';
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString(undefined, {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}


function ImageModal({ url, isPaid, onClose }: { url: string; isPaid: boolean; onClose: () => void }) {
  const t = useTranslations('history');
  // Watermarked version — computed once when modal opens
  const [watermarked, setWatermarked] = useState<string | null>(null);
  // Keep ref so download can use latest value without re-creating the callback
  const watermarkedRef = useRef<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Apply watermark once — used for both display (non-paid) and download (everyone)
  useEffect(() => {
    let cancelled = false;
    applyWatermark(url).then((wm) => {
      if (!cancelled) { watermarkedRef.current = wm; setWatermarked(wm); }
    });
    return () => { cancelled = true; };
  }, [url]);

  // Paid users see the clean image; everyone else sees the watermarked version
  const displaySrc = isPaid ? url : (watermarked ?? url);

  const handleDownload = useCallback(async () => {
    // Everyone downloads watermarked for now (paid clean-download coming later)
    const toDownload = watermarkedRef.current ?? await applyWatermark(url);

    try {
      let blob: Blob;
      if (toDownload.startsWith('data:')) {
        const [header, base64] = toDownload.split(',');
        const mime = header.match(/:(.*?);/)![1];
        const binary = atob(base64);
        const buffer = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) buffer[i] = binary.charCodeAt(i);
        blob = new Blob([buffer], { type: mime });
      } else {
        const res = await fetch(`/api/proxy-image?url=${encodeURIComponent(toDownload)}`);
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
      window.open(toDownload, '_blank');
    }
  }, [url]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }} transition={{ type: 'spring', damping: 22, stiffness: 300 }} onClick={(e) => e.stopPropagation()} className="relative max-w-3xl w-full">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-white/50">{t('aiResult')}</span>
          <div className="flex items-center gap-2">
            {!isPaid && (
              <Link href="/pricing" onClick={(e) => e.stopPropagation()} className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium text-[var(--accent-orange)] border border-[var(--accent-orange)]/40 hover:bg-[var(--accent-orange)]/10 transition-colors">
                <Lock className="w-3 h-3" />
                {t('downloadFree')}
              </Link>
            )}
            <button onClick={handleDownload} className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white transition-all hover:scale-105 hover:shadow-[0_0_24px_rgba(247,37,133,0.5)]" style={{ background: 'linear-gradient(135deg, #FF6B35, #F72585)' }}>
              <Download className="w-4 h-4" />
              {t('downloadWatermarked')}
            </button>
            <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
        <div className="relative">
          <img src={displaySrc} alt={t('aiResult')} className="max-h-[78vh] w-auto mx-auto object-contain rounded-2xl shadow-2xl" />
          {/* Faint processing indicator while watermark renders */}
          {!watermarked && !isPaid && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-6 h-6 border-2 border-white/30 border-t-white/80 rounded-full animate-spin" />
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function HistoryPage() {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalUrl, setModalUrl] = useState<string | null>(null);
  const router = useRouter();
  const t = useTranslations('history');
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.email) { router.push('/login'); return; }

      const [genResult, userResult] = await Promise.all([
        supabase.from('generations').select('id, user_email, result_image_url, created_at').eq('user_email', session.user.email).order('created_at', { ascending: false }),
        supabase.from('users').select('email, plan').eq('email', session.user.email).maybeSingle(),
      ]);

      setGenerations(genResult.data ?? []);
      if (userResult.data) setUserData(userResult.data);
      setLoading(false);
    };
    fetchData();
  }, [router, supabase]);

  const paid = userData ? isPaidPlan(userData.plan) : false;

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-[var(--accent-orange)] border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <>
      <Navbar />
      <AnimatePresence>
        {modalUrl && <ImageModal url={modalUrl} isPaid={paid} onClose={() => setModalUrl(null)} />}
      </AnimatePresence>

      <main className="min-h-screen pt-24 pb-16">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="mb-8 flex items-end justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-1">{t('title')} <span className="gradient-text">{t('titleHighlight')}</span></h1>
              <p className="text-[var(--text-secondary)] text-sm">{generations.length > 0 ? t('results', { count: generations.length }) : ''}</p>
            </div>
            {!paid && generations.length > 0 && (
              <Link href="/pricing" className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-[var(--accent-orange)]/40 bg-[var(--accent-orange)]/5 text-sm hover:bg-[var(--accent-orange)]/10 transition-colors">
                <Lock className="w-4 h-4 text-[var(--accent-orange)]" />
                <span><span className="text-[var(--accent-orange)] font-medium">{t('upgradeBanner')}</span><span className="text-[var(--text-secondary)]"> {t('removeWatermarks')}</span></span>
              </Link>
            )}
          </div>

          {generations.length === 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-20 h-20 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center mb-6">
                <Car className="w-10 h-10 text-[var(--text-secondary)] opacity-30" />
              </div>
              <h2 className="text-xl font-semibold mb-2">{t('emptyTitle')}</h2>
              <p className="text-[var(--text-secondary)] mb-8 max-w-sm">{t('emptyDesc')}</p>
              <button onClick={() => router.push('/app')} className="btn-primary flex items-center gap-2">
                {t('startBtn')} <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {generations.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {generations.map((gen, index) => (
                <motion.div key={gen.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3, delay: index * 0.04 }} className="group cursor-pointer" onClick={() => gen.result_image_url && setModalUrl(gen.result_image_url)}>
                  <div className="relative aspect-square rounded-2xl overflow-hidden bg-[var(--bg-card)] border border-[var(--border-color)]">
                    {gen.result_image_url ? (
                      <>
                        <img src={gen.result_image_url} alt={t('aiResult')} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300" />
                        {!paid && (
                          <div className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Lock className="w-3 h-3 text-[var(--accent-orange)]" />
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center opacity-20"><Car className="w-8 h-8" /></div>
                    )}
                  </div>
                  <p className="mt-1.5 text-[11px] text-[var(--text-secondary)] text-center opacity-60 truncate px-1">{formatDate(gen.created_at)}</p>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
