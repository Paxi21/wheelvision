import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';
import { redis } from '@/lib/redis';

export const maxDuration = 30;

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
    console.warn('[generate] rate limit check failed:', e);
  }

  if (!n8nUrl) {
    return NextResponse.json({ error: 'Servis yapılandırması eksik.' }, { status: 503 });
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

    // Cache check
    const cacheKey = 'wheel:' + createHash('sha256')
      .update(car_image as string + ':' + wheel_image as string)
      .digest('hex');

    try {
      const cached = await redis.get<string>(cacheKey);
      if (cached) {
        return NextResponse.json({ output_url: cached });
      }
    } catch (redisErr) {
      console.warn('[generate] Redis read failed:', redisErr);
    }

    // Call n8n — returns immediately with job_id
    const n8nPayload = {
      user_email: user.email,
      car_image,
      wheel_image,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15_000);

    let n8nResponse: Response;
    try {
      n8nResponse = await fetch(n8nUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify(n8nPayload),
      });
    } catch (fetchErr) {
      if ((fetchErr as Error).name === 'AbortError') {
        throw new Error('Servis yanıt vermiyor. Lütfen tekrar deneyin.');
      }
      throw new Error('Servis geçici olarak kullanılamıyor.');
    } finally {
      clearTimeout(timeoutId);
    }

    if (!n8nResponse.ok) {
      throw new Error('Bir sorun oluştu. Lütfen tekrar deneyin.');
    }

    const data = await n8nResponse.json();

    if (data.job_id) {
      return NextResponse.json({ status: 'processing', job_id: data.job_id });
    }

    if (data.output_url) {
      return NextResponse.json({ output_url: data.output_url });
    }

    throw new Error('Beklenmeyen yanıt.');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Bir hata oluştu';
    return NextResponse.json({ error: toUserMessage(message) }, { status: 500 });
  }
}
