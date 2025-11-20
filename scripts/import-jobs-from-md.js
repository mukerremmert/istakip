const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { promisify } = require('util');
const fs = require('fs');

// Veritabanı yolu
const dbPath = path.join(
  process.env.APPDATA || process.env.HOME,
  'connex-is-takip-sistemi',
  'database.sqlite'
);

// MD dosya yolu
const mdPath = path.join(__dirname, '..', 'ISLER.md');

console.log('\n' + '='.repeat(60));
console.log('📋 İŞ KAYITLARINI VERİTABANINA EKLEME');
console.log('='.repeat(60) + '\n');

console.log('📁 Veritabanı:', dbPath);
console.log('📁 MD dosyası:', mdPath);

// Dosya kontrolü
if (!fs.existsSync(mdPath)) {
  console.error('❌ MD dosyası bulunamadı:', mdPath);
  process.exit(1);
}

if (!fs.existsSync(dbPath)) {
  console.error('❌ Veritabanı bulunamadı:', dbPath);
  console.error('   Lütfen uygulamayı en az bir kez çalıştırın.');
  process.exit(1);
}

const db = new sqlite3.Database(dbPath);
const run = promisify(db.run.bind(db));
const get = promisify(db.get.bind(db));
const all = promisify(db.all.bind(db));

// MD dosyasını oku
const mdContent = fs.readFileSync(mdPath, 'utf8');

// Tablo satırlarını parse et (| ile başlayan satırlar)
const lines = mdContent.split('\n');
const jobLines = lines.filter(line => line.trim().startsWith('|') && !line.includes('---'));

// İlk satır başlık, onu atla
const dataLines = jobLines.slice(1);

console.log(`✅ ${dataLines.length} iş kaydı bulundu\n`);

// KDV hesapla
function calculateVAT(totalAmount, vatRate = 20) {
  const baseAmount = Math.round((totalAmount / (1 + vatRate / 100)) * 100) / 100;
  const vatAmount = Math.round((totalAmount - baseAmount) * 100) / 100;
  
  return {
    totalAmount: Math.round(totalAmount * 100) / 100,
    baseAmount,
    vatAmount,
    vatRate
  };
}

async function importJobs() {
  try {
    // Araçları kontrol et
    const vehicles = await all('SELECT id, plate FROM vehicles');
    if (vehicles.length === 0) {
      console.error('❌ Veritabanında araç bulunamadı!');
      console.error('   Lütfen önce en az bir araç ekleyin.');
      return;
    }
    console.log(`🚗 ${vehicles.length} araç bulundu\n`);
    
    // İlk aracı kullan (veya rastgele seç)
    const vehicle = vehicles[0];
    console.log(`📌 Kullanılacak araç: ${vehicle.plate} (ID: ${vehicle.id})\n`);
    
    let successCount = 0;
    let errorCount = 0;
    let duplicateCount = 0;
    let notFoundCourts = new Set();
    
    console.log('⏳ İşler ekleniyor...\n');
    
    for (let i = 0; i < dataLines.length; i++) {
      const line = dataLines[i];
      
      // Satırı parse et: | Tarih | Mahkeme | Dosya No | Tutar |
      const parts = line.split('|').map(p => p.trim()).filter(p => p);
      
      if (parts.length < 4) {
        errorCount++;
        continue;
      }
      
      const date = parts[0];
      const courtName = parts[1];
      const fileNumber = parts[2];
      const amount = parseFloat(parts[3]);
      
      if (!date || !courtName || !fileNumber || !amount || amount <= 0) {
        errorCount++;
        continue;
      }
      
      // Mahkemeyi bul
      let court = await get('SELECT id, name FROM courts WHERE name = ?', [courtName]);
      
      if (!court) {
        // LIKE ile ara
        court = await get('SELECT id, name FROM courts WHERE name LIKE ?', [`%${courtName}%`]);
      }
      
      if (!court) {
        notFoundCourts.add(courtName);
        errorCount++;
        continue;
      }
      
      // Duplicate kontrolü (aynı mahkeme + dosya numarası)
      const existing = await get(
        'SELECT id FROM jobs WHERE court_id = ? AND file_number = ?',
        [court.id, fileNumber]
      );
      
      if (existing) {
        duplicateCount++;
        continue;
      }
      
      // KDV hesapla
      const amounts = calculateVAT(amount);
      
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
          date, date, date, // date, received_date, scheduled_date (hepsi aynı)
          court.id, fileNumber, vehicle.id,
          amounts.totalAmount, amounts.baseAmount, amounts.vatAmount, amounts.vatRate,
          'Ödendi', 'Kesildi', 'Tamamlandı', date, // payment_status, invoice_status, status, status_date
          date, date // payment_date, completion_date (tarih ile aynı)
        ]);
        
        successCount++;
        
        if (successCount % 100 === 0) {
          console.log(`   ✅ ${successCount} kayıt eklendi...`);
        }
      } catch (err) {
        console.error(`   ❌ ${fileNumber} (${courtName}): ${err.message}`);
        errorCount++;
      }
    }
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📈 İMPORT TAMAMLANDI`);
    console.log(`${'='.repeat(60)}`);
    console.log(`✅ Başarılı:         ${successCount}`);
    console.log(`🔄 Tekrar (Atlandı): ${duplicateCount}`);
    console.log(`❌ Hata:             ${errorCount}`);
    console.log(`📊 Toplam:           ${dataLines.length}`);
    console.log(`${'='.repeat(60)}\n`);
    
    if (notFoundCourts.size > 0) {
      console.log(`⚠️  Bulunamayan Mahkemeler (${notFoundCourts.size}):`);
      notFoundCourts.forEach(court => console.log(`   - ${court}`));
      console.log('');
    }
    
    // Son durumu göster
    const finalCount = await get('SELECT COUNT(*) as count FROM jobs');
    const totalAmount = await get('SELECT SUM(total_amount) as total FROM jobs');
    
    console.log(`📊 Veritabanı Durumu:`);
    console.log(`   Toplam iş sayısı: ${finalCount.count}`);
    console.log(`   Toplam tutar: ${totalAmount.total ? totalAmount.total.toFixed(2) : '0.00'} TL\n`);
    
    console.log('✅ İşlem tamamlandı!\n');
    
  } catch (error) {
    console.error('❌ Genel hata:', error);
  } finally {
    db.close();
  }
}

importJobs();

