const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Excel dosya yolu
const excelPath = path.join(__dirname, '..', 'Hesap_Hareketleri.xls');

console.log('\n' + '='.repeat(60));
console.log('📋 MAHKEME İSİMLERİNİ ÇIKARMA');
console.log('='.repeat(60) + '\n');

console.log('📁 Excel dosyası:', excelPath);

if (!fs.existsSync(excelPath)) {
  console.error('❌ Excel dosyası bulunamadı:', excelPath);
  process.exit(1);
}

// Excel'i oku
const workbook = XLSX.readFile(excelPath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

console.log(`✅ Excel'den ${data.length} satır okundu\n`);

// Mahkeme kayıtlarını filtrele
const mahkemeKayitlari = data.slice(12).filter(row => 
  row[5] && (
    row[5].includes('MAHKEMELER VEZNESİ') || 
    row[5].includes('İDARE MAHKEMESİ') || 
    row[5].includes('BÖLGE ADLİYE')
  )
);

console.log(`📊 ${mahkemeKayitlari.length} mahkeme kaydı bulundu\n`);

// Mahkeme ismini parse et
function parseCourtName(description) {
  if (!description) return null;
  
  // Format: "GELEN EFT - ANTALYA MAHKEMELER VEZNESİ - Antalya 2. (Sulh Hukuk Mah.) Satış Memu-2024/38 Satış-RAMAZAN ÇATAL"
  const cleanDesc = description
    .replace(/^GELEN\s+(EFT|FAST|HAVALE)\s*-\s*/, '')
    .replace(/^.*?VEZNESİ\s*-\s*/, '')
    .replace(/-RAMAZAN ÇATAL$/, '');
  
  // Örnek: "Antalya 2. (Sulh Hukuk Mah.) Satış Memu-2024/38 Satış"
  const match = cleanDesc.match(/^(.+?)-(\d{4}\/\d+)/);
  
  return match ? match[1].trim() : null;
}

// Benzersiz mahkeme isimlerini topla
const mahkemeIsimleri = new Set();
const parseHatalari = [];

mahkemeKayitlari.forEach((row, index) => {
  const courtName = parseCourtName(row[5]);
  if (courtName) {
    mahkemeIsimleri.add(courtName);
  } else {
    parseHatalari.push({
      satir: index + 13, // 12 başlık + 1 index
      aciklama: row[5]
    });
  }
});

const sortedCourts = Array.from(mahkemeIsimleri).sort();

console.log(`✅ ${sortedCourts.length} benzersiz mahkeme ismi bulundu\n`);

if (parseHatalari.length > 0) {
  console.log(`⚠️  ${parseHatalari.length} kayıt parse edilemedi:\n`);
  parseHatalari.slice(0, 10).forEach(hata => {
    console.log(`   Satır ${hata.satir}: ${hata.aciklama.substring(0, 80)}...`);
  });
  if (parseHatalari.length > 10) {
    console.log(`   ... ve ${parseHatalari.length - 10} kayıt daha\n`);
  }
}

// Markdown dosyası oluştur
const mdContent = `# Mahkeme İsimleri

Excel dosyasından çıkarılan benzersiz mahkeme isimleri.

**Toplam:** ${sortedCourts.length} mahkeme

---

${sortedCourts.map((name, i) => `${i + 1}. ${name}`).join('\n')}

---

## Parse Edilemeyen Kayıtlar

${parseHatalari.length > 0 ? parseHatalari.map(h => `- Satır ${h.satir}: ${h.aciklama}`).join('\n') : 'Yok'}
`;

const outputPath = path.join(__dirname, '..', 'MAHKEMELER.md');
fs.writeFileSync(outputPath, mdContent, 'utf8');

console.log(`✅ MAHKEMELER.md dosyası oluşturuldu: ${outputPath}\n`);

// Konsola da yazdır
console.log('📋 İlk 20 mahkeme:');
sortedCourts.slice(0, 20).forEach((name, i) => {
  console.log(`   ${i + 1}. ${name}`);
});
if (sortedCourts.length > 20) {
  console.log(`   ... ve ${sortedCourts.length - 20} mahkeme daha`);
}

console.log('\n✅ İşlem tamamlandı!\n');

