import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const CREDITS_MAP: Record<string, number> = {
  starter:  5,
  standard: 15,
  pro:      40,
};

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';

// iyzico auth: HMAC-SHA256(key=secretKey, data=apiKey+rnd+secretKey+JSON.stringify(body))
function buildAuthHeader(apiKey: string, secretKey: string, rnd: string, body: object): string {
  const hashStr = apiKey + rnd + secretKey + JSON.stringify(body);
  const hash = crypto
    .createHmac('sha256', secretKey)
    .update(hashStr)
    .digest('base64');
  const raw = `apiKey:${apiKey}&randomKey:${rnd}&signature:${hash}`;
  return 'IYZWS ' + Buffer.from(raw).toString('base64');
}

// iyzico POSTs form data to this endpoint after payment
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const token = formData.get('token') as string | null;

    if (!token) {
      console.error('[callback] No token received');
      return NextResponse.redirect(new URL('/en/pricing?status=failed', BASE_URL));
    }

    const apiKey    = process.env.IYZICO_API_KEY!;
    const secretKey = process.env.IYZICO_SECRET_KEY!;
    const baseUrl   = process.env.IYZICO_BASE_URL ?? 'https://sandbox-api.iyzipay.com';

    const rnd         = crypto.randomBytes(8).toString('hex');
    const requestBody = { locale: 'tr', token };
    const authorization = buildAuthHeader(apiKey, secretKey, rnd, requestBody);

    const iyzResponse = await fetch(
      `${baseUrl}/payment/iyzipos/checkoutform/auth/ecom/detail`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authorization,
          'x-iyzi-rnd': rnd,
        },
        body: JSON.stringify(requestBody),
      }
    );

    const result = await iyzResponse.json() as Record<string, unknown>;

    if (result.status !== 'success' || result.paymentStatus !== 'SUCCESS') {
      console.error('[callback] payment not successful:', result.paymentStatus, result.errorMessage);
      return NextResponse.redirect(new URL('/en/pricing?status=failed', BASE_URL));
    }

    const basketItems  = result.basketItems as Array<{ id: string }> | undefined;
    const buyerEmail   = (result.buyer as { email?: string } | undefined)?.email
                      ?? (result.buyerEmail as string | undefined);
    const packageType  = basketItems?.[0]?.id;
    const creditsToAdd = packageType ? (CREDITS_MAP[packageType] ?? 0) : 0;

    if (!creditsToAdd || !buyerEmail) {
      console.error('[callback] missing package or buyer email', { packageType, buyerEmail });
      return NextResponse.redirect(new URL('/en/pricing?status=failed', BASE_URL));
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: user } = await supabase
      .from('users')
      .select('credits')
      .eq('email', buyerEmail)
      .maybeSingle();

    const { error: updateError } = await supabase
      .from('users')
      .update({
        credits: (user?.credits ?? 0) + creditsToAdd,
        plan: packageType,
      })
      .eq('email', buyerEmail);

    if (updateError) {
      console.error('[callback] supabase update error:', updateError.message);
      return NextResponse.redirect(new URL('/en/pricing?status=failed', BASE_URL));
    }

    console.log(`[callback] ✅ ${buyerEmail} +${creditsToAdd} credits (${packageType})`);
    return NextResponse.redirect(
      new URL(`/en/pricing?status=success&credits=${creditsToAdd}`, BASE_URL)
    );

  } catch (err) {
    console.error('[callback] unexpected error:', err);
    return NextResponse.redirect(new URL('/en/pricing?status=failed', BASE_URL));
  }
}
