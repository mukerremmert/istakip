# Electron Build Sorunları Çözüm Rehberi

## 🔧 Adım 1: Temiz Başlangıç

```bash
# Node modules ve cache'i temizle
cd C:\Projeler\ramazancatal
rmdir /s /q node_modules
rmdir /s /q dist
rmdir /s /q dist-electron
rmdir /s /q dist-installer
del package-lock.json

# Tekrar yükle
npm install
```

## 🔧 Adım 2: Native Modülleri Rebuild Et

```bash
# sqlite3'ü Electron için rebuild et
npm run rebuild

# Veya manuel
npx electron-rebuild -f -w sqlite3
```

## 🔧 Adım 3: Test Build (Dir Mode)

```bash
# Önce sadece klasöre build et (hızlı test)
npm run dist:dir

# Eğer başarılı olursa:
# C:\Projeler\ramazancatal\dist-installer\win-unpacked\İş Takip Sistemi.exe
```

## 🔧 Adım 4: Full Installer Build

```bash
# NSIS installer oluştur
npm run dist

# Veya portable exe
npm run build:portable
```

## 🐛 Yaygın Hatalar ve Çözümleri

### Hata 1: "Cannot find module 'sqlite3'"
```bash
# Çözüm: Native modülü rebuild et
npm rebuild sqlite3 --runtime=electron --target=38.1.2 --disturl=https://electronjs.org/headers --abi=127
```

### Hata 2: "Application entry file not found"
```bash
# Çözüm: package.json main path'i kontrol et
# "main": "dist-electron/main.cjs" olmalı
```

### Hata 3: "ASAR extraction failed"
```bash
# Çözüm: electron-builder.yml'de asarUnpack kullan
# sqlite3 ve native modüller unpack edilmeli
```

### Hata 4: "Build failed: Code signing"
```bash
# Çözüm: package.json'da signAndEditExecutable: false
# electron-builder.yml'de signtoolOptions: null
```

### Hata 5: "Windows Defender / SmartScreen"
```bash
# Çözüm 1: Portable exe kullan (build:portable)
# Çözüm 2: Kod imzalama sertifikası al ($300-400/yıl)
# Çözüm 3: .NET'e geç (ClickOnce publishing)
```

## ✅ Başarılı Build Kontrolü

Build başarılıysa şunları göreceksiniz:

```
dist-installer/
├── İş Takip Sistemi Setup 1.0.0.exe  (~150MB)
├── latest.yml
└── win-unpacked/
    └── İş Takip Sistemi.exe
```

## 🚀 Hızlı Test

```bash
# Build edilen exe'yi çalıştır
."dist-installer\win-unpacked\İş Takip Sistemi.exe"
```

## 📊 Build Boyutları

- **Unpacked**: ~300-400 MB
- **NSIS Installer**: ~150-180 MB
- **Portable**: ~150-180 MB
- **7z Archive**: ~120-140 MB

## 🔍 Debug Modu

Eğer hala sorun varsa debug mode ile build edin:

```bash
# Verbose output ile
$env:DEBUG="electron-builder"
npm run dist

# Log dosyasına yaz
npm run dist > build.log 2>&1
```

## ⚡ Alternatif: better-sqlite3 Kullan

sqlite3 yerine better-sqlite3 daha az sorun çıkarır:

```bash
npm uninstall sqlite3
npm install better-sqlite3
```

Sonra database-handler.ts'de:
```typescript
import Database from 'better-sqlite3';
// Daha basit API, daha az build sorunu
```

## 🎯 En İyi Pratikler

1. ✅ `asar: true` kullan, sadece native modülleri unpack et
2. ✅ Gereksiz node_modules'leri files exclude et
3. ✅ Compression: maximum (daha küçük boyut)
4. ✅ oneClick: false (kullanıcı installation path seçebilsin)
5. ✅ portable versiyonu da hazırla (installer sorunları için)
