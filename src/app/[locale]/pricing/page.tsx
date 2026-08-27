'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { motion, AnimatePresence } from 'motion/react';
import {
  Check, X, Sparkles, Building2, User, Zap, Gem, Phone, Gift,
} from 'lucide-react';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { AnimatedBorder } from '@/components/ui/animated-border';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

const WHATSAPP_BASE = 'https://wa.me/905375859524?text=';

/* ─── Coming Soon Modal ──────────────────────────────────────────────────── */
function ComingSoonModal({ onClose }: { onClose: () => void }) {
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
        <h3 className="text-xl font-bold mb-3">Çok Yakında!</h3>
        <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-5">
          Online ödeme sistemi çok yakında aktif olacak. Şu an WhatsApp üzerinden paket satın alabilirsiniz.
        </p>
        <a
          href={WHATSAPP_BASE + encodeURIComponent('Merhaba, WheelVision paket satın almak istiyorum.')}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onClose}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#25D366] text-white text-sm font-semibold hover:bg-[#1ebe57] transition-colors"
        >
          📱 WhatsApp ile Satın Al
        </a>
      </motion.div>
    </div>
  );
}

/* ─── B2C Plan types ─────────────────────────────────────────────────────── */
type PlanFeature = { label: string; included: boolean };

type B2CPlan = {
  id: string;
  name: string;
  desc: string;
  credits: number;
  price: number;
  pricePerImage: number;
  badge: string | null;
  icon: React.ElementType;
  color: string;
  features: PlanFeature[];
};

