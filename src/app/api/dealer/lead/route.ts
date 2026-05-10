import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: NextRequest) {
  try {
    const { generation_id, musteri_isim, musteri_telefon } = await req.json() as {
      generation_id?: string;
      musteri_isim?: string;
      musteri_telefon?: string;
    };

    if (!generation_id || !musteri_isim || !musteri_telefon) {
      return NextResponse.json({ error: 'Eksik alan' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    const { error } = await supabase
      .from('dealer_generations')
      .update({
        musteri_isim:    musteri_isim.trim(),
        musteri_telefon: musteri_telefon.trim(),
      })
      .eq('id', generation_id);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Kayıt başarısız' }, { status: 500 });
  }
}
