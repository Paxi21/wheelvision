'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { Toast, useToast } from '@/components/Toast';
import { useAuth } from '@/contexts/AuthContext';

function getLoginErrorMessage(err: unknown): string {
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  if (msg.includes('invalid login credentials') || msg.includes('invalid_credentials') || msg.includes('invalid credentials')) {
    return 'Email veya şifre hatalı.';
  }
  if (msg.includes('email not confirmed')) {
    return 'Email adresinizi doğrulamanız gerekiyor.';
  }
  if (msg.includes('too many requests') || msg.includes('rate limit')) {
    return 'Çok fazla giriş denemesi. Lütfen birkaç dakika bekleyin.';
  }
  return 'Giriş sırasında bir hata oluştu. Lütfen tekrar deneyin.';
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast, showToast, closeToast } = useToast();
  const router = useRouter();
  const { session } = useAuth();

  // Already logged in → go to app
  useEffect(() => {
    if (session) {
      console.log('[Login] Session found, redirecting to /app');
      router.replace('/app');
    }
  }, [session, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    console.log('[Login] Attempting login for:', email);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      console.log('[Login] Success, redirecting...');
      router.push('/app');
    } catch (err) {
      console.error('[Login] Error:', err);
      showToast(getLoginErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-[var(--accent-orange)] rounded-full blur-[150px] opacity-10" />
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-[var(--accent-purple)] rounded-full blur-[150px] opacity-10" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[var(--accent-orange)] via-[var(--accent-pink)] to-[var(--accent-purple)] flex items-center justify-center">
            <span className="text-white font-bold text-xl">W</span>
          </div>
          <span className="text-2xl font-bold">
            Wheel<span className="gradient-text">Vision</span>
          </span>
        </Link>

        <div className="gradient-border p-8">
          <h1 className="text-2xl font-bold text-center mb-2">Hoş Geldiniz</h1>
          <p className="text-[var(--text-secondary)] text-center mb-8">Hesabınıza giriş yapın</p>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--text-secondary)]">E-posta</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-12"
                  placeholder="ornek@email.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--text-secondary)]">Şifre</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-12 pr-12"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Giriş Yap <ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-[var(--text-secondary)]">
            Hesabınız yok mu?{' '}
            <Link href="/register" className="text-[var(--accent-orange)] hover:underline font-medium">
              Kayıt Ol
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
