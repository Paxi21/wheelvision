import fs from 'fs';
import path from 'path';
import { markdownToHtml } from './markdown';

const BLOG_ROOT = path.join(process.cwd(), 'content', 'blog');
const DEFAULT_BLOG_LOCALE = 'tr';

function blogDir(locale: string): string {
  const dir = path.join(BLOG_ROOT, locale);
  return fs.existsSync(dir) ? dir : path.join(BLOG_ROOT, DEFAULT_BLOG_LOCALE);
}

export type BlogPostMeta = {
  slug: string;
  title: string;
  description: string;
  date: string;
  keywords: string[];
  readingMinutes: number;
};

export type BlogPost = BlogPostMeta & {
  contentHtml: string;
};

type FrontmatterValue = string | string[];
type Frontmatter = Record<string, FrontmatterValue>;

function parseFrontmatter(raw: string): { data: Frontmatter; content: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { data: {}, content: raw };

  const data: Frontmatter = {};
  for (const line of match[1].split('\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();

    if (value.startsWith('[') && value.endsWith(']')) {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          data[key] = parsed.map(String);
          continue;
        }
      } catch {
        // fall through — treat as a plain string below
      }
    }

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    data[key] = value;
  }
  return { data, content: match[2] };
}

function str(data: Frontmatter, key: string, fallback = ''): string {
  const v = data[key];
  return typeof v === 'string' ? v : fallback;
}

function arr(data: Frontmatter, key: string): string[] {
  const v = data[key];
  return Array.isArray(v) ? v : [];
}

function readingMinutesFor(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function readPost(slug: string, locale: string): { data: Frontmatter; content: string } {
  const filePath = path.join(blogDir(locale), `${slug}.md`);
  const raw = fs.readFileSync(filePath, 'utf-8');
  return parseFrontmatter(raw);
}

export function getAllSlugs(locale: string = DEFAULT_BLOG_LOCALE): string[] {
  return fs.readdirSync(blogDir(locale))
    .filter((f) => f.endsWith('.md'))
    .map((f) => f.replace(/\.md$/, ''));
}

export function getAllPosts(locale: string = DEFAULT_BLOG_LOCALE): BlogPostMeta[] {
  return getAllSlugs(locale)
    .map((slug) => {
      const { data, content } = readPost(slug, locale);
      return {
        slug,
        title: str(data, 'title', slug),
        description: str(data, 'description'),
        date: str(data, 'date'),
        keywords: arr(data, 'keywords'),
        readingMinutes: readingMinutesFor(content),
      };
    })
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

export function getPostBySlug(slug: string, locale: string = DEFAULT_BLOG_LOCALE): BlogPost | null {
  try {
    const { data, content } = readPost(slug, locale);
    return {
      slug,
      title: str(data, 'title', slug),
      description: str(data, 'description'),
      date: str(data, 'date'),
      keywords: arr(data, 'keywords'),
      readingMinutes: readingMinutesFor(content),
      contentHtml: markdownToHtml(content),
    };
  } catch {
    return null;
  }
}

export function formatBlogDate(iso: string, locale: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatReadingTime(minutes: number, locale: string): string {
  return locale === 'tr' ? `${minutes} dk okuma` : `${minutes} min read`;
}
