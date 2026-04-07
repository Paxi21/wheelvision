'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase';
import { Mail, Lock, Eye, EyeOff, ArrowRight, User } from 'lucide-react';
import { Toast, useToast } from '@/components/Toast';
import { useAuth } from '@/contexts/AuthContext';
import { Link, useRouter } from '@/i18n/navigation';
import { useTranslations, useLocale } from 'next-intl';

function getRegisterErrorMessage(err: unknown, locale: string): string {
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  const isTr = locale === 'tr';
  if (msg.includes('already registered') || msg.includes('email_exists') || msg.includes('already been registered') || msg.includes('duplicate key') || msg.includes('unique constraint') || msg.includes('23505')) {
    return isTr ? 'Bu email zaten kayıtlı. Giriş yapmayı deneyin.' : 'This email is already registered. Try signing in.';
  }
  if (msg.includes('password should be at least') || msg.includes('weak_password')) {
    return isTr ? 'Şifre en az 6 karakter olmalı.' : 'Password must be at least 6 characters.';
  }
  if (msg.includes('invalid format') || msg.includes('invalid email')) {
    return isTr ? 'Geçerli bir email adresi girin.' : 'Please enter a valid email address.';
  }
  return isTr ? 'Kayıt sırasında bir hata oluştu. Lütfen tekrar deneyin.' : 'An error occurred. Please try again.';
}

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast, showToast, closeToast } = useToast();
  const router = useRouter();
  const { session, loading: authLoading } = useAuth();
  const t = useTranslations('register');
  const locale = useLocale();

  useEffect(() => {
    if (session && !authLoading) router.replace('/app');
  }, [session, authLoading, router]);

  const handleRegister = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (password.length < 6) {
      showToast(locale === 'tr' ? 'Şifre en az 6 karakter olmalı.' : 'Password must be at least 6 characters.', 'error');
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
        options: { data: { full_name: fullName.trim() } },
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error('User creation failed.');
      const { error: dbError } = await supabase.from('users').upsert({
        id: authData.user.id,
        email: email.toLowerCase().trim(),
        full_name: fullName.trim(),
        credits: 2,
      }, { onConflict: 'id' });
      if (dbError) throw dbError;
      setSuccess(true);
      showToast(locale === 'tr' ? 'Hesabınız oluşturuldu!' : 'Account created!', 'success');
    } catch (err) {
      showToast(getRegisterErrorMessage(err, locale), 'error');
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

          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-2">{t('successTitle')}</h2>
              <p className="text-[var(--text-secondary)]">{t('successDesc')}</p>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-secondary)]">{t('fullName')}</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
                  <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="input-field pl-12" placeholder={t('fullNamePlaceholder')} required />
                </div>
              </div>
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
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="input-field pl-12 pr-12" placeholder="••••••••" minLength={6} required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-white">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>{t('submit')} <ArrowRight className="w-5 h-5" /></>}
              </button>
            </form>
          )}

          <p className="mt-8 text-center text-sm text-[var(--text-secondary)]">
            {t('hasAccount')}{' '}
            <Link href="/login" className="text-[var(--accent-orange)] hover:underline font-medium">{t('loginLink')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
