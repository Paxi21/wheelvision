import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 10;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.slice(7);

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const jobId = request.nextUrl.searchParams.get('job_id');
    if (!jobId) {
      return NextResponse.json({ error: 'job_id gerekli' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('dealer_generations')
      .select('id, sonuc_foto_url, araba_foto_url')
      .eq('id', jobId)
      .single();

    if (error || !data) {
      return NextResponse.json({ status: 'not_found' }, { status: 404 });
    }

    if (data.sonuc_foto_url && data.sonuc_foto_url !== 'processing' && !data.sonuc_foto_url.startsWith('__')) {
      return NextResponse.json({
        status: 'completed',
        output_url: data.sonuc_foto_url,
      });
    }

    return NextResponse.json({ status: 'processing' });
  } catch (err) {
    return NextResponse.json({ error: 'Bir hata oluştu' }, { status: 500 });
  }
}
