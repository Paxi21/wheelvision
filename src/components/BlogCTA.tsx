import { Sparkles } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

export default async function BlogCTA() {
  const t = await getTranslations('blog');

  return (
    <div
      className="mt-14 rounded-2xl border border-[var(--border-color)] p-8 text-center"
      style={{ background: 'linear-gradient(135deg, rgba(255,107,53,0.1), rgba(114,9,183,0.1))' }}
    >
      <h3 className="text-xl font-bold mb-2">{t('ctaTitle')}</h3>
      <p className="text-sm text-[var(--text-secondary)] mb-6 max-w-md mx-auto">
        {t('ctaDesc')}
      </p>
      <Link
        href="/app"
        className="btn-primary inline-flex items-center gap-2 px-8 py-3.5 text-base"
      >
        <Sparkles className="w-5 h-5" />
        {t('ctaButton')}
      </Link>
    </div>
  );
}
