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
const mdPath = path.join(__dirname, '..', 'MAHKEMELER.md');

console.log('\n' + '='.repeat(60));
console.log('📋 MAHKEMELERİ VERİTABANINA EKLEME');
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

// Mahkeme isimlerini çıkar (numara. ile başlayan satırlar)
const courtLines = mdContent
  .split('\n')
  .filter(line => /^\d+\.\s/.test(line.trim()))
  .map(line => line.replace(/^\d+\.\s/, '').trim());

console.log(`✅ ${courtLines.length} mahkeme ismi bulundu\n`);

// Şehir ve ilçe tespit et
function detectCityAndDistrict(name) {
  // Korkuteli kontrolü
  if (name.includes('Korkuteli')) {
    return { city: 'Antalya', district: 'Korkuteli' };
  }
  
  // Diğerleri Antalya
  return { city: 'Antalya', district: null };
}

async function importCourts() {
  try {
    let successCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;
    
    console.log('⏳ Mahkemeler ekleniyor...\n');
    
    for (const courtName of courtLines) {
      if (!courtName || courtName.trim() === '') continue;
      
      const { city, district } = detectCityAndDistrict(courtName);
      
      // Duplicate kontrolü
      const existing = await get('SELECT id FROM courts WHERE name = ?', [courtName]);
      
      if (existing) {
        duplicateCount++;
        continue;
      }
      
      // Mahkemeyi ekle (tür olmadan)
      try {
        await run(
          'INSERT INTO courts (name, city, district) VALUES (?, ?, ?)',
          [courtName, city, district]
        );
        
        successCount++;
        console.log(`   ✅ ${courtName}`);
        
      } catch (err) {
        console.error(`   ❌ ${courtName}: ${err.message}`);
        errorCount++;
      }
    }
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📈 İMPORT TAMAMLANDI`);
    console.log(`${'='.repeat(60)}`);
    console.log(`✅ Başarılı:         ${successCount}`);
    console.log(`🔄 Tekrar (Atlandı): ${duplicateCount}`);
    console.log(`❌ Hata:             ${errorCount}`);
    console.log(`📊 Toplam:           ${courtLines.length}`);
    console.log(`${'='.repeat(60)}\n`);
    
    // Son durumu göster
    const finalCount = await get('SELECT COUNT(*) as count FROM courts');
    console.log(`📊 Veritabanındaki toplam mahkeme sayısı: ${finalCount.count}\n`);
    
    console.log('✅ İşlem tamamlandı!\n');
    
  } catch (error) {
    console.error('❌ Genel hata:', error);
  } finally {
    db.close();
  }
}

importCourts();

