const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { promisify } = require('util');
const fs = require('fs');

// AppData path'ini kullan
const dbPath = path.join(
  process.env.APPDATA || process.env.HOME,
  'connex-is-takip-sistemi',
  'database.sqlite'
);

console.log('Database yolu:', dbPath);

const db = new sqlite3.Database(dbPath);
const run = promisify(db.run.bind(db));
const get = promisify(db.get.bind(db));
const all = promisify(db.all.bind(db));

// EXCEL'den kopyalanan tam veri - Her satır: Tarih [TAB] İşlem No [TAB] Açıklama
// Bu kısmı Excel'den kopyalayıp buraya yapıştırın
const rawBankData = `06/01/2025	248424931797	GELEN EFT - ANTALYA MAHKEMELER VEZNESİ - Antalya 2. (Sulh Hukuk Mah.) Satış Memu-2024/38 Satış-RAMAZAN ÇATAL
06/01/2025	248420609255	GELEN EFT - ANTALYA MAHKEMELER VEZNESİ - Antalya 2. (Sulh Hukuk Mah.) Satış Memu-2024/39 Satış-RAMAZAN ÇATAL
07/01/2025	248434416922	GELEN EFT - ANTALYA MAHKEMELER VEZNESİ - Antalya 11. Asliye Hukuk Mahkemesi-2023/432 Esas-RAMAZAN ÇATAL
07/01/2025	248435110822	GELEN EFT - ANTALYA MAHKEMELER VEZNESİ - Antalya 13. Asliye Hukuk Mahkemesi-2024/181 Esas-RAMAZAN ÇATAL
07/01/2025	248438127188	GELEN EFT - ANTALYA MAHKEMELER VEZNESİ - Antalya 13. Asliye Hukuk Mahkemesi-2024/26 Esas-RAMAZAN ÇATAL
07/01/2025	248439053977	GELEN EFT - ANTALYA MAHKEMELER VEZNESİ - Antalya 11. Asliye Hukuk Mahkemesi-2023/479 Esas-RAMAZAN ÇATAL
07/01/2025	248434084840	GELEN EFT - ANTALYA MAHKEMELER VEZNESİ - Antalya 11. Asliye Hukuk Mahkemesi-2024/175 Esas-RAMAZAN ÇATAL
09/01/2025	248453212728	GELEN EFT - ANTALYA MAHKEMELER VEZNESİ - Antalya 8. Asliye Hukuk Mahkemesi-2024/1051 Esas-RAMAZAN ÇATAL
09/01/2025	248455223747	GELEN EFT - ANTALYA MAHKEMELER VEZNESİ - Antalya 8. Asliye Hukuk Mahkemesi-2024/1071 Esas-RAMAZAN ÇATAL
09/01/2025	248455315899	GELEN EFT - ANTALYA MAHKEMELER VEZNESİ - Antalya 8. Asliye Hukuk Mahkemesi-2024/1093 Esas-RAMAZAN ÇATAL
09/01/2025	248452318793	GELEN EFT - ANTALYA MAHKEMELER VEZNESİ - Antalya 8. Asliye Hukuk Mahkemesi-2024/1113 Esas-RAMAZAN ÇATAL
09/01/2025	248450281117	GELEN EFT - ANTALYA MAHKEMELER VEZNESİ - Antalya 8. Asliye Hukuk Mahkemesi-2024/1102 Esas-RAMAZAN ÇATAL
09/01/2025	248458029932	GELEN EFT - ANTALYA MAHKEMELER VEZNESİ - Antalya 14. Sulh Hukuk Mahkemesi-2024/75 Esas-RAMAZAN ÇATAL
09/01/2025	248455862652	GELEN EFT - ANTALYA MAHKEMELER VEZNESİ - Antalya 8. Asliye Hukuk Mahkemesi-2024/1034 Esas-RAMAZAN ÇATAL
09/01/2025	248455862702	GELEN EFT - ANTALYA MAHKEMELER VEZNESİ - Antalya 8. Asliye Hukuk Mahkemesi-2024/1046 Esas-RAMAZAN ÇATAL
09/01/2025	248455794895	GELEN EFT - ANTALYA MAHKEMELER VEZNESİ - Antalya 8. Asliye Hukuk Mahkemesi-2024/1095 Esas-RAMAZAN ÇATAL
09/01/2025	248455794945	GELEN EFT - ANTALYA MAHKEMELER VEZNESİ - Antalya 8. Asliye Hukuk Mahkemesi-2024/1085 Esas-RAMAZAN ÇATAL
09/01/2025	248452876167	GELEN EFT - ANTALYA MAHKEMELER VEZNESİ - Antalya 8. Asliye Hukuk Mahkemesi-2024/1076 Esas-RAMAZAN ÇATAL
09/01/2025	248459733168	GELEN EFT - ANTALYA MAHKEMELER VEZNESİ - Antalya 8. Asliye Hukuk Mahkemesi-2024/1096 Esas-RAMAZAN ÇATAL
09/01/2025	248455864478	GELEN EFT - ANTALYA MAHKEMELER VEZNESİ - Antalya 8. Asliye Hukuk Mahkemesi-2024/1114 Esas-RAMAZAN ÇATAL
09/01/2025	248451382312	GELEN EFT - ANTALYA MAHKEMELER VEZNESİ - Antalya 8. Asliye Hukuk Mahkemesi-2024/1027 Esas-RAMAZAN ÇATAL
09/01/2025	248452501392	GELEN EFT - ANTALYA MAHKEMELER VEZNESİ - Antalya 8. Asliye Hukuk Mahkemesi-2024/1059 Esas-RAMAZAN ÇATAL
09/01/2025	248459512737	GELEN EFT - ANTALYA MAHKEMELER VEZNESİ - Antalya 8. Asliye Hukuk Mahkemesi-2024/1028 Esas-RAMAZAN ÇATAL
09/01/2025	248451372880	GELEN EFT - ANTALYA MAHKEMELER VEZNESİ - Antalya 8. Asliye Hukuk Mahkemesi-2024/1087 Esas-RAMAZAN ÇATAL
09/01/2025	248457327086	GELEN EFT - ANTALYA MAHKEMELER VEZNESİ - Antalya 8. Asliye Hukuk Mahkemesi-2024/1088 Esas-RAMAZAN ÇATAL
09/01/2025	248453556383	GELEN EFT - ANTALYA MAHKEMELER VEZNESİ - Antalya 8. Asliye Hukuk Mahkemesi-2024/1098 Esas-RAMAZAN ÇATAL
09/01/2025	248456472403	GELEN EFT - ANTALYA MAHKEMELER VEZNESİ - Antalya 8. Asliye Hukuk Mahkemesi-2024/1097 Esas-RAMAZAN ÇATAL
09/01/2025	248459512787	GELEN EFT - ANTALYA MAHKEMELER VEZNESİ - Antalya 8. Asliye Hukuk Mahkemesi-2024/1099 Esas-RAMAZAN ÇATAL
13/01/2025	248499009932	GELEN EFT - ANTALYA MAHKEMELER VEZNESİ - Antalya 5. Aile Mahkemesi-2023/770 Esas-RAMAZAN ÇATAL
13/01/2025	248499944204	GELEN EFT - ANTALYA MAHKEMELER VEZNESİ - Antalya 5. Aile Mahkemesi-2022/342 Esas-RAMAZAN ÇATAL
13/01/2025	248493763621	GELEN EFT - ANTALYA MAHKEMELER VEZNESİ - Antalya 10. Asliye Hukuk Mahkemesi-2023/87 Esas-RAMAZAN ÇATAL
13/01/2025	248492798898	GELEN EFT - ANTALYA MAHKEMELER VEZNESİ - Antalya 10. Asliye Hukuk Mahkemesi-2024/155 Esas-RAMAZAN ÇATAL
13/01/2025	248499743584	GELEN EFT - ANTALYA MAHKEMELER VEZNESİ - Antalya 10. Asliye Hukuk Mahkemesi-2024/166 Esas-RAMAZAN ÇATAL
13/01/2025	248497771257	GELEN EFT - ANTALYA MAHKEMELER VEZNESİ - Antalya 10. Asliye Hukuk Mahkemesi-2025/2 D.İş-RAMAZAN ÇATAL
14/01/2025	248501870266	GELEN EFT - ANTALYA MAHKEMELER VEZNESİ - Antalya 1. Asliye Ticaret Mahkemesi-2024/910 Esas-RAMAZAN ÇATAL
15/01/2025	248513073545	GELEN EFT - ANTALYA MAHKEMELER VEZNESİ - Antalya 16. Asliye Hukuk Mahkemesi-2023/345 Esas-RAMAZAN ÇATAL`;

