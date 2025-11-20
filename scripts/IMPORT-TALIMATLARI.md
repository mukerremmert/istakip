# 📥 Tek Seferlik Import Talimatları

## Müşterinin Bilgisayarında Kullanım

### 1. Gereksinimler
- Node.js kurulu olmalı (uygulama ile birlikte gelir)
- Excel dosyası (`Hesap_Hareketleri.xls`) proje klasöründe olmalı
- Uygulama en az bir kez çalıştırılmış olmalı (veritabanı oluşsun)

### 2. Adımlar

1. **Excel dosyasını kontrol et:**
   - `Hesap_Hareketleri.xls` dosyası proje klasöründe olmalı
   - Dosya yolu: `C:\Projeler\ramazancatal\Hesap_Hareketleri.xls`

2. **Script'i çalıştır:**
   ```bash
   cd C:\Projeler\ramazancatal
   node scripts/one-time-import.js
   ```

3. **Sonuçları kontrol et:**
   - Script, kaç mahkeme eklendiğini gösterir
   - Kaç iş kaydı oluşturulduğunu gösterir
   - Hataları listeler

### 3. Önemli Notlar

- ✅ Script otomatik olarak yeni mahkemeleri oluşturur
- ✅ Duplicate kayıtları atlar (aynı dosya numarası + mahkeme)
- ✅ Mevcut araçları kullanır (en az 1 araç olmalı)
- ⚠️  Eğer araç yoksa, önce uygulamadan araç ekleyin

### 4. Sorun Giderme

**Excel dosyası bulunamadı:**
- Dosyanın proje klasöründe olduğundan emin olun
- Dosya adının `Hesap_Hareketleri.xls` olduğundan emin olun

**Veritabanı bulunamadı:**
- Uygulamayı en az bir kez çalıştırın
- Veritabanı yolu: `%APPDATA%\connex-is-takip-sistemi\database.sqlite`

**Araç bulunamadı:**
- Uygulamadan en az bir araç ekleyin
- Sonra script'i tekrar çalıştırın

### 5. Alternatif: Manuel Ekleme

Eğer script çalışmazsa, uygulamadan manuel olarak:
1. Mahkemeler sayfasından mahkemeleri ekleyin
2. İşler sayfasından iş kayıtlarını ekleyin

