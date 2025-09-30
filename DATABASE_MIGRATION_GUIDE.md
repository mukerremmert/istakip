# Database Migration Rehberi

## 🐛 Sorun: Schema Değişikliği

### Ne Oldu?
Kod güncellendiğinde database şeması değişti ama mevcut database eski şema ile oluşturulmuştu.

**Hata**: `SQLITE_ERROR: table jobs has no column named received_date`

### Neden Oldu?
- `main.ts`'de schema güncellendi
- Ancak mevcut `database.sqlite` dosyası eski schema ile oluşturulmuştu
- SQLite `CREATE TABLE IF NOT EXISTS` kullanıyor → mevcut tablo varsa değiştirmiyor

## ✅ Hızlı Çözüm

### Geliştirme Ortamında
```bash
cd C:\Projeler\ramazancatal

# Database'i yedekle
copy database.sqlite database.sqlite.backup

# Sil
del database.sqlite

# Uygulamayı tekrar başlat
npm run electron:dev
# Yeni schema ile oluşturulacak
```

### Production Build'de
```bash
# Build klasöründe
cd dist-installer\win-unpacked

# Database'i sil
del database.sqlite

# Uygulamayı başlat
"İş Takip Sistemi.exe"
```

## 🔧 Kalıcı Çözüm: Database Versiyonlama

### 1. Schema Version Tablosu

`main.ts` dosyasına ekleyin:

```typescript
const CURRENT_SCHEMA_VERSION = 2 // Her schema değişikliğinde artır

async function initializeDatabase() {
  return new Promise<void>((resolve, reject) => {
    const dbPath = path.join(process.cwd(), 'database.sqlite')
    db = new sqlite3.Database(dbPath, async (err) => {
      if (err) {
        console.error('❌ Database bağlantı hatası:', err)
        reject(err)
      } else {
        console.log('✅ SQLite3 database bağlantısı kuruldu:', dbPath)
        
        // Schema versiyonu kontrol et
        await checkAndMigrateSchema()
        
        await createTables()
        resolve()
      }
    })
  })
}

async function checkAndMigrateSchema() {
  if (!db) throw new Error('Database bağlantısı yok')
  const run = promisify(db.run.bind(db))
  const get = promisify(db.get.bind(db))

  // Schema version tablosunu oluştur
  await run(`
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER PRIMARY KEY,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Mevcut versiyonu al
  const currentVersion = await get('SELECT MAX(version) as version FROM schema_version')
  const dbVersion = currentVersion?.version || 0

  console.log(`📊 Database version: ${dbVersion}, Code version: ${CURRENT_SCHEMA_VERSION}`)

  // Migration gerekli mi?
  if (dbVersion < CURRENT_SCHEMA_VERSION) {
    console.log('🔄 Database migration başlıyor...')
    await runMigrations(dbVersion, CURRENT_SCHEMA_VERSION)
  } else {
    console.log('✅ Database güncel')
  }
}

async function runMigrations(fromVersion: number, toVersion: number) {
  if (!db) throw new Error('Database bağlantısı yok')
  const run = promisify(db.run.bind(db))

  // Version 0 → 1: İlk schema
  if (fromVersion < 1) {
    console.log('📝 Migration 1: İlk schema oluşturuluyor...')
    // createTables zaten yapacak
    await run('INSERT INTO schema_version (version) VALUES (1)')
  }

  // Version 1 → 2: received_date kolonu ekleme
  if (fromVersion < 2) {
    console.log('📝 Migration 2: received_date kolonu ekleniyor...')
    try {
      await run('ALTER TABLE jobs ADD COLUMN received_date TEXT')
      await run('INSERT INTO schema_version (version) VALUES (2)')
      console.log('✅ Migration 2 tamamlandı')
    } catch (error) {
      // Kolon zaten varsa hata vermez
      console.log('⚠️ Migration 2: Kolon zaten mevcut veya hata:', error)
    }
  }

  // Gelecek migrationlar buraya eklenecek
  // if (fromVersion < 3) { ... }
}
```

### 2. Migration'ları Test Etme

```typescript
// Test: Eski database ile çalıştır
// Database version 1 ise → Migration 2 çalışır
// received_date kolonu eklenir
```

### 3. Yeni Kolon Ekleme (Örnek)

Gelecekte yeni kolon eklemek isterseniz:

```typescript
const CURRENT_SCHEMA_VERSION = 3

