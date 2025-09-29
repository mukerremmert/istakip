# 🎯 Final Test Checklist - Windows Installer

## ✅ Yapılan Kritik Düzeltmeler

### 1. Database Path Sorunu ✓
**Sorun**: `process.cwd()` kurulu uygulamada yanlış yeri gösteriyordu  
**Çözüm**: `app.getPath('userData')` kullanıldı

```typescript
// YANLIŞ (Önceki):
const dbPath = path.join(process.cwd(), 'database.sqlite')
// → C:\Users\...\AppData\Local\Programs\is-takip-sistemi\database.sqlite (YANLIŞ!)

// DOĞRU (Yeni):
const dbPath = path.join(app.getPath('userData'), 'database.sqlite')
// → C:\Users\...\AppData\Roaming\İş Takip Sistemi\database.sqlite (DOĞRU!)
```

### 2. IPC Handler Timing ✓
**Sorun**: Handler'lar window oluşturulmadan önce kurulmuyordu  
**Çözüm**: Database + IPC setup window'dan ÖNCE yapılıyor

### 3. Schema Migration ✓
**Sorun**: Eski database yeni schema'ya uymuyor  
**Çözüm**: Database silindi, yeni schema ile oluşturulacak

## 📋 Test 1: Win-Unpacked (Şu an çalışıyor)

```powershell
cd C:\Projeler\ramazancatal
.\dist-installer\win-unpacked\İş Takip Sistemi.exe
```

### Kontrol Listesi:
- [ ] Dashboard açıldı
- [ ] İşler listesi görünüyor
- [ ] Mahkemeler listesi görünüyor
- [ ] Araçlar listesi görünüyor
- [ ] İş oluşturma çalışıyor
- [ ] Console'da hata yok

### Database Konumu:
```
C:\Users\[KULLANICI]\AppData\Roaming\İş Takip Sistemi\database.sqlite
```

## 📦 Test 2: Installer (Asıl Test)

### Adım 1: Eski Kurulumu Kaldır (Eğer varsa)

```powershell
# Windows Ayarlar → Uygulamalar
# "İş Takip Sistemi" bul → Kaldır

# VEYA PowerShell ile:
Get-WmiObject -Class Win32_Product | Where-Object { $_.Name -like "*İş Takip*" } | ForEach-Object { $_.Uninstall() }
```

### Adım 2: Yeni Installer'ı Çalıştır

```powershell
cd C:\Projeler\ramazancatal
Start-Process "dist-installer\İş Takip Sistemi Setup 1.0.0.exe"
```

**SmartScreen Uyarısı**:
```
"More info" → "Run anyway" tıklayın
```

**Kurulum Seçenekleri**:
- ✅ Installation Path: `C:\Users\[KULLANICI]\AppData\Local\Programs\is-takip-sistemi`
- ✅ Desktop Shortcut: EVET (önerilen)
- ✅ Start Menu: EVET (varsayılan)

### Adım 3: Kurulum Sonrası Kontroller

#### A) Uygulama Başlatma
```powershell
# Yöntem 1: Desktop shortcut'tan
# Yöntem 2: Start Menu'den
# Yöntem 3: Direkt exe'den
& "$env:LOCALAPPDATA\Programs\is-takip-sistemi\İş Takip Sistemi.exe"
```

#### B) Kontrol Listesi
- [ ] Uygulama açıldı
- [ ] Dashboard yüklendi
- [ ] İşler listesi görünüyor
- [ ] Mahkemeler listesi görünüyor
- [ ] Araçlar listesi görünüyor
- [ ] İş oluşturma çalışıyor
- [ ] CRUD işlemleri çalışıyor
- [ ] Export (Excel/PDF) çalışıyor
- [ ] Console'da hata yok

#### C) Database Konumu
```
C:\Users\[KULLANICI]\AppData\Roaming\İş Takip Sistemi\database.sqlite
```

Kontrol et:
```powershell
Test-Path "$env:APPDATA\İş Takip Sistemi\database.sqlite"
# True dönmeli
```

#### D) Log Dosyası
```
C:\Users\[KULLANICI]\AppData\Roaming\İş Takip Sistemi\app-debug.log
```

Hata varsa bu dosyaya bakın:
```powershell
Get-Content "$env:APPDATA\İş Takip Sistemi\app-debug.log" -Tail 50
```

## 🔍 Yaygın Sorunlar ve Çözümleri

