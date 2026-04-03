'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { createClient } from '@/lib/supabase';
import { User, Mail, CreditCard, LogOut, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';

interface UserData {
  email: string;
  full_name: string;
  credits: number;
  plan: string;
}

export default function SettingsPage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.email) {
        router.push('/login');
        return;
      }
      const { data } = await supabase
        .from('users')
        .select('email, full_name, credits, plan')
        .eq('email', session.user.email)
        .maybeSingle();
      if (data) setUser(data);
      setLoading(false);
    };
    fetchUser();
  }, [router, supabase]);

  const handleLogout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--accent-orange)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const planLabel: Record<string, string> = {
    free: 'Ücretsiz',
    starter: 'Başlangıç',
    standard: 'Standart',
    pro: 'Pro',
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16 px-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">
            Hesap <span className="gradient-text">Ayarları</span>
          </h1>

          <div className="space-y-4">
            {/* Profile card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="card"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#F72585] flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <h2 className="font-semibold">Profil Bilgileri</h2>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-[var(--border-color)]">
                  <span className="text-sm text-[var(--text-secondary)]">Ad Soyad</span>
                  <span className="text-sm font-medium">{user?.full_name ?? '—'}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-[var(--text-secondary)] flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" /> E-posta
                  </span>
                  <span className="text-sm font-medium">{user?.email}</span>
                </div>
              </div>
            </motion.div>

            {/* Plan & credits */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="card"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-[#F72585] to-[#7209B7] flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <h2 className="font-semibold">Plan ve Krediler</h2>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-[var(--border-color)]">
                  <span className="text-sm text-[var(--text-secondary)]">Mevcut Plan</span>
                  <span className="text-sm font-semibold text-[var(--accent-orange)]">
                    {planLabel[user?.plan ?? 'free'] ?? 'Ücretsiz'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-[var(--text-secondary)]">Kalan Kredi</span>
                  <span className="text-sm font-bold text-white">{user?.credits ?? 0}</span>
                </div>
              </div>
              {(user?.plan === 'free' || !user?.plan) && (
                <button
                  onClick={() => router.push('/pricing')}
                  className="mt-4 w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02]"
                  style={{ background: 'linear-gradient(135deg, #FF6B35, #F72585)' }}
                >
                  Planı Yükselt
                </button>
              )}
            </motion.div>

            {/* Danger zone */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card border-red-500/20"
            >
              <h2 className="font-semibold mb-4 text-red-400 flex items-center gap-2">
                <Trash2 className="w-4 h-4" /> Tehlikeli Alan
              </h2>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-medium transition-all"
              >
                <LogOut className="w-4 h-4" />
                {loggingOut ? 'Çıkış yapılıyor...' : 'Çıkış Yap'}
              </button>
            </motion.div>
          </div>
        </div>
      </main>
    </>
  );
}
