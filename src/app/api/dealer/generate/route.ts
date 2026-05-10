import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { redis } from '@/lib/redis';

export const maxDuration = 30;

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey   = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const cloudName    = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
const WHEEL_SWAP_API = process.env.WHEEL_SWAP_API_URL || 'http://72.61.191.108:5679';

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

// Python wheel swap API'ye fire-and-forget istek gönder
// API async işler ve Supabase'i kendisi günceller
function fireWheelSwap(generationId: string, carImageUrl: string, wheelImageUrl: string): void {
  fetch(`${WHEEL_SWAP_API}/swap-wheels`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      generation_id: generationId,
      car_image_url: carImageUrl,
      wheel_image_url: wheelImageUrl,
    }),
    signal: AbortSignal.timeout(10000),
  }).catch((e: Error) => {
    console.error('[dealer/generate] fireWheelSwap error:', e.message);
  });
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

    // 5. Kullanım sayacını artır
    await supabase
      .from('dealers')
      .update({ kullanilan: dealer.kullanilan + 1 })
      .eq('id', dealer.id);

    // 6. Python wheel swap API'ye fire-and-forget gönder
    // API async işler, sonucu dealer_generations.sonuc_foto_url'e yazar
    fireWheelSwap(generationId, car_image as string, wheelImageUrl);

    console.log('[dealer/generate] wheel swap API fired, returning immediately');

    // 7. Frontend'e hemen cevap dön
    return NextResponse.json({ generation_id: generationId, status: 'processing' });

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Bir hata oluştu';
    console.error('[dealer/generate] fatal error:', message);
    return NextResponse.json({ error: toUserMessage(message) }, { status: 500 });
  }
}
