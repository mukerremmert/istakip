const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { promisify } = require('util');

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

// Tüm banka ekstresi mahkeme verileri (Regex ile sadece mahkeme kayıtlarını filtreledim)
const bankPayments = `06/01/2025	ANTALYA MAHKEMELER VEZNESİ - Antalya 2. (Sulh Hukuk Mah.) Satış Memu-2024/38 Satış-RAMAZAN ÇATAL
06/01/2025	ANTALYA MAHKEMELER VEZNESİ - Antalya 2. (Sulh Hukuk Mah.) Satış Memu-2024/39 Satış-RAMAZAN ÇATAL
07/01/2025	ANTALYA MAHKEMELER VEZNESİ - Antalya 11. Asliye Hukuk Mahkemesi-2023/432 Esas-RAMAZAN ÇATAL
07/01/2025	ANTALYA MAHKEMELER VEZNESİ - Antalya 13. Asliye Hukuk Mahkemesi-2024/181 Esas-RAMAZAN ÇATAL
07/01/2025	ANTALYA MAHKEMELER VEZNESİ - Antalya 13. Asliye Hukuk Mahkemesi-2024/26 Esas-RAMAZAN ÇATAL
07/01/2025	ANTALYA MAHKEMELER VEZNESİ - Antalya 11. Asliye Hukuk Mahkemesi-2023/479 Esas-RAMAZAN ÇATAL
07/01/2025	ANTALYA MAHKEMELER VEZNESİ - Antalya 11. Asliye Hukuk Mahkemesi-2024/175 Esas-RAMAZAN ÇATAL
09/01/2025	ANTALYA MAHKEMELER VEZNESİ - Antalya 8. Asliye Hukuk Mahkemesi-2024/1051 Esas-RAMAZAN ÇATAL
09/01/2025	ANTALYA MAHKEMELER VEZNESİ - Antalya 8. Asliye Hukuk Mahkemesi-2024/1071 Esas-RAMAZAN ÇATAL
09/01/2025	ANTALYA MAHKEMELER VEZNESİ - Antalya 8. Asliye Hukuk Mahkemesi-2024/1093 Esas-RAMAZAN ÇATAL
09/01/2025	ANTALYA MAHKEMELER VEZNESİ - Antalya 8. Asliye Hukuk Mahkemesi-2024/1113 Esas-RAMAZAN ÇATAL
09/01/2025	ANTALYA MAHKEMELER VEZNESİ - Antalya 8. Asliye Hukuk Mahkemesi-2024/1102 Esas-RAMAZAN ÇATAL
09/01/2025	ANTALYA MAHKEMELER VEZNESİ - Antalya 14. Sulh Hukuk Mahkemesi-2024/75 Esas-RAMAZAN ÇATAL
09/01/2025	ANTALYA MAHKEMELER VEZNESİ - Antalya 8. Asliye Hukuk Mahkemesi-2024/1034 Esas-RAMAZAN ÇATAL
09/01/2025	ANTALYA MAHKEMELER VEZNESİ - Antalya 8. Asliye Hukuk Mahkemesi-2024/1046 Esas-RAMAZAN ÇATAL
09/01/2025	ANTALYA MAHKEMELER VEZNESİ - Antalya 8. Asliye Hukuk Mahkemesi-2024/1095 Esas-RAMAZAN ÇATAL
09/01/2025	ANTALYA MAHKEMELER VEZNESİ - Antalya 8. Asliye Hukuk Mahkemesi-2024/1085 Esas-RAMAZAN ÇATAL
09/01/2025	ANTALYA MAHKEMELER VEZNESİ - Antalya 8. Asliye Hukuk Mahkemesi-2024/1076 Esas-RAMAZAN ÇATAL
09/01/2025	ANTALYA MAHKEMELER VEZNESİ - Antalya 8. Asliye Hukuk Mahkemesi-2024/1096 Esas-RAMAZAN ÇATAL
09/01/2025	ANTALYA MAHKEMELER VEZNESİ - Antalya 8. Asliye Hukuk Mahkemesi-2024/1114 Esas-RAMAZAN ÇATAL
09/01/2025	ANTALYA MAHKEMELER VEZNESİ - Antalya 8. Asliye Hukuk Mahkemesi-2024/1027 Esas-RAMAZAN ÇATAL
09/01/2025	ANTALYA MAHKEMELER VEZNESİ - Antalya 8. Asliye Hukuk Mahkemesi-2024/1059 Esas-RAMAZAN ÇATAL
09/01/2025	ANTALYA MAHKEMELER VEZNESİ - Antalya 8. Asliye Hukuk Mahkemesi-2024/1028 Esas-RAMAZAN ÇATAL
09/01/2025	ANTALYA MAHKEMELER VEZNESİ - Antalya 8. Asliye Hukuk Mahkemesi-2024/1087 Esas-RAMAZAN ÇATAL
09/01/2025	ANTALYA MAHKEMELER VEZNESİ - Antalya 8. Asliye Hukuk Mahkemesi-2024/1088 Esas-RAMAZAN ÇATAL
09/01/2025	ANTALYA MAHKEMELER VEZNESİ - Antalya 8. Asliye Hukuk Mahkemesi-2024/1098 Esas-RAMAZAN ÇATAL
09/01/2025	ANTALYA MAHKEMELER VEZNESİ - Antalya 8. Asliye Hukuk Mahkemesi-2024/1097 Esas-RAMAZAN ÇATAL
09/01/2025	ANTALYA MAHKEMELER VEZNESİ - Antalya 8. Asliye Hukuk Mahkemesi-2024/1099 Esas-RAMAZAN ÇATAL
13/01/2025	ANTALYA MAHKEMELER VEZNESİ - Antalya 5. Aile Mahkemesi-2023/770 Esas-RAMAZAN ÇATAL
13/01/2025	ANTALYA MAHKEMELER VEZNESİ - Antalya 5. Aile Mahkemesi-2022/342 Esas-RAMAZAN ÇATAL
13/01/2025	ANTALYA MAHKEMELER VEZNESİ - Antalya 10. Asliye Hukuk Mahkemesi-2023/87 Esas-RAMAZAN ÇATAL
13/01/2025	ANTALYA MAHKEMELER VEZNESİ - Antalya 10. Asliye Hukuk Mahkemesi-2024/155 Esas-RAMAZAN ÇATAL
13/01/2025	ANTALYA MAHKEMELER VEZNESİ - Antalya 10. Asliye Hukuk Mahkemesi-2024/166 Esas-RAMAZAN ÇATAL
13/01/2025	ANTALYA MAHKEMELER VEZNESİ - Antalya 10. Asliye Hukuk Mahkemesi-2025/2 D.İş-RAMAZAN ÇATAL
14/01/2025	ANTALYA MAHKEMELER VEZNESİ - Antalya 1. Asliye Ticaret Mahkemesi-2024/910 Esas-RAMAZAN ÇATAL
15/01/2025	ANTALYA MAHKEMELER VEZNESİ - Antalya 16. Asliye Hukuk Mahkemesi-2023/345 Esas-RAMAZAN ÇATAL
15/01/2025	ANTALYA MAHKEMELER VEZNESİ - Antalya 16. Asliye Hukuk Mahkemesi-2024/356 Esas-RAMAZAN ÇATAL
15/01/2025	ANTALYA MAHKEMELER VEZNESİ - Antalya 16. Asliye Hukuk Mahkemesi-2024/268 Esas-RAMAZAN ÇATAL
17/01/2025	ANTALYA MAHKEMELER VEZNESİ - Antalya 16. Asliye Hukuk Mahkemesi-2024/364 Esas-RAMAZAN ÇATAL
17/01/2025	ANTALYA MAHKEMELER VEZNESİ - Antalya 16. Asliye Hukuk Mahkemesi-2024/139 Esas-RAMAZAN ÇATAL
17/01/2025	ANTALYA MAHKEMELER VEZNESİ - Antalya 16. Asliye Hukuk Mahkemesi-2024/193 Esas-RAMAZAN ÇATAL
17/01/2025	ANTALYA MAHKEMELER VEZNESİ - Antalya 16. Asliye Hukuk Mahkemesi-2024/359 Esas-RAMAZAN ÇATAL
17/01/2025	ANTALYA MAHKEMELER VEZNESİ - Antalya 4. Asliye Ticaret Mahkemesi-2024/576 Esas-RAMAZAN ÇATAL
17/01/2025	ANTALYA MAHKEMELER VEZNESİ - Antalya 5. Sulh Hukuk Mahkemesi-2023/698 Esas-RAMAZAN ÇATAL
20/01/2025	ANTALYA MAHKEMELER VEZNESİ - Antalya 11. Asliye Hukuk Mahkemesi-2021/49 Esas-RAMAZAN ÇATAL
21/01/2025	ANTALYA MAHKEMELER VEZNESİ - Antalya 10. Sulh Hukuk Mahkemesi-2024/894 Esas-RAMAZAN ÇATAL
21/01/2025	ANTALYA MAHKEMELER VEZNESİ - Antalya 10. Sulh Hukuk Mahkemesi-2024/923 Esas-RAMAZAN ÇATAL
21/01/2025	ANTALYA MAHKEMELER VEZNESİ - Antalya 11. Asliye Hukuk Mahkemesi-2024/216 Esas-RAMAZAN ÇATAL
21/01/2025	ANTALYA MAHKEMELER VEZNESİ - Antalya 10. Sulh Hukuk Mahkemesi-2024/928 Esas-RAMAZAN ÇATAL
21/01/2025	ANTALYA MAHKEMELER VEZNESİ - Antalya 1. Asliye Ticaret Mahkemesi-2024/156 Talimat-RAMAZAN ÇATAL
21/01/2025	ANTALYA MAHKEMELER VEZNESİ - Antalya 11. Asliye Hukuk Mahkemesi-2024/48 Esas-RAMAZAN ÇATAL
21/01/2025	ANTALYA MAHKEMELER VEZNESİ - Antalya 11. Asliye Hukuk Mahkemesi-2025/3 Esas-RAMAZAN ÇATAL
21/01/2025	ANTALYA MAHKEMELER VEZNESİ - Antalya 10. Sulh Hukuk Mahkemesi-2024/836 Esas-RAMAZAN ÇATAL`;

