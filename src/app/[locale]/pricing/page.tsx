'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { motion, AnimatePresence } from 'motion/react';
import { Check, X, Sparkles, Zap, Crown, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { AnimatedBorder } from '@/components/ui/animated-border';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase';
import PaymentModal from '@/components/PaymentModal';

type PaidPackage = 'starter' | 'standard' | 'pro';

export default function PricingPage() {
  const t = useTranslations('pricing');
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const supabase = useMemo(() => createClient(), []);

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [payingPackage, setPayingPackage] = useState<PaidPackage | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Get logged-in user email
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) setUserEmail(session.user.email);
    });
  }, [supabase]);

  // Handle callback status from iyzico redirect — show once then clean URL
  useEffect(() => {
    const status = searchParams.get('status');
    const credits = searchParams.get('credits');
    if (!status) return;

    if (status === 'success') {
      setToast({ type: 'success', message: `Ödeme başarılı!${credits ? ` ${credits} kredi hesabınıza eklendi.` : ' Krediniz hesabınıza eklendi.'}` });
    } else if (status === 'failed') {
      setToast({ type: 'error', message: 'Ödeme başarısız. Lütfen tekrar deneyin.' });
    }

    // Remove query params so refreshing doesn't re-show the toast
    router.replace(pathname, { scroll: false });

    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBuy = (packageType: PaidPackage) => {
    if (!userEmail) {
      window.location.href = '/register';
      return;
    }
    setPayingPackage(packageType);
  };

  const plans = [
    {
      id: 'free',
      name: t('free'),
      price: 0,
      period: '',
      icon: Sparkles,
      credits: 2,
      description: t('planFreeDesc'),
      color: 'from-[#A0A0B0] to-[#6A6A7A]',
      popular: false,
      watermarkBadge: false,
      features: [
        { text: t('featCredits', { count: 2 }), included: true },
        { text: t('featWatermark'), included: true, warn: true },
        { text: t('featNoWatermark'), included: false },
        { text: t('featPriority'), included: false },
        { text: t('featHistory'), included: true },
      ],
      href: '/register',
      paidId: null,
    },
    {
      id: 'starter',
      name: t('starter'),
      price: '₺49.99',
      period: t('oneTime'),
      icon: Zap,
      credits: 5,
      description: t('planStarterDesc'),
      color: 'from-[#FF6B35] to-[#F72585]',
      popular: false,
      watermarkBadge: true,
      features: [
        { text: t('featCredits', { count: 5 }), included: true },
        { text: t('featNoWatermark'), included: true },
        { text: t('featPriority'), included: false },
        { text: t('featHistory'), included: true },
      ],
      href: '/register?plan=starter',
      paidId: 'starter' as PaidPackage,
    },
    {
      id: 'standard',
      name: t('standard'),
      price: '₺99.99',
      period: t('oneTime'),
      icon: Crown,
      credits: 15,
      description: t('planStandardDesc'),
      color: 'from-[#F72585] to-[#7209B7]',
      popular: true,
      watermarkBadge: true,
      features: [
        { text: t('featCredits', { count: 15 }), included: true },
        { text: t('featNoWatermark'), included: true },
        { text: t('featPriority'), included: true },
        { text: t('featHistory'), included: true },
      ],
      href: '/register?plan=standard',
      paidId: 'standard' as PaidPackage,
    },
    {
      id: 'pro',
      name: t('pro'),
      price: '₺199.99',
      period: t('oneTime'),
      icon: Lock,
      credits: 40,
      description: t('planProDesc'),
      color: 'from-[#7209B7] to-[#3A0CA3]',
      popular: false,
      watermarkBadge: true,
      features: [
        { text: t('featCredits', { count: 40 }), included: true },
        { text: t('featNoWatermark'), included: true },
        { text: t('featPriority'), included: true },
        { text: t('featHistory'), included: true },
      ],
      href: '/register?plan=pro',
      paidId: 'pro' as PaidPackage,
    },
  ];

  return (
    <>
      <Navbar />

      {/* Toast notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl text-sm font-medium border ${
              toast.type === 'success'
                ? 'bg-green-500/10 border-green-500/30 text-green-400'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}
          >
            {toast.type === 'success'
              ? <CheckCircle className="w-4 h-4 flex-shrink-0" />
              : <AlertCircle className="w-4 h-4 flex-shrink-0" />
            }
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment Modal */}
      {payingPackage && userEmail && (
        <PaymentModal
          packageType={payingPackage}
          userEmail={userEmail}
          onClose={() => setPayingPackage(null)}
        />
      )}

      <main className="min-h-screen pt-24 pb-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--accent-orange)] rounded-full blur-[150px] opacity-10" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[var(--accent-purple)] rounded-full blur-[150px] opacity-10" />
        </div>

        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 relative z-10">
          <div className="text-center mb-16">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] text-sm mb-6">
                <Sparkles className="w-4 h-4 text-[var(--accent-orange)]" />
                {t('subtitle')}
              </span>
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="text-4xl md:text-5xl font-bold mb-4">
              {t('headTitle')} <span className="gradient-text">{t('headHighlight')}</span>
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="text-[var(--text-secondary)] text-lg max-w-xl mx-auto mb-4">
              {t('headDesc')}
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[var(--accent-orange)]/15 to-[var(--accent-purple)]/15 border border-[var(--accent-orange)]/30 text-sm">
              <span>🔓</span>
              <span className="text-[var(--accent-orange)] font-medium">{t('upgradeBanner')}</span>
            </motion.div>
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
            {plans.map((plan, index) => {
              const Icon = plan.icon;
              const onBuyClick = plan.paidId ? () => handleBuy(plan.paidId!) : undefined;
              return (
                <motion.div key={plan.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.1 }} className="relative">
                  {plan.popular && (
                    <div className="absolute -top-4 left-0 right-0 flex justify-center z-20">
                      <span className="px-4 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-[var(--accent-pink)] to-[var(--accent-purple)] text-white shadow-lg">
                        {t('popular')}
                      </span>
                    </div>
                  )}
                  {plan.popular ? (
                    <AnimatedBorder containerClassName="h-full" duration={4}>
                      <PlanCard plan={plan} Icon={Icon} creditsLabel={t('credits')} watermarkBadgeLabel={t('watermarkBadge')} buyLabel={t('buy')} onBuy={onBuyClick} isLoggedIn={!!userEmail} />
                    </AnimatedBorder>
                  ) : (
                    <div className="h-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] overflow-hidden">
                      <PlanCard plan={plan} Icon={Icon} creditsLabel={t('credits')} watermarkBadgeLabel={t('watermarkBadge')} buyLabel={t('buy')} onBuy={onBuyClick} isLoggedIn={!!userEmail} />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.6 }} className="mt-12 p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] max-w-2xl mx-auto text-center">
            <p className="text-sm text-[var(--text-secondary)]">
              <span className="text-[var(--accent-orange)] font-medium">{t('freePlanLabel')}</span>{' '}
              {t('freePlanNote')}
            </p>
          </motion.div>

          <div className="mt-20 text-center">
            <h2 className="text-2xl font-bold mb-8">{t('faqTitle')}</h2>
            <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto text-left">
              {([1, 2, 3, 4] as const).map((i) => (
                <div key={i} className="card">
                  <h3 className="font-semibold mb-2">{t(`faqQ${i}`)}</h3>
                  <p className="text-sm text-[var(--text-secondary)]">{t(`faqA${i}`)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

type PlanType = {
  id: string; name: string; price: number | string; period: string; icon: React.ElementType;
  credits: number; description: string; color: string; popular: boolean;
  watermarkBadge: boolean; features: { text: string; included: boolean; warn?: boolean }[];
  href: string; paidId: PaidPackage | null;
};

function PlanCard({
  plan, Icon, creditsLabel, watermarkBadgeLabel, buyLabel, onBuy, isLoggedIn,
}: {
  plan: PlanType;
  Icon: React.ElementType;
  creditsLabel: string;
  watermarkBadgeLabel: string;
  buyLabel: string;
  onBuy?: () => void;
  isLoggedIn: boolean;
}) {
  return (
    <div className="flex flex-col h-full p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${plan.color} flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-lg">{plan.name}</h3>
          <p className="text-xs text-[var(--text-secondary)]">{plan.description}</p>
        </div>
      </div>

      <div className="mb-5">
        <div className="flex items-end gap-1">
          <span className="text-4xl font-bold">{plan.price === 0 ? plan.name : plan.price}</span>
        </div>
        {plan.period && <p className="text-xs text-[var(--text-secondary)] mt-0.5">{plan.period}</p>}
        <p className="text-sm text-[var(--accent-orange)] font-medium mt-1">{plan.credits} {creditsLabel}</p>
      </div>

      {plan.watermarkBadge && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 mb-4">
          <span className="text-xs">🔓</span>
          <span className="text-xs text-green-400 font-medium">{watermarkBadgeLabel}</span>
        </div>
      )}

      <ul className="space-y-3 flex-1 mb-8">
        {plan.features.map((feature, i) => (
          <li key={i} className="flex items-center gap-3">
            {feature.included ? (
              <div className={`w-5 h-5 rounded-full bg-gradient-to-r ${plan.color} flex items-center justify-center flex-shrink-0`}>
                <Check className="w-3 h-3 text-white" />
              </div>
            ) : (
              <div className="w-5 h-5 rounded-full bg-[var(--bg-dark)] border border-[var(--border-color)] flex items-center justify-center flex-shrink-0">
                <X className="w-3 h-3 text-[var(--text-secondary)]" />
              </div>
            )}
            <span className={`text-sm ${feature.included ? (feature.warn ? 'text-[var(--accent-orange)]' : 'text-white') : 'text-[var(--text-secondary)]'}`}>
              {feature.text}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA Button */}
      {plan.paidId ? (
        plan.popular ? (
          <ShimmerButton onClick={onBuy} className="w-full justify-center py-3">{buyLabel}</ShimmerButton>
        ) : (
          <button
            onClick={onBuy}
            className="block w-full text-center py-3 rounded-full border border-[var(--border-color)] text-sm font-semibold hover:border-[var(--accent-orange)] hover:text-[var(--accent-orange)] transition-colors"
          >
            {buyLabel}
          </button>
        )
      ) : (
        <Link href={plan.href} className="block text-center py-3 rounded-full border border-[var(--border-color)] text-sm font-semibold hover:border-[var(--accent-orange)] hover:text-[var(--accent-orange)] transition-colors">
          {buyLabel}
        </Link>
      )}
    </div>
  );
}
