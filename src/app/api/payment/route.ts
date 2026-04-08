export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Exact replica of iyzipay/lib/utils.js → generateHashV2
// hash = HMAC-SHA256(key=secretKey, data=randomString+uriPath+JSON.stringify(body)) → HEX
// auth = IYZWSv2 base64("apiKey:xxx&randomKey:xxx&signature:xxx")
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
  try {
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

    const apiKey    = process.env.IYZICO_API_KEY!;
    const secretKey = process.env.IYZICO_SECRET_KEY!;
    const baseUrl   = process.env.IYZICO_BASE_URL!;
    const appUrl    = process.env.NEXT_PUBLIC_BASE_URL!;

    const randomString   = generateRandomString();
    const ts             = Date.now().toString();
    // Encode email in conversationId so callback can reliably retrieve it
    const conversationId = ts + '__' + Buffer.from(userEmail).toString('base64');
    const basketId       = 'B' + ts;

    const uriPath = '/payment/iyzipos/checkoutform/initialize/auth/ecom';

    const requestBody = {
      locale: 'tr',
      conversationId,
      price: selectedPackage.price,
      paidPrice: selectedPackage.price,
      currency: 'TRY',
      basketId,
      paymentGroup: 'PRODUCT',
      callbackUrl: appUrl + '/api/payment/callback',
      enabledInstallments: [1, 2, 3, 6, 9],
      buyer: {
        id: userEmail,   // set to email so callback has it in buyer.id too
        name: 'Test',
        surname: 'User',
        gsmNumber: '+905350000000',
        email: userEmail || 'test@wheelvision.io',
        identityNumber: '74300864791',
        lastLoginDate: '2024-01-01 12:00:00',
        registrationDate: '2024-01-01 12:00:00',
        registrationAddress: 'Nidakule Goztepe, Merdivenkoy Mah. Bora Sk. No:1',
        ip: '85.34.78.112',
        city: 'Istanbul',
        country: 'Turkey',
        zipCode: '34732',
      },
      shippingAddress: {
        contactName: 'Test User',
        city: 'Istanbul',
        country: 'Turkey',
        address: 'Nidakule Goztepe, Merdivenkoy Mah. Bora Sk. No:1',
        zipCode: '34732',
      },
      billingAddress: {
        contactName: 'Test User',
        city: 'Istanbul',
        country: 'Turkey',
        address: 'Nidakule Goztepe, Merdivenkoy Mah. Bora Sk. No:1',
        zipCode: '34732',
      },
      basketItems: [
        {
          id: 'BI' + Date.now().toString(),
          name: selectedPackage.name,
          category1: 'Dijital Urun',
          category2: 'Kredi Paketi',
          itemType: 'VIRTUAL',
          price: selectedPackage.price,
        },
      ],
    };

    const authorization = buildAuthHeader(apiKey, secretKey, randomString, uriPath, requestBody);

    const response = await fetch(baseUrl + uriPath, {
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

    const result = await response.json() as Record<string, unknown>;
    console.log('iyzico response:', JSON.stringify(result));

    if (result.status === 'success') {
      return NextResponse.json({
        checkoutFormContent: result.checkoutFormContent,
        token: result.token,
      });
    }

    return NextResponse.json({
      error: result.errorMessage || 'Odeme baslatilamadi',
      errorCode: result.errorCode,
    }, { status: 500 });

  } catch (error) {
    console.error('Payment error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
