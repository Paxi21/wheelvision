# WheelVision — Teknik Referans Dökümanı

> Bu dosya projenin güncel teknik referansıdır. NotebookLM veya başka bir araçla yüklenebilir.
> Son güncelleme: 2026-04-30

---

## 1. Proje Tanımı

WheelVision, kullanıcıların araba fotoğrafı + jant fotoğrafı yükleyerek yapay zeka ile jantların arabaya nasıl görüneceğini görselleştiren bir SaaS uygulamasıdır.

**İki farklı kullanım kanalı:**
- **B2C (bireysel):** Kredi bazlı ücretlendirme (1 görselleştirme = 1 kredi), wheelvision.io/app
- **B2B (jant bayii):** Dealer Pro abonelik (aylık limit), wheelvision.io/[slug] özel sayfa

**Domain:** wheelvision.io
**GitHub → Vercel:** main branch push = otomatik deploy

---

## 2. Teknoloji Stack

| Katman | Teknoloji |
|--------|-----------|
| Frontend | Next.js 14+ (App Router), TypeScript, Tailwind CSS |
| i18n | next-intl (tr, en, de) |
| AI Orkestrasyonu | n8n (self-hosted, VPS) |
| AI Modeli | Fal AI — nano-banana-2 (fal-ai/nano-banana-2/edit) |
| Veritabanı | Supabase (PostgreSQL + Auth) |
| Görsel Depolama | Cloudinary (cloud: dxcok7tox) |
| Rate Limiting / Cache | Upstash Redis |
| Görsel Sıkıştırma | TinyPNG API (sunucu tarafı) + browser-image-compression (istemci) |
| Görsel Doğrulama | Claude Haiku (claude-haiku-4-5-20251001) — araba tespiti + jant boyutu |
| Analytics | Google Analytics (G-5TEZ5ZTLBW) |
| Hosting (Frontend) | Vercel (otomatik deploy, main branch) |
| Hosting (n8n) | Hostinger VPS — root@72.61.191.108 |
| UI Animasyon | framer-motion |

---

## 3. AI Görselleştirme Pipeline'ı

### n8n Workflow: "Wheelvision Projesi yeni"

**URL (Production):** `http://72.61.191.108:5678/webhook/jant-v4`
**Secret Header:** `X-Webhook-Secret`

```
Webhook (POST)
    ↓
Supabase — users tablosundan kredi kontrol (email ile)
    ↓
If (credits > 0)
    ├── TRUE
    │     ↓
    │   SAM 3 (fal-ai/sam-3/image) — jant maskesi tespit
    │     ↓
    │   IF (mask URL var mı?)
    │     ├── TRUE  → nano-banana-2 (3 image_urls: car + wheel + mask)
    │     └── FALSE → nano-banana-2 (2 image_urls: car + wheel, masksız)
    │     ↓
    │   Supabase — kredi düşür (credits - 1)
    │     ↓
    │   Respond to Webhook (output_url)
    └── FALSE → Respond to Webhook1 (error: "Yetersiz kredi")
```

### Fal AI Parametreleri (n8n'de)

```json
{
  "image_urls": [
    "{{ $('Webhook').item.json.body.car_image }}",
    "{{ $('Webhook').item.json.body.wheel_image }}"
  ],
  "prompt": "{{ $('Webhook').item.json.body.prompt }}",
  "strength": 0.43,
  "guidance_scale": 9,
  "num_inference_steps": 50
}
```

> **ÖNEMLİ:** image_urls dizisinde tam olarak 2 eleman olmalı. 3. eleman eklenirse n8n "Empty string in image_urls" hatası verir.

### B2C Prompt (generate/route.ts'de sabit)

```
Replace the wheel rims on this car with the rim design from the second image.
Keep the EXACT same car body, color, background, lighting, and camera angle.
Do not change anything else.
```

### B2B Prompt — rim_only (dealer/generate/route.ts)

