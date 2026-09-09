import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';
import { redis } from '@/lib/redis';
import tinify from 'tinify';

export const maxDuration = 300;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const n8nUrl = process.env.N8N_WEBHOOK_URL!;
const n8nSecret = process.env.N8N_WEBHOOK_SECRET || '';
const cloudinaryCloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;

const DEALER_SERVICE_EMAIL = 'dealer@wheelvision.io';

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

    console.log('[dealer/generate] TinyPNG compressed + uploaded to Cloudinary');
    return json.secure_url;
  } catch (err) {
    console.warn('[dealer/generate] compression skipped:', err);
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

// ── Dealer-based auth: public /d/[slug] ziyaretçileri, dealer_id + slug ile ──
async function handleDealerRequest(body: Record<string, unknown>) {
  const { dealer_id, slug, car_image, wheel_id, generation_type, custom_wheel_url } = body;

  if (!isValidCloudinaryUrl(car_image)) {
    return NextResponse.json({ error: 'Geçersiz araba görseli' }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  // Dealer_id + slug'ı BİRLİKTE doğrula — sadece dealer_id yetmez (cross-dealer spoofing koruması)
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

  if (dealer.kullanilan >= dealer.aylik_limit) {
    return NextResponse.json({ error: 'Aylık görsel limiti doldu' }, { status: 402 });
  }

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

  // n8n workflow kredi kontrolü users tablosundan email ile yapıyor — dealer service user'ı hazırla
  const { data: svcUser } = await supabase
    .from('users')
    .select('credits')
    .eq('email', DEALER_SERVICE_EMAIL)
    .maybeSingle();

  if (!svcUser) {
    await supabase.from('users').upsert({
      email: DEALER_SERVICE_EMAIL, full_name: 'Dealer Service', credits: 99999, is_verified: true,
    }, { onConflict: 'email' });
  } else if (svcUser.credits < 100) {
    await supabase.from('users').update({ credits: 99999 }).eq('email', DEALER_SERVICE_EMAIL);
  }

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

  const generationId = genRow.id as string;
  const genHeaders = { 'X-Generation-Id': generationId };
  console.log('[dealer/generate] generation_id:', generationId);

  const prompt = generation_type === 'full_wheel' ? PROMPT_FULL_WHEEL : PROMPT_RIM_ONLY;

  let n8nRes: Response;
  try {
    n8nRes = await fetch(n8nUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': n8nSecret,
      },
      body: JSON.stringify({
        car_image,
        wheel_image: wheelImageUrl,
        prompt,
        email: DEALER_SERVICE_EMAIL,
      }),
      signal: AbortSignal.timeout(90_000),
    });
  } catch (fetchErr) {
    await supabase.from('dealer_generations').update({ sonuc_foto_url: '__error__' }).eq('id', generationId);
    const msg = (fetchErr as Error).name === 'AbortError'
      ? 'İşlem uzun sürdü. Lütfen tekrar deneyin.'
      : 'Servis geçici olarak kullanılamıyor. Lütfen birkaç dakika sonra tekrar deneyin.';
    return NextResponse.json({ error: msg }, { status: 502, headers: genHeaders });
  }

  const n8nData = await n8nRes.json().catch(() => ({})) as { output_url?: string; error?: string };
  console.log('[dealer/generate] n8n response:', JSON.stringify(n8nData));

  if (!n8nRes.ok || !isValidOutputImageUrl(n8nData.output_url)) {
    const errMsg = n8nData.error ?? 'Görsel oluşturulamadı';
    await supabase.from('dealer_generations').update({ sonuc_foto_url: '__error__' }).eq('id', generationId);
    return NextResponse.json({ error: toUserMessage(errMsg) }, { status: 502, headers: genHeaders });
  }

  const outputUrl = await compressAndStore(n8nData.output_url);

  await Promise.all([
    supabase.from('dealer_generations').update({ sonuc_foto_url: outputUrl }).eq('id', generationId),
    supabase.from('dealers').update({ kullanilan: dealer.kullanilan + 1 }).eq('id', dealer.id),
  ]);

  console.log('[dealer/generate] done — output_url:', outputUrl);

  return NextResponse.json({ output_url: outputUrl, generation_id: generationId }, { headers: genHeaders });
}

// ── User-based auth: Supabase Bearer token ile giriş yapmış kullanıcı ──
async function handleUserRequest(request: NextRequest, body: Record<string, unknown>) {
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
      console.log('[dealer/generate] cache HIT:', cacheKey);
      return NextResponse.json({ output_url: cached });
    }
    console.log('[dealer/generate] cache MISS:', cacheKey);
  } catch (redisErr) {
    console.warn('[dealer/generate] Redis read failed, proceeding without cache:', redisErr);
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
    if (n8nSecret) n8nHeaders['X-Webhook-Secret'] = n8nSecret;

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
    console.error('[dealer/generate] n8n fetch error:', fetchErr);
    throw new Error('Servis geçici olarak kullanılamıyor. Lütfen birkaç dakika sonra tekrar deneyin.');
  } finally {
    clearTimeout(timeoutId);
  }

  if (!n8nResponse.ok) {
    const errBody = await n8nResponse.text().catch(() => '');
    console.error('[dealer/generate] n8n error response:', n8nResponse.status, errBody);
    throw new Error('Bir sorun oluştu. Lütfen tekrar deneyin.');
  }

  const text = await n8nResponse.text();
  console.log('[dealer/generate] n8n raw response:', text);

  if (!text?.trim()) {
    console.error('[dealer/generate] empty response from n8n');
    throw new Error('Görsel oluşturma servisi şu an meşgul. Lütfen birkaç saniye bekleyip tekrar deneyin.');
  }

  let data: Record<string, unknown>;
  try {
    data = JSON.parse(text);
  } catch {
    console.error('[dealer/generate] n8n invalid JSON, raw:', text);
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

  const rawImageUrl = candidates.find(isValidOutputImageUrl);

  if (!rawImageUrl) {
    console.error('[dealer/generate] no valid image URL in response:', data);
    throw new Error('Görsel oluşturulamadı. Lütfen farklı bir fotoğraf ile tekrar deneyin.');
  }

  const imageUrl = await compressAndStore(rawImageUrl);

  try {
    await redis.set(cacheKey, imageUrl, { ex: 604800 });
    console.log('[dealer/generate] cached result for 7 days:', cacheKey);
  } catch (redisErr) {
    console.warn('[dealer/generate] Redis write failed, continuing:', redisErr);
  }

  return NextResponse.json({ output_url: imageUrl });
}

export async function POST(request: NextRequest) {
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
    console.warn('[dealer/generate] rate limit check failed (Redis error), allowing request:', e);
  }

  if (!n8nUrl) {
    console.error('[dealer/generate] N8N_WEBHOOK_URL environment variable is not set');
    return NextResponse.json({ error: 'Servis yapılandırması eksik. Lütfen yönetici ile iletişime geçin.' }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 });
  }

  try {
    const { dealer_id, slug } = body;

    // dealer_id + slug birlikte geldiyse — public dealer sayfası akışı, dealer-based auth
    if (typeof dealer_id === 'string' && dealer_id && typeof slug === 'string' && slug) {
      return await handleDealerRequest(body);
    }

    // aksi halde — mevcut user-based (Supabase Bearer token) auth akışı
    return await handleUserRequest(request, body);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Bir hata oluştu';
    console.error('[dealer/generate] fatal error:', message);
    return NextResponse.json({ error: toUserMessage(message) }, { status: 500 });
  }
}
