# 🛡️ Database Koruma Testi

## ✅ Mevcut Ayar

### electron-builder.yml (Line 54)
```yaml
deleteAppDataOnUninstall: false
```

**Anlamı**: Uygulama kaldırıldığında `AppData\Roaming\İş Takip Sistemi\` klasörü **SİLİNMEYECEK** ✓

## 📋 Test Senaryosu

### Aşama 1: Database Oluştur

1. Yeni build'i kur:
```powershell
cd C:\Projeler\ramazancatal
Start-Process "dist-installer\İş Takip Sistemi Setup 1.0.0.exe"
```

2. Uygulamayı aç ve veri gir:
   - [ ] En az 1 mahkeme ekle
   - [ ] En az 1 araç ekle
   - [ ] En az 1 iş ekle

3. Database'in oluştuğunu doğrula:
```powershell
$dbPath = "$env:APPDATA\İş Takip Sistemi\database.sqlite"
Test-Path $dbPath
# True dönmeli

Get-Item $dbPath | Select Name, Length, LastWriteTime
# Dosya bilgileri görünmeli
```

### Aşama 2: Uygulama Verisini Yedekle (Opsiyonel)

```powershell
# Yedek al (emin olmak için)
$backupPath = "$env:USERPROFILE\Desktop\database_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').sqlite"
Copy-Item "$env:APPDATA\İş Takip Sistemi\database.sqlite" $backupPath
Write-Host "✓ Yedek oluşturuldu: $backupPath"
```

### Aşama 3: Uygulamayı Kaldır

#### Yöntem 1: Windows Ayarlar (Önerilen)
```
Windows Ayarlar (Win + I)
→ Uygulamalar
→ Yüklü uygulamalar
→ "İş Takip Sistemi" bul
→ "..." → "Kaldır"
```

#### Yöntem 2: Denetim Masası
```
Denetim Masası
→ Programlar ve Özellikler
→ "İş Takip Sistemi"
→ Sağ tık → Kaldır
```

#### Yöntem 3: PowerShell
```powershell
# UYARI: Yalnızca test için!
Get-Package "*İş Takip*" | Uninstall-Package
```

### Aşama 4: Database'i Kontrol Et

**ÖNEMLI**: Kaldırma işleminden HEMEN SONRA:

```powershell
Write-Host "`n=== DATABASE KORUMA KONTROLÜ ===" -ForegroundColor Cyan

$appDataPath = "$env:APPDATA\İş Takip Sistemi"
$dbPath = "$appDataPath\database.sqlite"
$logPath = "$appDataPath\app-debug.log"

Write-Host "`n1. AppData klasörü var mı?"
if (Test-Path $appDataPath) {
    Write-Host "   ✅ EVET - Klasör korundu!" -ForegroundColor Green
    
    Write-Host "`n2. Database dosyası var mı?"
    if (Test-Path $dbPath) {
        Write-Host "   ✅ EVET - Database korundu!" -ForegroundColor Green
        $db = Get-Item $dbPath
        Write-Host "   📊 Boyut: $($db.Length / 1KB) KB" -ForegroundColor Cyan
        Write-Host "   📅 Son değişiklik: $($db.LastWriteTime)" -ForegroundColor Cyan
    } else {
        Write-Host "   ❌ HAYIR - Database silindi!" -ForegroundColor Red
    }
    
    Write-Host "`n3. Klasör içeriği:"
    Get-ChildItem $appDataPath | Format-Table Name, Length, LastWriteTime -AutoSize
    
} else {
    Write-Host "   ❌ HAYIR - AppData klasörü silindi!" -ForegroundColor Red
    Write-Host "   ⚠️  deleteAppDataOnUninstall çalışmadı!" -ForegroundColor Yellow
}
```

### Aşama 5: Yeniden Kur ve Test Et

```powershell
# Yeniden kur
cd C:\Projeler\ramazancatal
Start-Process "dist-installer\İş Takip Sistemi Setup 1.0.0.exe"

# Kurulum bitince uygulamayı aç
# → Eski veriler görünüyor mu?
```

**Beklenen Sonuç**:
- ✅ Mahkemeler listesi eski verilerle dolu
- ✅ Araçlar listesi eski verilerle dolu
- ✅ İşler listesi eski verilerle dolu

## 📊 Test Matrisi

| Durum | Beklenen | Gerçek | Sonuç |
|-------|----------|--------|-------|
| AppData klasörü korunuyor mu? | ✅ Evet | ? | Bekliyor |
| Database dosyası korunuyor mu? | ✅ Evet | ? | Bekliyor |
| Log dosyası korunuyor mu? | ✅ Evet | ? | Bekliyor |
| Yeniden kurulumda veri görünüyor mu? | ✅ Evet | ? | Bekliyor |

## 🔧 Alternatif Ayarlar

### Seçenek 1: Mevcut (Önerilen) ✓
```yaml
deleteAppDataOnUninstall: false
```
- ✅ Veriler korunur
- ✅ Yeniden kurunca veriler geri gelir
- ⚠️ Manuel silmek gerekir (eğer tamamen temizlemek istenirse)

### Seçenek 2: Kullanıcıya Sor
```yaml
deleteAppDataOnUninstall: false
# NSIS custom script ile sor:
# "Uygulama verileri de silinsin mi?"
```

### Seçenek 3: Her Zaman Sil (ÖNERİLMEZ!)
```yaml
deleteAppDataOnUninstall: true
```
- ❌ TÜM VERİLER SİLİNİR
- ❌ Yedek alınmazsa kayıp
- ❌ Kullanıcı memnuniyetsizliği

## 🎯 Önerilen Davranış (Şu anki ayar)

### Kullanıcı Deneyimi

**Senaryo 1: Normal Kullanım**
```
Kurulum → Veri Girişi → Günlük Kullanım
→ Veriler AppData'da güvenle saklanıyor ✓
```

**Senaryo 2: Yanlışlıkla Kaldırma**
```
Yanlışlıkla "Kaldır" → Panikte kaldır
→ Veriler KORUNUYOR ✓
→ Yeniden kur → Veriler geri geliyor ✓
```

**Senaryo 3: Kasıtlı Temizlik**
```
Bilgisayarı değiştiriyorum, temizlemek istiyorum
→ Kaldır → Veriler korunuyor
→ Manuel sil:
   - Windows Ayarlar → Depolama → Geçici dosyalar
   - VEYA manuel: %APPDATA%\İş Takip Sistemi klasörünü sil