async function runMigrations(fromVersion: number, toVersion: number) {
  // ... önceki migrationlar ...

  // Version 2 → 3: Yeni kolon
  if (fromVersion < 3) {
    console.log('📝 Migration 3: new_column ekleniyor...')
    await run('ALTER TABLE jobs ADD COLUMN new_column TEXT')
    await run('INSERT INTO schema_version (version) VALUES (3)')
  }
}
```

## 🚨 Production'da Veri Kaybını Önleme

### Otomatik Yedekleme

```typescript
async function backupDatabase() {
  const dbPath = path.join(process.cwd(), 'database.sqlite')
  const backupPath = path.join(
    process.cwd(), 
    `database.backup.${new Date().toISOString().replace(/:/g, '-')}.sqlite`
  )
  
  try {
    fs.copyFileSync(dbPath, backupPath)
    console.log('✅ Database yedeklendi:', backupPath)
  } catch (error) {
    console.error('❌ Yedekleme hatası:', error)
  }
}

// Migration öncesi otomatik yedekle
async function checkAndMigrateSchema() {
  // ... önceki kod ...
  
  if (dbVersion < CURRENT_SCHEMA_VERSION) {
    await backupDatabase() // YEDEKLE
    console.log('🔄 Database migration başlıyor...')
    await runMigrations(dbVersion, CURRENT_SCHEMA_VERSION)
  }
}
```

## 📊 SQLite Migration Komutları

### Kolon Ekleme
```sql
ALTER TABLE jobs ADD COLUMN new_column TEXT;
ALTER TABLE jobs ADD COLUMN amount REAL DEFAULT 0;
```

### Kolon Silme (SQLite dikkatli!)
SQLite direkt kolon silmeyi desteklemez. Yöntem:

```sql
-- 1. Yeni tablo oluştur (istenmeyen kolon olmadan)
CREATE TABLE jobs_new (
  id INTEGER PRIMARY KEY,
  date TEXT NOT NULL,
  -- received_date YOK (silmek istediğimiz)
  court_id INTEGER
);

-- 2. Verileri kopyala
INSERT INTO jobs_new SELECT id, date, court_id FROM jobs;

-- 3. Eski tabloyu sil
DROP TABLE jobs;

-- 4. Yeni tabloyu yeniden adlandır
ALTER TABLE jobs_new RENAME TO jobs;
```

### Kolon Tipi Değiştirme
Aynı şekilde, yeni tablo oluşturup veri taşıma gerekli.

## 🎯 Best Practices

### 1. Her Schema Değişikliğinde
- [ ] `CURRENT_SCHEMA_VERSION` artır
- [ ] `runMigrations()` fonksiyonuna yeni migration ekle
- [ ] Test et (hem boş database hem eski database ile)
- [ ] Commit'le

### 2. Migration Kodları
- ✅ Idempotent olsun (tekrar çalıştırılabilir)
- ✅ Try-catch ile korumalı
- ✅ Log mesajları açıklayıcı
- ✅ Geri alınabilir (backup var)

### 3. Testing
```typescript
// Test 1: Boş database
// rm database.sqlite
// npm run electron:dev
// → Version 0'dan CURRENT_SCHEMA_VERSION'a geçmeli

// Test 2: Eski version
// Schema version 1 olan bir database ile test
// → Migration'lar sırasıyla çalışmalı

// Test 3: Güncel database
// Zaten güncel database ile çalıştır
// → Hiçbir migration çalışmamalı
```

## 🔄 Alternatif: Prisma Migrations

Daha profesyonel çözüm:

```bash
npm install prisma @prisma/client
```

```prisma
// prisma/schema.prisma
datasource db {
  provider = "sqlite"
  url      = "file:./database.sqlite"
}

model Job {
  id            Int      @id @default(autoincrement())
  date          String
  receivedDate  String?  @map("received_date")
  // ...
  
  @@map("jobs")
}
```

```bash
# Schema değişikliği sonrası
npx prisma migrate dev --name add_received_date
# Otomatik migration oluşturur ve uygular
```

## 📝 Özet

**Şimdilik**: Database'i sil, yeniden oluştur (DEV ortamı için OK)

**Gelecek**: 
1. Schema versiyonlama sistemi ekle
2. Migration fonksiyonları yaz
3. Otomatik backup ekle
4. Ya da Prisma kullan (daha profesyonel)

**Production'da**: Her zaman önce backup al!

---
**Son Güncelleme**: 29 Eylül 2025
**Durum**: Schema versiyonlama sistemi eklenecek (v1.1.0)

