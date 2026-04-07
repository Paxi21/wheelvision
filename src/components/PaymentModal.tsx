'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Loader2 } from 'lucide-react';

interface PaymentModalProps {
  packageType: 'starter' | 'standard' | 'pro';
  userEmail: string;
  onClose: () => void;
}

export default function PaymentModal({ packageType, userEmail, onClose }: PaymentModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const formContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initPayment = async () => {
      try {
        const res = await fetch('/api/payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ packageType, userEmail }),
        });
        let data: { checkoutFormContent?: string; token?: string; error?: string };
        try {
          data = await res.json();
        } catch {
          setError(`Sunucu hatası (${res.status})`);
          setLoading(false);
          return;
        }

        if (!res.ok || data.error) {
          setError(data.error ?? `Ödeme başlatılamadı (${res.status})`);
          setLoading(false);
          return;
        }

        if (formContainerRef.current && data.checkoutFormContent) {
          // Inject iyzico's checkout form HTML
          formContainerRef.current.innerHTML = data.checkoutFormContent;
          // Execute scripts inside the injected HTML
          formContainerRef.current.querySelectorAll('script').forEach((oldScript) => {
            const newScript = document.createElement('script');
            Array.from(oldScript.attributes).forEach((attr) =>
              newScript.setAttribute(attr.name, attr.value)
            );
            newScript.textContent = oldScript.textContent;
            oldScript.parentNode?.replaceChild(newScript, oldScript);
          });
        }
        setLoading(false);
      } catch {
        setError('Connection error. Please try again.');
        setLoading(false);
      }
    };

    initPayment();
  }, [packageType, userEmail]);

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
          {loading && (
            <div className="flex flex-col items-center gap-3 text-[var(--text-secondary)]">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-orange)]" />
              <span className="text-sm">Ödeme formu yükleniyor...</span>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <X className="w-6 h-6 text-red-400" />
              </div>
              <p className="text-red-400 text-sm">{error}</p>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-[var(--border-color)] text-sm hover:bg-white/5 transition-colors"
              >
                Kapat
              </button>
            </div>
          )}

          {/* iyzico injects checkout form here */}
          <div
            ref={formContainerRef}
            className={loading || error ? 'hidden' : 'w-full'}
          />
        </div>
      </div>
    </div>
  );
}
