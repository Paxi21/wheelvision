'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { motion, AnimatePresence } from 'motion/react';
import { Check, X, Sparkles, Building2, User, Zap, Gift, Crown, Gem } from 'lucide-react';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { AnimatedBorder } from '@/components/ui/animated-border';
import { useTranslations } from 'next-intl';

const WHATSAPP_URL = 'https://wa.me/905375859524?text=Merhaba%2C%20WheelVision%20Dealer%20Pro%20paketi%20hakk%C4%B1nda%20bilgi%20almak%20istiyorum.';

/* ─── Coming Soon Modal ──────────────────────────────────────────────────── */
function ComingSoonModal({ onClose, t }: { onClose: () => void; t: ReturnType<typeof useTranslations<'pricing'>> }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.25 }}
        className="relative max-w-sm w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-8 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <X className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
        </button>

        <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-[var(--accent-orange)] to-[var(--accent-pink)] flex items-center justify-center mx-auto mb-5 text-3xl">
          🚀
        </div>

        <h3 className="text-xl font-bold mb-3">{t('comingSoonTitle')}</h3>
        <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-5">
          {t('comingSoonDesc')}
        </p>
        <p className="text-xs text-[var(--text-secondary)]/60">{t('comingSoonNote')}</p>
      </motion.div>
    </div>
  );
}

/* ─── B2C Plan Card ──────────────────────────────────────────────────────── */
type B2CPlan = {
  id: string;
  name: string;
  price: string;
  priceNote: string;
  description: string;
  icon: React.ElementType;
  color: string;
  popular: boolean;
  dimmed: boolean;
  cta: string;
  note?: string;
  features: { text: string; included: boolean }[];
};

