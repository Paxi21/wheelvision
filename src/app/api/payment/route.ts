import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

class IyzicoHashGenerator {
  private apiKey: string;
  private secretKey: string;

  constructor(apiKey: string, secretKey: string) {
    this.apiKey = apiKey;
    this.secretKey = secretKey;
  }

  generateHash(request: object): { authorization: string; rndKey: string } {
    const rndKey = this.generateRandomString();
    const jsonString = JSON.stringify(request);

    // SHA1 hash of: randomKey + request + secretKey
    const dataToHash = rndKey + jsonString + this.secretKey;
    const sha1Hash = crypto.createHash('sha1').update(dataToHash, 'utf8').digest('base64');

    // PKI string for header
    const authorizationString = this.apiKey + ':' + sha1Hash;
    const base64Auth = Buffer.from(authorizationString).toString('base64');

    return {
      authorization: 'IYZWS ' + base64Auth,
      rndKey,
    };
  }

  private generateRandomString(): string {
    return crypto.randomBytes(8).toString('hex');
  }
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

    const conversationId = Date.now().toString();
    const basketId       = 'B' + Date.now().toString();
    const buyerId        = userId || 'BYR' + Date.now().toString();

    const requestBody = {
      locale: 'tr',
      conversationId,
      price: selectedPackage.price,
      paidPrice: selectedPackage.price,
      currency: 'TRY',
      basketId,
      paymentGroup: 'PRODUCT',
      callbackUrl: process.env.NEXT_PUBLIC_BASE_URL + '/api/payment/callback',
      enabledInstallments: [1, 2, 3, 6, 9],
      buyer: {
        id: buyerId,
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

    const hashGenerator = new IyzicoHashGenerator(apiKey, secretKey);
    const { authorization, rndKey } = hashGenerator.generateHash(requestBody);

    console.log('=== IYZICO REQUEST ===');
    console.log('URL:', baseUrl + '/payment/iyzipos/checkoutform/initialize/auth/ecom');
    console.log('Authorization:', authorization);
    console.log('x-iyzi-rnd:', rndKey);
    console.log('Body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(baseUrl + '/payment/iyzipos/checkoutform/initialize/auth/ecom', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': authorization,
        'x-iyzi-rnd': rndKey,
      },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json() as Record<string, unknown>;
    console.log('=== IYZICO RESPONSE ===');
    console.log(JSON.stringify(result, null, 2));

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
