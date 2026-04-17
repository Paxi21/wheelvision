'use client';

import Navbar from '@/components/Navbar';
import { motion } from 'motion/react';
import { Check, X, Sparkles, Zap, Crown, Building2, Gift } from 'lucide-react';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { AnimatedBorder } from '@/components/ui/animated-border';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export default function PricingPage() {
  const t = useTranslations('pricing');

  const plans = [
    {
      id: 'free',
      name: t('free'),
      price: t('freePrice'),
      period: '',
      icon: Gift,
      credits: 1,
      description: t('planFreeDesc'),
      color: 'from-[#6B7280] to-[#4B5563]',
      popular: false,
      isFree: true,
      buyLabel: t('freeBuy'),
      features: [
        { text: t('featTrialCredit'), included: true },
        { text: t('featOneTimeBonus'), included: true },
        { text: t('featWatermark'), included: true, isLimit: true },
        { text: t('featWhatsApp'), included: false },
        { text: t('featWeeklyReport'), included: false },
      ],
    },
    {
      id: 'starter',
      name: t('starter'),
      price: t('starterPrice'),
      period: t('month'),
      icon: Zap,
      credits: 25,
      description: t('planStarterDesc'),
      color: 'from-[#FF6B35] to-[#F72585]',
      popular: false,
      isFree: false,
      buyLabel: t('buy'),
      features: [
        { text: t('featImagesPerMonth', { count: 25 }), included: true },
        { text: t('featNoWatermark'), included: true },
        { text: t('featBasicSupport'), included: true },
        { text: t('featWhatsApp'), included: true },
        { text: t('featWeeklyReport'), included: false },
      ],
    },
    {
      id: 'professional',
      name: t('professional'),
      price: t('professionalPrice'),
      period: t('month'),
      icon: Crown,
      credits: 75,
      description: t('planProfessionalDesc'),
      color: 'from-[#F72585] to-[#7209B7]',
      popular: true,
      isFree: false,
      buyLabel: t('buy'),
      features: [
        { text: t('featImagesPerMonth', { count: 75 }), included: true },
        { text: t('featNoWatermark'), included: true },
        { text: t('featPrioritySupport'), included: true },
        { text: t('featWhatsApp'), included: true },
        { text: t('featWeeklyReport'), included: true },
      ],
    },
    {
      id: 'enterprise',
      name: t('enterprise'),
      price: t('enterprisePrice'),
      period: t('month'),
      icon: Building2,
      credits: 200,
      description: t('planEnterpriseDesc'),
      color: 'from-[#7209B7] to-[#3A0CA3]',
      popular: false,
      isFree: false,
      buyLabel: t('buy'),
      features: [
        { text: t('featImagesPerMonth', { count: 200 }), included: true },
        { text: t('featNoWatermark'), included: true },
        { text: t('feat247Support'), included: true },
        { text: t('featWhatsApp'), included: true },
        { text: t('featWeeklyReport'), included: true },
      ],
    },
  ];

  return (
    <>
      <Navbar />

      <main className="min-h-screen pt-24 pb-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--accent-orange)] rounded-full blur-[150px] opacity-10" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[var(--accent-purple)] rounded-full blur-[150px] opacity-10" />
        </div>

        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 relative z-10">

          {/* Header */}
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
              <span>🚀</span>
              <span className="text-[var(--accent-orange)] font-medium">{t('upgradeBanner')}</span>
            </motion.div>
          </div>

          {/* Plans Grid — free + 3 paid (4 cols on large, 2 on md, 1 on mobile) */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {plans.map((plan, index) => {
              const Icon = plan.icon;
              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="relative"
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-0 right-0 flex justify-center z-20">
                      <span className="px-4 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-[var(--accent-pink)] to-[var(--accent-purple)] text-white shadow-lg">
                        {t('popular')}
                      </span>
                    </div>
                  )}

                  {plan.popular ? (
                    <AnimatedBorder containerClassName="h-full" duration={4}>
                      <PlanCard plan={plan} Icon={Icon} />
                    </AnimatedBorder>
                  ) : (
                    <div className={`h-full rounded-2xl border bg-[var(--bg-card)] overflow-hidden ${plan.isFree ? 'border-[var(--border-color)] opacity-90' : 'border-[var(--border-color)]'}`}>
                      <PlanCard plan={plan} Icon={Icon} />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* FAQ */}
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
  id: string;
  name: string;
  price: string;
  period: string;
  icon: React.ElementType;
  credits: number;
  description: string;
  color: string;
  popular: boolean;
  isFree: boolean;
  buyLabel: string;
  features: { text: string; included: boolean; isLimit?: boolean }[];
};

function PlanCard({ plan, Icon }: { plan: PlanType; Icon: React.ElementType }) {
  return (
    <div className="flex flex-col h-full p-6">

      {/* Plan header */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${plan.color} flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-lg">{plan.name}</h3>
          <p className="text-xs text-[var(--text-secondary)]">{plan.description}</p>
        </div>
      </div>

      {/* Price */}
      <div className="mb-6">
        <div className="flex items-end gap-0.5">
          <span className="text-4xl font-bold">{plan.price}</span>
          {plan.period && (
            <span className="text-[var(--text-secondary)] text-sm mb-1">{plan.period}</span>
          )}
        </div>
        {plan.isFree && (
          <p className="text-xs text-[var(--text-secondary)] mt-1 leading-snug">
            🎁 Kayıt olunca otomatik tanımlanır
          </p>
        )}
      </div>

      {/* Features */}
      <ul className="space-y-3 flex-1 mb-8">
        {plan.features.map((feature, i) => (
          <li key={i} className="flex items-center gap-3">
            {feature.included ? (
              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                feature.isLimit
                  ? 'bg-yellow-500/20 border border-yellow-500/40'
                  : `bg-gradient-to-r ${plan.color}`
              }`}>
                {feature.isLimit
                  ? <span className="text-[9px] text-yellow-400 font-bold">!</span>
                  : <Check className="w-3 h-3 text-white" />
                }
              </div>
            ) : (
              <div className="w-5 h-5 rounded-full bg-[var(--bg-dark)] border border-[var(--border-color)] flex items-center justify-center flex-shrink-0">
                <X className="w-3 h-3 text-[var(--text-secondary)]" />
              </div>
            )}
            <span className={`text-sm ${
              feature.isLimit
                ? 'text-yellow-400/80'
                : feature.included ? 'text-white' : 'text-[var(--text-secondary)]'
            }`}>
              {feature.text}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      {plan.popular ? (
        <Link href="/register" className="block w-full">
          <ShimmerButton className="w-full justify-center py-3">{plan.buyLabel}</ShimmerButton>
        </Link>
      ) : (
        <Link
          href="/register"
          className={`block w-full text-center py-3 rounded-full border text-sm font-semibold transition-colors ${
            plan.isFree
              ? 'border-[var(--border-color)] text-[var(--text-secondary)] hover:border-white/30 hover:text-white'
              : 'border-[var(--border-color)] hover:border-[var(--accent-orange)] hover:text-[var(--accent-orange)]'
          }`}
        >
          {plan.buyLabel}
        </Link>
      )}
    </div>
  );
}
