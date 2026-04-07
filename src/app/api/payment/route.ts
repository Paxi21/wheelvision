import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

function generatePKIString(request: Record<string, unknown>): string {
  let pki = '[';
  for (const [key, value] of Object.entries(request)) {
    if (value !== null && value !== undefined) {
      if (Array.isArray(value)) {
        pki += `${key}=[`;
        for (const item of value) {
          pki += '[';
          for (const [k, v] of Object.entries(item as object)) {
            pki += `${k}=${v},`;
          }
          pki = pki.slice(0, -1) + '],';
        }
        pki = pki.slice(0, -1) + '],';
      } else if (typeof value === 'object') {
        pki += `${key}=[`;
        for (const [k, v] of Object.entries(value as object)) {
          pki += `${k}=${v},`;
        }
        pki = pki.slice(0, -1) + '],';
      } else {
        pki += `${key}=${value},`;
      }
    }
  }
  pki = pki.slice(0, -1) + ']';
  return pki;
}

function generateAuthorizationHeader(apiKey: string, secretKey: string, randomString: string, request: Record<string, unknown>): string {
  const pkiString = generatePKIString(request);
  const shaSum = crypto.createHash('sha1');
  shaSum.update(randomString + secretKey + pkiString);
  const hashString = shaSum.digest('base64');
  return `IYZWS ${apiKey}:${hashString}`;
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

    const randomString   = Date.now().toString() + Math.random().toString(36).substring(2, 8);
    const conversationId = 'conv' + Date.now();
    const basketId       = 'basket' + Date.now();

    const requestBody: Record<string, unknown> = {
      locale: 'tr',
      conversationId,
      price: selectedPackage.price,
      paidPrice: selectedPackage.price,
      currency: 'TRY',
      basketId,
      paymentGroup: 'PRODUCT',
      callbackUrl: process.env.NEXT_PUBLIC_BASE_URL + '/api/payment/callback',
      buyer: {
        id: userId || 'guest123',
        name: 'Test',
        surname: 'User',
        gsmNumber: '+905350000000',
        email: userEmail || 'test@test.com',
        identityNumber: '74300864791',
        registrationAddress: 'Istanbul Turkey',
        ip: '85.34.78.112',
        city: 'Istanbul',
        country: 'Turkey',
      },
      shippingAddress: {
        contactName: 'Test User',
        city: 'Istanbul',
        country: 'Turkey',
        address: 'Istanbul Turkey',
      },
      billingAddress: {
        contactName: 'Test User',
        city: 'Istanbul',
        country: 'Turkey',
        address: 'Istanbul Turkey',
      },
      basketItems: [
        {
          id: packageType,
          name: selectedPackage.name,
          category1: 'Kredi',
          itemType: 'VIRTUAL',
          price: selectedPackage.price,
        },
      ],
    };

    const apiKey    = process.env.IYZICO_API_KEY!;
    const secretKey = process.env.IYZICO_SECRET_KEY!;
    const baseUrl   = process.env.IYZICO_BASE_URL!;

    const authorization = generateAuthorizationHeader(apiKey, secretKey, randomString, requestBody);

    console.log('Request:', JSON.stringify(requestBody, null, 2));
    console.log('Authorization:', authorization);

    const response = await fetch(baseUrl + '/payment/iyzipos/checkoutform/initialize/auth/ecom', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': authorization,
        'x-iyzi-rnd': randomString,
      },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json() as Record<string, string>;
    console.log('iyzico response:', result);

    if (result.status === 'success') {
      return NextResponse.json({
        checkoutFormContent: result.checkoutFormContent,
        token: result.token,
      });
    }

    return NextResponse.json({
      error: result.errorMessage || 'Payment failed',
      errorCode: result.errorCode,
    }, { status: 500 });

  } catch (error) {
    console.error('Payment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
