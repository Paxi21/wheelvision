import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const CREDITS_MAP: Record<string, number> = {
  starter: 5,
  standard: 15,
  pro: 40,
};

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const token = formData.get('token') as string;

    if (!token) {
      return NextResponse.redirect(new URL('/pricing?status=failed', BASE_URL));
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
      iyzipay.checkoutForm.retrieve({ token }, async (err: Error | null, result: Record<string, unknown>) => {
        if (err || result.status !== 'success' || result.paymentStatus !== 'SUCCESS') {
          console.error('[callback] Payment verification failed:', err ?? result);
          resolve(NextResponse.redirect(new URL('/pricing?status=failed', BASE_URL)));
          return;
        }

        const basketItems = result.basketItems as Array<{ id: string }>;
        const buyer = result.buyer as { id: string };
        const packageType = basketItems[0]?.id;
        const buyerId = buyer?.id;
        const creditsToAdd = CREDITS_MAP[packageType] ?? 0;

        if (!creditsToAdd || !buyerId) {
          resolve(NextResponse.redirect(new URL('/pricing?status=failed', BASE_URL)));
          return;
        }

        const { data: user } = await supabase
          .from('users')
          .select('credits')
          .eq('id', buyerId)
          .maybeSingle();

        await supabase
          .from('users')
          .update({ credits: (user?.credits ?? 0) + creditsToAdd, plan: packageType })
          .eq('id', buyerId);

        resolve(NextResponse.redirect(new URL(`/pricing?status=success&credits=${creditsToAdd}`, BASE_URL)));
      });
    });
  } catch (err) {
    console.error('[callback] Unexpected error:', err);
    return NextResponse.redirect(new URL('/pricing?status=failed', BASE_URL));
  }
}
