'use client';

import { useEffect, useState, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import { createClient } from '@/lib/supabase';
import { User, Mail, CreditCard, LogOut, Globe, ChevronDown, BarChart2, Settings2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations, useLocale } from 'next-intl';

interface UserData {
  email: string;
  full_name: string;
  credits: number;
  plan: string;
  created_at?: string;
}

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
] as const;

export default function SettingsPage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [vizCount, setVizCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const router = useRouter();

  const t = useTranslations('settings');
  const currentLocale = useLocale();
  const supabase = useMemo(() => createClient(), []);

  const currentLang = LANGUAGES.find((l) => l.code === currentLocale) ?? LANGUAGES[0];

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.email) { router.push('/login'); return; }
      const { data } = await supabase.from('users').select('email, full_name, credits, plan, created_at').eq('email', session.user.email).maybeSingle();
      if (data) setUser(data);
      const { count } = await supabase.from('generations').select('*', { count: 'exact', head: true }).eq('user_email', session.user.email);
      setVizCount(count ?? 0);
      setLoading(false);
    };
    fetchUser();
  }, [router, supabase]);

  const handleLogout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.push('/');
  };

  const switchLocale = (locale: string) => {
    setLangOpen(false);
    if (locale === currentLocale) return;
    const path = window.location.pathname;
    const newPath = path.replace(/^\/(en|tr)/, `/${locale}`);
    window.location.href = newPath.startsWith(`/${locale}`) ? newPath : `/${locale}`;
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-[var(--accent-orange)] border-t-transparent rounded-full animate-spin" /></div>;
  }

  const planLabel: Record<string, string> = {
    free: t('planFree'),
    starter: t('planStarter'),
    standard: t('planStandard'),
    pro: t('planPro'),
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16 px-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">{t('title')} <span className="gradient-text">{t('titleHighlight')}</span></h1>
          <div className="space-y-4">

            {/* Profile */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#F72585] flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <h2 className="font-semibold">{t('profileTitle')}</h2>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-[var(--border-color)]">
                  <span className="text-sm text-[var(--text-secondary)]">{t('nameSurname')}</span>
                  <span className="text-sm font-medium">{user?.full_name ?? '—'}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-[var(--text-secondary)] flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {t('email')}</span>
                  <span className="text-sm font-medium">{user?.email}</span>
                </div>
              </div>
            </motion.div>

            {/* Plan & Credits */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-[#F72585] to-[#7209B7] flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <h2 className="font-semibold">{t('planCreditsTitle')}</h2>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-[var(--border-color)]">
                  <span className="text-sm text-[var(--text-secondary)]">{t('currentPlan')}</span>
                  <span className="text-sm font-semibold text-[var(--accent-orange)]">{planLabel[user?.plan ?? 'free'] ?? t('planFree')}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-[var(--text-secondary)]">{t('remainingCredits')}</span>
                  <span className="text-sm font-bold text-white">{user?.credits ?? 0}</span>
                </div>
              </div>
              {(user?.plan === 'free' || !user?.plan) && (
                <button onClick={() => router.push('/pricing')} className="mt-4 w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02]" style={{ background: 'linear-gradient(135deg, #FF6B35, #F72585)' }}>
                  {t('upgradePlan')}
                </button>
              )}
            </motion.div>

            {/* Language */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-[#7209B7] to-[#3A0CA3] flex items-center justify-center">
                  <Globe className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold">{t('languageTitle')}</h2>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">{t('languageSubtitle')}</p>
                </div>
              </div>
              <div className="relative">
                <button
                  onClick={() => setLangOpen(!langOpen)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-[var(--bg-dark)] border border-[var(--border-color)] hover:border-white/20 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">{currentLang.flag}</span>
                    <span className="text-sm font-medium">{currentLang.label}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-[var(--text-secondary)] transition-transform ${langOpen ? 'rotate-180' : ''}`} />
                </button>

                {langOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 py-1 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-xl z-10">
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => switchLocale(lang.code)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/5 transition-colors ${
                          currentLocale === lang.code ? 'text-[var(--accent-orange)]' : 'text-[var(--text-secondary)]'
                        }`}
                      >
                        <span className="text-base">{lang.flag}</span>
                        <span>{lang.label}</span>
                        {currentLocale === lang.code && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--accent-orange)]" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Stats */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#7209B7] flex items-center justify-center">
                  <BarChart2 className="w-5 h-5 text-white" />
                </div>
                <h2 className="font-semibold">{t('statsTitle')}</h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-[var(--bg-dark)] border border-[var(--border-color)] px-4 py-3 text-center">
                  <p className="text-2xl font-bold gradient-text">{vizCount}</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">{t('totalVisualizations')}</p>
                </div>
                <div className="rounded-xl bg-[var(--bg-dark)] border border-[var(--border-color)] px-4 py-3 text-center">
                  <p className="text-sm font-bold text-white">
                    {user?.created_at
                      ? new Date(user.created_at).toLocaleDateString(currentLocale === 'tr' ? 'tr-TR' : 'en-US', { month: 'short', year: 'numeric' })
                      : '—'}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">{t('memberSince')}</p>
                </div>
              </div>
            </motion.div>

            {/* Account Management */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-[#3A0CA3] to-[#6B7280] flex items-center justify-center">
                  <Settings2 className="w-5 h-5 text-white" />
                </div>
                <h2 className="font-semibold">{t('dangerZone')}</h2>
              </div>
              <button onClick={handleLogout} disabled={loggingOut} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-dark)] hover:bg-white/5 text-sm font-medium transition-all">
                <LogOut className="w-4 h-4" />
                {loggingOut ? t('loggingOut') : t('logout')}
              </button>
            </motion.div>

          </div>
        </div>
      </main>
    </>
  );
}
