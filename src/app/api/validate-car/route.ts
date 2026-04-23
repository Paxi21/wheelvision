import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { image_url } = await req.json();

    if (!image_url) {
      return NextResponse.json({ valid: false, message: 'Görsel URL bulunamadı' });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 10,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'url', url: image_url },
            },
            {
              type: 'text',
              text: 'Is there a car, vehicle, or automobile visible in this image? Reply ONLY with yes or no.',
            },
          ],
        }],
      }),
    });

    const data = await response.json();
    const answer = (data.content?.[0]?.text as string | undefined)?.toLowerCase().trim();
    const isValid = answer === 'yes';

    return NextResponse.json({
      valid: isValid,
      message: isValid
        ? 'ok'
        : 'Lütfen bir araç fotoğrafı yükleyin. Yüklediğiniz görselde araç tespit edilemedi.',
    });
  } catch {
    // Hata durumunda kullanıcıyı engelleme — geçişe izin ver
    return NextResponse.json({ valid: true, message: 'ok' });
  }
}
