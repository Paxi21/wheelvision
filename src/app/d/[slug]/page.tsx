import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import DealerPage from '@/components/DealerPage';

export type Dealer = {
  id: string;
  firma_adi: string;
  slug: string;
  whatsapp: string;
  logo_url: string | null;
  aktif: boolean;
  aylik_limit: number;
  kullanilan: number;
};

export type Wheel = {
  id: string;
  dealer_id: string;
  jant_adi: string;
  jant_foto_url: string;
  marka: string | null;
  ebat: string | null;
  fiyat: number | null;
};

// Prevent caching — dealer data (limits) must always be fresh
export const dynamic = 'force-dynamic';

export default async function DealerSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fetch dealer by slug
  const { data: dealer } = await supabase
    .from('dealers')
    .select('id, firma_adi, slug, whatsapp, logo_url, aktif, aylik_limit, kullanilan')
    .eq('slug', slug)
    .single();

  if (!dealer) notFound();

  // Inactive dealer
  if (!dealer.aktif) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-[var(--bg-dark)]">
        <div className="text-center space-y-3">
          <p className="text-4xl">🔒</p>
          <h1 className="text-xl font-bold text-white">{dealer.firma_adi}</h1>
          <p className="text-[var(--text-secondary)]">Bu sayfa şu anda aktif değil.</p>
        </div>
      </div>
    );
  }

  // Fetch dealer's wheel catalog
  const { data: wheels } = await supabase
    .from('dealer_wheels')
    .select('id, dealer_id, jant_adi, jant_foto_url, marka, ebat, fiyat')
    .eq('dealer_id', dealer.id)
    .order('sira', { ascending: true });

  return <DealerPage dealer={dealer as Dealer} wheels={(wheels ?? []) as Wheel[]} />;
}
