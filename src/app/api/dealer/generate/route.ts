import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { redis } from '@/lib/redis';

export const maxDuration = 120;

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey   = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const n8nUrl       = process.env.N8N_WEBHOOK_URL!;
const cloudName    = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;

const INTERNAL_KEYWORDS = ['dealer@wheelvision.io', 'supabase', 'Supabase', 'n8n', 'N8N', 'webhook', 'Webhook'];

function toUserMessage(msg: string): string {
  if (INTERNAL_KEYWORDS.some(k => msg.includes(k))) {
    return 'Bir sorun oluştu. Lütfen tekrar deneyin.';
  }
  return msg;
}

function isValidCloudinaryUrl(url: unknown): boolean {
  if (typeof url !== 'string') return false;
  try {
    const p = new URL(url);
    return (
      p.protocol === 'https:' &&
      p.hostname === 'res.cloudinary.com' &&
      p.pathname.startsWith(`/${cloudName}/`)
    );
  } catch {
    return false;
  }
}

const TRUSTED = ['fal.media', 'v3.fal.media', 'res.cloudinary.com', 'storage.googleapis.com'];
function isValidOutputUrl(url: unknown): url is string {
  if (typeof url !== 'string') return false;
  try {
    const p = new URL(url);
    return p.protocol === 'https:' && TRUSTED.some(d => p.hostname === d || p.hostname.endsWith(`.${d}`));
  } catch { return false; }
}

