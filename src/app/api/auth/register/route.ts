import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Free signup credit — hardcoded here, on the server, and nowhere else. The client used to
// upsert its own users row directly (including this value) with its own Supabase session,
// which meant anyone could set `credits` to whatever they wanted by editing the request
// before it left the browser, or by calling the Supabase REST API directly with their JWT.
const SIGNUP_CREDITS = 2;

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.slice(7);

    // Verify the token belongs to a real, just-created Supabase Auth user — identity comes
    // from the verified session, never from the request body.
    const supabaseAuthed = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user }, error: authError } = await supabaseAuthed.auth.getUser();
    if (authError || !user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({} as Record<string, unknown>));
    const fullName = typeof body.full_name === 'string' ? body.full_name.trim().slice(0, 200) : '';

    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    // Plain insert, not upsert: if the row already exists (retry, double submit), leave the
    // existing credits balance untouched instead of resetting a paying user back to 2.
    const { error: dbError } = await supabaseAdmin.from('users').insert({
      id: user.id,
      email: user.email,
      full_name: fullName,
      credits: SIGNUP_CREDITS,
    });

    if (dbError && dbError.code !== '23505') { // 23505 = unique_violation — row already exists, fine
      console.error('[auth/register] users insert failed:', dbError.message);
      return NextResponse.json({ error: 'Kayıt tamamlanamadı. Lütfen tekrar deneyin.' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[auth/register] fatal error:', err);
    return NextResponse.json({ error: 'Kayıt tamamlanamadı. Lütfen tekrar deneyin.' }, { status: 500 });
  }
}