// Parse fonksiyonu - Excel'den gelen verileri işle
function parseBankExtract(text) {
  const lines = text.trim().split('\n');
  const results = [];
  
  for (const line of lines) {
    // Tab ile ayır
    const parts = line.split('\t');
    if (parts.length < 3) continue;
    
    const date = parts[0].trim();
    const description = parts[2].trim();
    
    // Sadece mahkeme ödemelerini al
    if (!description.includes('MAHKEMELER VEZNESİ') && 
        !description.includes('İDARE MAHKEMESİ') && 
        !description.includes('BÖLGE ADLİYE')) {
      continue;
    }
    
    // Tarihi yyyy-mm-dd formatına çevir
    const [day, month, year] = date.split('/');
    const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    
    results.push({
      paymentDate: isoDate,
      description: description
    });
  }
  
  return results;
}

// Mahkeme adını ve dosya numarasını parse et
function parseCourtDescription(description) {
  // "GELEN EFT - " ve "VEZNES İ - " kısımlarını çıkar
  const cleanDesc = description
    .replace(/^GELEN\s+(EFT|FAST|HAVALE)\s*-\s*/, '')
    .replace(/^.*?VEZNESİ\s*-\s*/, '');
  
  // Court name ve file number'ı ayıkla
  const match = cleanDesc.match(/^(.+?)-(\d{4}\/\d+)\s+(Esas|Talimat|D\.İş|Satış)/);
  
  if (match) {
    let courtName = match[1].trim();
    // "Antalya" önekini kaldır
    courtName = courtName.replace(/^Antalya\s+/, '');
    
    return {
      courtName: courtName,
      fileNumber: match[2].trim()
    };
  }
  
  return null;
}

