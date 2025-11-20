import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import path from 'path'
import sqlite3 from 'sqlite3'
import { promisify } from 'util'
import fs from 'fs'
import { setupAutoUpdater, checkForUpdates, downloadUpdate, quitAndInstall } from './auto-updater'

console.log('🔥 MAIN.TS BAŞLADI - IPC HANDLER KURULUMU BAŞLIYOR')
console.log('📦 Tüm import\'lar tamamlandı')

// Log dosyası oluştur - app.getPath('userData') kullan
// NOT: Bu satırda app henüz hazır olmayabilir, o yüzden try-catch kullan
let logFilePath: string
let logStream: fs.WriteStream

try {
  const userDataPath = app.getPath('userData')
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true })
  }
  logFilePath = path.join(userDataPath, 'app-debug.log')
  logStream = fs.createWriteStream(logFilePath, { flags: 'a' })
} catch (error) {
  // Eğer app henüz hazır değilse, geçici olarak process.cwd() kullan
  logFilePath = path.join(process.cwd(), 'app-debug.log')
  logStream = fs.createWriteStream(logFilePath, { flags: 'a' })
}

// Console.log'u hem konsola hem dosyaya yaz
const originalConsoleLog = console.log
const originalConsoleError = console.error

console.log = (...args: any[]) => {
  const timestamp = new Date().toISOString()
  const message = `[${timestamp}] ${args.join(' ')}\n`
  logStream.write(message)
  originalConsoleLog(...args)
}

console.error = (...args: any[]) => {
  const timestamp = new Date().toISOString()
  const message = `[${timestamp}] ERROR: ${args.join(' ')}\n`
  logStream.write(message)
  originalConsoleError(...args)
}

console.log('📝 Log dosyası oluşturuldu:', logFilePath)

// __dirname CommonJS'te otomatik olarak mevcut
// TypeScript için declare etmemiz gerekebilir ama runtime'da zaten var

// Electron main process
let mainWindow: BrowserWindow | null = null
let db: sqlite3.Database | null = null

const isDev = process.env.NODE_ENV === 'development'
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL

// Database başlat
async function initializeDatabase() {
  return new Promise<void>((resolve, reject) => {
    // ÖNEMLI: app.getPath('userData') kullan - Kurulu uygulamada doğru yolu gösterir
    // Development: C:\Users\...\AppData\Roaming\Electron
    // Production: C:\Users\...\AppData\Roaming\İş Takip Sistemi
    const userDataPath = app.getPath('userData')
    
    // userData klasörünün var olduğundan emin ol
    if (!require('fs').existsSync(userDataPath)) {
      require('fs').mkdirSync(userDataPath, { recursive: true })
    }
    
    const dbPath = path.join(userDataPath, 'database.sqlite')
    console.log('📁 Database yolu:', dbPath)
    console.log('📁 User data path:', userDataPath)
    
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('❌ Database bağlantı hatası:', err)
        reject(err)
      } else {
        console.log('✅ SQLite3 database bağlantısı kuruldu:', dbPath)
        createTables().then(() => resolve()).catch(reject)
      }
    })
  })
}

