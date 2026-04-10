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

export async function POST(req: NextRequest) {
  console.log('=== CALLBACK STARTED ===');

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;

  try {
    // Email from callbackUrl query param (most reliable)
    const { searchParams } = new URL(req.url);
    const emailFromUrl = searchParams.get('email');
    console.log('[callback] email from URL:', emailFromUrl);

    const formData = await req.formData();
    const token = formData.get('token') as string | null;
    console.log('[callback] token:', token ? token.substring(0, 20) + '...' : 'MISSING');

    if (!token) {
      return NextResponse.redirect(new URL('/en/pricing?status=failed&reason=no_token', baseUrl));
    }

    // Retrieve payment from iyzico
    const apiKey    = process.env.IYZICO_API_KEY!;
    const secretKey = process.env.IYZICO_SECRET_KEY!;
    const iyzBase   = process.env.IYZICO_BASE_URL ?? 'https://sandbox-api.iyzipay.com';
    const rnd       = process.hrtime()[0] + Math.random().toString(8).slice(2);
    const uriPath   = '/payment/iyzipos/checkoutform/auth/ecom/detail';
    const reqBody   = { locale: 'tr', token };

    const res = await fetch(iyzBase + uriPath, {
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
    console.log('[callback] iyzico result status:', result?.status);
    console.log('[callback] iyzico paymentStatus:', result?.paymentStatus);
    console.log('[callback] conversationId:', result?.conversationId);
    console.log('[callback] paidPrice:', result?.paidPrice);

    if (result.status !== 'success' || result.paymentStatus !== 'SUCCESS') {
      console.log('[callback] PAYMENT FAILED:', result.errorMessage);
      return NextResponse.redirect(new URL('/en/pricing?status=failed', baseUrl));
    }

    console.log('[callback] PAYMENT SUCCESS!');

    // Resolve email: URL param → conversationId → buyer fields
    const convEmail = ((result.conversationId as string) || '').split('___')[0];
    const email = emailFromUrl
      ?? (convEmail?.includes('@') ? convEmail : null)
      ?? result.buyer?.email
      ?? result.buyer?.id;

    console.log('[callback] extracted email:', email);

    if (!email || !String(email).includes('@')) {
      console.error('[callback] could not resolve buyer email');
      return NextResponse.redirect(new URL('/en/pricing?status=failed', baseUrl));
    }

    // Determine credits and plan from price
    const paidPrice = parseFloat(result.paidPrice || '0');
    let creditsToAdd = 5;
    let planName = 'starter';
    if (paidPrice >= 199) { creditsToAdd = 40; planName = 'pro'; }
    else if (paidPrice >= 99) { creditsToAdd = 15; planName = 'standard'; }
    else if (paidPrice >= 49) { creditsToAdd = 5; planName = 'starter'; }
    console.log('[callback] paidPrice:', paidPrice, '| creditsToAdd:', creditsToAdd, '| plan:', planName);

    // Update Supabase
    console.log('[callback] SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('[callback] SERVICE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    console.log('[callback] finding user with email:', email);
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('id, email, credits')
      .eq('email', email)
      .single();

    console.log('[callback] find result - user:', JSON.stringify(user), '| error:', findError?.message);

    if (user && !findError) {
      const newCredits = (user.credits || 0) + creditsToAdd;
      console.log('[callback] updating credits:', user.credits, '+', creditsToAdd, '=', newCredits);

      const { error: updateError } = await supabase
        .from('users')
        .update({ credits: newCredits, is_paid: true, plan: planName })
        .eq('id', user.id);

      console.log('[callback] update error:', updateError?.message ?? 'none');

      if (!updateError) {
        console.log('[callback] SUCCESS - credits updated!');
      }
    }

    return NextResponse.redirect(new URL(`/en/pricing?status=success&credits=${creditsToAdd}`, baseUrl));

  } catch (err) {
    console.error('[callback] CATCH ERROR:', err);
    return NextResponse.redirect(new URL('/en/pricing?status=failed&reason=error', baseUrl));
  }
}
