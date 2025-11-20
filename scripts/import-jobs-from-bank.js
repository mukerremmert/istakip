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

// Banka ekstresi verileri - Sadece mahkemelerden gelen ödemeler
const bankData = [
  { paymentDate: '2025-01-06', description: 'Antalya 2. (Sulh Hukuk Mah.) Satış Memu-2024/38 Satış-RAMAZAN ÇATAL' },
  { paymentDate: '2025-01-06', description: 'Antalya 2. (Sulh Hukuk Mah.) Satış Memu-2024/39 Satış-RAMAZAN ÇATAL' },
  { paymentDate: '2025-01-07', description: 'Antalya 11. Asliye Hukuk Mahkemesi-2023/432 Esas-RAMAZAN ÇATAL' },
  { paymentDate: '2025-01-07', description: 'Antalya 13. Asliye Hukuk Mahkemesi-2024/181 Esas-RAMAZAN ÇATAL' },
  { paymentDate: '2025-01-07', description: 'Antalya 13. Asliye Hukuk Mahkemesi-2024/26 Esas-RAMAZAN ÇATAL' },
  { paymentDate: '2025-01-07', description: 'Antalya 11. Asliye Hukuk Mahkemesi-2023/479 Esas-RAMAZAN ÇATAL' },
  { paymentDate: '2025-01-07', description: 'Antalya 11. Asliye Hukuk Mahkemesi-2024/175 Esas-RAMAZAN ÇATAL' },
  { paymentDate: '2025-01-09', description: 'Antalya 8. Asliye Hukuk Mahkemesi-2024/1051 Esas-RAMAZAN ÇATAL' },
  { paymentDate: '2025-01-09', description: 'Antalya 8. Asliye Hukuk Mahkemesi-2024/1071 Esas-RAMAZAN ÇATAL' },
  { paymentDate: '2025-01-09', description: 'Antalya 8. Asliye Hukuk Mahkemesi-2024/1093 Esas-RAMAZAN ÇATAL' }
  // Daha fazla kayıt eklenebilir...
];

// Mahkeme adını ve dosya numarasını parse et
function parseDescription(description) {
  const match = description.match(/^(.+?)-(\d{4}\/\d+)/);
  if (match) {
    return {
      courtName: match[1].trim(),
      fileNumber: match[2].trim()
    };
  }
  return null;
}

// Tarih hesaplamaları
function calculateDates(paymentDate) {
  const payment = new Date(paymentDate);
  
  // İş geliş tarihi: Ödeme tarihinden 10-30 gün önce (rastgele)
  const daysBeforePayment = 10 + Math.floor(Math.random() * 21); // 10-30 arası
  const receivedDate = new Date(payment);
  receivedDate.setDate(receivedDate.getDate() - daysBeforePayment);
  
  // İş yapılacak tarih: Geliş tarihinden 1-10 gün sonra (rastgele)
  const daysAfterReceived = 1 + Math.floor(Math.random() * 10); // 1-10 arası
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
  const vatAmount = (baseAmount * vatRate) / 100;
  const totalAmount = baseAmount + vatAmount;
  
  return {
    baseAmount,
    vatAmount,
    totalAmount,
    vatRate
  };
}

async function importJobs() {
  try {
    console.log('🚀 İş kayıtları ekleniyor...\n');
    
    // Rastgele bir araç seç
    const vehicles = await all('SELECT id, plate FROM vehicles');
    if (vehicles.length === 0) {
      console.error('❌ Veritabanında araç bulunamadı!');
      return;
    }
    
    console.log(`📊 ${vehicles.length} araç bulundu`);
    console.log(`📊 ${bankData.length} ödeme kaydı işlenecek\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const payment of bankData) {
      const parsed = parseDescription(payment.description);
      if (!parsed) {
        console.log(`⚠️  Parse edilemedi: ${payment.description}`);
        errorCount++;
        continue;
      }
      
      // Mahkemeyi bul
      const court = await get('SELECT id FROM courts WHERE name LIKE ?', [`%${parsed.courtName}%`]);
      if (!court) {
        console.log(`⚠️  Mahkeme bulunamadı: ${parsed.courtName}`);
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
        console.log(`✅ ${parsed.courtName} - ${parsed.fileNumber} eklendi`);
      } catch (err) {
        console.error(`❌ Hata: ${parsed.fileNumber} - ${err.message}`);
        errorCount++;
      }
    }
    
    console.log(`\n📈 Özet:`);
    console.log(`   ✅ Başarılı: ${successCount}`);
    console.log(`   ❌ Hata: ${errorCount}`);
    console.log(`   📊 Toplam: ${bankData.length}`);
    
  } catch (error) {
    console.error('❌ Genel hata:', error);
  } finally {
    db.close();
  }
}

importJobs();
