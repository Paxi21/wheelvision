import { NextRequest, NextResponse } from 'next/server';

// Only proxy images from trusted AI/CDN domains
const TRUSTED_DOMAINS = ['fal.media', 'v3.fal.media', 'res.cloudinary.com'];

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return new NextResponse('Missing url', { status: 400 });
  }

  try {
    const parsed = new URL(url);
    const trusted = TRUSTED_DOMAINS.some(
      (d) => parsed.hostname === d || parsed.hostname.endsWith(`.${d}`)
    );
    if (!trusted || parsed.protocol !== 'https:') {
      return new NextResponse('Untrusted URL', { status: 400 });
    }
  } catch {
    return new NextResponse('Invalid URL', { status: 400 });
  }

  try {
    const upstream = await fetch(url);
    if (!upstream.ok) {
      return new NextResponse('Upstream error', { status: 502 });
    }

    const blob = await upstream.blob();
    return new NextResponse(blob, {
      headers: {
        'Content-Type': upstream.headers.get('Content-Type') ?? 'image/jpeg',
        'Cache-Control': 'public, max-age=3600',
        // Same-origin response — canvas can now drawImage without CORS taint
        'Access-Control-Allow-Origin': request.headers.get('origin') ?? '*',
      },
    });
  } catch {
    return new NextResponse('Fetch failed', { status: 502 });
  }
}
