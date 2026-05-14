import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { redis } from '@/lib/redis';

export const maxDuration = 120;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const falKey      = process.env.FAL_KEY!;
const cloudName   = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;

const INTERNAL_KEYWORDS = ['supabase', 'Supabase', 'fal.run', 'FAL', 'webhook', 'Webhook'];

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

const TRUSTED = ['fal.media', 'v3.fal.media', 'v3b.fal.media', 'res.cloudinary.com', 'storage.googleapis.com'];
function isValidOutputUrl(url: unknown): url is string {
  if (typeof url !== 'string') return false;
  try {
    const p = new URL(url);
    return p.protocol === 'https:' && TRUSTED.some(d => p.hostname === d || p.hostname.endsWith(`.${d}`));
  } catch { return false; }
}

const PROMPT_RIM_ONLY = `You are a professional automotive photo editor.
Task: swap ONLY the wheel rims on the car in the first image using the exact rim design from the second image.
The new rim must replicate the spoke pattern, finish, color, and design of the reference wheel precisely.
Maintain the correct perspective, angle, and scale of the original wheel position on the car.
Match all lighting, shadows, and reflections so the new rim looks naturally lit by the same environment.
Keep the tire sidewall, brake calipers, and all surrounding car parts completely untouched.
Do NOT change the car body, paint color, windows, interior, background, or road surface.
The final result must look like a real professional photograph — seamless, photorealistic, no artificial edges or artifacts.
Only the rim design changes. Everything else is identical to the original photo.`;

const PROMPT_FULL_WHEEL = `You are a professional automotive photo editor.
Task: replace the COMPLETE wheel assembly (rim AND tire) on the car using the wheel design from the second image.
The new rim must exactly replicate the spoke pattern, finish, color, and design of the reference wheel.
Adjust the tire sidewall height and profile proportionally to fit the new rim diameter.
Maintain the correct perspective, angle, and scale for each wheel position on the car.
Match all lighting, shadows, and reflections so the new wheels look naturally lit.
Do NOT change the car body, paint color, windows, interior, background, or road surface.
The final result must look like a real professional photograph — seamless, photorealistic, no artificial edges or artifacts.`;

export async function POST(request: NextRequest) {
  console.log('[dealer/generate] request received');

  // Rate limit
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const key = `ratelimit:dealer:${ip}`;
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, 60);
    if (count > 5) {
      return NextResponse.json(
        { error: 'Çok fazla istek gönderdiniz. Lütfen 1 dakika bekleyip tekrar deneyin.' },
        { status: 429 }
      );
    }
  } catch (e) {
    console.warn('[dealer/generate] rate limit check failed:', e);
  }

  try {
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 });
    }

    const { dealer_id, slug, car_image, wheel_id, generation_type, custom_wheel_url } = body;

    if (!isValidCloudinaryUrl(car_image)) {
      return NextResponse.json({ error: 'Geçersiz araba görseli' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // 1. Dealer doğrula
    const { data: dealer, error: dealerErr } = await supabase
      .from('dealers')
      .select('id, firma_adi, slug, aktif, aylik_limit, kullanilan')
      .eq('id', dealer_id)
      .eq('slug', slug)
      .eq('aktif', true)
      .single();

    if (dealerErr || !dealer) {
      return NextResponse.json({ error: 'Dealer bulunamadı' }, { status: 404 });
    }

    // 2. Aylık limit kontrolü
    if (dealer.kullanilan >= dealer.aylik_limit) {
      return NextResponse.json({ error: 'Aylık görsel limiti doldu' }, { status: 402 });
    }

    // 3. Jant görselini çöz
    let wheelImageUrl: string;
    let dbWheelId: string | null = null;

    if (wheel_id === '__custom__') {
      if (!isValidCloudinaryUrl(custom_wheel_url)) {
        return NextResponse.json({ error: 'Geçersiz jant görseli' }, { status: 400 });
      }
      wheelImageUrl = custom_wheel_url as string;
    } else {
      const { data: wheel, error: wheelErr } = await supabase
        .from('dealer_wheels')
        .select('id, jant_adi, jant_foto_url')
        .eq('id', wheel_id)
        .eq('dealer_id', dealer_id)
        .single();

      if (wheelErr || !wheel) {
        return NextResponse.json({ error: 'Jant bulunamadı' }, { status: 404 });
      }
      if (!wheel.jant_foto_url) {
        return NextResponse.json({ error: 'Bu janta ait görsel bulunamadı.' }, { status: 400 });
      }
      wheelImageUrl = wheel.jant_foto_url;
      dbWheelId = wheel.id;
    }

    // 4. Bekleyen generation kaydı oluştur
    const { data: genRow, error: genErr } = await supabase
      .from('dealer_generations')
      .insert({
        dealer_id: dealer.id,
        wheel_id: dbWheelId,
        araba_foto_url: car_image as string,
        sonuc_foto_url: null,
      })
      .select('id')
      .single();

    if (genErr || !genRow) {
      console.error('[dealer/generate] generation kaydı oluşturulamadı:', genErr?.message);
      return NextResponse.json({ error: 'İşlem başlatılamadı.' }, { status: 500 });
    }

    const generationId = genRow.id;
    console.log('[dealer/generate] generation_id:', generationId);

    // 5. Fal AI çağrısı (sync, 90s)
    const prompt = generation_type === 'full_wheel' ? PROMPT_FULL_WHEEL : PROMPT_RIM_ONLY;

    const falRes = await fetch('https://fal.run/fal-ai/nano-banana-2/edit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${falKey}`,
      },
      body: JSON.stringify({
        image_urls: [car_image, wheelImageUrl],
        prompt,
        strength: 0.43,
        guidance_scale: 9,
        num_inference_steps: 50,
      }),
      signal: AbortSignal.timeout(90_000),
    });

    const falData = await falRes.json() as { images?: { url: string }[]; error?: string };
    console.log('[dealer/generate] fal response status:', falRes.status);

    const genHeaders = { 'X-Generation-Id': generationId };

    if (!falRes.ok || !falData.images?.[0]?.url) {
      const errMsg = falData.error ?? 'Görsel oluşturulamadı';
      await supabase.from('dealer_generations').update({ sonuc_foto_url: '__error__' }).eq('id', generationId);
      return NextResponse.json({ error: toUserMessage(errMsg) }, { status: 502, headers: genHeaders });
    }

    const outputUrl = falData.images[0].url;

    if (!isValidOutputUrl(outputUrl)) {
      await supabase.from('dealer_generations').update({ sonuc_foto_url: '__error__' }).eq('id', generationId);
      return NextResponse.json({ error: 'Geçersiz sonuç görseli' }, { status: 502, headers: genHeaders });
    }

    // 6. Sonucu DB'ye yaz + kullanım sayacını artır
    await Promise.all([
      supabase.from('dealer_generations').update({ sonuc_foto_url: outputUrl }).eq('id', generationId),
      supabase.from('dealers').update({ kullanilan: dealer.kullanilan + 1 }).eq('id', dealer.id),
    ]);

    console.log('[dealer/generate] done — output_url:', outputUrl);

    // 7. Frontend'e hem output_url hem generation_id dön
    return NextResponse.json({ output_url: outputUrl, generation_id: generationId }, { headers: genHeaders });

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Bir hata oluştu';
    console.error('[dealer/generate] fatal error:', message);
    return NextResponse.json({ error: toUserMessage(message) }, { status: 500 });
  }
}
