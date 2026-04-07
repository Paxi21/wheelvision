import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

function generateCheckoutFormInitializeRequest(
  apiKey: string,
  secretKey: string,
  request: Record<string, unknown>
): { authorization: string; randomKey: string; body: string } {
  const randomKey = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const jsonRequest = JSON.stringify(request);

  // iyzico hash: SHA256(randomKey + jsonRequest + secretKey)
  const hashStr = randomKey + jsonRequest + secretKey;
  const hash = crypto.createHash('sha256').update(hashStr, 'utf8').digest('hex');

  return {
    authorization: `IYZWSv2 ${apiKey}:${hash}`,
    randomKey,
    body: jsonRequest,
  };
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

    const requestBody = {
      locale: 'tr',
      conversationId: Date.now().toString(),
      price: selectedPackage.price,
      paidPrice: selectedPackage.price,
      currency: 'TRY',
      basketId: 'B' + Date.now(),
      paymentGroup: 'PRODUCT',
      callbackUrl: process.env.NEXT_PUBLIC_BASE_URL + '/api/payment/callback',
      buyer: {
        id: userId || 'BY' + Date.now(),
        name: 'Test',
        surname: 'User',
        gsmNumber: '+905350000000',
        email: userEmail || 'test@wheelvision.io',
        identityNumber: '74300864791',
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
          id: packageType,
          name: selectedPackage.name,
          category1: 'Dijital Urun',
          category2: 'Kredi Paketi',
          itemType: 'VIRTUAL',
          price: selectedPackage.price,
        },
      ],
    };

    const { authorization, randomKey, body } = generateCheckoutFormInitializeRequest(apiKey, secretKey, requestBody);

    console.log('URL:', baseUrl + '/payment/iyzipos/checkoutform/initialize/auth/ecom');

    const response = await fetch(baseUrl + '/payment/iyzipos/checkoutform/initialize/auth/ecom', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': authorization,
        'x-iyzi-rnd': randomKey,
      },
      body,
    });

    const result = await response.json() as Record<string, string>;
    console.log('iyzico response:', JSON.stringify(result, null, 2));

    if (result.status === 'success') {
      return NextResponse.json({
        checkoutFormContent: result.checkoutFormContent,
        token: result.token,
      });
    }

    return NextResponse.json({
      error: result.errorMessage || 'Payment failed',
      errorCode: result.errorCode,
      errorGroup: result.errorGroup,
    }, { status: 500 });

  } catch (error) {
    console.error('Payment error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
