import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey   = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const n8nUrl       = process.env.N8N_WEBHOOK_URL!;
const cloudName    = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;

// Validate car image is from our Cloudinary account (user-provided input)
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

// Trusted domains for AI output
const TRUSTED = ['fal.media', 'v3.fal.media', 'res.cloudinary.com', 'storage.googleapis.com'];

function isValidOutputUrl(url: unknown): url is string {
  if (typeof url !== 'string') return false;
  try {
    const p = new URL(url);
    return p.protocol === 'https:' && TRUSTED.some(d => p.hostname === d || p.hostname.endsWith(`.${d}`));
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  if (!n8nUrl) {
    return NextResponse.json({ error: 'Servis yapılandırması eksik.' }, { status: 503 });
  }

  try {
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 });
    }

    const { dealer_id, slug, car_image, wheel_id } = body;

    // Validate car image (user input — must be our Cloudinary)
    if (!isValidCloudinaryUrl(car_image)) {
      return NextResponse.json({ error: 'Geçersiz araba görseli' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // 1. Validate dealer — id AND slug must match, dealer must be active
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

    // 2. Check monthly limit
    if (dealer.kullanilan >= dealer.aylik_limit) {
      return NextResponse.json({ error: 'Aylık görsel limiti doldu' }, { status: 402 });
    }

    // 3. Validate wheel belongs to this dealer (prevents cross-dealer spoofing)
    const { data: wheel, error: wheelErr } = await supabase
      .from('dealer_wheels')
      .select('id, jant_adi, jant_foto_url')
      .eq('id', wheel_id)
      .eq('dealer_id', dealer_id)
      .single();

    if (wheelErr || !wheel) {
      return NextResponse.json({ error: 'Jant bulunamadı' }, { status: 404 });
    }

    // 4. Call n8n → Fal AI
    // NOTE: n8n workflow checks Supabase users table for credits.
    // You need a dedicated service user in Supabase:
    //   email: dealer@wheelvision.io, credits: 99999
    // OR create a separate n8n webhook that skips the credit check.
    const n8nPayload = {
      user_email: 'dealer@wheelvision.io',
      car_image,
      wheel_image: wheel.jant_foto_url,
      prompt:
        'Replace the wheel rims on this car with the rim design from the second image. ' +
        'Keep the EXACT same car body, color, background, lighting, and camera angle. ' +
        'Do not change anything else.',
    };

    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), 120_000);

    let n8nRes: Response;
    try {
      n8nRes = await fetch(n8nUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Secret': process.env.N8N_WEBHOOK_SECRET ?? '',
        },
        signal: controller.signal,
        body: JSON.stringify(n8nPayload),
      });
    } catch (err) {
      if ((err as Error).name === 'AbortError') throw new Error('İstek zaman aşımına uğradı.');
      throw new Error('Görsel servisi şu an ulaşılamıyor.');
    } finally {
      clearTimeout(timeoutId);
    }

    if (!n8nRes.ok) throw new Error('Görsel işleme hatası.');

    const text = await n8nRes.text();
    if (!text?.trim()) throw new Error('Servis yanıt vermedi.');

    let data: Record<string, unknown>;
    try { data = JSON.parse(text); }
    catch { throw new Error('Geçersiz servis yanıtı.'); }

    if (data.error) {
      const msg = data.error as string;
      // Map n8n credit error to a clear message
      throw new Error(msg === 'Yetersiz kredi' ? 'Servis kredisi yetersiz. Yönetici ile iletişime geçin.' : 'Görsel oluşturulamadı.');
    }

    // Extract output URL from various response shapes
    const candidates = [
      data.output_url,
      (data.images as { url?: string }[])?.[0]?.url,
      (data.image as { url?: string })?.url,
      data.url,
    ];
    const outputUrl = candidates.find(isValidOutputUrl);
    if (!outputUrl) throw new Error('Görsel URL bulunamadı.');

    // 5. Save generation record
    await supabase.from('dealer_generations').insert({
      dealer_id: dealer.id,
      wheel_id:  wheel.id,
      araba_foto_url: car_image as string,
      sonuc_foto_url: outputUrl,
    });

    // 6. Increment usage counter (ignore errors — non-critical)
    await supabase
      .from('dealers')
      .update({ kullanilan: dealer.kullanilan + 1 })
      .eq('id', dealer.id);

    return NextResponse.json({ output_url: outputUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Bir hata oluştu';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
