'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

interface PaymentModalProps {
  packageType: 'starter' | 'standard' | 'pro';
  userEmail: string;
  onClose: () => void;
}

export default function PaymentModal({ packageType, userEmail, onClose }: PaymentModalProps) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const formContainerRef = useRef<HTMLDivElement>(null);

  const loadForm = async () => {
    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageType, userEmail }),
      });

      const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));

      if (!res.ok || data.error) {
        setErrorMsg(data.error ?? `Sunucu hatası (${res.status})`);
        setStatus('error');
        return;
      }

      if (!data.checkoutFormContent) {
        setErrorMsg('Ödeme formu alınamadı.');
        setStatus('error');
        return;
      }

      // Inject iyzico's checkout HTML + run its scripts
      if (formContainerRef.current) {
        formContainerRef.current.innerHTML = data.checkoutFormContent;
        formContainerRef.current.querySelectorAll('script').forEach((old) => {
          const fresh = document.createElement('script');
          Array.from(old.attributes).forEach((a) => fresh.setAttribute(a.name, a.value));
          fresh.textContent = old.textContent;
          old.parentNode?.replaceChild(fresh, old);
        });
      }
      setStatus('ready');
    } catch {
      setErrorMsg('Bağlantı hatası. Lütfen tekrar deneyin.');
      setStatus('error');
    }
  };

  useEffect(() => { loadForm(); }, [packageType, userEmail]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-lg bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[var(--accent-orange)] animate-pulse" />
            <span className="font-semibold text-sm">Güvenli Ödeme</span>
            <span className="text-xs text-[var(--text-secondary)] ml-1">— iyzico</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 min-h-[400px] flex items-center justify-center">

          {status === 'loading' && (
            <div className="flex flex-col items-center gap-3 text-[var(--text-secondary)]">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-orange)]" />
              <span className="text-sm">Ödeme formu yükleniyor...</span>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-400" />
              </div>
              <p className="text-red-400 text-sm max-w-xs">{errorMsg}</p>
              <div className="flex gap-3">
                <button
                  onClick={loadForm}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--accent-orange)]/10 border border-[var(--accent-orange)]/30 text-[var(--accent-orange)] text-sm hover:bg-[var(--accent-orange)]/20 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Tekrar Dene
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-[var(--border-color)] text-sm hover:bg-white/5 transition-colors"
                >
                  Kapat
                </button>
              </div>
            </div>
          )}

          {/* iyzico injects its checkout form HTML here */}
          <div
            ref={formContainerRef}
            className={status === 'ready' ? 'w-full' : 'hidden'}
          />
        </div>
      </div>
    </div>
  );
}
