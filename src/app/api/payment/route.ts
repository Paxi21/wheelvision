import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const PACKAGES = {
  starter:  { price: '49.99',  credits: 5,  name: 'Başlangıç Paketi' },
  standard: { price: '99.99',  credits: 15, name: 'Standart Paket'   },
  pro:      { price: '199.99', credits: 40, name: 'Pro Paket'        },
} as const;

type PackageType = keyof typeof PACKAGES;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { packageType: PackageType; userEmail: string };
    const { packageType, userEmail } = body;

    const selectedPackage = PACKAGES[packageType];
    if (!selectedPackage) {
      return NextResponse.json({ error: 'Geçersiz paket türü' }, { status: 400 });
    }

    if (!process.env.IYZICO_API_KEY || !process.env.IYZICO_SECRET_KEY) {
      return NextResponse.json({ error: 'Ödeme sistemi yapılandırılmamış' }, { status: 500 });
    }

    // Lazy-load to avoid Turbopack module resolution crash
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Iyzipay = require('iyzipay');
    const iyzipay = new Iyzipay({
      apiKey: process.env.IYZICO_API_KEY,
      secretKey: process.env.IYZICO_SECRET_KEY,
      uri: process.env.IYZICO_BASE_URL ?? 'https://sandbox-api.iyzipay.com',
    });

    // Fetch user from Supabase to get real data
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: userData } = await supabase
      .from('users')
      .select('id, full_name')
      .eq('email', userEmail)
      .maybeSingle();

    const userId = userData?.id ?? userEmail;
    const fullName = userData?.full_name ?? 'WheelVision User';
    const nameParts = fullName.trim().split(' ');
    const firstName = nameParts[0] ?? 'WheelVision';
    const lastName  = nameParts.slice(1).join(' ') || 'User';

    const conversationId = `wv_${Date.now()}`;
    const basketId       = `bsk_${Date.now()}`;
    const baseUrl        = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
    const callbackUrl    = `${baseUrl}/api/payment/callback`;

    const requestData = {
      locale: Iyzipay.LOCALE.TR,
      conversationId,
      price: selectedPackage.price,
      paidPrice: selectedPackage.price,
      currency: Iyzipay.CURRENCY.TRY,
      basketId,
      paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
      callbackUrl,
      enabledInstallments: [1],
      buyer: {
        id: String(userId),
        name: firstName,
        surname: lastName,
        gsmNumber: '+905350000000',
        email: userEmail,
        identityNumber: '11111111111',
        registrationAddress: 'Türkiye',
        ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '85.34.78.112',
        city: 'Istanbul',
        country: 'Turkey',
      },
      shippingAddress: {
        contactName: fullName,
        city: 'Istanbul',
        country: 'Turkey',
        address: 'Türkiye',
      },
      billingAddress: {
        contactName: fullName,
        city: 'Istanbul',
        country: 'Turkey',
        address: 'Türkiye',
      },
      basketItems: [
        {
          id: packageType,
          name: selectedPackage.name,
          category1: 'Kredi Paketi',
          itemType: Iyzipay.BASKET_ITEM_TYPE.VIRTUAL,
          price: selectedPackage.price,
        },
      ],
    };

    return new Promise<NextResponse>((resolve) => {
      iyzipay.checkoutFormInitialize.create(
        requestData,
        (err: Error | null, result: Record<string, string>) => {
          if (err) {
            console.error('[iyzico] init error:', err.message);
            resolve(NextResponse.json({ error: err.message }, { status: 500 }));
            return;
          }
          if (result.status !== 'success') {
            console.error('[iyzico] init failed:', result.errorCode, result.errorMessage);
            resolve(NextResponse.json(
              { error: result.errorMessage ?? 'iyzico hatası' },
              { status: 500 }
            ));
            return;
          }
          resolve(NextResponse.json({
            checkoutFormContent: result.checkoutFormContent,
            token: result.token,
          }));
        }
      );
    });

  } catch (err) {
    console.error('[iyzico] unexpected error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
