const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Excel dosya yolu
const excelPath = path.join(__dirname, '..', 'Hesap_Hareketleri.xls');

console.log('\n' + '='.repeat(60));
console.log('📋 İŞ KAYITLARINI ÇIKARMA');
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

// Mahkeme adını ve dosya numarasını parse et
function parseCourtDescription(description) {
  if (!description) return null;
  
  // Format: "GELEN EFT - ANTALYA MAHKEMELER VEZNESİ - Antalya 2. (Sulh Hukuk Mah.) Satış Memu-2024/38 Satış-RAMAZAN ÇATAL"
  const cleanDesc = description
    .replace(/^GELEN\s+(EFT|FAST|HAVALE)\s*-\s*/, '')
    .replace(/^.*?VEZNESİ\s*-\s*/, '')
    .replace(/-RAMAZAN ÇATAL$/, '');
  
  // Örnek: "Antalya 2. (Sulh Hukuk Mah.) Satış Memu-2024/38 Satış"
  const match = cleanDesc.match(/^(.+?)-(\d{4}\/\d+)/);
  
  if (!match) return null;
  
  return {
    courtName: match[1].trim(),
    fileNumber: match[2].trim()
  };
}

// Tarihi formatla
function formatDate(date) {
  if (!date) return null;
  
  let isoDate;
  if (typeof date === 'number') {
    // Excel date serial number
    const excelDate = XLSX.SSF.parse_date_code(date);
    isoDate = `${excelDate.y}-${String(excelDate.m).padStart(2, '0')}-${String(excelDate.d).padStart(2, '0')}`;
  } else if (typeof date === 'string') {
    // String tarih (dd/mm/yyyy)
    const parts = date.split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    } else {
      return null;
    }
  } else {
    return null;
  }
  
  return isoDate;
}

// Tutarı parse et
function parseAmount(amount) {
  if (typeof amount === 'number') {
    return amount;
  } else if (typeof amount === 'string') {
    return parseFloat(amount.replace(/,/g, ''));
  }
  return 0;
}

// İş kayıtlarını parse et
const jobs = [];
const parseHatalari = [];

mahkemeKayitlari.forEach((row, index) => {
  const date = formatDate(row[0]);
  const description = row[5];
  const amount = parseAmount(row[6]);
  
  if (!date || !description || !amount || amount <= 0) {
    parseHatalari.push({
      satir: index + 13,
      aciklama: description || 'Açıklama yok',
      sebep: !date ? 'Tarih parse edilemedi' : !amount ? 'Tutar parse edilemedi' : 'Bilinmeyen hata'
    });
    return;
  }
  
  const parsed = parseCourtDescription(description);
  
  if (!parsed) {
    parseHatalari.push({
      satir: index + 13,
      aciklama: description,
      sebep: 'Mahkeme adı veya dosya numarası parse edilemedi'
    });
    return;
  }
  
  jobs.push({
    date: date, // İşin bize geliş tarihi
    scheduledDate: date, // İşin yapılacağı tarih (aynı)
    courtName: parsed.courtName,
    fileNumber: parsed.fileNumber,
    amount: amount
  });
});

console.log(`✅ ${jobs.length} iş kaydı parse edildi\n`);

if (parseHatalari.length > 0) {
  console.log(`⚠️  ${parseHatalari.length} kayıt parse edilemedi:\n`);
  parseHatalari.slice(0, 10).forEach(hata => {
    console.log(`   Satır ${hata.satir}: ${hata.sebep}`);
    console.log(`      ${hata.aciklama.substring(0, 80)}...`);
  });
  if (parseHatalari.length > 10) {
    console.log(`   ... ve ${parseHatalari.length - 10} kayıt daha\n`);
  }
}

// Markdown dosyası oluştur
const mdContent = `# İş Kayıtları

Excel dosyasından çıkarılan iş kayıtları.

**Toplam:** ${jobs.length} iş kaydı

---

## İş Kayıtları

| Tarih | Mahkeme | Dosya No | Tutar (TL) |
|-------|---------|----------|------------|
${jobs.map(job => `| ${job.date} | ${job.courtName} | ${job.fileNumber} | ${job.amount.toFixed(2)} |`).join('\n')}

---

## Parse Edilemeyen Kayıtlar

${parseHatalari.length > 0 ? parseHatalari.map(h => `- Satır ${h.satir}: ${h.sebep} - ${h.aciklama}`).join('\n') : 'Yok'}
`;

const outputPath = path.join(__dirname, '..', 'ISLER.md');
fs.writeFileSync(outputPath, mdContent, 'utf8');

console.log(`✅ ISLER.md dosyası oluşturuldu: ${outputPath}\n`);

// Özet istatistikler
const totalAmount = jobs.reduce((sum, job) => sum + job.amount, 0);
const uniqueCourts = new Set(jobs.map(job => job.courtName));

console.log('📊 Özet İstatistikler:');
console.log(`   Toplam iş sayısı: ${jobs.length}`);
console.log(`   Toplam tutar: ${totalAmount.toFixed(2)} TL`);
console.log(`   Farklı mahkeme sayısı: ${uniqueCourts.size}`);
console.log(`   Ortalama iş tutarı: ${(totalAmount / jobs.length).toFixed(2)} TL\n`);

console.log('✅ İşlem tamamlandı!\n');