// Tabloları oluştur
async function createTables() {
  if (!db) throw new Error('Database bağlantısı yok')
  const run = promisify(db.run.bind(db))

  try {
    // Vehicles tablosu
    await run(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        plate TEXT UNIQUE NOT NULL,
        brand TEXT NOT NULL,
        model TEXT NOT NULL,
        year INTEGER NOT NULL,
        type TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Courts tablosu
    await run(`
      CREATE TABLE IF NOT EXISTS courts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        city TEXT NOT NULL,
        district TEXT,
        type TEXT,
        address TEXT,
        phone TEXT,
        email TEXT,
        contact TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Jobs tablosu
    await run(`
      CREATE TABLE IF NOT EXISTS jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        received_date TEXT,
        scheduled_date TEXT,
        court_id INTEGER NOT NULL,
        file_number TEXT NOT NULL,
        vehicle_id INTEGER NOT NULL,
        total_amount REAL NOT NULL,
        base_amount REAL NOT NULL,
        vat_amount REAL NOT NULL,
        vat_rate INTEGER DEFAULT 20,
        payment_status TEXT NOT NULL,
        invoice_status TEXT NOT NULL,
        status TEXT NOT NULL,
        status_date TEXT NOT NULL,
        status_note TEXT,
        invoice_number TEXT,
        invoice_date TEXT,
        payment_date TEXT,
        completion_date TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (court_id) REFERENCES courts (id),
        FOREIGN KEY (vehicle_id) REFERENCES vehicles (id)
      )
    `)

    console.log('✅ Database tabloları oluşturuldu')
  } catch (error) {
    console.error('❌ Tablo oluşturma hatası:', error)
    throw error
  }
}

// IPC Handler'ları kur
function setupIPCHandlers() {
  if (!db) {
    console.error('❌ Database bağlantısı yok, handler\'lar kurulamıyor')
    return
  }

  const run = promisify(db.run.bind(db))
  const get = promisify(db.get.bind(db))
  const all = promisify(db.all.bind(db))

  console.log('🔧 IPC handlers kuruluyor...')

  // Job handlers
  ipcMain.handle('job:getAll', async () => {
    console.log('📋 job:getAll handler çağrıldı')
    try {
      const data = await all(`
        SELECT j.*, c.name as court_name, v.plate as vehicle_plate
        FROM jobs j
        JOIN courts c ON j.court_id = c.id
        LEFT JOIN vehicles v ON j.vehicle_id = v.id
        ORDER BY j.created_at DESC
      `)
      console.log('📊 Job data alındı:', data.length, 'kayıt')
      return { success: true, data }
    } catch (error) {
      console.error('❌ Job getAll hatası:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Bilinmeyen hata' }
    }
  })

  ipcMain.handle('job:create', async (_, jobData) => {
    console.log('📋 job:create handler çağrıldı')
    try {
      await run(
        `INSERT INTO jobs (date, received_date, scheduled_date, court_id, file_number, vehicle_id, total_amount, base_amount, vat_amount, vat_rate, payment_status, invoice_status, status, status_date, status_note, invoice_number, invoice_date, payment_date, completion_date, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [jobData.scheduledDate, jobData.receivedDate, jobData.scheduledDate, jobData.courtId, jobData.fileNumber, jobData.vehicleId, jobData.totalAmount, jobData.baseAmount, jobData.vatAmount, jobData.vatRate, jobData.paymentStatus, jobData.invoiceStatus, jobData.status, jobData.statusDate, jobData.statusNote, jobData.invoiceNumber, jobData.invoiceDate, jobData.paymentDate, jobData.completionDate, jobData.notes]
      )
      
      const lastIdResult = await get('SELECT last_insert_rowid() as lastID')
      const newJob = await get(`
        SELECT j.*, c.name as court_name, v.plate as vehicle_plate
        FROM jobs j
        JOIN courts c ON j.court_id = c.id
        LEFT JOIN vehicles v ON j.vehicle_id = v.id
        WHERE j.id = ?
      `, [lastIdResult.lastID])
      
      console.log('✅ Job oluşturuldu:', newJob)
      return { success: true, data: newJob }
    } catch (error) {
      console.error('❌ Job create hatası:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Bilinmeyen hata' }
    }
  })

  ipcMain.handle('job:update', async (_, jobData) => {
    console.log('📋 job:update handler çağrıldı')
    try {
      await run(
        `UPDATE jobs SET 
          date = ?, received_date = ?, scheduled_date = ?, court_id = ?, file_number = ?, 
          vehicle_id = ?, total_amount = ?, base_amount = ?, vat_amount = ?, vat_rate = ?, 
          payment_status = ?, invoice_status = ?, status = ?, status_date = ?, status_note = ?, 
          invoice_number = ?, invoice_date = ?, payment_date = ?, completion_date = ?, 
          notes = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`,
        [jobData.scheduledDate, jobData.receivedDate, jobData.scheduledDate, jobData.courtId, jobData.fileNumber, jobData.vehicleId, jobData.totalAmount, jobData.baseAmount, jobData.vatAmount, jobData.vatRate, jobData.paymentStatus, jobData.invoiceStatus, jobData.status, jobData.statusDate, jobData.statusNote, jobData.invoiceNumber, jobData.invoiceDate, jobData.paymentDate, jobData.completionDate, jobData.notes, jobData.id]
      )
      
      const updatedJob = await get(`
        SELECT j.*, c.name as court_name, v.plate as vehicle_plate
        FROM jobs j
        JOIN courts c ON j.court_id = c.id
        LEFT JOIN vehicles v ON j.vehicle_id = v.id
        WHERE j.id = ?
      `, [jobData.id])
      
      console.log('✅ Job güncellendi:', updatedJob)
      return { success: true, data: updatedJob }
    } catch (error) {
      console.error('❌ Job update hatası:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Bilinmeyen hata' }
    }
  })

  // Vehicle handlers
  ipcMain.handle('vehicle:getAll', async () => {
    console.log('🚗 vehicle:getAll handler çağrıldı')
    try {
      const data = await all('SELECT * FROM vehicles ORDER BY created_at DESC')
      console.log('📊 Vehicle data alındı:', data.length, 'kayıt')
      return { success: true, data }
    } catch (error) {
      console.error('❌ Vehicle getAll hatası:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Bilinmeyen hata' }
    }
  })

  ipcMain.handle('vehicle:create', async (_, vehicleData) => {
    console.log('🚗 vehicle:create handler çağrıldı')
    try {
      await run(
        'INSERT INTO vehicles (plate, brand, model, year, type) VALUES (?, ?, ?, ?, ?)',
        [vehicleData.plate, vehicleData.brand, vehicleData.model, vehicleData.year, vehicleData.type]
      )
      const lastIdResult = await get('SELECT last_insert_rowid() as lastID')
      const newVehicle = await get('SELECT * FROM vehicles WHERE id = ?', [lastIdResult.lastID])
      console.log('✅ Vehicle oluşturuldu:', newVehicle)
      return { success: true, data: newVehicle }
    } catch (error) {
      console.error('❌ Vehicle create hatası:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Bilinmeyen hata' }
    }
  })

  // Court handlers
  ipcMain.handle('court:getAll', async () => {
    console.log('🏛️ court:getAll handler çağrıldı')
    try {
      const data = await all('SELECT * FROM courts ORDER BY created_at DESC')
      console.log('📊 Court data alındı:', data.length, 'kayıt')
      return { success: true, data }
    } catch (error) {
      console.error('❌ Court getAll hatası:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Bilinmeyen hata' }
    }
  })

  ipcMain.handle('court:create', async (_, courtData) => {
    console.log('🏛️ court:create handler çağrıldı')
    try {
      await run(
        'INSERT INTO courts (name, city, district, type, address, phone, email, contact, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [courtData.name, courtData.city, courtData.district, courtData.type, courtData.address, courtData.phone, courtData.email, courtData.contact, courtData.notes]
      )
      const lastIdResult = await get('SELECT last_insert_rowid() as lastID')
      const newCourt = await get('SELECT * FROM courts WHERE id = ?', [lastIdResult.lastID])
      console.log('✅ Court oluşturuldu:', newCourt)
      return { success: true, data: newCourt }
    } catch (error) {
      console.error('❌ Court create hatası:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Bilinmeyen hata' }
    }
  })

  ipcMain.handle('court:update', async (_, courtData) => {
    console.log('🏛️ court:update handler çağrıldı')
    try {
      await run(
        'UPDATE courts SET name = ?, city = ?, district = ?, type = ?, address = ?, phone = ?, email = ?, contact = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [courtData.name, courtData.city, courtData.district, courtData.type, courtData.address, courtData.phone, courtData.email, courtData.contact, courtData.notes, courtData.id]
      )
      const updatedCourt = await get('SELECT * FROM courts WHERE id = ?', [courtData.id])
      console.log('✅ Court güncellendi:', updatedCourt)
      return { success: true, data: updatedCourt }
    } catch (error) {
      console.error('❌ Court update hatası:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Bilinmeyen hata' }
    }
  })

  ipcMain.handle('court:delete', async (_, id) => {
    console.log('🏛️ court:delete handler çağrıldı:', id)
    try {
      await run('DELETE FROM courts WHERE id = ?', [id])
      console.log('✅ Court silindi:', id)
      return { success: true }
    } catch (error) {
      console.error('❌ Court delete hatası:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Bilinmeyen hata' }
    }
  })

  // App version handler
  ipcMain.handle('get-app-version', () => {
    console.log('📦 Uygulama versiyonu istendi')
    return app.getVersion()
  })

  ipcMain.handle('get-app-name', () => {
    console.log('📦 Uygulama ismi istendi')
    return app.getName()
  })

  // Auto-updater: Manuel güncelleme kontrolü
  ipcMain.handle('check-for-updates', async () => {
    console.log('🔄 Manuel güncelleme kontrolü başlatıldı')
    try {
      checkForUpdates()
      return { success: true }
    } catch (error) {
      console.error('❌ Güncelleme kontrolü hatası:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Bilinmeyen hata' }
    }
  })
  
  // Auto-updater: Güncelleme indirme
  ipcMain.handle('start-download-update', async () => {
    console.log('📥 Güncelleme indirme başlatıldı')
    try {
      downloadUpdate() // Aynı autoUpdater instance'ını kullan
      return { success: true }
    } catch (error) {
      console.error('❌ İndirme başlatma hatası:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Bilinmeyen hata' }
    }
  })
  
  // Auto-updater: Yükle ve yeniden başlat
  ipcMain.handle('quit-and-install', async () => {
    console.log('🔄 Uygulama yeniden başlatılıyor...')
    try {
      quitAndInstall() // Aynı autoUpdater instance'ını kullan
      return { success: true }
    } catch (error) {
      console.error('❌ Yeniden başlatma hatası:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Bilinmeyen hata' }
    }
  })

  console.log('✅ Tüm IPC handlers kuruldu (auto-update dahil)')
}

