import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Calendar, Clock, ArrowLeft } from 'lucide-react';
import Navbar from '@/components/Navbar';
import BlogCTA from '@/components/BlogCTA';
import { Link } from '@/i18n/navigation';
import { getAllSlugs, getPostBySlug, formatBlogDate } from '@/lib/blog';

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};

  const url = `https://wheelvision.io/tr/blog/${slug}`;

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
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    author: { '@type': 'Organization', name: 'WheelVision' },
    publisher: { '@type': 'Organization', name: 'WheelVision', url: 'https://wheelvision.io' },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `https://wheelvision.io/tr/blog/${slug}` },
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
        <article className="max-w-[720px] mx-auto">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Tüm Yazılar
          </Link>

          <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)] mb-4">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {formatBlogDate(post.date)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {post.readingTime}
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">{post.title}</h1>
          <p className="text-lg text-[var(--text-secondary)] mb-10 leading-relaxed">{post.description}</p>

          <div
            className="blog-content"
            dangerouslySetInnerHTML={{ __html: post.contentHtml }}
          />

          <BlogCTA />
        </article>
      </main>
    </>
  );
}