```
You are a professional automotive photo editor.
Task: swap ONLY the wheel rims on the car in the first image using the exact rim design from the second image.
The new rim must replicate the spoke pattern, finish, color, and design of the reference wheel precisely.
Maintain the correct perspective, angle, and scale of the original wheel position on the car.
Match all lighting, shadows, and reflections so the new rim looks naturally lit by the same environment.
Keep the tire sidewall, brake calipers, and all surrounding car parts completely untouched.
Do NOT change the car body, paint color, windows, interior, background, or road surface.
The final result must look like a real professional photograph — seamless, photorealistic, no artificial edges or artifacts.
Only the rim design changes. Everything else is identical to the original photo.
```

### B2B Prompt — full_wheel (jant boyutu uyumsuzluğunda)

```
You are a professional automotive photo editor.
Task: replace the COMPLETE wheel assembly (rim AND tire) on the car using the wheel design from the second image.
The new rim must exactly replicate the spoke pattern, finish, color, and design of the reference wheel.
Adjust the tire sidewall height and profile proportionally to fit the new rim diameter.
Maintain the correct perspective, angle, and scale for each wheel position on the car.
Match all lighting, shadows, and reflections so the new wheels look naturally lit.
Do NOT change the car body, paint color, windows, interior, background, or road surface.
The final result must look like a real professional photograph — seamless, photorealistic, no artificial edges or artifacts.
```

---

## 4. Dosya Yapısı (Kritik Dosyalar)

```
src/
  app/
    [locale]/
      page.tsx                    ← Landing page
      app/page.tsx                ← B2C uygulama (upload + generate)
      pricing/page.tsx            ← Fiyatlandırma (B2C tab + B2B tab)
      history/page.tsx            ← Görselleştirme geçmişi
      settings/page.tsx           ← Kullanıcı ayarları
      login/page.tsx
      register/page.tsx
    d/[slug]/page.tsx             ← Dealer sayfası (server component)
    api/
      generate/route.ts           ← B2C AI generate API
      dealer/generate/route.ts    ← B2B dealer AI generate API
      validate-car/route.ts       ← Araba doğrulama + jant boyutu tespiti
      proxy-image/route.ts        ← İndirme için CORS proxy
      payment/                    ← iyzico ödeme (başlatma + callback)
    layout.tsx                    ← Root layout, GA, metadata
    globals.css                   ← Keyframes, CSS değişkenleri
    sitemap.ts                    ← SEO sitemap
    robots.ts                     ← SEO robots
  components/
    DealerPage.tsx                ← B2B dealer UI (tüm ekranlar, ~800 satır)
    Navbar.tsx
    LanguageSwitcher.tsx
  contexts/
    AuthContext.tsx
  lib/
    supabase.ts
    redis.ts                      ← Upstash Redis client
    watermark.ts                  ← Canvas filigran ekleme
  i18n/
    request.ts
    navigation.ts
messages/
  tr.json
  en.json
  de.json
public/
  demo-before.jpg                 ← Before/After slider (landing)
  demo-after.jpg
  gallery-before-1.jpg            ← Örnek araç: Mercedes SL
  gallery-before-2.jpg            ← Örnek araç: Aston Martin V8
  gallery-before-3.jpg            ← Örnek araç: BMW E30
  gallery-after-1.jpg
  gallery-after-2.jpg
  gallery-after-3.jpg
  favicon.ico
  og-image.jpg
next.config.ts
middleware.ts                     ← Dealer slug rewrite + next-intl
```

---

## 5. Supabase Tablo Yapısı

**Proje:** jantgor
**URL:** https://xrwdndupqhnxnvkjkjpr.supabase.co

### users

| Kolon | Tip | Açıklama |
|-------|-----|----------|
| id | uuid | Primary key |
| email | text | Kullanıcı e-postası |
| full_name | text | Ad soyad |
| credits | int4 | Kalan kredi |
| is_verified | bool | Doğrulanmış mı |
| created_at | timestamp | Kayıt tarihi |
| phone | text | Telefon (opsiyonel) |

### generations

