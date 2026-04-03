'use client';

import { useEffect, useCallback, useState } from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';

type ToastType = 'success' | 'error';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

export function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className={`fixed top-6 right-6 z-[200] flex items-start gap-3 px-4 py-3.5 rounded-2xl shadow-2xl border backdrop-blur-md max-w-sm w-full
        ${type === 'success'
          ? 'bg-green-500/15 border-green-500/30 text-green-400'
          : 'bg-red-500/15 border-red-500/30 text-red-400'
        }`}
      style={{ animation: 'toastIn 0.25s ease' }}
    >
      {type === 'success'
        ? <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
        : <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
      }
      <p className="text-sm flex-1 leading-relaxed text-white/90">{message}</p>
      <button
        onClick={onClose}
        className="shrink-0 opacity-50 hover:opacity-100 transition-opacity mt-0.5"
      >
        <X className="w-4 h-4" />
      </button>
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(-12px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}

export function useToast() {
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const showToast = useCallback((message: string, type: ToastType) => {
    setToast({ message, type });
  }, []);

  const closeToast = useCallback(() => setToast(null), []);

  return { toast, showToast, closeToast };
}