```

**Senaryo 4: Güncelleme**
```
Version 1.0.0 → 1.1.0 güncelleme
→ ESKİ VERSİYONU KALDIRMA!
→ Direkt yeni installer'ı çalıştır
→ Eski sürüm otomatik upgrade edilir
→ Veriler korunur ✓
```

## 📖 Kullanıcı Dokümantasyonu

Kullanıcılara şunu söyleyin:

### ✅ İyi Haber
**"Uygulama kaldırılsa bile verileriniz korunur!"**

- Yanlışlıkla kaldırsanız bile verileriniz güvende
- Yeniden kurduğunuzda tüm verileriniz geri gelir
- Yedekleme yapmayı unutsanız bile sorun yok

### ⚠️ Tamamen Silmek İsterseniz
Uygulamayı kaldırdıktan sonra manuel olarak şu klasörü silin:
```
C:\Users\[KULLANICI_ADI]\AppData\Roaming\İş Takip Sistemi
```

### 📦 Yedekleme Yapma
Düzenli yedek almak isterseniz:
```powershell
# Bu dosyayı kopyalayın:
C:\Users\[KULLANICI_ADI]\AppData\Roaming\İş Takip Sistemi\database.sqlite

# Buraya:
- USB bellek
- OneDrive / Google Drive
- Network paylaşım
```

## 🧪 Otomatik Test Script

Tüm testi otomatikleştirmek için:

```powershell
# test-database-protection.ps1

Write-Host "=== DATABASE KORUMA TESTİ ===" -ForegroundColor Cyan

# 1. Mevcut durumu kontrol et
$appDataPath = "$env:APPDATA\İş Takip Sistemi"
$dbPath = "$appDataPath\database.sqlite"

Write-Host "`n1. Test verisi oluşturuluyor..."
# (Manuel: Uygulamayı aç, veri gir)
Read-Host "Veri girişini tamamladınız mı? (Enter basın)"

# 2. Database'i yedekle
$backupPath = "$env:TEMP\db_test_backup.sqlite"
Copy-Item $dbPath $backupPath
Write-Host "✓ Yedek alındı"

# 3. Dosya bilgilerini kaydet
$beforeSize = (Get-Item $dbPath).Length
$beforeDate = (Get-Item $dbPath).LastWriteTime
Write-Host "`nÖNCE:"
Write-Host "  Boyut: $beforeSize bytes"
Write-Host "  Tarih: $beforeDate"

# 4. Kaldırmayı bekle
Write-Host "`nŞimdi uygulamayı Denetim Masası'ndan kaldırın..."
Read-Host "Kaldırma tamamlandı mı? (Enter basın)"

# 5. Kontrolü yap
Write-Host "`nSONRA:"
if (Test-Path $dbPath) {
    $afterSize = (Get-Item $dbPath).Length
    $afterDate = (Get-Item $dbPath).LastWriteTime
    
    Write-Host "  ✅ DATABASE KORUNDU!" -ForegroundColor Green
    Write-Host "  Boyut: $afterSize bytes"
    Write-Host "  Tarih: $afterDate"
    
    if ($beforeSize -eq $afterSize -and $beforeDate -eq $afterDate) {
        Write-Host "`n🎉 TEST BAŞARILI! Veriler tamamen korundu!" -ForegroundColor Green
    } else {
        Write-Host "`n⚠️ Dosya değişmiş!" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ❌ DATABASE SİLİNDİ!" -ForegroundColor Red
    Write-Host "  deleteAppDataOnUninstall ayarı çalışmadı!" -ForegroundColor Red
    
    # Yedekten geri yükle
    Copy-Item $backupPath $dbPath
    Write-Host "`n✓ Yedekten geri yüklendi" -ForegroundColor Cyan
}

# Cleanup
Remove-Item $backupPath -ErrorAction SilentlyContinue
```

## 📝 Özet

### Mevcut Durum: Güvenli ✓

```yaml
deleteAppDataOnUninstall: false  # ← Bu satır kritik!
```

**Sonuç**:
- ✅ Veriler korunuyor
- ✅ Yanlışlıkla kaldırma güvenli
- ✅ Yeniden kurulumda veriler geri geliyor
- ✅ Kullanıcı dostu

**Öneriler**:
1. ✅ Mevcut ayarı değiştirmeyin
2. ✅ Kullanıcı dokümantasyonuna ekleyin
3. ✅ Yedekleme önerisi verin
4. ✅ Güncelleme sırasında kaldırmayın (upgrade yapın)

---
**Test Tarihi**: Test edilecek  
**Beklenen Sonuç**: Database korunacak ✓  
**Gerçek Sonuç**: Test sonrası güncellenecek
