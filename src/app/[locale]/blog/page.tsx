import type { Metadata } from 'next';
import { Calendar, Clock, ArrowRight, Sparkles } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import Navbar from '@/components/Navbar';
import { Link } from '@/i18n/navigation';
import { getAllPosts, formatBlogDate, formatReadingTime } from '@/lib/blog';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'blog' });
  const title = `${t('heroTitle')} — WheelVision Blog`;
  const description = t('heroDesc');
  const url = `https://wheelvision.io/${locale}/blog`;

  return {
    title,
    description,
    openGraph: {
      type: 'website',
      url,
      title,
      description,
      siteName: 'WheelVision',
      images: [{ url: 'https://wheelvision.io/og-image.jpg', width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['https://wheelvision.io/og-image.jpg'],
    },
  };
}

export default async function BlogIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations('blog');
  const posts = getAllPosts(locale);
  const [featured, ...rest] = posts;

  return (
    <>
      <Navbar />
      <main className="min-h-screen pb-20">
        {/* Hero banner */}
        <section className="relative overflow-hidden pt-28 pb-16 px-4">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-24 left-1/4 w-96 h-96 bg-[var(--accent-orange)] rounded-full blur-[150px] opacity-20" />
            <div className="absolute -top-10 right-1/4 w-96 h-96 bg-[var(--accent-purple)] rounded-full blur-[150px] opacity-20" />
          </div>
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] text-sm mb-6">
              <Sparkles className="w-4 h-4 text-[var(--accent-orange)]" />
              {t('badge')}
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold mb-5 leading-tight">
              <span className="gradient-text">{t('heroTitle')}</span>
            </h1>
            <p className="text-[var(--text-secondary)] text-lg max-w-xl mx-auto">
              {t('heroDesc')}
            </p>
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-4">
          {/* Featured post */}
          {featured && (
            <Link
              href={`/blog/${featured.slug}`}
              className="group relative block mb-14"
            >
              <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-r from-[var(--accent-pink)] via-[var(--accent-purple)] to-[var(--accent-orange)] opacity-0 group-hover:opacity-100 blur transition-opacity duration-500" />
              <div className="relative grid md:grid-cols-2 rounded-3xl border border-[var(--border-color)] bg-[var(--bg-card)] overflow-hidden transition-transform duration-300 ease-out group-hover:scale-[1.02]">
                <div
                  className="h-56 md:h-full min-h-[280px] flex items-center justify-center text-8xl"
                  style={{ background: 'linear-gradient(135deg, rgba(255,107,53,0.25), rgba(114,9,183,0.25))' }}
                >
                  🛞
                </div>
                <div className="p-8 md:p-10 flex flex-col justify-center">
                  <span className="inline-flex items-center gap-1.5 self-start px-3 py-1 rounded-full text-xs font-bold mb-4 bg-gradient-to-r from-[var(--accent-orange)] to-[var(--accent-pink)] text-white">
                    {t('featuredBadge')}
                  </span>
                  <h2 className="text-2xl md:text-3xl font-bold mb-3 leading-tight group-hover:text-[var(--accent-orange)] transition-colors">
                    {featured.title}
                  </h2>
                  <p className="text-[var(--text-secondary)] leading-relaxed mb-6">
                    {featured.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)] mb-6">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatBlogDate(featured.date, locale)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {formatReadingTime(featured.readingMinutes, locale)}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--accent-orange)]">
                    {t('readMore')}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </div>
            </Link>
          )}

          {/* Remaining posts */}
          {rest.length > 0 && (
            <>
              <h2 className="text-xl font-bold mb-6">{t('moreArticles')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {rest.map((post) => (
                  <Link
                    key={post.slug}
                    href={`/blog/${post.slug}`}
                    className="group relative block"
                  >
                    <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-[var(--accent-pink)] via-[var(--accent-purple)] to-[var(--accent-orange)] opacity-0 group-hover:opacity-100 blur transition-opacity duration-500" />
                    <div className="relative rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] overflow-hidden transition-transform duration-300 ease-out group-hover:scale-[1.02]">
                      <div
                        className="h-32 flex items-center justify-center text-5xl"
                        style={{ background: 'linear-gradient(135deg, rgba(255,107,53,0.18), rgba(114,9,183,0.18))' }}
                      >
                        🛞
                      </div>
                      <div className="p-6">
                        <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)] mb-3">
                          <span className="inline-flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatBlogDate(post.date, locale)}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            {formatReadingTime(post.readingMinutes, locale)}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold mb-2 group-hover:text-[var(--accent-orange)] transition-colors">
                          {post.title}
                        </h3>
                        <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">
                          {post.description}
                        </p>
                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--accent-orange)]">
                          {t('readMore')}
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}
