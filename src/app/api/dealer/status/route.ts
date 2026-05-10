import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'id parametresi gerekli' }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, serviceKey);
  const { data, error } = await supabase
    .from('dealer_generations')
    .select('sonuc_foto_url')
    .eq('id', id)
    .single();

  if (error || !data) {
    return NextResponse.json({ status: 'not_found' }, { status: 404 });
  }

  const url = data.sonuc_foto_url;

  if (url === '__error__') {
    return NextResponse.json({ status: 'error' });
  }
  if (url) {
    return NextResponse.json({ status: 'done', output_url: url });
  }
  return NextResponse.json({ status: 'processing' });
}
