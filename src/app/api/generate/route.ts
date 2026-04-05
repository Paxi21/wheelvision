import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const n8nUrl = process.env.N8N_WEBHOOK_URL!;
const cloudinaryCloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;

// Trusted domains for AI-generated image output
const TRUSTED_IMAGE_DOMAINS = [
  'fal.media',
  'v3.fal.media',
  'res.cloudinary.com',
  'storage.googleapis.com',
];

// In-memory rate limiter: max 5 generations per hour per user
// Note: For multi-instance deployments, replace with Redis
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(email: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000;
  const maxRequests = 5;

  const entry = rateLimitMap.get(email);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(email, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= maxRequests) return false;
  entry.count++;
  return true;
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

// Whitelist-based validation for AI output URLs — prevents open redirect / malicious URLs
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
    // 1. Auth token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.slice(7);

    // 2. Verify session with Supabase
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 3. Rate limit check
    if (!checkRateLimit(user.email)) {
      return NextResponse.json(
        { error: 'Çok fazla istek. Lütfen 1 saat bekleyin.' },
        { status: 429 }
      );
    }

    // 4. Validate request body
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 });
    }

    const { car_image, wheel_image } = body;

    // Only accept Cloudinary URLs from our account — prevents SSRF via arbitrary URLs
    if (!isValidCloudinaryUrl(car_image) || !isValidCloudinaryUrl(wheel_image)) {
      return NextResponse.json({ error: 'Geçersiz görsel URL' }, { status: 400 });
    }

    // 5. Server-side credit check (source of truth: database, not client state)
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

    // 6. Call n8n (URL is server-side only — never exposed to browser)
    const n8nPayload = {
      user_email: user.email,
      car_image,
      wheel_image,
      prompt: 'Replace the wheel rims on this car with the rim design from the second image. Keep the EXACT same car body, color, background, lighting, and camera angle. Do not change anything else.',
    };


    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120_000);

    let n8nResponse: Response;
    try {
      n8nResponse = await fetch(n8nUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Secret': process.env.N8N_WEBHOOK_SECRET ?? '',
        },
        signal: controller.signal,
        body: JSON.stringify(n8nPayload),
      });
    } catch (fetchErr) {
      if ((fetchErr as Error).name === 'AbortError') {
        throw new Error('İstek zaman aşımına uğradı (120s).');
      }
      console.error('[generate] n8n fetch error:', fetchErr);
      throw new Error('İşlem servisi şu an ulaşılamıyor. Lütfen tekrar deneyin.');
    } finally {
      clearTimeout(timeoutId);
    }


    if (!n8nResponse.ok) {
      const errBody = await n8nResponse.text().catch(() => '');
      console.error('[generate] n8n error response body:', errBody);
      throw new Error('Görsel işleme sırasında bir hata oluştu.');
    }

    const text = await n8nResponse.text();
    console.log('[generate] n8n raw response:', text);

    if (!text?.trim()) {
      throw new Error('n8n yanıt vermedi.');
    }

    let data: Record<string, unknown>;
    try {
      data = JSON.parse(text);
    } catch {
      console.error('[generate] n8n invalid JSON, raw:', text);
      throw new Error('Sunucu geçersiz yanıt döndü.');
    }


    if (data.error) {
      const safeErrors = ['Yetersiz kredi'];
      const errMsg = data.error as string;
      throw new Error(safeErrors.includes(errMsg) ? errMsg : 'Görsel oluşturma başarısız.');
    }

    const candidates = [
      data.output_url,
      (data.images as { url?: string }[])?.[0]?.url,
      (data.image as { url?: string })?.url,
      data.url,
    ];


    const imageUrl = candidates.find(isValidOutputImageUrl);

    if (!imageUrl) {
      console.error('[generate] no valid image URL in response:', data);
      throw new Error('Görsel URL bulunamadı.');
    }

    return NextResponse.json({ output_url: imageUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Bir hata oluştu';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