const B2C_PLANS: B2CPlan[] = [
  {
    id: 'free',
    name: 'Ücretsiz',
    desc: 'Ücretsiz dene, karar ver',
    credits: 2,
    price: 0,
    pricePerImage: 0,
    badge: null,
    icon: Gift,
    color: 'from-[#6B7280] to-[#4B5563]',
    features: [
      { label: 'Filigranlı görsel', included: true },
      { label: 'Jant kataloğuna erişim', included: true },
      { label: 'Özel jant yükleme', included: false },
      { label: 'Görsel geçmişi', included: true },
      { label: 'Email destek', included: false },
    ],
  },
  {
    id: 'baslangic',
    name: 'Başlangıç',
    desc: 'Ara sıra kullananlar için',
    credits: 10,
    price: 249,
    pricePerImage: 24.90,
    badge: null,
    icon: Zap,
    color: 'from-[#FF6B35] to-[#F72585]',
    features: [
      { label: 'Filigransız görsel', included: true },
      { label: 'Jant kataloğuna erişim', included: true },
      { label: 'Özel jant yükleme', included: true },
      { label: 'Görsel geçmişi', included: true },
      { label: 'Email destek', included: true },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    desc: 'Sık kullananlar için',
    credits: 30,
    price: 599,
    pricePerImage: 19.97,
    badge: null,
    icon: Gem,
    color: 'from-[#7209B7] to-[#3A0CA3]',
    features: [
      { label: 'Filigransız görsel', included: true },
      { label: 'Jant kataloğuna erişim', included: true },
      { label: 'Özel jant yükleme', included: true },
      { label: 'Görsel geçmişi', included: true },
      { label: 'Email destek', included: true },
    ],
  },
];

/* ─── B2C Card ───────────────────────────────────────────────────────────── */
function B2CPlanCard({ plan, onBuy }: { plan: B2CPlan; onBuy: () => void }) {
  const Icon = plan.icon;
  const isFeatured = plan.badge === 'Önerilen';
  const isFree     = plan.id === 'free';

  const inner = (
    <div className={`flex flex-col h-full p-6 ${isFree ? 'opacity-80' : ''}`}>
      {/* Icon + name */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${plan.color} flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-lg">{plan.name}</h3>
          <p className="text-xs text-[var(--text-secondary)]">{plan.desc}</p>
        </div>
      </div>

      {/* Price */}
      <div className="mb-1">
        <div className="flex items-end gap-1">
          <span className="text-4xl font-bold">{isFree ? '₺0' : `₺${plan.price}`}</span>
        </div>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          {isFree ? 'Ücretsiz başla' : `₺${plan.pricePerImage.toFixed(2)} / görsel · Tek seferlik ödeme`}
        </p>
      </div>

      {/* Credits pill */}
      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-5 self-start bg-gradient-to-r ${plan.color} text-white`}>
        🎫 {plan.credits} kredi
      </div>

      {/* Features */}
      <ul className="space-y-2.5 flex-1 mb-6">
        {plan.features.map((feat, i) => (
          <li key={i} className="flex items-center gap-3">
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                feat.included ? `bg-gradient-to-r ${plan.color}` : 'bg-white/10'
              }`}
            >
              {feat.included
                ? <Check className="w-3 h-3 text-white" />
                : <X className="w-3 h-3 text-[var(--text-secondary)]" />}
            </div>
            <span className={`text-sm ${feat.included ? 'text-white' : 'text-[var(--text-secondary)] line-through'}`}>
              {feat.label}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      {isFree ? (
        <Link href="/register" className="block w-full">
          <button className="w-full text-center py-3 rounded-full border border-[var(--border-color)] text-sm font-semibold transition-colors hover:border-white/30 hover:text-white text-[var(--text-secondary)]">
            Ücretsiz Başla
          </button>
        </Link>
      ) : isFeatured ? (
        <button onClick={onBuy} className="block w-full">
          <ShimmerButton className="w-full justify-center py-3">Satın Al</ShimmerButton>
        </button>
      ) : (
        <button
          onClick={onBuy}
          className="block w-full text-center py-3 rounded-full border border-[var(--border-color)] text-sm font-semibold transition-colors hover:border-[var(--accent-orange)] hover:text-[var(--accent-orange)]"
        >
          Satın Al
        </button>
      )}

      {!isFree && (
        <p className="text-[10px] text-[var(--text-secondary)]/50 text-center mt-3">
          Tek seferlik ödeme · Krediler bitene kadar geçerli
        </p>
      )}
    </div>
  );

  if (isFeatured) {
    return (
      <div className="relative">
        <div className="absolute -top-4 left-0 right-0 flex justify-center z-20">
          <span className="px-4 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-[var(--accent-pink)] to-[var(--accent-purple)] text-white shadow-lg">
            ⭐ {plan.badge}
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

/* ─── B2B Plan types ─────────────────────────────────────────────────────── */
type B2BPlan = {
  id: string;
  name: string;
  desc: string;
  creditsMonthly: number;
  basePrice: number;
  badge: string | null;
  icon: React.ElementType;
  color: string;
  features: string[];
};

const B2B_PLANS: B2BPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    desc: 'Küçük galeriler için',
    creditsMonthly: 75,
    basePrice: 1499,
    badge: null,
    icon: Zap,
    color: 'from-[#6B7280] to-[#4B5563]',
    features: [
      'Aylık 75 görsel',
      'Filigransız görsel',
      'Tüm jant kataloğuna erişim',
      'Özel jant yükleme',
      'Email destek',
      'WhatsApp destek',
      'Öncelikli işleme',
    ],
  },
  {
    id: 'business',
    name: 'Business',
    desc: 'Büyüyen işletmeler için',
    creditsMonthly: 200,
    basePrice: 2999,
    badge: 'Popüler',
    icon: Building2,
    color: 'from-[#FF6B35] to-[#F72585]',
    features: [
      'Aylık 200 görsel',
      'Filigransız görsel',
      'Tüm jant kataloğuna erişim',
      'Özel jant yükleme',
      'Email destek',
      'WhatsApp destek',
      'Öncelikli işleme',
    ],
  },
];

const COMMITMENT_OPTIONS = [
  { value: '1', label: 'Aylık',  discount: 0 },
  { value: '3', label: '3 Ay',  discount: 10 },
  { value: '6', label: '6 Ay',  discount: 15 },
  { value: '12', label: '12 Ay', discount: 20 },
];

function calcPrice(base: number, discount: number): number {
  return Math.round(base * (1 - discount / 100));
}

/* ─── B2B Plan Card ──────────────────────────────────────────────────────── */
function B2BPlanCard({
  plan,
  commitment,
  onBuy,
}: {
  plan: B2BPlan;
  commitment: string;
  onBuy: () => void;
}) {
  const Icon = plan.icon;
  const discount = COMMITMENT_OPTIONS.find(o => o.value === commitment)?.discount ?? 0;
  const price    = calcPrice(plan.basePrice, discount);
  const perImage = (price / plan.creditsMonthly).toFixed(2);
  const isPopular = !!plan.badge;

  const inner = (
    <div className="flex flex-col h-full p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${plan.color} flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-lg">{plan.name}</h3>
          <p className="text-xs text-[var(--text-secondary)]">{plan.desc}</p>
        </div>
      </div>

      {/* Price */}
      <div className="mb-1">
        {discount > 0 && (
          <span className="text-sm line-through text-[var(--text-secondary)]/60 block">
            ₺{plan.basePrice.toLocaleString('tr-TR')}/ay
          </span>
        )}
        <div className="flex items-end gap-1">
          <span className="text-4xl font-bold">₺{price.toLocaleString('tr-TR')}</span>
          <span className="text-[var(--text-secondary)] text-sm mb-1.5">/ay</span>
        </div>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          ₺{perImage} / görsel
          {discount > 0 && (
            <span className="ml-2 text-green-400 font-semibold">%{discount} indirim</span>
          )}
        </p>
      </div>

      {/* Credits pill */}
      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-5 self-start bg-gradient-to-r ${plan.color} text-white`}>
        🎫 {plan.creditsMonthly} görsel/ay
      </div>

      {/* Features */}
      <ul className="space-y-2.5 flex-1 mb-6">
        {plan.features.map((feat, i) => (
          <li key={i} className="flex items-center gap-3">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-r ${plan.color}`}>
              <Check className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm text-white">{feat}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      {isPopular ? (
        <button onClick={onBuy} className="block w-full">
          <ShimmerButton className="w-full justify-center py-3">Başla</ShimmerButton>
        </button>
      ) : (
        <button
          onClick={onBuy}
          className="block w-full text-center py-3 rounded-full border border-[var(--border-color)] text-sm font-semibold transition-colors hover:border-[var(--accent-orange)] hover:text-[var(--accent-orange)]"
        >
          Başla
        </button>
      )}
    </div>
  );

  if (isPopular) {
    return (
      <div className="relative">
        <div className="absolute -top-4 left-0 right-0 flex justify-center z-20">
          <span className="px-4 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-[var(--accent-pink)] to-[var(--accent-purple)] text-white shadow-lg">
            ⭐ {plan.badge}
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

/* ─── Enterprise Card ────────────────────────────────────────────────────── */
const ENTERPRISE_FEATURES = [
  'Sınırsız görsel',
  'Tüm Business özellikleri',
  'Özel entegrasyon',
  'Hesap yöneticisi',
  'Özel fiyatlandırma',
];

function EnterpriseCard() {
  const mailtoHref =
    'mailto:info@wheelvision.io' +
    '?subject=' + encodeURIComponent('WheelVision Enterprise Plan Talebi') +
    '&body=' + encodeURIComponent('Merhaba, WheelVision Enterprise plan hakkında bilgi almak istiyorum.');

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(114,9,183,0.15), rgba(58,12,163,0.15))',
        border: '1px solid rgba(114,9,183,0.4)',
      }}
    >
      <div className="p-6 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#7209B7] to-[#3A0CA3] flex items-center justify-center flex-shrink-0">
            <Phone className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Enterprise</h3>
            <p className="text-xs text-[var(--text-secondary)]">Büyük galeriler için</p>
          </div>
        </div>

        {/* Price */}
        <div className="mb-5">
          <p className="text-3xl font-bold">Özel Fiyat</p>
          <p className="text-xs text-[var(--text-secondary)] mt-1">İhtiyacınıza göre fiyatlandırma</p>
        </div>

        {/* Features */}
        <ul className="space-y-2.5 flex-1 mb-6">
          {ENTERPRISE_FEATURES.map((feat, i) => (
            <li key={i} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-r from-[#7209B7] to-[#3A0CA3]">
                <Check className="w-3 h-3 text-white" />
              </div>
              <span className="text-sm text-white">{feat}</span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <a
          href={mailtoHref}
          className="block w-full text-center py-3 rounded-full text-sm font-semibold transition-colors border border-purple-500/50 text-purple-300 hover:border-purple-400 hover:text-purple-200"
        >
          İletişime Geçin →
        </a>

        <p className="text-[10px] text-[var(--text-secondary)]/50 text-center mt-3">
          info@wheelvision.io
        </p>
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────────── */
export default function PricingPage() {
  const t = useTranslations('pricing');
  const [tab, setTab]           = useState<'b2c' | 'b2b'>('b2c');
  const [commitment, setCommitment] = useState('1');
  const [showComingSoon, setShowComingSoon] = useState(false);

  return (
    <>
      <AnimatePresence>
        {showComingSoon && (
          <ComingSoonModal key="modal" onClose={() => setShowComingSoon(false)} />
        )}
      </AnimatePresence>

      <Navbar />

      <main className="min-h-screen pt-24 pb-16 px-4 relative overflow-hidden">
        {/* Background blobs */}
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

            {/* ── B2C ── */}
            {tab === 'b2c' && (
              <motion.div
                key="b2c"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto items-start">
                  {B2C_PLANS.map((plan, i) => (
                    <motion.div
                      key={plan.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.07 }}
                      className={plan.badge === 'Önerilen' ? 'mt-4' : ''}
                    >
                      <B2CPlanCard plan={plan} onBuy={() => setShowComingSoon(true)} />
                    </motion.div>
                  ))}
                </div>

                <p className="text-center text-xs text-[var(--text-secondary)]/60 mt-6">
                  {t('creditStackNote')}
                </p>
              </motion.div>
            )}

            {/* ── B2B ── */}
            {tab === 'b2b' && (
              <motion.div
                key="b2b"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Commitment Toggle */}
                <div className="flex flex-col items-center mb-10">
                  <p className="text-sm text-[var(--text-secondary)] mb-3 font-medium">Taahhüt Süresi</p>
                  <div className="inline-flex p-1 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] gap-1">
                    {COMMITMENT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setCommitment(opt.value)}
                        className="relative flex flex-col items-center px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 min-w-[60px]"
                        style={commitment === opt.value ? {
                          background: 'linear-gradient(135deg,#FF6B35,#F72585)',
                          color: '#fff',
                          boxShadow: '0 4px 12px rgba(247,37,133,0.3)',
                        } : { color: 'var(--text-secondary)' }}
                      >
                        <span>{opt.label}</span>
                        {opt.discount > 0 && (
                          <span className={`text-[10px] font-bold ${commitment === opt.value ? 'text-white/80' : 'text-green-400'}`}>
                            %{opt.discount} off
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                  {commitment !== '1' && (
                    <motion.p
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-green-400 font-semibold mt-3"
                    >
                      🎉 %{COMMITMENT_OPTIONS.find(o => o.value === commitment)?.discount} indirim uygulandı!
                    </motion.p>
                  )}
                </div>

                {/* Plan Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto items-start">
                  {B2B_PLANS.map((plan, i) => (
                    <motion.div
                      key={plan.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.07 }}
                      className={plan.badge ? 'mt-4' : ''}
                    >
                      <B2BPlanCard
                        plan={plan}
                        commitment={commitment}
                        onBuy={() => setShowComingSoon(true)}
                      />
                    </motion.div>
                  ))}

                  {/* Enterprise */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: B2B_PLANS.length * 0.07 }}
                  >
                    <EnterpriseCard />
                  </motion.div>
                </div>

                {/* Rollover note */}
                <div className="flex items-start gap-3 max-w-2xl mx-auto mt-8 p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)]">
                  <span className="text-xl mt-0.5">♻️</span>
                  <div>
                    <p className="text-sm font-semibold">Kredi Devretme</p>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">
                      Her ay başında aylık krediler eklenir. Kullanılmayan krediler bir sonraki aya devredilir.
                      Abonelik iptal edilirse kalan krediler 30 gün daha geçerli kalır.
                    </p>
                  </div>
                </div>
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
