'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { Toast, useToast } from '@/components/Toast';
import { useAuth } from '@/contexts/AuthContext';
import { Link, useRouter } from '@/i18n/navigation';
import { useTranslations, useLocale } from 'next-intl';

function getLoginErrorMessage(err: unknown, locale: string): string {
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  const isTr = locale === 'tr';
  if (msg.includes('invalid login credentials') || msg.includes('invalid_credentials') || msg.includes('invalid credentials')) {
    return isTr ? 'Email veya şifre hatalı.' : 'Invalid email or password.';
  }
  if (msg.includes('email not confirmed')) {
    return isTr ? 'Email adresinizi doğrulamanız gerekiyor.' : 'Please verify your email address.';
  }
  if (msg.includes('too many requests') || msg.includes('rate limit')) {
    return isTr ? 'Çok fazla giriş denemesi. Lütfen birkaç dakika bekleyin.' : 'Too many attempts. Please wait a few minutes.';
  }
  return isTr ? 'Giriş sırasında bir hata oluştu. Lütfen tekrar deneyin.' : 'An error occurred. Please try again.';
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast, showToast, closeToast } = useToast();
  const router = useRouter();
  const { session } = useAuth();
  const t = useTranslations('login');
  const locale = useLocale();

  useEffect(() => {
    if (session) router.replace('/app');
  }, [session, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.push('/app');
    } catch (err) {
      showToast(getLoginErrorMessage(err, locale), 'error');
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
        <Link href="/" className="flex justify-center mb-8">
          <Image src="/logo.png" alt="WheelVision" width={180} height={45} priority className="h-11 w-auto" />
        </Link>
        <div className="gradient-border p-8">
          <h1 className="text-2xl font-bold text-center mb-2">{t('title')}</h1>
          <p className="text-[var(--text-secondary)] text-center mb-8">{t('subtitle')}</p>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--text-secondary)]">{t('emailLabel')}</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field pl-12" placeholder="ornek@email.com" required />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--text-secondary)]">{t('passwordLabel')}</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="input-field pl-12 pr-12" placeholder="••••••••" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-white">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>{t('submit')} <ArrowRight className="w-5 h-5" /></>}
            </button>
          </form>
          <p className="mt-8 text-center text-sm text-[var(--text-secondary)]">
            {t('noAccount')}{' '}
            <Link href="/register" className="text-[var(--accent-orange)] hover:underline font-medium">{t('signupLink')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
