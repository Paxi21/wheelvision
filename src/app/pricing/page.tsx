'use client';

import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { motion } from 'motion/react';
import { Check, X, Sparkles, Zap, Crown, Lock } from 'lucide-react';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { AnimatedBorder } from '@/components/ui/animated-border';

const plans = [
  {
    id: 'free',
    name: 'Ücretsiz',
    price: 0,
    period: '',
    icon: Sparkles,
    credits: 2,
    description: 'Denemek için mükemmel',
    color: 'from-[#A0A0B0] to-[#6A6A7A]',
    popular: false,
    watermarkBadge: false,
    features: [
      { text: '2 görselleştirme kredisi', included: true },
      { text: 'Filigran eklenir', included: true, warn: true },
      { text: 'Filigransız indirme', included: false },
      { text: 'Öncelikli işleme', included: false },
      { text: 'Geçmiş görüntüleme', included: true },
    ],
    cta: 'Ücretsiz Başla',
    href: '/register',
  },
  {
    id: 'starter',
    name: 'Başlangıç',
    price: 1.99,
    period: 'tek seferlik',
    icon: Zap,
    credits: 5,
    description: 'Hızlıca dene',
    color: 'from-[#FF6B35] to-[#F72585]',
    popular: false,
    watermarkBadge: true,
    features: [
      { text: '5 görselleştirme kredisi', included: true },
      { text: 'Filigransız indirme', included: true },
      { text: 'Öncelikli işleme', included: false },
      { text: 'Geçmiş görüntüleme', included: true },
    ],
    cta: 'Başlangıç Seç',
    href: '/register?plan=starter',
  },
  {
    id: 'standard',
    name: 'Standart',
    price: 4.99,
    period: 'tek seferlik',
    icon: Crown,
    credits: 15,
    description: 'En çok tercih edilen',
    color: 'from-[#F72585] to-[#7209B7]',
    popular: true,
    watermarkBadge: true,
    features: [
      { text: '15 görselleştirme kredisi', included: true },
      { text: 'Filigransız indirme', included: true },
      { text: 'Öncelikli işleme', included: true },
      { text: 'Geçmiş görüntüleme', included: true },
    ],
    cta: 'Standart Seç',
    href: '/register?plan=standard',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 9.99,
    period: 'tek seferlik',
    icon: Lock,
    credits: 40,
    description: 'Maksimum kredi',
    color: 'from-[#7209B7] to-[#3A0CA3]',
    popular: false,
    watermarkBadge: true,
    features: [
      { text: '40 görselleştirme kredisi', included: true },
      { text: 'Filigransız indirme', included: true },
      { text: 'Öncelikli işleme', included: true },
      { text: 'Geçmiş görüntüleme', included: true },
    ],
    cta: 'Pro Seç',
    href: '/register?plan=pro',
  },
];

export default function PricingPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16 px-4 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--accent-orange)] rounded-full blur-[150px] opacity-10" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[var(--accent-purple)] rounded-full blur-[150px] opacity-10" />
        </div>

        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 relative z-10">
          {/* Header */}
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] text-sm mb-6">
                <Sparkles className="w-4 h-4 text-[var(--accent-orange)]" />
                Şeffaf Fiyatlandırma
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl md:text-5xl font-bold mb-4"
            >
              Size Uygun <span className="gradient-text">Planı Seçin</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-[var(--text-secondary)] text-lg max-w-xl mx-auto mb-4"
            >
              Tek seferlik ödeme. Abonelik yok. Gizli ücret yok.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[var(--accent-orange)]/15 to-[var(--accent-purple)]/15 border border-[var(--accent-orange)]/30 text-sm"
            >
              <span>🔓</span>
              <span className="text-[var(--accent-orange)] font-medium">Ücretli plana geç, tüm geçmiş filigranlar anında kalksın!</span>
            </motion.div>
          </div>

          {/* Plans Grid */}
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
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
                        En Popüler
                      </span>
                    </div>
                  )}

                  {plan.popular ? (
                    <AnimatedBorder containerClassName="h-full" duration={4}>
                      <PlanCard plan={plan} Icon={Icon} />
                    </AnimatedBorder>
                  ) : (
                    <div className="h-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] overflow-hidden">
                      <PlanCard plan={plan} Icon={Icon} />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Watermark Notice */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mt-12 p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] max-w-2xl mx-auto text-center"
          >
            <p className="text-sm text-[var(--text-secondary)]">
              <span className="text-[var(--accent-orange)] font-medium">Ücretsiz plan:</span>{' '}
              İndirilen görsellere küçük bir WheelVision filigranı eklenir. Ücretli planlarda filigran bulunmaz.
            </p>
          </motion.div>

          {/* FAQ */}
          <div className="mt-20 text-center">
            <h2 className="text-2xl font-bold mb-8">Sık Sorulan Sorular</h2>
            <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto text-left">
              {[
                {
                  q: 'Krediler ne zaman yüklenir?',
                  a: 'Satın aldıktan hemen sonra krediler hesabınıza yüklenir. Kredilerin son kullanma tarihi yoktur.',
                },
                {
                  q: 'Tek seferlik ödeme mi?',
                  a: 'Evet, abonelik yoktur. İstediğiniz paketi satın alır, kredileriniz bitince tekrar alırsınız.',
                },
                {
                  q: 'Filigran nasıl görünüyor?',
                  a: 'Ücretsiz planda indirilen görselin köşesine küçük, şeffaf bir WheelVision logosu eklenir.',
                },
                {
                  q: 'Geçmiş görsellerimin filigranı kalkar mı?',
                  a: 'Evet! Herhangi bir ücretli paket satın aldığınızda, geçmişteki tüm filigranlar otomatik olarak kalkar.',
                },
              ].map((faq, i) => (
                <div key={i} className="card">
                  <h3 className="font-semibold mb-2">{faq.q}</h3>
                  <p className="text-sm text-[var(--text-secondary)]">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

function PlanCard({ plan, Icon }: { plan: typeof plans[0]; Icon: React.ElementType }) {
  return (
    <div className="flex flex-col h-full p-6">
      {/* Icon & Name */}
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
          <span className="text-4xl font-bold">
            {plan.price === 0 ? 'Ücretsiz' : `$${plan.price}`}
          </span>
        </div>
        {plan.period && (
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">{plan.period}</p>
        )}
        <p className="text-sm text-[var(--accent-orange)] font-medium mt-1">
          {plan.credits} kredi
        </p>
      </div>

      {/* Watermark badge */}
      {plan.watermarkBadge && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 mb-4">
          <span className="text-xs">🔓</span>
          <span className="text-xs text-green-400 font-medium">Geçmiş filigranlar kalkar</span>
        </div>
      )}

      {/* Features */}
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
            <span className={`text-sm ${
              feature.included
                ? feature.warn
                  ? 'text-[var(--accent-orange)]'
                  : 'text-white'
                : 'text-[var(--text-secondary)]'
            }`}>
              {feature.text}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      {plan.popular ? (
        <Link href={plan.href}>
          <ShimmerButton className="w-full justify-center py-3">
            {plan.cta}
          </ShimmerButton>
        </Link>
      ) : (
        <Link
          href={plan.href}
          className="block text-center py-3 rounded-full border border-[var(--border-color)] text-sm font-semibold hover:border-[var(--accent-orange)] hover:text-[var(--accent-orange)] transition-colors"
        >
          {plan.cta}
        </Link>
      )}
    </div>
  );
}
