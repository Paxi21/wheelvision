'use client';

import Navbar from '@/components/Navbar';
import { motion } from 'motion/react';
import { Check, Sparkles, Building2 } from 'lucide-react';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { AnimatedBorder } from '@/components/ui/animated-border';
import { useTranslations } from 'next-intl';

export default function PricingPage() {
  const t = useTranslations('pricing');

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
    <>
      <Navbar />

      <main className="min-h-screen pt-24 pb-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--accent-orange)] rounded-full blur-[150px] opacity-10" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[var(--accent-purple)] rounded-full blur-[150px] opacity-10" />
        </div>

        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 relative z-10">

          {/* Header */}
          <div className="text-center mb-14">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] text-sm mb-6">
                <Sparkles className="w-4 h-4 text-[var(--accent-orange)]" />
                {t('subtitle')}
              </span>
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="text-4xl md:text-5xl font-bold mb-4">
              {t('headTitle')} <span className="gradient-text">{t('headHighlight')}</span>
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="text-[var(--text-secondary)] text-lg max-w-xl mx-auto">
              {t('headDesc')}
            </motion.p>
          </div>

          {/* Single Dealer Plan Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="max-w-lg mx-auto"
          >
            <AnimatedBorder containerClassName="w-full" duration={4}>
              <div className="flex flex-col p-8 md:p-10">

                {/* Plan header */}
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

                  {/* Discount badge */}
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
                  <div className="flex items-baseline gap-3 mb-1">
                    <span className="text-lg line-through" style={{ color: 'rgba(160,160,176,0.6)' }}>
                      {t('dealerNormalPrice')}
                    </span>
                  </div>
                  <div className="flex items-end gap-1">
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

                {/* CTA */}
                <a href="mailto:info@wheelvision.io?subject=Dealer%20Pro%20Paket%20Talebi" className="block w-full mb-3">
                  <ShimmerButton className="w-full justify-center py-4 text-base font-bold">
                    {t('dealerCta')}
                  </ShimmerButton>
                </a>

                <a
                  href="https://wa.me/905000000000?text=Merhaba%2C%20Dealer%20Pro%20paketi%20hakk%C4%B1nda%20bilgi%20almak%20istiyorum."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center py-3 rounded-full text-sm font-semibold transition-colors border border-[var(--border-color)] text-[var(--text-secondary)] hover:border-white/30 hover:text-white"
                >
                  WhatsApp ile İletişim
                </a>

                {/* Fine print */}
                <p className="text-xs text-[var(--text-secondary)]/60 text-center mt-5 leading-relaxed">
                  {t('dealerNote')}
                </p>
              </div>
            </AnimatedBorder>
          </motion.div>

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
