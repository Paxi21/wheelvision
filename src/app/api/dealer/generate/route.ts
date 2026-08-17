import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';
import { redis } from '@/lib/redis';
import tinify from 'tinify';

export const maxDuration = 300;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const n8nUrl = process.env.N8N_WEBHOOK_URL!;
const cloudinaryCloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;

const INTERNAL_KEYWORDS = ['supabase', 'Supabase', 'n8n', 'N8N', 'webhook', 'Webhook', '@'];

function toUserMessage(msg: string): string {
  if (INTERNAL_KEYWORDS.some(k => msg.includes(k))) {
    return 'Bir sorun oluştu. Lütfen tekrar deneyin.';
  }
  return msg;
}

async function compressAndStore(sourceUrl: string): Promise<string> {
  const tinyKey = process.env.TINYPNG_API_KEY;
  if (!tinyKey) return sourceUrl;

  try {
    tinify.key = tinyKey;
    const compressed = await tinify.fromUrl(sourceUrl).toBuffer();

    const blob = new Blob([Buffer.from(compressed)], { type: 'image/jpeg' });
    const fd = new FormData();
    fd.append('file', blob, 'result.jpg');
    fd.append('upload_preset', 'wheelvision');
    fd.append('folder', 'wheelvision-results');

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudinaryCloud}/image/upload`,
      { method: 'POST', body: fd }
    );

    if (!res.ok) throw new Error(`Cloudinary ${res.status}`);
    const json = await res.json() as { secure_url?: string };
    if (!json.secure_url) throw new Error('no secure_url');

    console.log('[generate] TinyPNG compressed + uploaded to Cloudinary');
    return json.secure_url;
  } catch (err) {
    console.warn('[generate] compression skipped:', err);
    return sourceUrl;
  }
}

const TRUSTED_IMAGE_DOMAINS = [
  'fal.media',
  'v3.fal.media',
  'v3b.fal.media',
  'fal.run',
  'cdn.fal.ai',
  'res.cloudinary.com',
  'storage.googleapis.com',
];

function isValidCloudinaryUrl(url: unknown): boolean {
  if (typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === 'https:' &&
      parsed.hostname === 'res.cloudinary.com' &&
      parsed.pathname.startsWith(`/${cloudinaryCloud}/`)
    );
  } catch {
    return false;
  }
}

function isValidOutputImageUrl(url: unknown): url is string {
  if (typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false;
    return TRUSTED_IMAGE_DOMAINS.some(
      (domain) =>
        parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const key = `ratelimit:${ip}`;
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, 60);
    if (count > 5) {
      return NextResponse.json(
        { error: 'Çok fazla istek gönderdiniz. Lütfen 1 dakika bekleyip tekrar deneyin.' },
        { status: 429 }
      );
    }
  } catch (e) {
    console.warn('[generate] rate limit check failed (Redis error), allowing request:', e);
  }

  if (!n8nUrl) {
    console.error('[generate] N8N_WEBHOOK_URL environment variable is not set');
    return NextResponse.json({ error: 'Servis yapılandırması eksik. Lütfen yönetici ile iletişime geçin.' }, { status: 503 });
  }

  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.slice(7);

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 });
    }

    const { car_image, wheel_image } = body;

    if (!isValidCloudinaryUrl(car_image) || !isValidCloudinaryUrl(wheel_image)) {
      return NextResponse.json({ error: 'Geçersiz görsel URL' }, { status: 400 });
    }

    const { data: userData, error: dbError } = await supabase
      .from('users')
      .select('credits')
      .eq('email', user.email)
      .single();

    if (dbError || !userData) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });
    }

    if (userData.credits < 1) {
      return NextResponse.json(
        { error: 'Yetersiz kredi. Lütfen kredi satın alın.' },
        { status: 402 }
      );
    }

    const cacheKey = 'wheel:' + createHash('sha256')
      .update(car_image as string + ':' + wheel_image as string)
      .digest('hex');

    try {
      const cached = await redis.get<string>(cacheKey);
      if (cached) {
        console.log('[generate] cache HIT:', cacheKey);
        return NextResponse.json({ output_url: cached });
      }
      console.log('[generate] cache MISS:', cacheKey);
    } catch (redisErr) {
      console.warn('[generate] Redis read failed, proceeding without cache:', redisErr);
    }

    const n8nPayload = {
      user_email: user.email,
      car_image,
      wheel_image,
      prompt: 'Replace the wheel rims on this car with the rim design from the second image. Keep the EXACT same car body, color, background, lighting, and camera angle. Do not change anything else.',
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 150_000);

    let n8nResponse: Response;
    try {
      const n8nHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
      if (process.env.N8N_WEBHOOK_SECRET) n8nHeaders['X-Webhook-Secret'] = process.env.N8N_WEBHOOK_SECRET;

      n8nResponse = await fetch(n8nUrl, {
        method: 'POST',
        headers: n8nHeaders,
        signal: controller.signal,
        body: JSON.stringify(n8nPayload),
      });
    } catch (fetchErr) {
      if ((fetchErr as Error).name === 'AbortError') {
        throw new Error('İşlem uzun sürdü. Lütfen tekrar deneyin.');
      }
      console.error('[generate] n8n fetch error:', fetchErr);
      throw new Error('Servis geçici olarak kullanılamıyor. Lütfen birkaç dakika sonra tekrar deneyin.');
    } finally {
      clearTimeout(timeoutId);
    }

    if (!n8nResponse.ok) {
      const errBody = await n8nResponse.text().catch(() => '');
      console.error('[generate] n8n error response:', n8nResponse.status, errBody);
      throw new Error('Bir sorun oluştu. Lütfen tekrar deneyin.');
    }

    const text = await n8nResponse.text();
    console.log('[generate] n8n raw response:', text);

    if (!text?.trim()) {
      console.error('[generate] empty response from n8n');
      throw new Error('Görsel oluşturma servisi şu an meşgul. Lütfen birkaç saniye bekleyip tekrar deneyin.');
    }

    let data: Record<string, unknown>;
    try {
      data = JSON.parse(text);
    } catch {
      console.error('[generate] n8n invalid JSON, raw:', text);
      throw new Error('Bir sorun oluştu. Lütfen tekrar deneyin.');
    }

    if (data.error) {
      console.error('[generate] n8n returned error:', data.error);
      throw new Error('Bir sorun oluştu. Lütfen tekrar deneyin.');
    }

    const candidates = [
      data.output_url,
      (data.images as { url?: string }[])?.[0]?.url,
      (data.image as { url?: string })?.url,
      data.url,
    ];

    const rawImageUrl = candidates.find(isValidOutputImageUrl);

    if (!rawImageUrl) {
      console.error('[generate] no valid image URL in response:', data);
      throw new Error('Görsel oluşturulamadı. Lütfen farklı bir fotoğraf ile tekrar deneyin.');
    }

    const imageUrl = await compressAndStore(rawImageUrl);

    try {
      await redis.set(cacheKey, imageUrl, { ex: 604800 });
      console.log('[generate] cached result for 7 days:', cacheKey);
    } catch (redisErr) {
      console.warn('[generate] Redis write failed, continuing:', redisErr);
    }

    return NextResponse.json({ output_url: imageUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Bir hata oluştu';
    console.error('[generate] fatal error:', message);
    return NextResponse.json({ error: toUserMessage(message) }, { status: 500 });
  }
}
