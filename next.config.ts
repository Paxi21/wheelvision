import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const supabaseHost = 'xzokritmcxslkqlahims.supabase.co';

const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.iyzipay.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.iyzipay.com",
  "font-src 'self' data: https://fonts.gstatic.com https://*.iyzipay.com",
  `connect-src 'self' https://${supabaseHost} https://api.cloudinary.com https://res.cloudinary.com https://fal.media https://*.fal.media https://*.iyzipay.com`,
  "img-src 'self' data: blob: https://res.cloudinary.com https://fal.media https://*.fal.media https://*.iyzipay.com",
  "frame-src 'self' https://*.iyzipay.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self' https://*.iyzipay.com",
].join('; ');

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Content-Security-Policy', value: csp },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com', pathname: '/dxcok7tox/**' },
      { protocol: 'https', hostname: 'fal.media', pathname: '/**' },
      { protocol: 'https', hostname: '*.fal.media', pathname: '/**' },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000, // 1 year — static demo images never change
    deviceSizes: [390, 640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 64, 96, 128, 256, 384],
  },
};

export default withNextIntl(nextConfig);
