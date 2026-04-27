import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export async function POST(req: NextRequest) {
  // IP rate limit — 10 requests/min, fail open on Redis error
  try {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const key = `ratelimit:validate:${ip}`;
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, 60);
    if (count > 10) {
      return NextResponse.json(
        { valid: false, message: 'Çok fazla istek gönderdiniz. Lütfen 1 dakika bekleyip tekrar deneyin.' },
        { status: 429 }
      );
    }
  } catch (e) {
    console.warn('[validate-car] rate limit check failed (Redis error), allowing request:', e);
  }

  try {
    const { image_url } = await req.json();

    if (!image_url) {
      return NextResponse.json({ valid: false, message: 'Görsel URL bulunamadı' });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 40,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'url', url: image_url },
            },
            {
              type: 'text',
              text: 'Is there a car in this image? If yes, estimate the wheel/rim diameter in inches (typically 15-22). Reply ONLY with JSON: {"car": true, "wheel_size": 19}. If no car: {"car": false, "wheel_size": null}. If car visible but wheel not clearly visible: {"car": true, "wheel_size": null}',
            },
          ],
        }],
      }),
    });

    const data = await response.json();
    const rawText = (data.content?.[0]?.text as string | undefined)?.trim() ?? '';

    let isValid = false;
    let wheelSize: number | null = null;

    try {
      const parsed = JSON.parse(rawText) as { car?: boolean; wheel_size?: number | null };
      isValid = parsed.car === true;
      wheelSize = typeof parsed.wheel_size === 'number' ? parsed.wheel_size : null;
    } catch {
      // JSON parse failed — fall back to yes/no check, fail-open for wheel_size
      isValid = rawText.toLowerCase().includes('true');
    }

    return NextResponse.json({
      valid: isValid,
      wheel_size: wheelSize,
      message: isValid
        ? 'ok'
        : 'Lütfen bir araç fotoğrafı yükleyin. Yüklediğiniz görselde araç tespit edilemedi.',
    });
  } catch {
    // Hata durumunda kullanıcıyı engelleme — geçişe izin ver
    return NextResponse.json({ valid: true, wheel_size: null, message: 'ok' });
  }
}