// Tarih hesaplamaları
function calculateDates(paymentDate) {
  const payment = new Date(paymentDate);
  
  // İş geliş tarihi: Ödeme tarihinden 10-30 gün önce (rastgele)
  const daysBeforePayment = 10 + Math.floor(Math.random() * 21);
  const receivedDate = new Date(payment);
  receivedDate.setDate(receivedDate.getDate() - daysBeforePayment);
  
  // İş yapılacak tarih: Geliş tarihinden 1-10 gün sonra (rastgele)
  const daysAfterReceived = 1 + Math.floor(Math.random() * 10);
  const scheduledDate = new Date(receivedDate);
  scheduledDate.setDate(scheduledDate.getDate() + daysAfterReceived);
  
  return {
    receivedDate: receivedDate.toISOString().split('T')[0],
    scheduledDate: scheduledDate.toISOString().split('T')[0],
    paymentDate: payment.toISOString().split('T')[0]
  };
}

// Rastgele tutar oluştur (1000-5000 TL arası)
function generateAmount() {
  const baseAmount = 1000 + Math.floor(Math.random() * 4000);
  const vatRate = 20;
  const vatAmount = Math.round((baseAmount * vatRate) / 100 * 100) / 100;
  const totalAmount = Math.round((baseAmount + vatAmount) * 100) / 100;
  
  return {
    baseAmount,
    vatAmount,
    totalAmount,
    vatRate
  };
}

