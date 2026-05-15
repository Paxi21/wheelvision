import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { redis } from '@/lib/redis';

export const maxDuration = 120;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const cloudName   = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
const VPS_SWAP_URL = process.env.VPS_SWAP_URL || 'http://72.61.191.108:5679/swap-wheel';

const INTERNAL_KEYWORDS = ['supabase', 'Supabase', 'fal.run', 'FAL', 'webhook', 'Webhook', '72.61'];

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

    const { dealer_id, slug, car_image, wheel_id, custom_wheel_url } = body;

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

    // 4. Generation kaydı oluştur
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
    const genHeaders   = { 'X-Generation-Id': generationId };
    console.log('[dealer/generate] generation_id:', generationId);

    // 5. VPS swap-wheel API çağrısı (110s timeout)
    const vpsRes = await fetch(VPS_SWAP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        car_image_url:   car_image,
        wheel_image_url: wheelImageUrl,
      }),
      signal: AbortSignal.timeout(110_000),
    });

    const vpsData = await vpsRes.json() as { result_url?: string; error?: string };
    console.log('[dealer/generate] vps response status:', vpsRes.status);

    if (!vpsRes.ok || !vpsData.result_url) {
      const errMsg = vpsData.error ?? 'Görsel oluşturulamadı';
      await supabase.from('dealer_generations').update({ sonuc_foto_url: '__error__' }).eq('id', generationId);
      return NextResponse.json({ error: toUserMessage(errMsg) }, { status: 502, headers: genHeaders });
    }

    const outputUrl = vpsData.result_url;

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

    return NextResponse.json({ output_url: outputUrl, generation_id: generationId }, { headers: genHeaders });

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Bir hata oluştu';
    console.error('[dealer/generate] fatal error:', message);
    return NextResponse.json({ error: toUserMessage(message) }, { status: 500 });
  }
}
