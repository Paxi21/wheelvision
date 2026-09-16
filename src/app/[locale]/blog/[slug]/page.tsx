import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Calendar, Clock, ArrowLeft, ArrowRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import Navbar from '@/components/Navbar';
import BlogCTA from '@/components/BlogCTA';
import { Link } from '@/i18n/navigation';
import { getAllSlugs, getAllPosts, getPostBySlug, formatBlogDate, formatReadingTime } from '@/lib/blog';

export function generateStaticParams({ params }: { params: { locale: string } }) {
  return getAllSlugs(params.locale).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = getPostBySlug(slug, locale);
  if (!post) return {};

  const url = `https://wheelvision.io/${locale}/blog/${slug}`;

  return {
    title: `${post.title} — WheelVision`,
    description: post.description,
    keywords: post.keywords.length > 0 ? post.keywords : undefined,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      url,
      title: post.title,
      description: post.description,
      siteName: 'WheelVision',
      publishedTime: post.date,
      images: [{ url: 'https://wheelvision.io/og-image.jpg', width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      images: ['https://wheelvision.io/og-image.jpg'],
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const post = getPostBySlug(slug, locale);
  if (!post) notFound();

  const t = await getTranslations('blog');
  const related = getAllPosts(locale).filter((p) => p.slug !== slug).slice(0, 3);
  const url = `https://wheelvision.io/${locale}/blog/${slug}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    author: { '@type': 'Organization', name: 'WheelVision' },
    publisher: { '@type': 'Organization', name: 'WheelVision', url: 'https://wheelvision.io' },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  };

  return (
    <>
      {/* Escape `<` so a stray "</script>" in post content can't break out of this tag */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <Navbar />
      <main className="min-h-screen pt-28 pb-20 px-4">
        <article className="max-w-3xl mx-auto">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('backToBlog')}
          </Link>

          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs text-[var(--text-secondary)]">
              <Calendar className="w-3.5 h-3.5" />
              {formatBlogDate(post.date, locale)}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs text-[var(--text-secondary)]">
              <Clock className="w-3.5 h-3.5" />
              {formatReadingTime(post.readingMinutes, locale)}
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold mb-5 leading-tight gradient-text">
            {post.title}
          </h1>
          <p className="text-lg text-[var(--text-secondary)] mb-10 leading-relaxed">{post.description}</p>

          <div
            className="blog-content"
            dangerouslySetInnerHTML={{ __html: post.contentHtml }}
          />

          <BlogCTA />

          {related.length > 0 && (
            <div className="mt-16">
              <h2 className="text-xl font-bold mb-6">{t('relatedTitle')}</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {related.map((p) => (
                  <Link
                    key={p.slug}
                    href={`/blog/${p.slug}`}
                    className="group relative block"
                  >
                    <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-[var(--accent-pink)] via-[var(--accent-purple)] to-[var(--accent-orange)] opacity-0 group-hover:opacity-100 blur transition-opacity duration-500" />
                    <div className="relative rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] overflow-hidden transition-transform duration-300 ease-out group-hover:scale-[1.02]">
                      <div
                        className="h-24 flex items-center justify-center text-4xl"
                        style={{ background: 'linear-gradient(135deg, rgba(255,107,53,0.18), rgba(114,9,183,0.18))' }}
                      >
                        🛞
                      </div>
                      <div className="p-5">
                        <h3 className="text-sm font-bold mb-2 leading-snug group-hover:text-[var(--accent-orange)] transition-colors">
                          {p.title}
                        </h3>
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent-orange)]">
                          {t('readMore')}
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </article>
      </main>
    </>
  );
}