export async function POST(request: NextRequest) {
  console.log('[dealer/generate] request received');

  // IP rate limit — 5 requests/min, fail open on Redis error
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
    console.warn('[dealer/generate] rate limit check failed (Redis error), allowing request:', e);
  }

  if (!n8nUrl) {
    console.error('[dealer/generate] N8N_WEBHOOK_URL is not set');
    return NextResponse.json({ error: 'Servis yapılandırması eksik.' }, { status: 503 });
  }
  console.log('[dealer/generate] n8n URL:', n8nUrl);

  try {
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 });
    }

    const { dealer_id, slug, car_image, wheel_id, generation_type, custom_wheel_url } = body;
    console.log('[dealer/generate] dealer_id:', dealer_id, 'slug:', slug, 'wheel_id:', wheel_id, 'generation_type:', generation_type);

    if (!isValidCloudinaryUrl(car_image)) {
      console.error('[dealer/generate] invalid car_image URL:', car_image);
      return NextResponse.json({ error: 'Geçersiz araba görseli' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // 1. Validate dealer
    const { data: dealer, error: dealerErr } = await supabase
      .from('dealers')
      .select('id, firma_adi, slug, aktif, aylik_limit, kullanilan')
      .eq('id', dealer_id)
      .eq('slug', slug)
      .eq('aktif', true)
      .single();

    if (dealerErr || !dealer) {
      console.error('[dealer/generate] dealer not found:', dealerErr?.message);
      return NextResponse.json({ error: 'Dealer bulunamadı' }, { status: 404 });
    }
    console.log('[dealer/generate] dealer OK:', dealer.firma_adi, `usage: ${dealer.kullanilan}/${dealer.aylik_limit}`);

    // 2. Monthly limit
    if (dealer.kullanilan >= dealer.aylik_limit) {
      return NextResponse.json({ error: 'Aylık görsel limiti doldu' }, { status: 402 });
    }

    // 3. Resolve wheel image
    let wheelImageUrl: string;
    let dbWheelId: string | null = null;

    if (wheel_id === '__custom__') {
      if (!isValidCloudinaryUrl(custom_wheel_url)) {
        console.error('[dealer/generate] invalid custom_wheel_url:', custom_wheel_url);
        return NextResponse.json({ error: 'Geçersiz jant görseli' }, { status: 400 });
      }
      wheelImageUrl = custom_wheel_url as string;
      console.log('[dealer/generate] using custom wheel URL:', wheelImageUrl);
    } else {
      const { data: wheel, error: wheelErr } = await supabase
        .from('dealer_wheels')
        .select('id, jant_adi, jant_foto_url')
        .eq('id', wheel_id)
        .eq('dealer_id', dealer_id)
        .single();

      if (wheelErr || !wheel) {
        console.error('[dealer/generate] wheel not found:', wheelErr?.message);
        return NextResponse.json({ error: 'Jant bulunamadı' }, { status: 404 });
      }
      if (!wheel.jant_foto_url) {
        console.error('[dealer/generate] wheel has no image URL:', wheel.id);
        return NextResponse.json({ error: 'Bu janta ait görsel bulunamadı. Lütfen başka bir jant seçin.' }, { status: 400 });
      }
      console.log('[dealer/generate] wheel OK:', wheel.jant_adi);
      wheelImageUrl = wheel.jant_foto_url;
      dbWheelId = wheel.id;
    }

    // 4. Ensure dealer service user exists in Supabase so n8n credit check passes.
    //    If not found, create it on-the-fly with high credits.
    const { data: serviceUser } = await supabase
      .from('users')
      .select('email, credits')
      .eq('email', 'dealer@wheelvision.io')
      .single();

    if (!serviceUser) {
      console.log('[dealer/generate] creating dealer service user in Supabase...');
      const { error: insertErr } = await supabase.from('users').insert({
        email: 'dealer@wheelvision.io',
        full_name: 'Dealer Service',
        credits: 99999,
        is_verified: true,
      });
      if (insertErr) {
        console.error('[dealer/generate] failed to create service user:', insertErr.message);
        // Not fatal — continue; n8n might still work if user was created previously
      } else {
        console.log('[dealer/generate] service user created OK');
      }
    } else {
      console.log('[dealer/generate] service user exists, credits:', serviceUser.credits);
      // Replenish if running low
      if (serviceUser.credits < 100) {
        await supabase
          .from('users')
          .update({ credits: 99999 })
          .eq('email', 'dealer@wheelvision.io');
        console.log('[dealer/generate] replenished service user credits to 99999');
      }
    }

    // 5. Call n8n
    const prompt = generation_type === 'full_wheel'
      ? 'You are a professional automotive photo editor. ' +
        'Task: replace the COMPLETE wheel assembly (rim AND tire) on the car using the wheel design from the second image. ' +
        'The new rim must exactly replicate the spoke pattern, finish, color, and design of the reference wheel. ' +
        'Adjust the tire sidewall height and profile proportionally to fit the new rim diameter. ' +
        'Maintain the correct perspective, angle, and scale for each wheel position on the car. ' +
        'Match all lighting, shadows, and reflections so the new wheels look naturally lit. ' +
        'Do NOT change the car body, paint color, windows, interior, background, or road surface. ' +
        'The final result must look like a real professional photograph — seamless, photorealistic, no artificial edges or artifacts.'
      : 'You are a professional automotive photo editor. ' +
        'Task: swap ONLY the wheel rims on the car in the first image using the exact rim design from the second image. ' +
        'The new rim must replicate the spoke pattern, finish, color, and design of the reference wheel precisely. ' +
        'Maintain the correct perspective, angle, and scale of the original wheel position on the car. ' +
        'Match all lighting, shadows, and reflections so the new rim looks naturally lit by the same environment. ' +
        'Keep the tire sidewall, brake calipers, and all surrounding car parts completely untouched. ' +
        'Do NOT change the car body, paint color, windows, interior, background, or road surface. ' +
        'The final result must look like a real professional photograph — seamless, photorealistic, no artificial edges or artifacts. ' +
        'Only the rim design changes. Everything else is identical to the original photo.';

    const n8nPayload = {
      user_email: 'dealer@wheelvision.io',
      car_image,
      wheel_image: wheelImageUrl,
      prompt,
    };
    console.log('[dealer/generate] calling n8n...');

    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), 90_000);

    let n8nRes: Response;
    try {
      const n8nHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
      if (process.env.N8N_WEBHOOK_SECRET) n8nHeaders['X-Webhook-Secret'] = process.env.N8N_WEBHOOK_SECRET;

      n8nRes = await fetch(n8nUrl, {
        method: 'POST',
        headers: n8nHeaders,
        signal: controller.signal,
        body: JSON.stringify(n8nPayload),
      });
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        throw new Error('İşlem uzun sürdü. Lütfen tekrar deneyin.');
      }
      console.error('[dealer/generate] n8n fetch error:', err);
      throw new Error('Servis geçici olarak kullanılamıyor. Lütfen birkaç dakika sonra tekrar deneyin.');
    } finally {
      clearTimeout(timeoutId);
    }

    console.log('[dealer/generate] n8n status:', n8nRes.status, n8nRes.statusText);

    if (!n8nRes.ok) {
      const errBody = await n8nRes.text().catch(() => '');
      console.error('[dealer/generate] n8n error response:', n8nRes.status, errBody);
      throw new Error('Bir sorun oluştu. Lütfen tekrar deneyin.');
    }

    const text = await n8nRes.text();
    console.log('[dealer/generate] n8n raw response:', text);

    if (!text?.trim()) {
      console.error('[dealer/generate] empty response from n8n — workflow may not have reached Respond node');
      throw new Error('Görsel oluşturma servisi şu an meşgul. Lütfen birkaç saniye bekleyip tekrar deneyin.');
    }

    let data: Record<string, unknown>;
    try { data = JSON.parse(text); }
    catch {
      console.error('[dealer/generate] invalid JSON from n8n:', text);
      throw new Error('Bir sorun oluştu. Lütfen tekrar deneyin.');
    }

    if (data.error) {
      console.error('[dealer/generate] n8n returned error:', data.error);
      throw new Error('Bir sorun oluştu. Lütfen tekrar deneyin.');
    }

    const candidates = [
      data.output_url,
      (data.images as { url?: string }[])?.[0]?.url,
      (data.image as { url?: string })?.url,
      data.url,
    ];
    const outputUrl = candidates.find(isValidOutputUrl);
    if (!outputUrl) {
      console.error('[dealer/generate] no valid image URL in response:', data);
      throw new Error('Görsel oluşturulamadı. Lütfen farklı bir fotoğraf ile tekrar deneyin.');
    }
    console.log('[dealer/generate] output URL:', outputUrl);

    // 6. Save to DB (skip for custom wheel uploads)
    if (dbWheelId) {
      await supabase.from('dealer_generations').insert({
        dealer_id: dealer.id,
        wheel_id:  dbWheelId,
        araba_foto_url: car_image as string,
        sonuc_foto_url: outputUrl,
      });
    }

    // 7. Increment usage
    await supabase
      .from('dealers')
      .update({ kullanilan: dealer.kullanilan + 1 })
      .eq('id', dealer.id);

    console.log('[dealer/generate] success');
    return NextResponse.json({ output_url: outputUrl });

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Bir hata oluştu';
    console.error('[dealer/generate] fatal error:', message);
    return NextResponse.json({ error: toUserMessage(message) }, { status: 500 });
  }
}
