'use client';

import { ArrowLeft, Search } from 'lucide-react';
import { Link } from '@/i18n/navigation';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full blur-[180px] opacity-15"
             style={{ background: 'radial-gradient(circle, #ec4899, transparent)' }} />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 rounded-full blur-[180px] opacity-15"
             style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)' }} />
      </div>

      <div className="text-center relative z-10">
        <div className="text-8xl font-bold mb-4"
             style={{ background: 'linear-gradient(135deg, #ec4899, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          404
        </div>
        <div className="w-16 h-16 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center mx-auto mb-6">
          <Search className="w-8 h-8 text-[var(--text-secondary)]" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Sayfa Bulunamadı</h1>
        <p className="text-[var(--text-secondary)] mb-8 max-w-sm mx-auto">
          Aradığınız sayfa mevcut değil veya taşınmış olabilir.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold transition-all hover:scale-105"
          style={{ background: 'linear-gradient(135deg, #FF6B35, #F72585)' }}
        >
          <ArrowLeft className="w-4 h-4" />
          Ana Sayfaya Dön
        </Link>
      </div>
    </div>
  );
}
