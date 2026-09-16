// Emails that never get a watermark, regardless of plan (e.g. internal/admin accounts).
const WATERMARK_EXEMPT_EMAILS = ['erhan.deniz421@gmail.com'];

// Accounts provisioned with a very large credit balance are treated as admin/service
// accounts and are exempt from the free-plan watermark too.
const WATERMARK_EXEMPT_CREDITS_THRESHOLD = 999;

/**
 * True if this user should never receive a watermark, independent of their paid plan status.
 */
export function isWatermarkExempt(email?: string | null, credits?: number | null): boolean {
  if (email && WATERMARK_EXEMPT_EMAILS.includes(email.trim().toLowerCase())) return true;
  if (typeof credits === 'number' && credits >= WATERMARK_EXEMPT_CREDITS_THRESHOLD) return true;
  return false;
}

/**
 * Applies a single centered WheelVision watermark to an image URL.
 * - Position: center of image
 * - Rotation: -30°
 * - Opacity: ~38% fill, 25% stroke shadow
 * - Works with remote URLs (via proxy) and data: URLs
 */
export function applyWatermark(imageUrl: string): Promise<string> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') { resolve(imageUrl); return; }

    const img = new window.Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width  = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(imageUrl); return; }

      ctx.drawImage(img, 0, 0);

      // Single centered watermark — font ~8% of image width
      const fontSize = Math.max(28, Math.floor(img.naturalWidth * 0.08));
      ctx.save();
      ctx.translate(img.naturalWidth / 2, img.naturalHeight / 2);
      ctx.rotate(-Math.PI / 6);
      ctx.font         = `bold ${fontSize}px Arial, sans-serif`;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth    = fontSize * 0.07;
      ctx.strokeStyle  = 'rgba(0,0,0,0.25)';
      ctx.strokeText('WheelVision', 0, 0);
      ctx.fillStyle    = 'rgba(255,255,255,0.38)';
      ctx.fillText('WheelVision', 0, 0);
      ctx.restore();

      resolve(canvas.toDataURL('image/jpeg', 0.92));
    };

    img.onerror = () => resolve(imageUrl);

    // Use proxy for remote URLs to avoid CORS taint on canvas
    img.src = imageUrl.startsWith('data:')
      ? imageUrl
      : `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`;
  });
}
