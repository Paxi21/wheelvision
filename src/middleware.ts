import { NextRequest, NextResponse } from 'next/server';

// Auth redirects handled at page level via AuthContext.
// Middleware is kept for future use (e.g. rate limiting, headers).
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