### Sorun 1: "No handler registered"
**Sebep**: IPC handler'lar kurulmamış  
**Çözüm**: ✓ Düzeltildi (window'dan önce kurulu)

### Sorun 2: "SQLITE_ERROR: no such column"
**Sebep**: Eski database schema'sı  
**Çözüm**: Database'i sil:
```powershell
Remove-Item "$env:APPDATA\İş Takip Sistemi\database.sqlite"
```

### Sorun 3: Database bulunamadı
**Sebep**: Path yanlış  
**Çözüm**: ✓ Düzeltildi (app.getPath('userData') kullanılıyor)

### Sorun 4: Native modül hatası
**Sebep**: sqlite3 düzgün rebuild edilmemiş  
**Kontrol**:
```powershell
cd C:\Projeler\ramazancatal\dist-installer\win-unpacked\resources
# app.asar.unpacked\node_modules\sqlite3\build\Release\node_sqlite3.node olmalı
```

## 📊 Beklenen Sonuç

### Win-Unpacked vs Kurulu Uygulama

| Özellik | Win-Unpacked | Kurulu Uygulama | Durum |
|---------|--------------|-----------------|-------|
| **Çalışıyor** | ✅ | ✅ | Aynı |
| **Database Path** | AppData\Roaming | AppData\Roaming | Aynı |
| **Log Path** | AppData\Roaming | AppData\Roaming | Aynı |
| **Native Modules** | ✅ | ✅ | Aynı |
| **IPC Handlers** | ✅ | ✅ | Aynı |

### Dosya Yapısı Karşılaştırması

**Win-Unpacked**:
```
dist-installer\win-unpacked\
├── İş Takip Sistemi.exe
├── resources\
│   ├── app.asar (React UI + main.cjs packed)
│   └── app.asar.unpacked\
│       └── node_modules\sqlite3\ (native modül)
└── *.dll dosyaları
```

**Kurulu Uygulama**:
```
%LOCALAPPDATA%\Programs\is-takip-sistemi\
├── İş Takip Sistemi.exe
├── resources\
│   ├── app.asar
│   └── app.asar.unpacked\
│       └── node_modules\sqlite3\
└── *.dll dosyaları

%APPDATA%\İş Takip Sistemi\
├── database.sqlite    <- DATA BURDA!
└── app-debug.log
```

## ✅ Başarı Kriterleri

Tüm bunlar çalışıyorsa **BAŞARILI**:

1. ✅ Installer çalıştı
2. ✅ Kurulum tamamlandı
3. ✅ Uygulama açıldı
4. ✅ Dashboard yüklendi
5. ✅ CRUD işlemleri çalışıyor
6. ✅ Database `AppData\Roaming` içinde
7. ✅ Console'da IPC hatası yok
8. ✅ Start Menu shortcut çalışıyor
9. ✅ Desktop shortcut çalışıyor
10. ✅ Uygulama kapatılıp açılınca veriler korunuyor

## 🎊 Tamamlandı!

Eğer tüm testler başarılıysa:

### Dağıtıma Hazır ✓
```
dist-installer\İş Takip Sistemi Setup 1.0.0.exe
└── 153 MB NSIS Installer
```

### Paylaşım
- USB'ye kopyala
- Email ile gönder
- Cloud'a yükle (OneDrive, Dropbox, Google Drive)
- Network share'e koy

### Kullanıcı Talimatları
```
1. Setup dosyasını çalıştır
2. SmartScreen: "More info" → "Run anyway"
3. Kurulum konumunu seç (varsayılan OK)
4. "Install" tıkla
5. Kurulum bitince "Finish"
6. Desktop'taki ikonu çift tıkla
```

## 📝 Notlar

### Version Yönetimi
Gelecekte version değiştirmek için:
```json
// package.json
"version": "1.0.1"
```

Build sonrası:
```
İş Takip Sistemi Setup 1.0.1.exe
```

### Auto-Update (Gelecek)
electron-updater zaten yüklü. Server kurulduğunda:
- Yeni versiyon server'a upload
- Uygulama otomatik kontrol eder
- Kullanıcı "Update" butonuna tıklar
- ~5-10 MB delta download

### Kod İmzalama (Opsiyonel)
SmartScreen uyarısını kaldırmak için:
- Code signing sertifikası al ($200-400/yıl)
- electron-builder config'e ekle
- Her build'de otomatik imzala

---
**Test Tarihi**: 29 Eylül 2025  
**Build Version**: 1.0.0  
**Son Düzeltme**: Database path fix (app.getPath('userData'))
