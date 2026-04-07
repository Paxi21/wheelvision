import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const CREDITS_MAP: Record<string, number> = {
  starter:  5,
  standard: 15,
  pro:      40,
};

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';

// iyzico POSTs form data to this endpoint after payment
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const token = formData.get('token') as string | null;

    if (!token) {
      console.error('[callback] No token in form data');
      return NextResponse.redirect(new URL('/en/pricing?status=failed', BASE_URL));
    }

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Iyzipay = require('iyzipay');
    const iyzipay = new Iyzipay({
      apiKey: process.env.IYZICO_API_KEY,
      secretKey: process.env.IYZICO_SECRET_KEY,
      uri: process.env.IYZICO_BASE_URL ?? 'https://sandbox-api.iyzipay.com',
    });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    return new Promise<NextResponse>((resolve) => {
      iyzipay.checkoutForm.retrieve(
        { locale: 'tr', token },
        async (err: Error | null, result: Record<string, unknown>) => {
          if (err) {
            console.error('[callback] retrieve error:', err.message);
            resolve(NextResponse.redirect(new URL('/en/pricing?status=failed', BASE_URL)));
            return;
          }

          if (result.status !== 'success' || result.paymentStatus !== 'SUCCESS') {
            console.error('[callback] payment not successful:', result.paymentStatus, result.errorMessage);
            resolve(NextResponse.redirect(new URL('/en/pricing?status=failed', BASE_URL)));
            return;
          }

          const basketItems = result.basketItems as Array<{ id: string }> | undefined;
          const buyer       = result.buyer as { id: string; email: string } | undefined;
          const packageType = basketItems?.[0]?.id;
          const buyerEmail  = buyer?.email;
          const creditsToAdd = packageType ? (CREDITS_MAP[packageType] ?? 0) : 0;

          if (!creditsToAdd || !buyerEmail) {
            console.error('[callback] missing package/buyer info');
            resolve(NextResponse.redirect(new URL('/en/pricing?status=failed', BASE_URL)));
            return;
          }

          // Get current credits, then add
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
            resolve(NextResponse.redirect(new URL('/en/pricing?status=failed', BASE_URL)));
            return;
          }

          console.log(`[callback] ✅ ${buyerEmail} +${creditsToAdd} credits (${packageType})`);
          resolve(NextResponse.redirect(
            new URL(`/en/pricing?status=success&credits=${creditsToAdd}`, BASE_URL)
          ));
        }
      );
    });

  } catch (err) {
    console.error('[callback] unexpected error:', err);
    return NextResponse.redirect(new URL('/en/pricing?status=failed', BASE_URL));
  }
}