async function importJobs() {
  try {
    console.log('🚀 EXCEL verisinden iş kayıtları oluşturuluyor...\n');
    console.log('📂 Lütfen Excel\'den tüm satırları kopyalayıp script\'e yapıştırın!\n');
    console.log('   Format: Tarih [TAB] İşlem No [TAB] Açıklama\n');
    
    // Parse bank data
    const bankData = parseBankExtract(rawBankData);
    console.log(`📊 ${bankData.length} mahkeme ödemesi bulundu\n`);
    
    if (bankData.length === 0) {
      console.log('⚠️  Veri bulunamadı! Excel\'den veriyi doğru formatta yapıştırdığınızdan emin olun.');
      console.log('   Her satırda: Tarih [TAB] İşlem No [TAB] Açıklama olmalı\n');
      return;
    }
    
    // Araçları al
    const vehicles = await all('SELECT id, plate FROM vehicles');
    if (vehicles.length === 0) {
      console.error('❌ Veritabanında araç bulunamadı!');
      return;
    }
    console.log(`🚗 ${vehicles.length} araç bulundu\n`);
    
    let successCount = 0;
    let errorCount = 0;
    let notFoundCourts = new Set();
    let duplicates = 0;
    
    console.log('⏳ İşleniyor...\n');
    
    for (let i = 0; i < bankData.length; i++) {
      const payment = bankData[i];
      const parsed = parseCourtDescription(payment.description);
      
      if (!parsed) {
        errorCount++;
        continue;
      }
      
      // Mahkemeyi bul
      let court = await get('SELECT id, name FROM courts WHERE name = ?', [parsed.courtName]);
      
      if (!court) {
        court = await get('SELECT id, name FROM courts WHERE name LIKE ?', [`%${parsed.courtName}%`]);
      }
      
      if (!court) {
        notFoundCourts.add(parsed.courtName);
        errorCount++;
        continue;
      }
      
      // Aynı dosya numarası var mı kontrol et
      const existing = await get(
        'SELECT id FROM jobs WHERE file_number = ? AND court_id = ?',
        [parsed.fileNumber, court.id]
      );
      
      if (existing) {
        duplicates++;
        continue;
      }
      
      // Rastgele araç seç
      const vehicle = vehicles[Math.floor(Math.random() * vehicles.length)];
      const dates = calculateDates(payment.paymentDate);
      const amounts = generateAmount();
      
      // İş kaydını ekle
      try {
        await run(`
          INSERT INTO jobs (
            date, received_date, scheduled_date, 
            court_id, file_number, vehicle_id,
            total_amount, base_amount, vat_amount, vat_rate,
            payment_status, invoice_status, status, status_date,
            payment_date, completion_date
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          dates.scheduledDate,
          dates.receivedDate,
          dates.scheduledDate,
          court.id,
          parsed.fileNumber,
          vehicle.id,
          amounts.totalAmount,
          amounts.baseAmount,
          amounts.vatAmount,
          amounts.vatRate,
          'Ödendi',
          'Kesildi',
          'Tamamlandı',
          dates.paymentDate,
          dates.paymentDate,
          dates.scheduledDate
        ]);
        
        successCount++;
        
        // Her 50 kayıtta bir ilerleme göster
        if (successCount % 50 === 0) {
          console.log(`   ✅ ${successCount} kayıt eklendi...`);
        }
      } catch (err) {
        console.error(`❌ ${parsed.fileNumber}: ${err.message}`);
        errorCount++;
      }
    }
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📈 İMPORT TAMAMLANDI`);
    console.log(`${'='.repeat(60)}`);
    console.log(`✅ Başarılı:      ${successCount}`);
    console.log(`🔄 Tekrar (Atlandı): ${duplicates}`);
    console.log(`❌ Hata:          ${errorCount}`);
    console.log(`📊 Toplam:        ${bankData.length}`);
    console.log(`${'='.repeat(60)}`);
    
    if (notFoundCourts.size > 0) {
      console.log(`\n⚠️  Bulunamayan Mahkemeler (${notFoundCourts.size}):`);
      notFoundCourts.forEach(court => console.log(`   - ${court}`));
    }
    
  } catch (error) {
    console.error('❌ Genel hata:', error);
  } finally {
    db.close();
  }
}

// Önce örnek veriyle test et
console.log('\n' + '='.repeat(60));
console.log('BANKA EKSTRESİ IMPORT ARACI');
console.log('='.repeat(60) + '\n');
console.log('ℹ️  Script çalışmadan önce:');
console.log('   1. Excel\'den tüm satırları seçin (Tarih, İşlem No, Açıklama)');
console.log('   2. Kopyalayın (Ctrl+C)');
console.log('   3. rawBankData değişkenine yapıştırın');
console.log('   4. Script\'i çalıştırın\n');

importJobs();
