import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const PACKAGES = {
  starter:  { price: '49.99',  credits: 5,  name: 'Başlangıç Paketi' },
  standard: { price: '99.99',  credits: 15, name: 'Standart Paket'   },
  pro:      { price: '199.99', credits: 40, name: 'Pro Paket'        },
} as const;

type PackageType = keyof typeof PACKAGES;

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { packageType: PackageType; userEmail: string };
    const { packageType, userEmail } = body;

    const pkg = PACKAGES[packageType];
    if (!pkg) {
      return NextResponse.json({ error: 'Geçersiz paket türü' }, { status: 400 });
    }

    const apiKey    = process.env.IYZICO_API_KEY!;
    const secretKey = process.env.IYZICO_SECRET_KEY!;
    const baseUrl   = process.env.IYZICO_BASE_URL ?? 'https://sandbox-api.iyzipay.com';
    const appUrl    = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';

    const rnd            = crypto.randomBytes(8).toString('hex');
    const conversationId = `wv_${Date.now()}`;
    const basketId       = `bsk_${Date.now()}`;

    const requestBody = {
      locale: 'tr',
      conversationId,
      price: pkg.price,
      paidPrice: pkg.price,
      currency: 'TRY',
      basketId,
      paymentGroup: 'PRODUCT',
      callbackUrl: `${appUrl}/api/payment/callback`,
      enabledInstallments: [1],
      buyer: {
        id: userEmail,
        name: 'WheelVision',
        surname: 'User',
        gsmNumber: '+905350000000',
        email: userEmail,
        identityNumber: '11111111111',
        registrationAddress: 'Turkey',
        ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '85.34.78.112',
        city: 'Istanbul',
        country: 'Turkey',
      },
      shippingAddress: {
        contactName: 'WheelVision User',
        city: 'Istanbul',
        country: 'Turkey',
        address: 'Turkey',
      },
      billingAddress: {
        contactName: 'WheelVision User',
        city: 'Istanbul',
        country: 'Turkey',
        address: 'Turkey',
      },
      basketItems: [
        {
          id: packageType,
          name: pkg.name,
          category1: 'Kredi Paketi',
          itemType: 'VIRTUAL',
          price: pkg.price,
        },
      ],
    };

    const authorization = buildAuthHeader(apiKey, secretKey, rnd, requestBody);

    const iyzResponse = await fetch(
      `${baseUrl}/payment/iyzipos/checkoutform/initialize/auth/ecom`,
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

    const result = await iyzResponse.json() as Record<string, string>;

    if (result.status === 'success') {
      return NextResponse.json({
        checkoutFormContent: result.checkoutFormContent,
        token: result.token,
      });
    }

    console.error('[iyzico] init failed:', result.errorCode, result.errorMessage);
    return NextResponse.json(
      { error: result.errorMessage ?? 'iyzico hatası' },
      { status: 500 }
    );

  } catch (err) {
    console.error('[iyzico] unexpected error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
