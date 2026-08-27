import type { Metadata } from 'next';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Link } from '@/i18n/navigation';
import { getAllPosts, formatBlogDate } from '@/lib/blog';

export const metadata: Metadata = {
  title: 'Blog — WheelVision',
  description: 'Jant deneme, AI görselleştirme ve jant seçimi hakkında rehberler — WheelVision blog.',
  openGraph: {
    type: 'website',
    url: 'https://wheelvision.io/tr/blog',
    title: 'Blog — WheelVision',
    description: 'Jant deneme, AI görselleştirme ve jant seçimi hakkında rehberler — WheelVision blog.',
    siteName: 'WheelVision',
    images: [{ url: 'https://wheelvision.io/og-image.jpg', width: 1200, height: 630, alt: 'WheelVision Blog' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog — WheelVision',
    description: 'Jant deneme, AI görselleştirme ve jant seçimi hakkında rehberler — WheelVision blog.',
    images: ['https://wheelvision.io/og-image.jpg'],
  },
};

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-28 pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="gradient-text">Blog</span>
            </h1>
            <p className="text-[var(--text-secondary)] text-lg">
              Jant deneme, AI görselleştirme ve jant seçimi hakkında rehberler
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="card block p-0 overflow-hidden hover:border-[var(--accent-orange)] transition-colors group"
              >
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
                      {formatBlogDate(post.date)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {post.readingTime}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold mb-2 group-hover:text-[var(--accent-orange)] transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">
                    {post.description}
                  </p>
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--accent-orange)]">
                    Devamını Oku
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
