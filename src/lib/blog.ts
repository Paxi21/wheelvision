import fs from 'fs';
import path from 'path';
import { markdownToHtml } from './markdown';

const BLOG_DIR = path.join(process.cwd(), 'content', 'blog');

export type BlogPostMeta = {
  slug: string;
  title: string;
  description: string;
  date: string;
  keywords: string[];
  readingTime: string;
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

function readingTimeFor(content: string): string {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return `${minutes} dk okuma`;
}

function readPost(slug: string): { data: Frontmatter; content: string } {
  const filePath = path.join(BLOG_DIR, `${slug}.md`);
  const raw = fs.readFileSync(filePath, 'utf-8');
  return parseFrontmatter(raw);
}

export function getAllSlugs(): string[] {
  return fs.readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith('.md'))
    .map((f) => f.replace(/\.md$/, ''));
}

export function getAllPosts(): BlogPostMeta[] {
  return getAllSlugs()
    .map((slug) => {
      const { data, content } = readPost(slug);
      return {
        slug,
        title: str(data, 'title', slug),
        description: str(data, 'description'),
        date: str(data, 'date'),
        keywords: arr(data, 'keywords'),
        readingTime: readingTimeFor(content),
      };
    })
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

export function getPostBySlug(slug: string): BlogPost | null {
  try {
    const { data, content } = readPost(slug);
    return {
      slug,
      title: str(data, 'title', slug),
      description: str(data, 'description'),
      date: str(data, 'date'),
      keywords: arr(data, 'keywords'),
      readingTime: readingTimeFor(content),
      contentHtml: markdownToHtml(content),
    };
  } catch {
    return null;
  }
}

export function formatBlogDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}
