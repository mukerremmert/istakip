const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { promisify } = require('util');
const XLSX = require('xlsx');
const fs = require('fs');

// Veritabanı yolu
const dbPath = path.join(
  process.env.APPDATA || process.env.HOME,
  'connex-is-takip-sistemi',
  'database.sqlite'
);

// Excel dosya yolu
const excelPath = path.join(__dirname, '..', 'Hesap_Hareketleri.xls');

console.log('\n' + '='.repeat(60));
console.log('📦 VERİTABANI HAZIRLAMA');
console.log('='.repeat(60) + '\n');

console.log('📁 Veritabanı:', dbPath);
console.log('📁 Excel dosyası:', excelPath);

// Dosya kontrolü
if (!fs.existsSync(excelPath)) {
  console.error('❌ Excel dosyası bulunamadı:', excelPath);
  process.exit(1);
}

const db = new sqlite3.Database(dbPath);
const run = promisify(db.run.bind(db));
const get = promisify(db.get.bind(db));
const all = promisify(db.all.bind(db));

// Excel'den veriyi oku
function readExcelFile(filePath) {
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    console.log(`✅ Excel'den ${data.length} satır okundu\n`);
    return data;
  } catch (error) {
    console.error('❌ Excel okuma hatası:', error.message);
    return [];
  }
}

// Excel satırından veriyi parse et
function parseExcelRow(row) {
  if (!row || row.length < 7) return null;
  
  const date = row[0];
  const description = row[5];
  const amount = row[6];
  
  if (!description || 
      (!description.includes('MAHKEMELER VEZNESİ') && 
       !description.includes('İDARE MAHKEMESİ') && 
       !description.includes('BÖLGE ADLİYE'))) {
    return null;
  }
  
  let isoDate;
  if (typeof date === 'number') {
    const excelDate = XLSX.SSF.parse_date_code(date);
    isoDate = `${excelDate.y}-${String(excelDate.m).padStart(2, '0')}-${String(excelDate.d).padStart(2, '0')}`;
  } else if (typeof date === 'string') {
    const [day, month, year] = date.split('/');
    isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  } else {
    return null;
  }
  
  let totalAmount = 0;
  if (typeof amount === 'number') {
    totalAmount = amount;
  } else if (typeof amount === 'string') {
    totalAmount = parseFloat(amount.replace(/,/g, ''));
  }
  
  if (!totalAmount || totalAmount <= 0) {
    return null;
  }
  
  return {
    paymentDate: isoDate,
    description: String(description),
    totalAmount: totalAmount
  };
}

// Mahkeme adını ve dosya numarasını parse et
function parseCourtDescription(description) {
  // Format: "GELEN EFT - ANTALYA MAHKEMELER VEZNESİ - Antalya 2. (Sulh Hukuk Mah.) Satış Memu-2024/38 Satış-RAMAZAN ÇATAL"
  const cleanDesc = description
    .replace(/^GELEN\s+(EFT|FAST|HAVALE)\s*-\s*/, '')
    .replace(/^.*?VEZNESİ\s*-\s*/, '')
    .replace(/-RAMAZAN ÇATAL$/, ''); // Son kısmı temizle
  
  // Örnek: "Antalya 2. (Sulh Hukuk Mah.) Satış Memu-2024/38 Satış"
  // Veya: "Antalya 11. Asliye Hukuk Mahkemesi-2023/432 Esas"
  const match = cleanDesc.match(/^(.+?)-(\d{4}\/\d+)\s+(Esas|Talimat|D\.İş|Satış|Satış Memu)/);
  if (!match) {
    // Alternatif format dene: "Mahkeme Adı-2024/38"
    const altMatch = cleanDesc.match(/^(.+?)-(\d{4}\/\d+)/);
    if (altMatch) {
      return {
        courtName: altMatch[1].trim(),
        fileNumber: altMatch[2].trim()
      };
    }
    return null;
  }
  
  return {
    courtName: match[1].trim(),
    fileNumber: match[2].trim()
  };
}

// Tarihleri hesapla
function calculateDates(paymentDate) {
  const date = new Date(paymentDate);
  const scheduledDate = new Date(date);
  scheduledDate.setDate(date.getDate() - 7);
  
  const receivedDate = new Date(scheduledDate);
  receivedDate.setDate(scheduledDate.getDate() - 3);
  
  return {
    paymentDate: paymentDate,
    scheduledDate: scheduledDate.toISOString().split('T')[0],
    receivedDate: receivedDate.toISOString().split('T')[0]
  };
}

// Tutarları hesapla
function calculateAmounts(totalAmount) {
  const vatRate = 20;
  const baseAmount = Math.round((totalAmount / (1 + vatRate / 100)) * 100) / 100;
  const vatAmount = Math.round((totalAmount - baseAmount) * 100) / 100;
  
  return {
    totalAmount: Math.round(totalAmount * 100) / 100,
    baseAmount,
    vatAmount,
    vatRate
  };
}

