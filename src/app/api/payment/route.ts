export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // Dynamic import — avoids module-level crash from iyzipay's fs.readdirSync
    const Iyzipay = (await import('iyzipay')).default;

    const { packageType, userId, userEmail } = await req.json();

    const packages: Record<string, { price: string; credits: number; name: string }> = {
      starter:  { price: '49.99',  credits: 5,  name: 'Baslangic Paketi' },
      standard: { price: '99.99',  credits: 15, name: 'Standart Paket'   },
      pro:      { price: '199.99', credits: 40, name: 'Pro Paket'        },
    };

    const selectedPackage = packages[packageType];
    if (!selectedPackage) {
      return NextResponse.json({ error: 'Invalid package' }, { status: 400 });
    }

    const iyzipay = new Iyzipay({
      apiKey:    process.env.IYZICO_API_KEY!,
      secretKey: process.env.IYZICO_SECRET_KEY!,
      uri:       process.env.IYZICO_BASE_URL!,
    });

    const conversationId = Date.now().toString();
    const basketId       = 'B' + Date.now().toString();
    const buyerId        = userId || 'BYR' + Date.now().toString();

    const request = {
      locale:               Iyzipay.LOCALE.TR,
      conversationId,
      price:                selectedPackage.price,
      paidPrice:            selectedPackage.price,
      currency:             Iyzipay.CURRENCY.TRY,
      basketId,
      paymentGroup:         Iyzipay.PAYMENT_GROUP.PRODUCT,
      callbackUrl:          process.env.NEXT_PUBLIC_BASE_URL + '/api/payment/callback',
      enabledInstallments:  [1, 2, 3, 6, 9],
      buyer: {
        id:                  buyerId,
        name:                'Test',
        surname:             'User',
        gsmNumber:           '+905350000000',
        email:               userEmail || 'test@wheelvision.io',
        identityNumber:      '74300864791',
        lastLoginDate:       '2024-01-01 12:00:00',
        registrationDate:    '2024-01-01 12:00:00',
        registrationAddress: 'Nidakule Goztepe, Merdivenkoy Mah. Bora Sk. No:1',
        ip:                  '85.34.78.112',
        city:                'Istanbul',
        country:             'Turkey',
        zipCode:             '34732',
      },
      shippingAddress: {
        contactName: 'Test User',
        city:        'Istanbul',
        country:     'Turkey',
        address:     'Nidakule Goztepe, Merdivenkoy Mah. Bora Sk. No:1',
        zipCode:     '34732',
      },
      billingAddress: {
        contactName: 'Test User',
        city:        'Istanbul',
        country:     'Turkey',
        address:     'Nidakule Goztepe, Merdivenkoy Mah. Bora Sk. No:1',
        zipCode:     '34732',
      },
      basketItems: [
        {
          id:        'BI' + Date.now().toString(),
          name:      selectedPackage.name,
          category1: 'Dijital Urun',
          category2: 'Kredi Paketi',
          itemType:  Iyzipay.BASKET_ITEM_TYPE.VIRTUAL,
          price:     selectedPackage.price,
        },
      ],
    };

    return new Promise<NextResponse>((resolve) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      iyzipay.checkoutFormInitialize.create(request, (err: unknown, result: any) => {
        console.log('iyzico result:', JSON.stringify(result, null, 2));

        if (err) {
          console.error('iyzico error:', err);
          resolve(NextResponse.json({ error: String(err) }, { status: 500 }));
          return;
        }

        if (result.status === 'success') {
          resolve(NextResponse.json({
            checkoutFormContent: result.checkoutFormContent,
            token: result.token,
          }));
        } else {
          resolve(NextResponse.json({
            error:     result.errorMessage || 'Odeme baslatilamadi',
            errorCode: result.errorCode,
          }, { status: 500 }));
        }
      });
    });

  } catch (error) {
    console.error('Payment error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