| Kolon | Tip | Açıklama |
|-------|-----|----------|
| id | uuid | Primary key |
| user_email | text | Kullanıcı e-postası |
| car_image_url | text | Orijinal araba görseli |
| wheel_image_url | text | Jant görseli |
| result_image_url | text | AI sonuç görseli |
| created_at | timestamp | Oluşturma tarihi |

### dealers

| Kolon | Tip | Açıklama |
|-------|-----|----------|
| id | uuid | Primary key |
| firma_adi | text | Bayi adı |
| slug | text | URL slug (benzersiz) |
| whatsapp | text | WhatsApp numarası (905...) |
| logo_url | text | Logo görseli |
| aktif | bool | Sayfa aktif mi |
| aylik_limit | int4 | Aylık görsel limiti |
| kullanilan | int4 | Bu ay kullanılan |

### dealer_wheels

| Kolon | Tip | Açıklama |
|-------|-----|----------|
| id | uuid | Primary key |
| dealer_id | uuid | FK → dealers.id |
| jant_adi | text | Jant adı |
| jant_foto_url | text | Cloudinary görsel URL |
| marka | text | Marka |
| ebat | text | Ebat (örn: "18x8.5 ET35") |
| fiyat | numeric | Fiyat |

### dealer_generations

| Kolon | Tip | Açıklama |
|-------|-----|----------|
| id | uuid | Primary key |
| dealer_id | uuid | FK → dealers.id |
| wheel_id | uuid | FK → dealer_wheels.id |
| araba_foto_url | text | Müşteri araç fotoğrafı |
| sonuc_foto_url | text | AI sonuç görseli |
| created_at | timestamp | Oluşturma tarihi |

### Dealer Service User (n8n için gerekli)

n8n workflow Supabase'deki users tablosundan kredi kontrol ediyor. Dealer istekleri bu kullanıcı üzerinden geçer:

```sql
INSERT INTO users (email, full_name, credits, is_verified)
VALUES ('dealer@wheelvision.io', 'Dealer Service', 99999, true);
```

