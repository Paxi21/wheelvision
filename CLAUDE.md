# WheelVision - AI Jant Görselleştirme Projesi

## Proje Özeti

WheelVision, kullanıcıların araba fotoğrafı + jant fotoğrafı yükleyerek yapay zeka ile jantların arabaya nasıl görüneceğini görselleştiren bir B2C SaaS uygulamasıdır.

**İş Modeli:** Kredi bazlı ücretlendirme (1 görselleştirme = 1 kredi)

**Teknoloji Stack:**
- Frontend: Next.js 14+ (App Router), TypeScript, Tailwind CSS
- Backend/Otomasyon: n8n (self-hosted)
- AI: Fal AI (nano-banana-2 modeli)
- Veritabanı: Supabase (PostgreSQL)
- Görsel Depolama: Cloudinary
- Hosting: Coolify (VPS üzerinde)
- Domain: wheelvision.io

---

## Çalışan Altyapı

### VPS Bilgileri
- **IP:** 72.61.191.108
- **Provider:** Hostinger
- **OS:** Ubuntu 24.04.4 LTS
- **SSH:** root@72.61.191.108

### Servisler ve URL'ler

| Servis | URL | Durum |
|--------|-----|-------|
| Coolify | http://72.61.191.108:8000 | ✅ Aktif |
| n8n | http://72.61.191.108:5678 | ✅ Aktif |
| Frontend (deploy sonrası) | https://wheelvision.io | ⏳ Bekliyor |

### n8n Workflow: "Wheelvision Projesi yeni"

**Webhook URL (Production):** `http://72.61.191.108:5678/webhook/jant-v4`
**Webhook URL (Test):** `http://72.61.191.108:5678/webhook-test/jant-v4`

**Workflow Akışı:**
```
Webhook (POST) 
    ↓
Get many rows (Supabase - users tablosu, email ile filtrele)
    ↓
If (credits > 0)
    ├── True → FAL AI → Update a row (kredi düşür) → Respond to Webhook
    └── False → Respond to Webhook1 (yetersiz kredi hatası)
```

**Webhook'a Gönderilecek JSON:**
```json
{
  "user_email": "kullanici@email.com",
  "car_image": "https://cloudinary-url/araba.jpg",
  "wheel_image": "https://cloudinary-url/jant.jpg",
  "credits": 3,
  "prompt": "Replace the wheels on the car with the wheel design from the second image"
}
```

**Başarılı Yanıt:**
```json
{
  "output_url": "https://fal.media/files/.../sonuc.png"
}
```

**Hata Yanıtı:**
```json
{
  "error": "Yetersiz kredi"
}
```

