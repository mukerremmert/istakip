const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { promisify } = require('util');
const XLSX = require('xlsx');

// AppData path
const dbPath = path.join(
  process.env.APPDATA || process.env.HOME,
  'connex-is-takip-sistemi',
  'database.sqlite'
);

// Excel dosya yolu
const excelPath = path.join(__dirname, '..', 'Hesap_Hareketleri.xls');

console.log('Database yolu:', dbPath);
console.log('Excel dosya yolu:', excelPath);

const db = new sqlite3.Database(dbPath);
const run = promisify(db.run.bind(db));
const get = promisify(db.get.bind(db));
const all = promisify(db.all.bind(db));

// Excel'den veriyi oku
function readExcelFile(filePath) {
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0]; // İlk sheet'i al
    const worksheet = workbook.Sheets[sheetName];
    
    // JSON'a çevir
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    console.log(`\n📊 Excel'den ${data.length} satır okundu\n`);
    
    return data;
  } catch (error) {
    console.error('❌ Excel okuma hatası:', error.message);
    return [];
  }
}

// Excel satırından mahkeme verisini parse et
function parseExcelRow(row) {
  if (!row || row.length < 7) return null;
  
  const date = row[0];
  const transactionNo = row[4]; // Referans No sütunu
  const description = row[5]; // Açıklama sütunu
  const amount = row[6]; // İşlem Tutarı sütunu
  
  // Sadece mahkeme kayıtlarını al
  if (!description || 
      (!description.includes('MAHKEMELER VEZNESİ') && 
       !description.includes('İDARE MAHKEMESİ') && 
       !description.includes('BÖLGE ADLİYE'))) {
    return null;
  }
  
  // Tarihi formatla
  let isoDate;
  if (typeof date === 'number') {
    // Excel date serial number
    const excelDate = XLSX.SSF.parse_date_code(date);
    isoDate = `${excelDate.y}-${String(excelDate.m).padStart(2, '0')}-${String(excelDate.d).padStart(2, '0')}`;
  } else if (typeof date === 'string') {
    // String tarih (dd/mm/yyyy)
    const [day, month, year] = date.split('/');
    isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  } else {
    return null;
  }
  
  // Tutarı parse et
  let totalAmount = 0;
  if (typeof amount === 'number') {
    totalAmount = amount;
  } else if (typeof amount === 'string') {
    // String ise virgül/noktayı temizle
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
  const cleanDesc = description
    .replace(/^GELEN\s+(EFT|FAST|HAVALE)\s*-\s*/, '')
    .replace(/^.*?VEZNESİ\s*-\s*/, '');
  
  const match = cleanDesc.match(/^(.+?)-(\d{4}\/\d+)\s+(Esas|Talimat|D\.İş|Satış)/);
  
  if (match) {
    let courtName = match[1].trim();
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
  
  const daysBeforePayment = 10 + Math.floor(Math.random() * 21);
  const receivedDate = new Date(payment);
  receivedDate.setDate(receivedDate.getDate() - daysBeforePayment);
  
  const daysAfterReceived = 1 + Math.floor(Math.random() * 10);
  const scheduledDate = new Date(receivedDate);
  scheduledDate.setDate(scheduledDate.getDate() + daysAfterReceived);
  
  return {
    receivedDate: receivedDate.toISOString().split('T')[0],
    scheduledDate: scheduledDate.toISOString().split('T')[0],
    paymentDate: payment.toISOString().split('T')[0]
  };
}

// Tutardan KDV'yi çıkar ve hesapla
function calculateAmounts(totalAmount) {
  const vatRate = 20;
  // Toplam tutar KDV dahil, KDV'siz tutarı hesapla
  const baseAmount = Math.round((totalAmount / 1.20) * 100) / 100;
  const vatAmount = Math.round((totalAmount - baseAmount) * 100) / 100;
  
  return { 
    baseAmount, 
    vatAmount, 
    totalAmount: Math.round(totalAmount * 100) / 100, 
    vatRate 
  };
}

async function importFromExcel() {
  try {
    console.log('\n' + '='.repeat(60));
    console.log('EXCEL\'DEN İMPORT BAŞLIYOR');
    console.log('='.repeat(60) + '\n');
    
    // Excel'i oku
    const excelData = readExcelFile(excelPath);
    if (excelData.length === 0) {
      console.error('❌ Excel dosyası okunamadı veya boş!');
      return;
    }
    
    // Mahkeme kayıtlarını parse et
    const bankData = [];
    for (let i = 12; i < excelData.length; i++) { // İlk 12 satırı atla (başlık ve bilgiler)
      const parsed = parseExcelRow(excelData[i]);
      if (parsed) {
        bankData.push(parsed);
      }
    }
    
    console.log(`✅ ${bankData.length} mahkeme ödemesi bulundu\n`);
    
    if (bankData.length === 0) {
      console.log('⚠️  Mahkeme ödemesi bulunamadı!');
      return;
    }
    
    // Araçları al
    const vehicles = await all('SELECT id, plate FROM vehicles');
    if (vehicles.length === 0) {
      console.error('❌ Veritabanında araç bulunamadı!');
      return;
    }
    console.log(`🚗 ${vehicles.length} araç bulundu\n`);
    
    let successCount = 0;
    let errorCount = 0;
    let duplicates = 0;
    let notFoundCourts = new Set();
    
    console.log('⏳ İşleniyor...\n');
    
    for (let i = 0; i < bankData.length; i++) {
      const payment = bankData[i];
      const parsed = parseCourtDescription(payment.description);
      
      if (!parsed) {
        errorCount++;
        continue;
      }
      
      // Mahkemeyi bul
      let court = await get('SELECT id, name FROM courts WHERE name = ?', [parsed.courtName]);
      
      if (!court) {
        court = await get('SELECT id, name FROM courts WHERE name LIKE ?', [`%${parsed.courtName}%`]);
      }
      
      if (!court) {
        notFoundCourts.add(parsed.courtName);
        errorCount++;
        continue;
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
      
      // Rastgele araç seç
      const vehicle = vehicles[Math.floor(Math.random() * vehicles.length)];
      const dates = calculateDates(payment.paymentDate);
      const amounts = calculateAmounts(payment.totalAmount);
      
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
        console.error(`❌ ${parsed.fileNumber}: ${err.message}`);
        errorCount++;
      }
    }
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📈 İMPORT TAMAMLANDI`);
    console.log(`${'='.repeat(60)}`);
    console.log(`✅ Başarılı:         ${successCount}`);
    console.log(`🔄 Tekrar (Atlandı):  ${duplicates}`);
    console.log(`❌ Hata:             ${errorCount}`);
    console.log(`📊 Toplam:           ${bankData.length}`);
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

importFromExcel();
