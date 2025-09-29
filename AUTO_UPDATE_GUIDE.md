# 🔄 Auto-Update Sistemi - GitHub Releases

## ✅ Kurulum Tamamlandı!

Auto-update sistemi projenize eklendi. İşte nasıl kullanacağınız:

## 📋 Yapılandırma

### 1. GitHub Repository Oluştur

```bash
# GitHub'da yeni repo oluştur:
# https://github.com/new

# Repo adı: is-takip-sistemi
# Public veya Private (ikisi de çalışır)
```

### 2. package.json'ı Güncelle

`KULLANICI_ADINIZ` yerine GitHub kullanıcı adınızı yazın:

```json
"repository": {
  "type": "git",
  "url": "https://github.com/KULLANICI_ADINIZ/is-takip-sistemi.git"
}
```

### 3. electron-builder.yml'i Güncelle

```yaml
publish:
  provider: github
  owner: KULLANICI_ADINIZ  # <- GitHub kullanıcı adınız
  repo: is-takip-sistemi
```

### 4. GitHub Token Oluştur

```
1. GitHub → Settings → Developer settings
2. Personal access tokens → Tokens (classic)
3. "Generate new token"
4. Scopes: repo (tam erişim)
5. Token'ı kopyala
```

### 5. Token'ı Ortam Değişkenine Ekle

**Windows (PowerShell):**
```powershell
$env:GH_TOKEN="ghp_your_token_here"
```

**Veya .env dosyası:**
```
GH_TOKEN=ghp_your_token_here
```

## 🚀 İlk Release Oluşturma

### Yöntem 1: Manuel (GitHub Web)

```bash
# 1. Build oluştur
npm run dist

# 2. GitHub'da Release oluştur:
# - Go to: https://github.com/KULLANICI/is-takip-sistemi/releases/new
# - Tag: v2.2.0
# - Title: v2.2.0 - İlk Release
# - Upload: dist-installer\İş Takip Sistemi Setup 2.2.0.exe
# - Upload: dist-installer\İş Takip Sistemi Setup 2.2.0.exe.blockmap
# - Upload: dist-installer\latest.yml
# - Publish release
```

### Yöntem 2: Otomatik (electron-builder)

```bash
# Build + Publish (tek komut)
npm run build
electron-builder --publish always

# Sadece build (publish yok)
npm run dist
```

## 🔄 Güncelleme İş Akışı

### Otomatik Kontrol

Uygulama:
1. Başladığında 5 saniye sonra kontrol eder
2. Her 2 saatte bir tekrar kontrol eder
3. Yeni versiyon varsa kullanıcıya sorar

### Manuel Kontrol

Kullanıcı UI'dan "Güncellemeleri Kontrol Et" butonuna tıklayabilir.

## 📊 Güncelleme Senaryoları

### Senaryo 1: Yeni Versiyon Var

```
1. ✨ "Yeni güncelleme mevcut: v2.3.0" dialog gösterilir
2. Kullanıcı "Şimdi İndir" tıklar
3. 📥 İndirme başlar (progress bar gösterilir)
4. ✅ İndirme tamamlanır
5. 🔄 "Şimdi Yeniden Başlat" dialog gösterilir
6. Uygulama kapanır ve güncelleme kurulur
7. Uygulama yeni versiyonla açılır
```

### Senaryo 2: Güncelleme Yok

```
1. 🔍 Kontrol yapılır
2. ✅ "Uygulama güncel" (sessizce, dialog yok)
```

### Senaryo 3: Hata

```
1. ❌ Hata oluşur (network, vb.)
2. Kullanıcıya hata mesajı gösterilir
```

## 🧪 Test Etme

### Test 1: Development'ta Devre Dışı

```bash
npm run electron:dev
# Console: "⚠️ Development modda auto-updater devre dışı"
```

### Test 2: Production Build

```bash
npm run dist
# İş Takip Sistemi Setup 2.2.0.exe çalıştır
# 5 saniye sonra güncelleme kontrolü yapılır
```

### Test 3: Yeni Versiyon Simüle Et

```bash
# 1. package.json'da version'ı artır: 2.3.0
# 2. npm run dist
# 3. GitHub'da v2.3.0 release oluştur
# 4. Eski versiyon (v2.2.0) çalıştır
# 5. Güncelleme dialog görmeli
```