async function prepareDatabase() {
  try {
    // Önce bir araç ekle (gerekli)
    const vehicles = await all('SELECT id FROM vehicles');
    if (vehicles.length === 0) {
      console.log('🚗 Araç ekleniyor...');
      await run(
        'INSERT INTO vehicles (plate, brand, model, year, type) VALUES (?, ?, ?, ?, ?)',
        ['34ABC123', 'Mercedes', 'Sprinter', 2020, 'Minibüs']
      );
      console.log('✅ Araç eklendi\n');
    }
    
    // Excel'i oku
    const excelData = readExcelFile(excelPath);
    if (excelData.length === 0) {
      console.error('❌ Excel dosyası okunamadı!');
      return;
    }
    
    // Mahkeme ödemelerini parse et
    const bankData = [];
    for (let i = 12; i < excelData.length; i++) {
      const parsed = parseExcelRow(excelData[i]);
      if (parsed) {
        bankData.push(parsed);
      }
    }
    
    console.log(`📊 ${bankData.length} mahkeme ödemesi bulundu\n`);
    
    if (bankData.length === 0) {
      console.log('⚠️  Mahkeme ödemesi bulunamadı!');
      return;
    }
    
    const vehiclesList = await all('SELECT id, plate FROM vehicles');
    let successCount = 0;
    let errorCount = 0;
    let duplicates = 0;
    let newCourts = 0;
    
    console.log('⏳ İşleniyor...\n');
    
    for (let i = 0; i < bankData.length; i++) {
      const payment = bankData[i];
      const parsed = parseCourtDescription(payment.description);
      
      if (!parsed) {
        errorCount++;
        continue;
      }
      
      // Mahkemeyi bul veya oluştur
      let court = await get('SELECT id, name FROM courts WHERE name = ?', [parsed.courtName]);
      
      if (!court) {
        court = await get('SELECT id, name FROM courts WHERE name LIKE ?', [`%${parsed.courtName}%`]);
      }
      
      if (!court) {
        try {
          const result = await run(
            'INSERT INTO courts (name, city, type) VALUES (?, ?, ?)',
            [parsed.courtName, 'Bilinmiyor', 'Asliye Hukuk']
          );
          court = { id: result.lastID, name: parsed.courtName };
          newCourts++;
        } catch (err) {
          errorCount++;
          continue;
        }
      }
      
      // Duplicate kontrolü
      const existing = await get(
        'SELECT id FROM jobs WHERE file_number = ? AND court_id = ?',
        [parsed.fileNumber, court.id]
      );
      
      if (existing) {
        duplicates++;
        continue;
      }
      
      const vehicle = vehiclesList[Math.floor(Math.random() * vehiclesList.length)];
      const dates = calculateDates(payment.paymentDate);
      const amounts = calculateAmounts(payment.totalAmount);
      
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
          dates.scheduledDate, dates.receivedDate, dates.scheduledDate,
          court.id, parsed.fileNumber, vehicle.id,
          amounts.totalAmount, amounts.baseAmount, amounts.vatAmount, amounts.vatRate,
          'Ödendi', 'Kesildi', 'Tamamlandı', dates.paymentDate,
          dates.paymentDate, dates.scheduledDate
        ]);
        
        successCount++;
        
        if (successCount % 50 === 0) {
          console.log(`   ✅ ${successCount} kayıt eklendi...`);
        }
      } catch (err) {
        errorCount++;
      }
    }
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📈 VERİTABANI HAZIRLANDI`);
    console.log(`${'='.repeat(60)}`);
    console.log(`✅ Başarılı:         ${successCount}`);
    console.log(`➕ Yeni Mahkeme:     ${newCourts}`);
    console.log(`🔄 Tekrar (Atlandı): ${duplicates}`);
    console.log(`❌ Hata:             ${errorCount}`);
    console.log(`${'='.repeat(60)}\n`);
    
    // Son durumu göster
    const finalCourts = await get('SELECT COUNT(*) as count FROM courts');
    const finalVehicles = await get('SELECT COUNT(*) as count FROM vehicles');
    const finalJobs = await get('SELECT COUNT(*) as count FROM jobs');
    
    console.log('📊 Veritabanı Durumu:');
    console.log(`   Mahkemeler: ${finalCourts.count}`);
    console.log(`   Araçlar:    ${finalVehicles.count}`);
    console.log(`   İşler:      ${finalJobs.count}\n`);
    
    console.log('✅ Veritabanı hazır! Müşterinin bilgisayarına kopyalayabilirsiniz.\n');
    console.log('📁 Veritabanı yolu:', dbPath);
    
  } catch (error) {
    console.error('❌ Genel hata:', error);
  } finally {
    db.close();
  }
}

prepareDatabase();

