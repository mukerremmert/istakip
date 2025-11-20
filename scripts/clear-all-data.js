const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { promisify } = require('util');
const fs = require('fs');

// Olası veritabanı yolları
const possiblePaths = [
  // Production path (kurulu uygulama)
  path.join(process.env.APPDATA, 'Connex İş Takip Sistemi', 'database.sqlite'),
  // Eski path
  path.join(process.env.APPDATA, 'connex-is-takip-sistemi', 'database.sqlite'),
  // Development path
  path.join(process.env.APPDATA, 'Electron', 'database.sqlite'),
];

console.log('🔍 Veritabanı aranıyor...\n');

let dbPath = null;
for (const possiblePath of possiblePaths) {
  if (fs.existsSync(possiblePath)) {
    dbPath = possiblePath;
    console.log(`✅ Veritabanı bulundu: ${dbPath}\n`);
    break;
  }
}

if (!dbPath) {
  console.error('❌ Veritabanı bulunamadı! Olası yollar:');
  possiblePaths.forEach(p => console.log(`   - ${p}`));
  process.exit(1);
}

const db = new sqlite3.Database(dbPath);
const run = promisify(db.run.bind(db));
const get = promisify(db.get.bind(db));
const all = promisify(db.all.bind(db));

async function clearAllData() {
  try {
    console.log('⚠️  TÜM VERİLER SİLİNECEK!\n');
    console.log('📊 Mevcut kayıt sayıları:\n');
    
    // Mevcut kayıt sayılarını göster
    const jobsCount = await get('SELECT COUNT(*) as count FROM jobs');
    const courtsCount = await get('SELECT COUNT(*) as count FROM courts');
    const vehiclesCount = await get('SELECT COUNT(*) as count FROM vehicles');
    
    console.log(`   İşler:     ${jobsCount.count}`);
    console.log(`   Mahkemeler: ${courtsCount.count}`);
    console.log(`   Araçlar:   ${vehiclesCount.count}\n`);
    
    if (jobsCount.count === 0 && courtsCount.count === 0 && vehiclesCount.count === 0) {
      console.log('✅ Veritabanı zaten boş!\n');
      db.close();
      return;
    }
    
    console.log('🗑️  Silme işlemi başlıyor...\n');
    
    // Foreign key constraint'leri devre dışı bırak
    await run('PRAGMA foreign_keys = OFF');
    
    // Önce işleri sil (foreign key bağımlılığı var)
    await run('DELETE FROM jobs');
    console.log('   ✅ İşler silindi');
    
    // Sonra mahkemeleri sil
    await run('DELETE FROM courts');
    console.log('   ✅ Mahkemeler silindi');
    
    // Son olarak araçları sil
    await run('DELETE FROM vehicles');
    console.log('   ✅ Araçlar silindi');
    
    // Foreign key constraint'leri tekrar aktif et
    await run('PRAGMA foreign_keys = ON');
    
    // VACUUM yaparak veritabanını optimize et
    await run('VACUUM');
    console.log('   ✅ Veritabanı optimize edildi\n');
    
    // Sonuçları kontrol et
    const finalJobsCount = await get('SELECT COUNT(*) as count FROM jobs');
    const finalCourtsCount = await get('SELECT COUNT(*) as count FROM courts');
    const finalVehiclesCount = await get('SELECT COUNT(*) as count FROM vehicles');
    
    console.log('📊 Silme sonrası kayıt sayıları:\n');
    console.log(`   İşler:     ${finalJobsCount.count}`);
    console.log(`   Mahkemeler: ${finalCourtsCount.count}`);
    console.log(`   Araçlar:   ${finalVehiclesCount.count}\n`);
    
    console.log('✅ Tüm veriler başarıyla silindi!\n');
    
  } catch (error) {
    console.error('❌ Hata:', error.message);
    console.error(error);
  } finally {
    db.close();
  }
}

clearAllData();

