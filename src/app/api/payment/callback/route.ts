export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

function buildAuthHeader(apiKey: string, secretKey: string, rnd: string, uriPath: string, body: object): string {
  const sig = crypto.createHmac('sha256', secretKey)
    .update(rnd + uriPath + JSON.stringify(body))
    .digest('hex');
  const raw = `apiKey:${apiKey}&randomKey:${rnd}&signature:${sig}`;
  return 'IYZWSv2 ' + Buffer.from(raw).toString('base64');
}

const CREDITS: Record<string, number> = { starter: 5, standard: 15, pro: 40 };

function creditsFromPrice(paidPrice: number): number {
  if (paidPrice >= 199) return 40;
  if (paidPrice >= 99)  return 15;
  return 5;
}

export async function POST(req: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;

  try {
    const formData = await req.formData();
    const token = formData.get('token') as string | null;
    if (!token) return NextResponse.redirect(new URL('/en/pricing?status=failed', baseUrl));

    const apiKey    = process.env.IYZICO_API_KEY!;
    const secretKey = process.env.IYZICO_SECRET_KEY!;
    const iyzBase   = process.env.IYZICO_BASE_URL ?? 'https://sandbox-api.iyzipay.com';
    const rnd       = process.hrtime()[0] + Math.random().toString(8).slice(2);
    const uriPath   = '/payment/iyzipos/checkoutform/auth/ecom/detail';
    const reqBody   = { locale: 'tr', token };

    const res    = await fetch(iyzBase + uriPath, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': buildAuthHeader(apiKey, secretKey, rnd, uriPath, reqBody),
        'x-iyzi-rnd': rnd,
        'x-iyzi-client-version': 'iyzipay-node-2.0.67',
      },
      body: JSON.stringify(reqBody),
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await res.json() as Record<string, any>;
    console.log('[callback] status:', result.status, '| paymentStatus:', result.paymentStatus);
    console.log('[callback] conversationId:', result.conversationId);

    if (result.status !== 'success' || result.paymentStatus !== 'SUCCESS') {
      console.log('[callback] payment failed:', result.errorMessage);
      return NextResponse.redirect(new URL('/en/pricing?status=failed', baseUrl));
    }

    // --- Extract email from conversationId: "email___timestamp" ---
    const conversationId   = (result.conversationId as string) || '';
    const emailFromConvId  = conversationId.split('___')[0];
    const buyerEmail       = (emailFromConvId?.includes('@') ? emailFromConvId : null)
                          ?? result.buyer?.email
                          ?? result.buyer?.id;

    console.log('[callback] extracted email:', buyerEmail);

    if (!buyerEmail || !String(buyerEmail).includes('@')) {
      console.error('[callback] could not resolve buyer email');
      return NextResponse.redirect(new URL('/en/pricing?status=failed', baseUrl));
    }

    // --- Determine credits ---
    const paidPrice    = parseFloat(result.paidPrice || '0');
    const basketItemId = result.basketItems?.[0]?.id as string | undefined;
    const creditsToAdd = (basketItemId && CREDITS[basketItemId])
      ? CREDITS[basketItemId]
      : creditsFromPrice(paidPrice);

    console.log('[callback] paidPrice:', paidPrice, '| creditsToAdd:', creditsToAdd);

    // --- Update Supabase ---
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: user, error: findErr } = await supabase
      .from('users')
      .select('id, credits')
      .eq('email', buyerEmail)
      .single();

    console.log('[callback] found user:', user?.id, 'credits:', user?.credits, '| err:', findErr?.message);

    if (user) {
      const newCredits = (user.credits || 0) + creditsToAdd;
      const { error: updErr } = await supabase
        .from('users')
        .update({ credits: newCredits })
        .eq('id', user.id);
      console.log('[callback] credits:', user.credits, '->', newCredits, '| updErr:', updErr?.message);
    }

    return NextResponse.redirect(new URL(`/en/pricing?status=success&credits=${creditsToAdd}`, baseUrl));

  } catch (err) {
    console.error('[callback] error:', err);
    return NextResponse.redirect(new URL('/en/pricing?status=failed', baseUrl));
  }
}
