import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './src/i18n/routing';
import { NextRequest, NextResponse } from 'next/server';

const intlMiddleware = createIntlMiddleware(routing);

// Known locales — handled by next-intl
const LOCALES = new Set(['en', 'tr']);

// Known app path segments — redirect to locale-prefixed version
const APP_SEGMENTS = new Set([
  'app', 'pricing', 'history', 'login', 'register',
  'settings', 'privacy', 'terms',
]);

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const firstSegment = pathname.split('/').filter(Boolean)[0] ?? '';

  // Root, locale prefix, or known app route → next-intl handles locale
  if (!firstSegment || LOCALES.has(firstSegment) || APP_SEGMENTS.has(firstSegment)) {
    return intlMiddleware(request);
  }

  // /d/* paths → direct dealer routes, pass through to Next.js router
  if (firstSegment === 'd') {
    return NextResponse.next();
  }

  // Unknown first segment → treat as dealer slug
  // Rewrite internally to /d/[slug] while keeping original URL in browser
  const url = request.nextUrl.clone();
  url.pathname = `/d/${firstSegment}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    // All paths except API routes, Next.js internals, and static files
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
};
