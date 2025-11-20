const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Kaynak veritabanı (bu bilgisayar)
const sourceDbPath = path.join(
  process.env.APPDATA || process.env.HOME,
  'connex-is-takip-sistemi',
  'database.sqlite'
);

// Müşterinin bilgisayarındaki hedef yol
const targetDbPath = path.join(
  process.env.APPDATA || process.env.HOME,
  'connex-is-takip-sistemi',
  'database.sqlite'
);

console.log('\n' + '='.repeat(60));
console.log('📋 VERİTABANI KOPYALAMA (Müşterinin Bilgisayarı)');
console.log('='.repeat(60) + '\n');

console.log('📁 Kaynak:', sourceDbPath);
console.log('📁 Hedef: ', targetDbPath);

// Kaynak dosya kontrolü
if (!fs.existsSync(sourceDbPath)) {
  console.error('❌ Kaynak veritabanı bulunamadı:', sourceDbPath);
  process.exit(1);
}

// Hedef klasörü oluştur
const targetFolder = path.dirname(targetDbPath);
if (!fs.existsSync(targetFolder)) {
  fs.mkdirSync(targetFolder, { recursive: true });
  console.log('✅ Hedef klasör oluşturuldu:', targetFolder);
}

// Eğer hedef dosya varsa yedekle
if (fs.existsSync(targetDbPath)) {
  const backupPath = targetDbPath + '.backup.' + Date.now();
  fs.copyFileSync(targetDbPath, backupPath);
  console.log('✅ Mevcut veritabanı yedeklendi:', backupPath);
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
  
  console.log('✅ İşlem tamamlandı! Uygulamayı açabilirsiniz.\n');
  
} catch (error) {
  console.error('❌ Kopyalama hatası:', error.message);
  process.exit(1);
}