function B2CPlanCard({ plan, onCtaClick }: { plan: B2CPlan; onCtaClick: () => void }) {
  const Icon = plan.icon;
  const inner = (
    <div className={`flex flex-col h-full p-6 ${plan.dimmed ? 'opacity-80' : ''}`}>
      {/* Header */}
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
      <div className="mb-5">
        <div className="flex items-end gap-1">
          <span className="text-4xl font-bold">{plan.price}</span>
        </div>
        <p className="text-xs text-[var(--text-secondary)] mt-1">{plan.priceNote}</p>
      </div>

      {/* Features */}
      <ul className="space-y-3 flex-1 mb-6">
        {plan.features.map((feat, i) => (
          <li key={i} className="flex items-center gap-3">
            {feat.included ? (
              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-r ${plan.color}`}>
                <Check className="w-3 h-3 text-white" />
              </div>
            ) : (
              <div className="w-5 h-5 rounded-full bg-[var(--bg-dark)] border border-[var(--border-color)] flex items-center justify-center flex-shrink-0">
                <X className="w-3 h-3 text-[var(--text-secondary)]" />
              </div>
            )}
            <span className={`text-sm ${feat.included ? 'text-white' : 'text-[var(--text-secondary)]'}`}>
              {feat.text}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      {plan.popular ? (
        <button onClick={onCtaClick} className="block w-full">
          <ShimmerButton className="w-full justify-center py-3">{plan.cta}</ShimmerButton>
        </button>
      ) : (
        <button
          onClick={onCtaClick}
          className={`block w-full text-center py-3 rounded-full border text-sm font-semibold transition-colors ${
            plan.dimmed
              ? 'border-[var(--border-color)] text-[var(--text-secondary)] hover:border-white/30 hover:text-white'
              : 'border-[var(--border-color)] hover:border-[var(--accent-orange)] hover:text-[var(--accent-orange)]'
          }`}
        >
          {plan.cta}
        </button>
      )}

      {plan.note && (
        <p className="text-[10px] text-[var(--text-secondary)]/50 text-center mt-3 leading-relaxed">{plan.note}</p>
      )}
    </div>
  );

  if (plan.popular) {
    return (
      <div className="relative">
        <div className="absolute -top-4 left-0 right-0 flex justify-center z-20">
          <span className="px-4 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-[var(--accent-pink)] to-[var(--accent-purple)] text-white shadow-lg">
            ⭐ Önerilen
          </span>
        </div>
        <AnimatedBorder containerClassName="h-full" duration={4}>
          {inner}
        </AnimatedBorder>
      </div>
    );
  }

  return (
    <div className="h-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] overflow-hidden">
      {inner}
    </div>
  );
}

/* ─── B2B Dealer Card ────────────────────────────────────────────────────── */
function B2BCard({ t }: { t: ReturnType<typeof useTranslations<'pricing'>> }) {
  const features = [
    t('feat200Images'),
    t('featHDNoWatermark'),
    t('featCustomPage'),
    t('featCatalog'),
    t('featWhatsAppLead'),
    t('featPrioritySupport'),
    t('featSetup'),
  ];

  return (
    <div className="max-w-lg mx-auto">
      <AnimatedBorder containerClassName="w-full" duration={4}>
        <div className="flex flex-col p-8 md:p-10">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-[var(--accent-orange)] to-[var(--accent-pink)] flex items-center justify-center flex-shrink-0">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-xl">{t('dealerPro')}</h2>
                <p className="text-sm text-[var(--text-secondary)]">{t('dealerProDesc')}</p>
              </div>
            </div>
            <span
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold text-white"
              style={{
                background: 'linear-gradient(135deg,#FF6B35,#F72585)',
                boxShadow: '0 0 16px rgba(247,37,133,0.4)',
                animation: 'pulse 2s ease-in-out infinite',
              }}
            >
              {t('dealerDiscount')}
            </span>
          </div>

          {/* Price */}
          <div className="mb-8">
            <span className="text-lg line-through" style={{ color: 'rgba(160,160,176,0.6)' }}>
              {t('dealerNormalPrice')}
            </span>
            <div className="flex items-end gap-1 mt-1">
              <span className="text-5xl font-black gradient-text">{t('dealerPrice')}</span>
              <span className="text-[var(--text-secondary)] text-base mb-1.5">{t('month')}</span>
            </div>
          </div>

          {/* Features */}
          <ul className="space-y-4 mb-10">
            {features.map((feat, i) => (
              <li key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-r from-[var(--accent-orange)] to-[var(--accent-pink)]">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm text-white">{feat}</span>
              </li>
            ))}
          </ul>

          {/* CTAs */}
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full mb-3"
          >
            <ShimmerButton className="w-full justify-center py-4 text-base font-bold">
              {t('dealerCta')}
            </ShimmerButton>
          </a>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center py-3 rounded-full text-sm font-semibold transition-colors border border-[var(--border-color)] text-[var(--text-secondary)] hover:border-white/30 hover:text-white"
          >
            {t('dealerWhatsApp')}
          </a>

          <p className="text-xs text-[var(--text-secondary)]/60 text-center mt-5 leading-relaxed">
            {t('dealerNote')}
          </p>
        </div>
      </AnimatedBorder>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────────── */
export default function PricingPage() {
  const t = useTranslations('pricing');
  const [tab, setTab] = useState<'b2c' | 'b2b'>('b2c');
  const [showComingSoon, setShowComingSoon] = useState(false);

  const b2cPlans: B2CPlan[] = [
    {
      id: 'free',
      name: t('free'),
      price: t('freePrice'),
      priceNote: t('freeNote'),
      description: t('planFreeDesc'),
      icon: Gift,
      color: 'from-[#6B7280] to-[#4B5563]',
      popular: false,
      dimmed: true,
      cta: t('freeCta'),
      features: [
        { text: t('feat2Credits'), included: true },
        { text: t('featStandardQuality'), included: true },
        { text: t('featWatermark'), included: true },
        { text: t('featHistory'), included: false },
        { text: t('featPriorityProcessing'), included: false },
      ],
    },
    {
      id: 'credit10',
      name: t('credit10'),
      price: t('credit10Price'),
      priceNote: t('oneTimePay'),
      description: t('planCredit10Desc'),
      icon: Zap,
      color: 'from-[#FF6B35] to-[#F72585]',
      popular: false,
      dimmed: false,
      cta: t('buyCta'),
      note: t('creditNote'),
      features: [
        { text: t('feat10Credits'), included: true },
        { text: t('featHDNoWatermark'), included: true },
        { text: t('featHistory'), included: true },
        { text: t('featEmailSupport'), included: true },
        { text: t('featPriorityProcessing'), included: false },
      ],
    },
    {
      id: 'credit30',
      name: t('credit30'),
      price: t('credit30Price'),
      priceNote: t('oneTimePay'),
      description: t('planCredit30Desc'),
      icon: Crown,
      color: 'from-[#F72585] to-[#7209B7]',
      popular: true,
      dimmed: false,
      cta: t('buyCta'),
      note: t('creditNote'),
      features: [
        { text: t('feat30Credits'), included: true },
        { text: t('featHDNoWatermark'), included: true },
        { text: t('featHistory'), included: true },
        { text: t('featEmailSupport'), included: true },
        { text: t('featPriorityProcessing'), included: true },
      ],
    },
    {
      id: 'credit50',
      name: t('credit50'),
      price: t('credit50Price'),
      priceNote: t('oneTimePay'),
      description: t('planCredit50Desc'),
      icon: Gem,
      color: 'from-[#7209B7] to-[#3A0CA3]',
      popular: false,
      dimmed: false,
      cta: t('buyCta'),
      note: t('creditNote'),
      features: [
        { text: t('feat50Credits'), included: true },
        { text: t('featHDNoWatermark'), included: true },
        { text: t('featHistory'), included: true },
        { text: t('featPriorityProcessing'), included: true },
        { text: t('featPrioritySupport'), included: true },
      ],
    },
  ];

  return (
    <>
      <AnimatePresence>
        {showComingSoon && (
          <ComingSoonModal key="coming-soon" onClose={() => setShowComingSoon(false)} t={t} />
        )}
      </AnimatePresence>

      <Navbar />

      <main className="min-h-screen pt-24 pb-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--accent-orange)] rounded-full blur-[150px] opacity-10" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[var(--accent-purple)] rounded-full blur-[150px] opacity-10" />
        </div>

        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 relative z-10">

          {/* Header */}
          <div className="text-center mb-10">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] text-sm mb-6">
                <Sparkles className="w-4 h-4 text-[var(--accent-orange)]" />
                {t('subtitle')}
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl md:text-5xl font-bold mb-4"
            >
              {t('headTitle')} <span className="gradient-text">{t('headHighlight')}</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
              className="text-[var(--text-secondary)] text-lg max-w-xl mx-auto mb-8"
            >
              {t('headDesc')}
            </motion.p>

            {/* Tab Toggle */}
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
              className="inline-flex p-1 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)]"
            >
              <button
                onClick={() => setTab('b2c')}
                className="relative flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                style={tab === 'b2c' ? {
                  background: 'linear-gradient(135deg,#FF6B35,#F72585)',
                  color: '#fff',
                  boxShadow: '0 4px 16px rgba(247,37,133,0.3)',
                } : { color: 'var(--text-secondary)' }}
              >
                <User className="w-4 h-4" />
                {t('tabIndividual')}
              </button>
              <button
                onClick={() => setTab('b2b')}
                className="relative flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                style={tab === 'b2b' ? {
                  background: 'linear-gradient(135deg,#FF6B35,#F72585)',
                  color: '#fff',
                  boxShadow: '0 4px 16px rgba(247,37,133,0.3)',
                } : { color: 'var(--text-secondary)' }}
              >
                <Building2 className="w-4 h-4" />
                {t('tabBusiness')}
              </button>
            </motion.div>
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {tab === 'b2c' ? (
              <motion.div
                key="b2c"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 max-w-6xl mx-auto items-start">
                  {b2cPlans.map((plan, i) => (
                    <motion.div
                      key={plan.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.07 }}
                      className={plan.popular ? 'mt-4' : ''}
                    >
                      <B2CPlanCard plan={plan} onCtaClick={() => setShowComingSoon(true)} />
                    </motion.div>
                  ))}
                </div>

                <p className="text-center text-xs text-[var(--text-secondary)]/60 mt-6">
                  {t('creditStackNote')}
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="b2b"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <B2BCard t={t} />
              </motion.div>
            )}
          </AnimatePresence>

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
