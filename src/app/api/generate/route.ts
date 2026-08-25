import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';
import { redis } from '@/lib/redis';

export const maxDuration = 30;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
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
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';

  try {
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
      .select('credits, full_name, phone')
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

    // dealer_generations has no job_id/status column — the row's own id IS
    // the job id. We create it here (service role, bypasses RLS) and n8n
    // writes the result back into sonuc_foto_url on this same row, matched
    // by generation_id in the webhook payload below.
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    const { data: genRow, error: insertError } = await supabaseAdmin
      .from('dealer_generations')
      .insert({
        araba_foto_url: car_image,
        wheel_id: null,
        dealer_id: null,
        user_email: user.email,
        musteri_ip: ip,
        musteri_isim: userData.full_name ?? null,
        musteri_telefon: userData.phone ?? null,
      })
      .select('id')
      .single();

    if (insertError || !genRow) {
      console.error('[generate] dealer_generations insert failed:', insertError);
      throw new Error('Bir sorun oluştu. Lütfen tekrar deneyin.');
    }

    const generationId = genRow.id as string;

    // Call n8n — fire the async job; the tracking row already exists for
    // n8n's "update a row" step to write sonuc_foto_url into.
    const n8nPayload = {
      generation_id: generationId,
      user_email: user.email,
      car_image,
      wheel_image,
      prompt: 'Replace the wheel rims on this car with the rim design from the second image. Keep the EXACT same car body, color, background, lighting, and camera angle. Do not change anything else.',
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15_000);

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
      await supabaseAdmin.from('dealer_generations').delete().eq('id', generationId);
      if ((fetchErr as Error).name === 'AbortError') {
        throw new Error('Servis yanıt vermiyor. Lütfen tekrar deneyin.');
      }
      throw new Error('Servis geçici olarak kullanılamıyor.');
    } finally {
      clearTimeout(timeoutId);
    }

    if (!n8nResponse.ok) {
      await supabaseAdmin.from('dealer_generations').delete().eq('id', generationId);
      throw new Error('Bir sorun oluştu. Lütfen tekrar deneyin.');
    }

    // n8n accepted the job — deduct the credit now. The async path returns
    // before the result is ready, so this is the last point in the request
    // lifecycle where we can reliably charge for the generation.
    const { error: creditError } = await supabaseAdmin
      .from('users')
      .update({ credits: userData.credits - 1 })
      .eq('email', user.email);
    if (creditError) {
      console.error('[generate] credit deduction failed:', creditError);
    }

    const data = await n8nResponse.json().catch(() => ({} as Record<string, unknown>));

    // Rare fast path: n8n answered synchronously with a result already.
    if (data.output_url) {
      return NextResponse.json({ output_url: data.output_url });
    }

    // Normal path: processing async — frontend polls dealer_generations by id.
    return NextResponse.json({ status: 'processing', job_id: generationId });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Bir hata oluştu';
    return NextResponse.json({ error: toUserMessage(message) }, { status: 500 });
  }
}
