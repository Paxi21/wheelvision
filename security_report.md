# WheelVision Güvenlik Raporu

**Tarih:** 2026-04-01
**Durum:** Kritik sorunlar giderildi

---

## Özet

Proje genel olarak iyi bir güvenlik mimarisine sahip. Aşağıdaki düzeltmeler uygulandı.

---

## ✅ DÜZELTMELER

### 1. n8n Webhook URL — GIZLENDI
- `NEXT_PUBLIC_N8N_WEBHOOK_URL` → `N8N_WEBHOOK_URL` olarak değiştirildi
- URL artık sadece sunucuda okunuyor, browser'da asla görünmüyor
- Tüm istekler `/api/generate` proxy route üzerinden geçiyor

### 2. Server-Side Auth + Kredi Kontrolü
- `/api/generate/route.ts` oluşturuldu
- Her istekte Supabase JWT doğrulanıyor
- Krediler veritabanından server-side kontrol ediliyor (client state'e güvenilmiyor)

### 3. Rate Limiting
- Kullanıcı başına saatte 5 istek sınırı (in-memory)
- ⚠️ Multi-instance deploy için Redis gerekir

### 4. Dosya Yükleme Validasyonu
- MIME type kontrolü: sadece `image/jpeg`, `image/png`, `image/webp`
- Dosya boyutu sınırı: maksimum 10MB
- Client-side `accept="image/*"` bypass'ına karşı koruma

### 5. Output URL Whitelist
- n8n'den dönen görsel URL'leri güvenilir domain listesiyle doğrulanıyor
- İzin verilen domainler: `fal.media`, `res.cloudinary.com`, `storage.googleapis.com`

### 6. Hata Mesajı Sanitizasyonu
- İç servis hataları (n8n status, network errors) kullanıcıya gösterilmiyor
- Hassas bilgiler sadece sunucu log'larına yazılıyor

### 7. Güvenlik Header'ları
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Content-Security-Policy` — izin verilen kaynaklar whitelist

### 8. Next.js Middleware
- `/app`, `/history`, `/settings` rotaları korumalı
- Oturumsuz kullanıcılar otomatik `/login`'e yönlendiriliyor
- Oturum açık kullanıcılar `/login`'e giremez

### 9. .env.local — Git'e Commit Edilmemiş ✅
- `.gitignore`'da `.env*` kuralı mevcut
- `.env.local` git tarafından track edilmiyor (doğrulandı)

---

## ⚠️ YAPILMASI GEREKENLER (Manuel)

### Kritik — Yapılması zorunlu

| # | Sorun | Çözüm |
|---|-------|-------|
| 1 | n8n HTTP kullanıyor | HTTPS'e geç veya n8n'in önüne Nginx/Cloudflare koy |
| 2 | n8n URL tahmin edilebilir (`jant-v4`) | UUID tabanlı webhook URL'i oluştur: `/webhook/8f3a9c2e-...` |
| 3 | n8n webhook kimlik doğrulama yok | n8n'de "Header Auth" ekle: `X-Webhook-Secret` header kontrolü |
| 4 | Cloudinary upload preset kısıtlanmamış | Cloudinary dashboard'da preset'i sadece `image/*` ve max 10MB ile sınırla |

### Supabase RLS (Row Level Security)

Supabase dashboard'da şu policy'lerin aktif olduğunu kontrol et:

```sql
-- users tablosu: kullanıcı sadece kendi verisini görebilir
CREATE POLICY "Users can view own data"
ON users FOR SELECT
USING (auth.email() = email);

-- generations tablosu: kullanıcı sadece kendi üretimlerini görebilir
CREATE POLICY "Users can view own generations"
ON generations FOR SELECT
USING (auth.email() = user_email);

-- generations tablosu: sadece service role insert yapabilir (n8n)
CREATE POLICY "Service role can insert generations"
ON generations FOR INSERT
WITH CHECK (auth.role() = 'service_role');
```

### n8n Webhook Secret Ekleme

n8n'de "Header Auth" credential oluştur:
- Header name: `X-Webhook-Secret`
- Header value: rastgele UUID (örn: `openssl rand -hex 32`)

Sonra API route'una ekle:

```typescript
// route.ts içinde n8n fetch'e header ekle:
headers: {
  'Content-Type': 'application/json',
  'X-Webhook-Secret': process.env.N8N_WEBHOOK_SECRET!,
},
```

---

## Mevcut Durum

| Alan | Durum |
|------|-------|
| API anahtarları browser'da gizli | ✅ |
| Server-side auth doğrulama | ✅ |
| Server-side kredi kontrolü | ✅ |
| Rate limiting | ✅ (basic) |
| Dosya validasyonu | ✅ |
| Güvenlik header'ları + CSP | ✅ |
| Route protection (middleware) | ✅ |
| .gitignore .env koruma | ✅ |
| n8n HTTPS | ❌ |
| n8n webhook secret | ❌ |
| Supabase RLS policy kontrolü | ❓ |
| Redis rate limiting | ❓ (opsiyonel) |
