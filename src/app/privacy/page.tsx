import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Gizlilik Politikası — WheelVision',
  description: 'WheelVision gizlilik politikası ve kişisel verilerin korunması hakkında bilgi.',
};

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-28 pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Gizlilik Politikası</h1>
          <p className="text-[var(--text-secondary)] text-sm mb-10">Son güncelleme: Nisan 2026</p>

          <div className="space-y-8 text-[var(--text-secondary)] leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">1. Toplanan Veriler</h2>
              <p>WheelVision olarak, hizmetimizi sunabilmek için aşağıdaki verileri toplamaktayız:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>E-posta adresi ve ad-soyad (hesap oluşturma)</li>
                <li>Yüklediğiniz araba ve jant görselleri</li>
                <li>Yapay zeka tarafından oluşturulan sonuç görselleri</li>
                <li>Kredi bakiyesi ve işlem geçmişi</li>
                <li>IP adresi ve tarayıcı bilgileri (güvenlik amacıyla)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">2. Verilerin Kullanımı</h2>
              <p>Topladığımız veriler yalnızca aşağıdaki amaçlarla kullanılmaktadır:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Görselleştirme hizmetinin sunulması</li>
                <li>Hesap yönetimi ve kimlik doğrulama</li>
                <li>Kredi sistemi takibi</li>
                <li>Hizmet güvenliği ve kötüye kullanım önleme</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">3. Veri Paylaşımı</h2>
              <p>Kişisel verileriniz hiçbir koşulda üçüncü taraflarla satılmaz. Hizmetin sunulması için gerekli olan teknik altyapı sağlayıcıları (Supabase, Cloudinary, Fal AI) dışında paylaşılmaz. Bu sağlayıcılar kendi gizlilik politikalarına tabidir.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">4. Görsel Depolama</h2>
              <p>Yüklediğiniz görseller Cloudinary altyapısında güvenli biçimde saklanmaktadır. Hesabınızı sildiğinizde verileriniz de silinir. Ücretsiz planda oluşturulan görseller filigranla işaretlenir.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">5. Çerezler</h2>
              <p>Yalnızca oturum yönetimi için zorunlu çerezler kullanılmaktadır. Reklam veya izleme amaçlı çerez kullanılmamaktadır.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">6. Haklarınız</h2>
              <p>KVKK kapsamında verilerinize erişim, düzeltme ve silme hakkına sahipsiniz. Talepleriniz için <span className="text-[var(--accent-orange)]">destek@wheelvision.io</span> adresine yazabilirsiniz.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">7. İletişim</h2>
              <p>Gizlilik politikamıza ilişkin sorularınız için: <span className="text-[var(--accent-orange)]">destek@wheelvision.io</span></p>
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