`dealer/generate/route.ts` bu kullanıcıyı otomatik oluşturur/yeniler (credits < 100 ise 99999'a çeker).

---

## 6. API Route'ları

### POST /api/generate (B2C)

- Bearer token ile auth (Supabase session)
- Cloudinary URL validasyonu (SSRF koruması)
- Sunucu tarafında kredi kontrolü
- Redis cache: sha256(car+wheel) key, 7 gün TTL
- n8n çağrısı (90s timeout)
- TinyPNG sıkıştırma + Cloudinary yeniden yükleme (fail-open)
- Rate limit: 5 req/min/IP (Upstash Redis, fail-open)

### POST /api/dealer/generate (B2B)

- Cloudinary URL validasyonu
- Supabase'den dealer doğrulama (id + slug double-check)
- Aylık limit kontrolü (kullanilan >= aylik_limit → 402)
- Wheel ownership kontrolü (wheel dealer'a mı ait?)
- jant_foto_url boşluk kontrolü (→ 400)
- generation_type: `rim_only` veya `full_wheel`
- n8n çağrısı (90s timeout)
- Kullanım sayacı artırma
- Rate limit: 5 req/min/IP

### POST /api/validate-car

- Claude Haiku ile araba tespiti + jant boyutu tahmini
- JSON yanıt: `{ valid, wheel_size, message }`
- wheel_size: 14-24 inch arası tahmini değer (null ise tespit edilemedi)
- Fail-open: hata durumunda `{ valid: true, wheel_size: null }`
- Rate limit: 10 req/min/IP

### GET /api/proxy-image

- `?url=` parametresi ile görsel proxy
- CORS sorununu aşmak için indirme öncesi kullanılır

---

## 7. Dealer Sayfa Sistemi

### Routing (Transparent Rewrite)

`middleware.ts` şema:
- `/tr`, `/en`, `/de` + bilinen app path'leri → next-intl'a gider
- Bilinmeyen ilk segment → dealer slug → `/d/[slug]` rewrite
- Kullanıcı `wheelvision.io/testjant` görür, Next.js `/d/testjant`'ı serve eder

### Dealer Sayfa Akışı (DealerPage.tsx)

1. **Welcome Screen:** Demo slider + "Ücretsiz Dene" butonu
2. **Upload Screen:** Araç fotoğrafı yükleme (+ örnek araçlar: Mercedes SL, Aston Martin, BMW E30)
3. **Wheel Selection:** Jant kataloğu grid (2-4 kolon)
4. **Generating:** Full-screen overlay (adım mesajları + progress bar)
5. **Result Screen:** Sonuç görseli + WhatsApp CTA (yeşil, pulse animasyon) + İndir + Sıfırla

### Demo Limit Sistemi

```typescript
const DEMO_LIMIT = 2;
const DEMO_LIMIT_ENABLED = false; // true → aktifleştir
```

- `demoUsage` state → localStorage `wheelvision_demo_usage` ile persist
- Limit dolunca modal: mailto:info@wheelvision.io + Instagram
- Sadece "Görsel Oluştur" butonu sınırlı; upload + jant seçimi serbest

---

## 7.5. Jant Boyutu Uyumluluk Sistemi

### Neden Var?

Kullanıcılar herhangi boyutta jant seçebildiği için AI yanlış oranlı sonuç üretebilir.

### Akış

1. **validate-car** araç görselinden jant boyutunu otomatik tespit eder (Claude Haiku)
2. **DealerPage.tsx** seçilen jantın ebat alanından inch değerini parse eder
3. **Boyut uyumsuzluğu** varsa (örn: araç 19", seçilen 21") → uyarı modal'ı göster
4. Kullanıcı onayladıktan sonra `full_wheel` prompt'u ile oluştur
5. Uyumsuzluk yoksa `rim_only` prompt'u kullan

### Önemli Dosyalar

- `validate-car/route.ts`: `wheel_size` field'ı döner
- `DealerPage.tsx`: `parseInchSize()`, `detectedCarWheelSize`, `showSizeWarning`, `sizeWarningConfirmed` state'leri
- `dealer/generate/route.ts`: `generation_type` parametresi alır, iki farklı prompt

### parseInchSize Fonksiyonu

```typescript
function parseInchSize(ebat: string | null | undefined): number | null {
  if (!ebat) return null;
  const match = ebat.match(/\b(1[4-9]|2[0-4])\b/); // 14-24 inch
  return match ? parseInt(match[1]) : null;
}
```

---

## 8. Environment Variables (Vercel'de Kayıtlı)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xrwdndupqhnxnvkjkjpr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

# n8n
N8N_WEBHOOK_URL=http://72.61.191.108:5678/webhook/jant-v4
N8N_WEBHOOK_SECRET=<secret>

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dxcok7tox
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=wheelvision

# AI
ANTHROPIC_API_KEY=<key>

# Redis
UPSTASH_REDIS_REST_URL=<url>
UPSTASH_REDIS_REST_TOKEN=<token>

# Görsel Sıkıştırma
TINYPNG_API_KEY=<key>

# Ödeme (iyzico)
IYZICO_API_KEY=<key>
IYZICO_SECRET_KEY=<key>
IYZICO_BASE_URL=https://sandbox-api.iyzipay.com  # prod: https://api.iyzipay.com
```

---

## 9. Fiyatlandırma

### B2C (Bireysel) — Tek Seferlik Kredi Paketleri

| Paket | Fiyat | Kredi | Özellik |
|-------|-------|-------|---------|
| Ücretsiz | $0 | 2 | Filigranlı görsel |
| 10 Kredi | $1.99 | 10 | Filigransız HD |
| 30 Kredi | $4.99 | 30 | Filigransız HD (popüler) |
| 50 Kredi | $6.99 | 50 | Filigransız HD |

Krediler birikmeli (birden fazla paketi satın alabilir). Süresi yok.

### B2B (Jant Bayii) — Dealer Pro

| Plan | Normal Fiyat | İlk Ay | Yenileme |
|------|-------------|--------|---------|
| Dealer Pro | $39.90/ay | $24.90 (%40 indirim) | $39.90/ay |

İçerik: 200 görsel/ay, özel markalı bayi sayfası, jant kataloğu yönetimi, WhatsApp lead bildirimleri, onboarding desteği.

---

## 10. DNS ve Hosting

### Nameservers

Porkbun'dan Cloudflare'e taşındı.
Cloudflare nameservers: `barb.ns.cloudflare.com`, `tim.ns.cloudflare.com`

### DNS Kayıtları

| Tip | Ad | Hedef |
|-----|-----|-------|
| A (Proxy) | @ | 76.76.21.21 (Vercel) |
| CNAME (Proxy) | www | cname.vercel-dns.com |
| A (DNS only) | n8n | 72.61.191.108 |

### VPS (n8n)

- **IP:** 72.61.191.108
- **Provider:** Hostinger
- **OS:** Ubuntu 24.04.4 LTS
- **SSH:** root@72.61.191.108
- **n8n:** http://72.61.191.108:5678

---

## 11. Güvenlik

- **SSRF koruması:** Cloudinary URL validasyonu (kendi cloud_name'imize ait mi?)
- **Output URL whitelist:** fal.media, res.cloudinary.com, storage.googleapis.com vb.
- **Rate limiting:** Upstash Redis (fail-open pattern)
  - `/api/generate`: 5 req/min/IP
  - `/api/dealer/generate`: 5 req/min/IP
  - `/api/validate-car`: 10 req/min/IP
- **Error sanitization:** INTERNAL_KEYWORDS → kullanıcıya generic mesaj
- **Cross-dealer spoofing:** dealer_id + slug double-check
- **Auth:** Bearer token → Supabase session verify (her generate çağrısında)
- **CSP:** `next.config.ts`'de kapsamlı header'lar
  - `worker-src * blob:` (browser-image-compression için)
  - `camera=(self)` Permissions-Policy (dealer mobile upload için)

---

## 12. Çözülen Önemli Sorunlar

### n8n "Empty string in image_urls"

**Sorun:** n8n Nano Banana 2 node'unda image_urls dizisinde 3. boş string eleman vardı.
**Çözüm:** 3. eleman + trailing comma kaldırıldı. Prompt hardcoded yerine `{{ $('Webhook').item.json.body.prompt }}` expression'ına çevrildi.

### jant_foto_url boş string

**Sorun:** Bazı dealer_wheels kayıtlarında jant_foto_url null/boş, n8n'e boş URL gidiyordu.
**Çözüm:** `dealer/generate/route.ts`'e `if (!wheel.jant_foto_url) return 400` guard eklendi.

### iyzipay npm paketi Vercel'de çalışmıyor

**Sorun:** `iyzipay` paketi `fs.readdirSync(...)` çağırıyor, Vercel Lambda'da ENOENT.
**Çözüm:** Paketi kullanma. `fetch` + `crypto.createHmac` ile doğrudan iyzico REST API (IYZWSv2 auth). Email için callbackUrl'e query param ekle.

### Fal AI sorunları

| Sorun | Çözüm |
|-------|-------|
| Arka jant değişmiyordu | "ALL VISIBLE WHEELS MUST BE CHANGED" kuralı (optimize prompt'ta) |
| Ekstra gölge/ışık ekliyordu | "READ, DO NOT CREATE" lighting kuralı |
| Araç rengi bozuluyordu | "ABSOLUTE PROHIBITION" bölümü |
| strength 0.38 yetmiyordu | 0.43'e çıkarıldı |

---

## 13. next.config.ts Özeti

```typescript
// CSP — geniş açık (iyzico payment flow tamamlandıktan sonra daraltılacak)
const csp = "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; ...worker-src * blob:;...";

images: {
  remotePatterns: [res.cloudinary.com/dxcok7tox, fal.media, *.fal.media],
  formats: ['image/avif', 'image/webp'],
  minimumCacheTTL: 31536000,
}
```

---

## 14. Optimize Edilmiş Fal AI Prompt (Referans)

Eski optimize prompt (n8n'de kullanılabilir — şu an B2C için daha basit bir prompt var):

```
Professional automotive photo retouching task. You are given two images: IMAGE 1 is the car photo to edit, IMAGE 2 is the reference wheel/rim design to apply. TASK: Replace ONLY the wheel rims in IMAGE 1 with the rim design from IMAGE 2. CRITICAL RULES: 1) Change NOTHING except the rim/wheel design — not the car body, not the color, not the paint, not the background. 2) ALL VISIBLE WHEELS MUST BE CHANGED — Apply the new rim design to EVERY wheel visible in the image. 3) LIGHTING — READ, DO NOT CREATE: inherit existing lighting at each wheel location. 4) The tire sidewall must remain completely unchanged. 5) Photorealistic, no artifacts. ABSOLUTE PROHIBITION: Do not add shadows. Do not add light. Do not change car color.

