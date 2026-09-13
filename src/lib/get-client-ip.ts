/**
 * WheelVision's DNS is Cloudflare-proxied (orange-clouded) in front of Vercel. A client can
 * send its own X-Forwarded-For header, and proxies conventionally APPEND to that header
 * rather than replace it — so trusting the first entry (as this code used to) trusts
 * attacker-controlled input. Varying that first value per request lets IP-based rate limits
 * be bypassed trivially.
 *
 * cf-connecting-ip is set exclusively by Cloudflare's edge from the real TCP connection and
 * is stripped/overwritten if a client tries to send its own — it cannot be spoofed. Prefer it
 * whenever present; fall back to x-real-ip / the first x-forwarded-for segment for requests
 * that reach Vercel directly (local dev, Vercel preview URLs without the custom domain).
 */
export function getClientIp(request: Request): string {
  const cf = request.headers.get('cf-connecting-ip');
  if (cf) return cf.trim();

  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  const xff = request.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();

  return 'unknown';
}
