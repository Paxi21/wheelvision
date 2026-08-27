// Minimal markdown → HTML converter for blog posts.
// Supports: headings (#, ##, ###), bold, italic, inline code, links,
// unordered/ordered lists, paragraphs. No tables, no raw HTML passthrough —
// content is escaped first, so this is safe even if a file gets edited carelessly.

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderInline(text: string): string {
  let html = escapeHtml(text);
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  return html;
}

export function markdownToHtml(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const out: string[] = [];

  let paragraphBuf: string[] = [];
  let listBuf: string[] = [];
  let listType: 'ul' | 'ol' | null = null;

  const flushParagraph = () => {
    if (paragraphBuf.length === 0) return;
    out.push(`<p>${renderInline(paragraphBuf.join(' '))}</p>`);
    paragraphBuf = [];
  };

  const flushList = () => {
    if (!listType || listBuf.length === 0) return;
    const items = listBuf.map((item) => `<li>${renderInline(item)}</li>`).join('');
    out.push(`<${listType}>${items}</${listType}>`);
    listBuf = [];
    listType = null;
  };

  const flushAll = () => { flushParagraph(); flushList(); };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (line === '') {
      flushAll();
      continue;
    }

    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      flushAll();
      const level = headingMatch[1].length; // # -> h1, ## -> h2, ### -> h3 (body content only ever uses ##/###; h1 is reserved for the page's own title)
      out.push(`<h${level}>${renderInline(headingMatch[2])}</h${level}>`);
      continue;
    }

    const ulMatch = line.match(/^[-*]\s+(.+)$/);
    if (ulMatch) {
      flushParagraph();
      if (listType !== 'ul') { flushList(); listType = 'ul'; }
      listBuf.push(ulMatch[1]);
      continue;
    }

    const olMatch = line.match(/^\d+\.\s+(.+)$/);
    if (olMatch) {
      flushParagraph();
      if (listType !== 'ol') { flushList(); listType = 'ol'; }
      listBuf.push(olMatch[1]);
      continue;
    }

    if (/^-{3,}$/.test(line)) {
      flushAll();
      out.push('<hr />');
      continue;
    }

    flushList();
    paragraphBuf.push(line);
  }

  flushAll();
  return out.join('\n');
}