// Satırları parse et
function parseBankData(text) {
  const lines = text.trim().split('\n');
  const data = [];
  
  for (const line of lines) {
    const parts = line.split('\t');
    if (parts.length >= 2) {
      const date = parts[0].trim();
      const description = parts[1].trim();
      
      // Tarihi yyyy-mm-dd formatına çevir
      const [day, month, year] = date.split('/');
      const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      
      data.push({
        paymentDate: isoDate,
        description: description
      });
    }
  }
  
  return data;
}

// Mahkeme adını ve dosya numarasını parse et
function parseCourtDescription(description) {
  // "ANTALYA MAHKEMELER VEZNESİ - " kısmını çıkar
  const cleanDesc = description.replace(/^.*?VEZNESİ\s*-\s*/, '');
  
  // Court name ve file number'ı ayıkla
  // Format: "Mahkeme Adı-2024/123 Esas-RAMAZAN ÇATAL" veya "Mahkeme Adı-2024/123 Talimat-RAMAZAN ÇATAL"
  const match = cleanDesc.match(/^(.+?)-(\d{4}\/\d+)\s+(Esas|Talimat|D\.İş|Satış)/);
  
  if (match) {
    let courtName = match[1].trim();
    // "Antalya" önekini kaldır - veritabanında Antalya ön eki yok
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
    console.log('🚀 Banka ekstresinden iş kayıtları oluşturuluyor...\n');
    
    // Parse bank data
    const bankData = parseBankData(bankPayments);
    console.log(`📊 ${bankData.length} ödeme kaydı bulundu\n`);
    
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
    
    for (const payment of bankData) {
      const parsed = parseCourtDescription(payment.description);
      
      if (!parsed) {
        console.log(`⚠️  Parse edilemedi: ${payment.description}`);
        errorCount++;
        continue;
      }
      
      // Mahkemeyi bul - daha esnek arama
      let court = await get('SELECT id, name FROM courts WHERE name = ?', [parsed.courtName]);
      
      if (!court) {
        // Tam eşleşme bulunamazsa LIKE ile ara
        court = await get('SELECT id, name FROM courts WHERE name LIKE ?', [`%${parsed.courtName}%`]);
      }
      
      if (!court) {
        notFoundCourts.add(parsed.courtName);
        errorCount++;
        continue;
      }
      
      // Rastgele araç seç
      const vehicle = vehicles[Math.floor(Math.random() * vehicles.length)];
      
      // Tarihleri hesapla
      const dates = calculateDates(payment.paymentDate);
      
      // Tutarları oluştur
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
        console.log(`✅ ${parsed.courtName} - ${parsed.fileNumber}`);
      } catch (err) {
        console.error(`❌ ${parsed.fileNumber}: ${err.message}`);
        errorCount++;
      }
    }
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📈 ÖZET`);
    console.log(`${'='.repeat(60)}`);
    console.log(`✅ Başarılı:    ${successCount}`);
    console.log(`❌ Hata:        ${errorCount}`);
    console.log(`📊 Toplam:      ${bankData.length}`);
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

importJobs();