function createWindow() {
  // Ana pencere oluştur
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: join(__dirname, '../../assets/icon.ico'),
    titleBarStyle: 'default',
    show: false // İlk başta gizli, hazır olduğunda göster
  })

  // Global erişim için (CommonJS'te gerek yok)

  // Pencere hazır olduğunda göster
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
    
    // DevTools'u HER ZAMAN aç (production'da da)
    mainWindow?.webContents.openDevTools()
    console.log('🔧 DevTools açıldı - Console log\'ları görülebilir')
    console.log('🎯 Mod:', isDev ? 'DEVELOPMENT' : 'PRODUCTION')
  })

  // Pencere kapatıldığında
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // URL yükle
  if (isDev && VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // Production'da doğru path
    // Build edilen yapıda: resources/app.asar (veya app folder) içinde
    // dist-electron/main.cjs (__dirname burası)
    // dist/index.html (buraya gitmek istiyoruz)
    const htmlPath = join(__dirname, '../dist/index.html')
    console.log('📁 HTML dosyası yolu:', htmlPath)
    console.log('📁 __dirname:', __dirname)
    console.log('📁 process.resourcesPath:', process.resourcesPath)
    mainWindow.loadFile(htmlPath)
  }
}

console.log('⏳ app.whenReady() bekleniyor...')