strength: 0.43, guidance_scale: 9, num_inference_steps: 50
```

---

## 15. Tamamlanan Özellikler

- ✅ B2C uygulama (upload, validate, generate, download)
- ✅ B2B dealer sayfa sistemi (wheelvision.io/[slug])
- ✅ n8n workflow (SAM 3 mask + nano-banana-2)
- ✅ Supabase Auth entegrasyonu
- ✅ Cloudinary upload (client-side sıkıştırma ile)
- ✅ TinyPNG sunucu sıkıştırma
- ✅ Upstash Redis rate limiting + cache
- ✅ Claude Haiku araç doğrulama
- ✅ Jant boyutu uyumluluk sistemi (wheel_size detection + mismatch modal)
- ✅ Demo limit sistemi (DealerPage) — şu an DEMO_LIMIT_ENABLED=false
- ✅ Full-screen generating overlay (adım mesajları + progress bar)
- ✅ WhatsApp CTA hiyerarşisi (pulse animasyon)
- ✅ Before/After demo slider (landing + dealer)
- ✅ Örnek araç fotoğrafları (SAMPLE_CARS)
- ✅ i18n: TR / EN / DE
- ✅ Google Analytics (G-5TEZ5ZTLBW)
- ✅ SEO: sitemap.ts, robots.ts, OpenGraph, Twitter Cards
- ✅ Araç fotoğrafı kalite ipucu (upload ekranı)
- ✅ Fiyatlandırma sayfası (B2C tab + B2B tab, AnimatePresence)
- ✅ Error sanitization (INTERNAL_KEYWORDS)
- ✅ iyzico ödeme entegrasyonu (direkt HTTP, IYZWSv2)
- ✅ Canvas filigran sistemi (ücretsiz plan)
- ✅ Görselleştirme geçmişi (history sayfası)

---

## 16. Yapılacaklar (TODO)

- ✳ `DEMO_LIMIT_ENABLED = true` — test bittikten sonra aç (`DealerPage.tsx`)
- ✳ iyzico live account (şahıs şirketi sonrası)
- ✳ Dealer admin paneli (jant ekleme/düzenleme UI)
- ✳ WhatsApp bildirim otomasyonu (n8n)
- ✳ Dealer analytics (hangi jantlar popüler, kaç görsel)
- ✳ Dealer onboarding formu (başvuru + otomatik slug)
- ✳ E-posta doğrulama akışı
- ✳ Instantly email kampanyası

---

## 17. Geliştirme Komutları

```bash
npm run dev      # Geliştirme sunucusu
npm run build    # Production build
npm run lint     # ESLint
```

---

## 18. Önemli Bağımlılıklar

```
next, react, typescript
next-intl              ← i18n
@supabase/supabase-js  ← DB + Auth
@upstash/redis         ← Rate limiting + cache
framer-motion          ← UI animasyon
browser-image-compression ← Client-side sıkıştırma
tinify                 ← Sunucu TinyPNG sıkıştırma
lucide-react           ← İkon seti
```
