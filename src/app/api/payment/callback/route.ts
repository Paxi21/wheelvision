export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Same auth implementation as payment/route.ts
function buildAuthHeader(
  apiKey: string,
  secretKey: string,
  randomString: string,
  uriPath: string,
  body: object
): string {
  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(randomString + uriPath + JSON.stringify(body))
    .digest('hex');

  const authorizationParams = [
    'apiKey:' + apiKey,
    'randomKey:' + randomString,
    'signature:' + signature,
  ].join('&');

  return 'IYZWSv2 ' + Buffer.from(authorizationParams).toString('base64');
}

function generateRandomString(): string {
  return process.hrtime()[0] + Math.random().toString(8).slice(2);
}

export async function POST(req: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;

  try {
    const formData = await req.formData();
    const token = formData.get('token') as string | null;

    console.log('[callback] token received:', token);

    if (!token) {
      console.log('[callback] no token');
      return NextResponse.redirect(new URL('/en/pricing?status=failed&reason=no_token', baseUrl));
    }

    const apiKey    = process.env.IYZICO_API_KEY!;
    const secretKey = process.env.IYZICO_SECRET_KEY!;
    const iyzBase   = process.env.IYZICO_BASE_URL ?? 'https://sandbox-api.iyzipay.com';

    const randomString = generateRandomString();
    const uriPath      = '/payment/iyzipos/checkoutform/auth/ecom/detail';
    const requestBody  = { locale: 'tr', token };

    const authorization = buildAuthHeader(apiKey, secretKey, randomString, uriPath, requestBody);

    const response = await fetch(iyzBase + uriPath, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': authorization,
        'x-iyzi-rnd': randomString,
        'x-iyzi-client-version': 'iyzipay-node-2.0.67',
      },
      body: JSON.stringify(requestBody),
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await response.json() as Record<string, any>;
    console.log('[callback] iyzico retrieve result:', JSON.stringify(result, null, 2));

    if (result.status === 'success' && result.paymentStatus === 'SUCCESS') {
      console.log('[callback] payment successful!');

      // Determine credits from price — hoisted so redirect can use it
      const paidPrice = parseFloat(result.paidPrice || '0');
      let creditsToAdd = 5;
      if (paidPrice >= 199) creditsToAdd = 40;
      else if (paidPrice >= 99) creditsToAdd = 15;
      else if (paidPrice >= 49) creditsToAdd = 5;

      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const buyerEmail = result.buyer?.email as string | undefined;
        console.log('[callback] paidPrice:', paidPrice, '| creditsToAdd:', creditsToAdd);
        console.log('[callback] result.buyer full:', JSON.stringify(result.buyer));
        console.log('[callback] iyzico buyer email:', buyerEmail);

        // Debug: list sample users to verify table access
        const { data: allUsers, error: listError } = await supabase
          .from('users')
          .select('id, email, credits')
          .limit(3);
        console.log('[callback] Sample users:', JSON.stringify(allUsers), '| listError:', listError?.message);

        if (buyerEmail) {
          const { data: user, error: userError } = await supabase
            .from('users')
            .select('id, email, credits')
            .eq('email', buyerEmail)
            .single();
          console.log('[callback] Found user:', JSON.stringify(user), '| userError:', userError?.message);

          if (user && !userError) {
            const newCredits = (user.credits || 0) + creditsToAdd;
            const { error: updateError } = await supabase
              .from('users')
              .update({ credits: newCredits })
              .eq('id', user.id);
            console.log('[callback] credits updated:', user.credits, '->', newCredits, '| updateError:', updateError?.message);
          }
        }
      } catch (dbError) {
        console.error('[callback] database error:', dbError);
      }

      return NextResponse.redirect(new URL(`/en/pricing?status=success&credits=${creditsToAdd}`, baseUrl));

    } else {
      const reason = encodeURIComponent((result.errorMessage as string) || 'unknown');
      console.log('[callback] payment not successful:', result.status, result.errorMessage);
      return NextResponse.redirect(new URL(`/en/pricing?status=failed&reason=${reason}`, baseUrl));
    }

  } catch (error) {
    console.error('[callback] error:', error);
    return NextResponse.redirect(new URL('/en/pricing?status=failed&reason=server_error', baseUrl));
  }
}