### Fal AI Ayarları
- **Model:** nano-banana-2
- **Endpoint:** `https://fal.run/fal-ai/nano-banana-2/edit`
- **Credential:** Header Auth account (n8n'de kayıtlı)
- **Output:** 1K PNG

---

## Supabase

**Proje Adı:** jantgor
**URL:** https://xrwdndupqhnxnvkjkjpr.supabase.co

### users Tablosu
| Kolon | Tip | Açıklama |
|-------|-----|----------|
| id | uuid | Primary key |
| email | text | Kullanıcı e-postası |
| full_name | text | Ad soyad |
| credits | int4 | Kalan kredi |
| verification_code | text | Doğrulama kodu |
| is_verified | bool | E-posta doğrulandı mı |
| created_at | timestamp | Kayıt tarihi |
| phone | text | Telefon (opsiyonel) |

### generations Tablosu
| Kolon | Tip | Açıklama |
|-------|-----|----------|
| id | uuid | Primary key |
| user_email | text | Kullanıcı e-postası |
| car_image_url | text | Orijinal araba görseli |
| wheel_image_url | text | Jant görseli |
| result_image_url | text | AI sonuç görseli |
| created_at | timestamp | Oluşturma tarihi |

**Test Kullanıcısı:**
- Email: erhan.deniz421@gmail.com
- Ad: erhan deniz
- Kredi: 3

---

## Cloudinary

**Cloud Name:** dxcok7tox
**Upload Preset:** wheelvision (oluşturulacak)

**Test Görselleri:**
- Araba (BMW): `https://res.cloudinary.com/dxcok7tox/image/upload/v1774142168/vxfjonzgwe8bmd64gmxd.jpg`
- Jant (MOTEC): `https://res.cloudinary.com/dxcok7tox/image/upload/v1774032621/5_ecfcq8.webp`

---

## Tasarım Sistemi

### Renkler
```css
--gradient-primary: linear-gradient(135deg, #FF6B35 0%, #F72585 50%, #7209B7 100%);
--bg-dark: #0A0A0F;
--bg-card: #12121A;
--text-primary: #FFFFFF;
--text-secondary: #A0A0B0;
--border-color: #2A2A35;
--accent-orange: #FF6B35;
--accent-pink: #F72585;
--accent-purple: #7209B7;
```

### Font
- **Ana Font:** Outfit (Google Fonts)

### Tema
- Dark mode varsayılan
- Gradient vurgular (turuncu → pembe → mor)
- Glassmorphism efektleri

---

## Fiyatlandırma Paketleri

| Paket | Fiyat | Kredi | Özellikler |
|-------|-------|-------|------------|
| Ücretsiz | $0/ay | 3 | Standart kalite, Filigranlı |
| Başlangıç | $5.90/ay | 10 | Yüksek kalite, Filigransız |
| Pro | $12.90/ay | 30 | Ultra 4K, Tüm jant modelleri |
| İşletme | $19.90/ay | Sınırsız | API erişimi, 7/24 destek |

---

## Sayfa Yapısı

```
/                   → Landing page (tanıtım)
/login              → Giriş sayfası
/register           → Kayıt sayfası
/app                → Ana uygulama (jant değiştirme)
/pricing            → Fiyatlandırma
/history            → Geçmiş görselleştirmeler
/settings           → Kullanıcı ayarları
```

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xrwdndupqhnxnvkjkjpr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase-anon-key>

# n8n Webhook
NEXT_PUBLIC_N8N_WEBHOOK_URL=http://72.61.191.108:5678/webhook/jant-v4

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dxcok7tox
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=wheelvision
```

---

## Yapılacaklar (TODO)

### Öncelikli
- [ ] Frontend sayfalarını tamamla (pricing, history, settings)
- [ ] Cloudinary upload preset oluştur
- [ ] Supabase Auth entegrasyonunu test et
- [ ] Coolify'a deploy et
- [ ] Domain bağla (wheelvision.io)

### Sonraki Adımlar
- [ ] generations tablosuna kayıt ekleme (n8n'de)
- [ ] Stripe/Paddle ödeme entegrasyonu
- [ ] E-posta doğrulama akışı
- [ ] Filigran sistemi (ücretsiz plan için)
- [ ] Rate limiting

### İyileştirmeler
- [ ] Görsel önizleme optimizasyonu
- [ ] PWA desteği
- [ ] Türkçe/İngilizce dil desteği
- [ ] SEO optimizasyonu

---

## Geliştirme Komutları

```bash
# Geliştirme sunucusu
npm run dev

# Production build
npm run build

# Linting
npm run lint
```

---

## Notlar

### n8n Workflow Test Etme
1. n8n'de Webhook node'a tıkla
2. "Listen for test event" butonuna bas
3. curl ile test isteği gönder:
```bash
curl -X POST http://72.61.191.108:5678/webhook-test/jant-v4 \
  -H "Content-Type: application/json" \
  -d '{"user_email":"erhan.deniz421@gmail.com","car_image":"URL","wheel_image":"URL","credits":3,"prompt":"Replace the wheels"}'
```

### Bilinen Sorunlar
- Test modunda webhook dinleme süresi sınırlı, hızlı olmak gerekiyor
- Fal AI işlemi 15-30 saniye sürebilir

---

## İletişim & Kaynaklar

- **Fal AI Docs:** https://fal.ai/models/fal-ai/nano-banana-2
- **Supabase Dashboard:** https://supabase.com/dashboard
- **Cloudinary Console:** https://console.cloudinary.com
- **n8n Docs:** https://docs.n8n.io
