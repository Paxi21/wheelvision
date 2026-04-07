import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import { Link } from '@/i18n/navigation';
import { getTranslations } from 'next-intl/server';

export const metadata: Metadata = {
  title: 'Privacy Policy — WheelVision',
  description: 'WheelVision privacy policy and personal data protection.',
};

export default async function PrivacyPage() {
  const t = await getTranslations('privacy');

  const s1Items = t.raw('s1Items') as string[];
  const s2Items = t.raw('s2Items') as string[];

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-28 pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
          <p className="text-[var(--text-secondary)] text-sm mb-10">{t('lastUpdated')}</p>

          <div className="space-y-8 text-[var(--text-secondary)] leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">{t('s1Title')}</h2>
              <p>{t('s1Body')}</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                {s1Items.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">{t('s2Title')}</h2>
              <p>{t('s2Body')}</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                {s2Items.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">{t('s3Title')}</h2>
              <p>{t('s3Body')}</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">{t('s4Title')}</h2>
              <p>{t('s4Body')}</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">{t('s5Title')}</h2>
              <p>{t('s5Body')}</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">{t('s6Title')}</h2>
              <p>{t('s6Body')} <span className="text-[var(--accent-orange)]">destek@wheelvision.io</span></p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">{t('s7Title')}</h2>
              <p>{t('s7Body')} <span className="text-[var(--accent-orange)]">destek@wheelvision.io</span></p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-[var(--border-color)]">
            <Link href="/" className="text-sm text-[var(--text-secondary)] hover:text-white transition-colors">
              {t('backHome')}
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
