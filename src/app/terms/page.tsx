import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Kullanım Şartları — WheelVision',
  description: 'WheelVision kullanım şartları ve koşulları.',
};

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-28 pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Kullanım Şartları</h1>
          <p className="text-[var(--text-secondary)] text-sm mb-10">Son güncelleme: Nisan 2026</p>

          <div className="space-y-8 text-[var(--text-secondary)] leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">1. Hizmetin Kapsamı</h2>
              <p>WheelVision, yapay zeka teknolojisi kullanarak araç görsellerinde jant değişikliği simülasyonu sunan bir B2C SaaS uygulamasıdır. Hizmet, yalnızca yasal ve kişisel kullanım amaçlıdır.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">2. Hesap ve Kredi Sistemi</h2>
              <ul className="list-disc list-inside space-y-1">
                <li>Her yeni hesap 2 ücretsiz kredi ile başlar.</li>
                <li>Her görselleştirme işlemi 1 kredi tüketir.</li>
                <li>Satın alınan krediler iade edilmez.</li>
                <li>Hesap paylaşımı yasaktır.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">3. Yüklenen İçerikler</h2>
              <p>Platforma yüklediğiniz görsellerin telif hakkı size aittir. Telif hakkı ihlali içeren, müstehcen veya yasadışı içerik yüklemek kesinlikle yasaktır. Bu tür içerikler tespit edildiğinde hesap anında askıya alınır.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">4. Oluşturulan Görseller</h2>
              <p>Ücretsiz planda oluşturulan görseller WheelVision filigranı taşır. Ticari kullanım için ücretli plana geçilmesi zorunludur. Oluşturulan görseller yapay zeka çıktısıdır; gerçek sonuçlarla birebir aynı olmayabilir.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">5. Hizmetin Kullanılabilirliği</h2>
              <p>WheelVision, hizmetin kesintisiz veya hatasız çalışacağını garanti etmez. Planlı bakım süreleri önceden duyurulur. Teknik sorunlar nedeniyle tüketilen krediler iade edilebilir.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">6. Hesap Feshi</h2>
              <p>Şartları ihlal eden hesaplar önceden bildirim yapılmaksızın askıya alınabilir veya kapatılabilir. Hesabınızı kendiniz kapatmak için destek ekibiyle iletişime geçebilirsiniz.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">7. Değişiklikler</h2>
              <p>Bu şartlar önceden bildirilerek güncellenebilir. Güncel şartlar her zaman bu sayfada yayımlanır. Hizmeti kullanmaya devam etmeniz, güncel şartları kabul ettiğiniz anlamına gelir.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">8. İletişim</h2>
              <p>Sorularınız için: <span className="text-[var(--accent-orange)]">destek@wheelvision.io</span></p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-[var(--border-color)]">
            <Link href="/" className="text-sm text-[var(--text-secondary)] hover:text-white transition-colors">
              ← Ana Sayfaya Dön
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
