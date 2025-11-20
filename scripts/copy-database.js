const fs = require('fs');
const path = require('path');

// Kaynak veritabanı (bu bilgisayar)
const sourceDbPath = path.join(
  process.env.APPDATA || process.env.HOME,
  'connex-is-takip-sistemi',
  'database.sqlite'
);

// Hedef klasör (müşterinin bilgisayarına kopyalamak için)
const targetFolder = path.join(__dirname, '..', 'database-backup');
const targetDbPath = path.join(targetFolder, 'database.sqlite');

console.log('\n' + '='.repeat(60));
console.log('📋 VERİTABANI KOPYALAMA');
console.log('='.repeat(60) + '\n');

console.log('📁 Kaynak:', sourceDbPath);
console.log('📁 Hedef: ', targetDbPath);

// Kaynak dosya kontrolü
if (!fs.existsSync(sourceDbPath)) {
  console.error('❌ Kaynak veritabanı bulunamadı:', sourceDbPath);
  console.error('   Lütfen önce veritabanını hazırlayın (node scripts/prepare-database.js)');
  process.exit(1);
}

// Hedef klasörü oluştur
if (!fs.existsSync(targetFolder)) {
  fs.mkdirSync(targetFolder, { recursive: true });
  console.log('✅ Hedef klasör oluşturuldu:', targetFolder);
}

// Dosyayı kopyala
try {
  fs.copyFileSync(sourceDbPath, targetDbPath);
  console.log('✅ Veritabanı başarıyla kopyalandı!\n');
  
  // Dosya boyutunu göster
  const stats = fs.statSync(targetDbPath);
  const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`📊 Dosya boyutu: ${fileSizeMB} MB`);
  console.log(`📁 Kopyalanan dosya: ${targetDbPath}\n`);
  
  console.log('📝 Müşterinin bilgisayarında yapılacaklar:');
  console.log('   1. Bu dosyayı müşterinin bilgisayarına kopyalayın');
  console.log('   2. Müşterinin bilgisayarında şu yola kopyalayın:');
  console.log(`      %APPDATA%\\connex-is-takip-sistemi\\database.sqlite`);
  console.log('   3. VEYA copy-to-customer.js script\'ini kullanın\n');
  
} catch (error) {
  console.error('❌ Kopyalama hatası:', error.message);
  process.exit(1);
}