// IPC Handler'ları hemen kur (app.whenReady beklemeden)
console.log('🚀 IPC Handler kurulumu başlatılıyor...')

// Test handler'ı hemen ekle
ipcMain.handle('test:ping', () => {
  console.log('🏓 Test ping alındı')
  return { success: true, message: 'pong' }
})
console.log('🧪 Test handler eklendi')

// Uygulama hazır olduğunda
app.whenReady().then(async () => {
  console.log('🚀 Electron uygulaması başlatılıyor...')
  
  // Database'i başlat ve handler'ları kur (window'dan ÖNCE)
  try {
    await initializeDatabase()
    console.log('✅ Database başlatıldı')
    setupIPCHandlers()
    console.log('✅ IPC handlers kuruldu')
  } catch (error) {
    console.error('❌ Database başlatma hatası:', error)
  }
  
  // Database hazır olduktan sonra ana pencereyi oluştur
  createWindow()

  // Auto-updater'ı başlat (sadece production'da)
  if (!isDev) {
    console.log('🔄 Auto-updater başlatılıyor...')
    setupAutoUpdater(mainWindow)
  } else {
    console.log('⚠️ Development modda auto-updater devre dışı')
  }

  // macOS'ta dock'tan tıklandığında pencere oluştur
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// Tüm pencereler kapatıldığında uygulamayı kapat (macOS hariç)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Uygulama kapatılmadan önce
app.on('before-quit', async () => {
  console.log('🔄 Uygulama kapatılıyor...')
  
  // Database bağlantısını kapat
  if (db) {
    try {
      db.close((err) => {
        if (err) {
          console.error('❌ Database kapatma hatası:', err)
        } else {
          console.log('✅ Database bağlantısı kapatıldı')
        }
      })
    } catch (error) {
      console.error('❌ Database kapatma hatası:', error)
    }
  }
  
  // Log stream'i kapat
  console.log('📝 Log dosyası kapatılıyor...')
  logStream.end()
})

// Güvenlik: Yeni pencere oluşturmayı engelle
app.on('web-contents-created', (_, contents) => {
  contents.setWindowOpenHandler(({ url }) => {
    console.log('🚫 Yeni pencere oluşturma engellendi:', url)
    return { action: 'deny' }
  })
})

// Hata yakalama
process.on('uncaughtException', (error) => {
  console.error('❌ Yakalanmamış hata:', error)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ İşlenmemiş promise reddi:', reason, promise)
})

console.log('✅ Electron main process hazır')