## 📝 Yeni Versiyon Yayınlama Adımları

```bash
# 1. Kod değişiklikleri yap
git add .
git commit -m "v2.3.0: Yeni özellikler"

# 2. package.json'da version güncelle
"version": "2.3.0"

# 3. VERSIONING.md güncelle
## v2.3.0 - Yeni Özellikler (2025-10-01)
...

# 4. Build oluştur
npm run dist

# 5. GitHub Release oluştur (manuel veya otomatik)
# Manuel: GitHub web üzerinden
# Otomatik: electron-builder --publish always

# 6. Kullanıcılar otomatik güncelleme alacak!
```

## 🎨 UI'a Güncelleme Butonu Ekle (Opsiyonel)

Layout veya Settings'e ekleyin:

```tsx
// src/shared/components/Layout.tsx veya Settings.tsx
const handleCheckUpdates = async () => {
  await window.electron.ipcRenderer.invoke('check-for-updates')
}

<button onClick={handleCheckUpdates}>
  🔄 Güncellemeleri Kontrol Et
</button>
```

## ⚙️ Ayarlar

### Otomatik İndirme

```typescript
// src/main/auto-updater.ts (line 9)
autoUpdater.autoDownload = false // true yaparsanız otomatik indirir
```

### Kontrol Sıklığı

```typescript
// src/main/auto-updater.ts (line 72-74)
setInterval(() => {
  checkForUpdates()
}, 2 * 60 * 60 * 1000) // 2 saat (ms cinsinden)
```

### İlk Kontrol Gecikmesi

```typescript
// src/main/auto-updater.ts (line 68-70)
setTimeout(() => {
  checkForUpdates()
}, 5000) // 5 saniye
```

## 🐛 Sorun Giderme

### Sorun 1: "Cannot find GitHub release"

**Sebep**: GitHub'da release yok veya token geçersiz

**Çözüm**:
```bash
# Token'ı kontrol et
echo $env:GH_TOKEN

# GitHub'da release oluşturulduğunu doğrula
# https://github.com/KULLANICI/is-takip-sistemi/releases
```

### Sorun 2: "Auto-updater error"

**Sebep**: Network sorunu veya yanlış konfigürasyon

**Çözüm**:
```bash
# Log dosyasını kontrol et:
# C:\Users\[USER]\AppData\Roaming\is-takip-sistemi\logs\main.log
```

### Sorun 3: "Update not working"

**Sebep**: Development moddasınız

**Çözüm**: Production build kullanın
```bash
npm run dist
# dist-installer\win-unpacked\İş Takip Sistemi.exe
```

## 📊 Delta Update

electron-updater otomatik olarak **delta update** yapar:
- İlk kurulum: ~150 MB
- Güncelleme: ~5-10 MB (sadece değişen dosyalar)

## 🔐 Güvenlik

### Code Signing (Önerilen)

Code signing olmadan SmartScreen uyarısı verecek. Önlemek için:

```bash
# 1. Code signing sertifikası al ($200-400/yıl)
# 2. electron-builder.yml'e ekle:

win:
  certificateFile: path/to/cert.pfx
  certificatePassword: your_password
```

### Private Repo

Private repo kullanıyorsanız, kullanıcılar güncellemeleri alabilir (token server-side).

## 📈 İstatistikler

GitHub Releases'te indirme sayılarını görebilirsiniz:
```
https://github.com/KULLANICI/is-takip-sistemi/releases
```

## 🎉 Özet

✅ Auto-update sistemi kurulu
✅ GitHub Releases entegrasyonu hazır
✅ Otomatik kontrol her 2 saatte
✅ Manuel kontrol desteği
✅ Delta update (küçük güncelleme boyutu)
✅ Kullanıcı dostu dialog'lar

**Sonraki adım**: 
1. GitHub repo'su oluştur
2. Token al ve ayarla
3. İlk release oluştur
4. Test et!

---
**Oluşturulma Tarihi**: 30 Eylül 2025  
**Versiyon**: 2.2.0  
**Auto-Updater**: electron-updater 6.6.2
