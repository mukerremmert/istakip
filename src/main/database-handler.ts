import sqlite3 from 'sqlite3'
import { promisify } from 'util'
import path from 'path'
import { ipcMain } from 'electron'

// IPC Response type
interface IPCResponse {
  success: boolean
  data?: any
  error?: string
}

// SQLite3 database handler - Main process'te çalışır
class DatabaseHandler {
  private db: sqlite3.Database | null = null
  private dbPath: string

  constructor() {
    // Database dosyası proje kök dizininde
    this.dbPath = path.join(process.cwd(), 'database.sqlite')
  }

  // Database bağlantısını başlat
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('❌ Database bağlantı hatası:', err)
          reject(err)
        } else {
          console.log('✅ SQLite3 database bağlantısı kuruldu:', this.dbPath)
          this.createTables()
            .then(() => resolve())
            .catch(reject)
        }
      })
    })
  }

  // Tabloları oluştur
  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database bağlantısı yok')

    const run = promisify(this.db.run.bind(this.db))

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

  // Database bağlantısını kapat
  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            console.error('❌ Database kapatma hatası:', err)
            reject(err)
          } else {
            console.log('✅ Database bağlantısı kapatıldı')
            resolve()
          }
        })
      } else {
        resolve()
      }
    })
  }

  // Database instance'ını döndür
  getDatabase(): sqlite3.Database {
    if (!this.db) {
      throw new Error('Database bağlantısı yok')
    }
    return this.db
  }
}

// Singleton instance
const databaseHandler = new DatabaseHandler()

// IPC handlers - Renderer process'ten gelen istekleri işle
export function setupDatabaseHandlers() {
  console.log('🔧 IPC handlers kuruluyor...')
  const db = databaseHandler.getDatabase()
  const run = promisify(db.run.bind(db))
  const get = promisify(db.get.bind(db))
  const all = promisify(db.all.bind(db))
  
  console.log('📡 IPC handler\'ları kaydediliyor...')

  // Vehicle handlers
  ipcMain.handle('vehicle:getAll', async () => {
    try {
      const rows = await all('SELECT * FROM vehicles ORDER BY created_at DESC')
      return { success: true, data: rows }
    } catch (error) {
      console.error('Error getting vehicles:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Bilinmeyen hata' }
    }
  })

  ipcMain.handle('vehicle:getById', async (_, id) => {
    try {
      const row = await get('SELECT * FROM vehicles WHERE id = ?', [id])
      return { success: true, data: row }
    } catch (error) {
      console.error('Error getting vehicle:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Bilinmeyen hata' }
    }
  })

  ipcMain.handle('vehicle:create', async (_, vehicleData) => {
    try {
      await run(
        'INSERT INTO vehicles (plate, brand, model, year, type) VALUES (?, ?, ?, ?, ?)',
        [vehicleData.plate, vehicleData.brand, vehicleData.model, vehicleData.year, vehicleData.type]
      )
      const lastIdResult = await get('SELECT last_insert_rowid() as lastID')
      const newVehicle = await get('SELECT * FROM vehicles WHERE id = ?', [lastIdResult.lastID])
      return { success: true, data: newVehicle }
    } catch (error) {
      console.error('Error creating vehicle:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Bilinmeyen hata' }
    }
  })

  ipcMain.handle('vehicle:update', async (_, vehicleData) => {
    try {
      await run(
        'UPDATE vehicles SET plate = ?, brand = ?, model = ?, year = ?, type = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [vehicleData.plate, vehicleData.brand, vehicleData.model, vehicleData.year, vehicleData.type, vehicleData.id]
      )
      return { success: true, data: vehicleData }
    } catch (error) {
      console.error('Error updating vehicle:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Bilinmeyen hata' }
    }
  })

  ipcMain.handle('vehicle:delete', async (_, id) => {
    try {
      await run('DELETE FROM vehicles WHERE id = ?', [id])
      return { success: true }
    } catch (error) {
      console.error('Error deleting vehicle:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Bilinmeyen hata' }
    }
  })

  ipcMain.handle('vehicle:search', async (_, searchTerm) => {
    try {
      const rows = await all(
        'SELECT * FROM vehicles WHERE plate LIKE ? OR brand LIKE ? OR model LIKE ? ORDER BY created_at DESC',
        [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]
      )
      return { success: true, data: rows }
    } catch (error) {
      console.error('Error searching vehicles:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Bilinmeyen hata' }
    }
  })

  ipcMain.handle('vehicle:getByType', async (_, type) => {
    try {
      const rows = await all('SELECT * FROM vehicles WHERE type = ? ORDER BY created_at DESC', [type])
      return { success: true, data: rows }
    } catch (error) {
      console.error('Error getting vehicles by type:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Bilinmeyen hata' }
    }
  })

  ipcMain.handle('vehicle:statistics', async () => {
    try {
      const totalVehicles = await get('SELECT COUNT(*) as count FROM vehicles')
      const typeStats = await all('SELECT type, COUNT(*) as count FROM vehicles GROUP BY type')
      const yearStats = await all('SELECT year, COUNT(*) as count FROM vehicles GROUP BY year')
      
      const vehiclesByType = typeStats.reduce((acc: Record<string, number>, row: any) => {
        acc[row.type] = row.count
        return acc
      }, {})
      
      const vehiclesByYear = yearStats.reduce((acc: Record<number, number>, row: any) => {
        acc[row.year] = row.count
        return acc
      }, {})
      
      return {
        success: true,
        data: {
          totalVehicles: totalVehicles?.count || 0,
          vehiclesByType,
          vehiclesByYear
        }
      }
    } catch (error) {
      console.error('Error getting vehicle statistics:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Bilinmeyen hata' }
    }
  })

  // Court Handlers
  ipcMain.handle('court:getAll', async (): Promise<IPCResponse> => {
    try {
      const data = await all('SELECT * FROM courts ORDER BY created_at DESC')
      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error instanceof Error ? error.message : 'Bilinmeyen hata' }
    }
  })

  ipcMain.handle('court:getById', async (_, id: number): Promise<IPCResponse> => {
    try {
      const data = await get('SELECT * FROM courts WHERE id = ?', [id])
      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error instanceof Error ? error.message : 'Bilinmeyen hata' }
    }
  })

  ipcMain.handle('court:create', async (_, courtData: any): Promise<IPCResponse> => {
    try {
      await run(
        'INSERT INTO courts (name, city, district, type, address, phone, email, contact, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [courtData.name, courtData.city, courtData.district, courtData.type, courtData.address, courtData.phone, courtData.email, courtData.contact, courtData.notes]
      )
      const lastIdResult = await get('SELECT last_insert_rowid() as lastID')
      const newCourt = await get('SELECT * FROM courts WHERE id = ?', [lastIdResult.lastID])
      return { success: true, data: newCourt }
    } catch (error: any) {
      return { success: false, error: error instanceof Error ? error.message : 'Bilinmeyen hata' }
    }
  })

  ipcMain.handle('court:update', async (_, courtData: any): Promise<IPCResponse> => {
    try {
      await run(
        'UPDATE courts SET name = ?, city = ?, district = ?, type = ?, address = ?, phone = ?, email = ?, contact = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [courtData.name, courtData.city, courtData.district, courtData.type, courtData.address, courtData.phone, courtData.email, courtData.contact, courtData.notes, courtData.id]
      )
      const updatedCourt = await get('SELECT * FROM courts WHERE id = ?', [courtData.id])
      return { success: true, data: updatedCourt }
    } catch (error: any) {
      return { success: false, error: error instanceof Error ? error.message : 'Bilinmeyen hata' }
    }
  })

  ipcMain.handle('court:delete', async (_, id: number): Promise<IPCResponse> => {
    try {
      await run('DELETE FROM courts WHERE id = ?', [id])
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error instanceof Error ? error.message : 'Bilinmeyen hata' }
    }
  })

  ipcMain.handle('court:search', async (_, searchTerm: string): Promise<IPCResponse> => {
    try {
      const data = await all(
        `SELECT * FROM courts WHERE name LIKE ? OR city LIKE ? OR district LIKE ? ORDER BY created_at DESC`,
        [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]
      )
      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error instanceof Error ? error.message : 'Bilinmeyen hata' }
    }
  })

  ipcMain.handle('court:getByCity', async (_, city: string): Promise<IPCResponse> => {
    try {
      const data = await all('SELECT * FROM courts WHERE city = ? ORDER BY created_at DESC', [city])
      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error instanceof Error ? error.message : 'Bilinmeyen hata' }
    }
  })

  ipcMain.handle('court:getByType', async (_, type: string): Promise<IPCResponse> => {
    try {
      const data = await all('SELECT * FROM courts WHERE type = ? ORDER BY created_at DESC', [type])
      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error instanceof Error ? error.message : 'Bilinmeyen hata' }
    }
  })

  // Job Handlers
  ipcMain.handle('job:getAll', async (): Promise<IPCResponse> => {
    try {
      const data = await all(`
        SELECT j.*, c.name as court_name, v.plate as vehicle_plate
        FROM jobs j
        JOIN courts c ON j.court_id = c.id
        LEFT JOIN vehicles v ON j.vehicle_id = v.id
        ORDER BY j.created_at DESC
      `)
      console.log('Jobs data from database:', data.slice(0, 2)) // İlk 2 kaydı logla
      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error instanceof Error ? error.message : 'Bilinmeyen hata' }
    }
  })

  ipcMain.handle('job:getById', async (_, id: number): Promise<IPCResponse> => {
    try {
      const data = await get(`
        SELECT j.*, c.name as court_name, v.plate as vehicle_plate
        FROM jobs j
        JOIN courts c ON j.court_id = c.id
        LEFT JOIN vehicles v ON j.vehicle_id = v.id
        WHERE j.id = ?
      `, [id])
      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error instanceof Error ? error.message : 'Bilinmeyen hata' }
    }
  })

  ipcMain.handle('job:create', async (_, jobData: any): Promise<IPCResponse> => {
    try {
      console.log('Creating job with data:', jobData)
      
      // INSERT işlemini yap
      await run(
        `INSERT INTO jobs (date, received_date, scheduled_date, court_id, file_number, vehicle_id, total_amount, base_amount, vat_amount, vat_rate, payment_status, invoice_status, status, status_date, status_note, invoice_number, invoice_date, payment_date, completion_date, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [jobData.scheduledDate, jobData.receivedDate, jobData.scheduledDate, jobData.courtId, jobData.fileNumber, jobData.vehicleId, jobData.totalAmount, jobData.baseAmount, jobData.vatAmount, jobData.vatRate, jobData.paymentStatus, jobData.invoiceStatus, jobData.status, jobData.statusDate, jobData.statusNote, jobData.invoiceNumber, jobData.invoiceDate, jobData.paymentDate, jobData.completionDate, jobData.notes]
      )
      
      // Son eklenen kaydın ID'sini al
      const lastIdResult = await get('SELECT last_insert_rowid() as lastID')
      const lastID = lastIdResult.lastID
      console.log('LastID from last_insert_rowid():', lastID)
      
      if (!lastID) {
        throw new Error('Insert failed - no lastID returned')
      }
      
      const newJob = await get(`
        SELECT j.*, c.name as court_name, v.plate as vehicle_plate
        FROM jobs j
        JOIN courts c ON j.court_id = c.id
        LEFT JOIN vehicles v ON j.vehicle_id = v.id
        WHERE j.id = ?
      `, [lastID])
      
      console.log('New job created:', newJob)
      return { success: true, data: newJob }
    } catch (error: any) {
      console.error('Error in job:create handler:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Bilinmeyen hata' }
    }
  })

  ipcMain.handle('job:update', async (_, jobData: any): Promise<IPCResponse> => {
    try {
      await run(
        `UPDATE jobs SET date = ?, received_date = ?, scheduled_date = ?, court_id = ?, file_number = ?, vehicle_id = ?, total_amount = ?, base_amount = ?, vat_amount = ?, vat_rate = ?, payment_status = ?, invoice_status = ?, status = ?, status_date = ?, status_note = ?, invoice_number = ?, invoice_date = ?, payment_date = ?, completion_date = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [jobData.scheduledDate, jobData.receivedDate, jobData.scheduledDate, jobData.courtId, jobData.fileNumber, jobData.vehicleId, jobData.totalAmount, jobData.baseAmount, jobData.vatAmount, jobData.vatRate, jobData.paymentStatus, jobData.invoiceStatus, jobData.status, jobData.statusDate, jobData.statusNote, jobData.invoiceNumber, jobData.invoiceDate, jobData.paymentDate, jobData.completionDate, jobData.notes, jobData.id]
      )
      const updatedJob = await get(`
        SELECT j.*, c.name as court_name, v.plate as vehicle_plate
        FROM jobs j
        JOIN courts c ON j.court_id = c.id
        LEFT JOIN vehicles v ON j.vehicle_id = v.id
        WHERE j.id = ?
      `, [jobData.id])
      return { success: true, data: updatedJob }
    } catch (error: any) {
      return { success: false, error: error instanceof Error ? error.message : 'Bilinmeyen hata' }
    }
  })

  ipcMain.handle('job:delete', async (_, id: number): Promise<IPCResponse> => {
    try {
      await run('DELETE FROM jobs WHERE id = ?', [id])
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error instanceof Error ? error.message : 'Bilinmeyen hata' }
    }
  })

  ipcMain.handle('job:getByDateRange', async (_, startDate: string, endDate: string): Promise<IPCResponse> => {
    try {
      const data = await all(`
        SELECT j.*, c.name as court_name, v.plate as vehicle_plate
        FROM jobs j
        JOIN courts c ON j.court_id = c.id
        LEFT JOIN vehicles v ON j.vehicle_id = v.id
        WHERE j.date BETWEEN ? AND ?
        ORDER BY j.created_at DESC
      `, [startDate, endDate])
      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error instanceof Error ? error.message : 'Bilinmeyen hata' }
    }
  })

  ipcMain.handle('job:getByPaymentStatus', async (_, status: string): Promise<IPCResponse> => {
    try {
      const data = await all(`
        SELECT j.*, c.name as court_name, v.plate as vehicle_plate
        FROM jobs j
        JOIN courts c ON j.court_id = c.id
        LEFT JOIN vehicles v ON j.vehicle_id = v.id
        WHERE j.payment_status = ?
        ORDER BY j.created_at DESC
      `, [status])
      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error instanceof Error ? error.message : 'Bilinmeyen hata' }
    }
  })

  ipcMain.handle('job:getByInvoiceStatus', async (_, status: string): Promise<IPCResponse> => {
    try {
      const data = await all(`
        SELECT j.*, c.name as court_name, v.plate as vehicle_plate
        FROM jobs j
        JOIN courts c ON j.court_id = c.id
        LEFT JOIN vehicles v ON j.vehicle_id = v.id
        WHERE j.invoice_status = ?
        ORDER BY j.created_at DESC
      `, [status])
      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error instanceof Error ? error.message : 'Bilinmeyen hata' }
    }
  })

  ipcMain.handle('job:getByCourt', async (_, courtId: number): Promise<IPCResponse> => {
    try {
      const data = await all(`
        SELECT j.*, c.name as court_name, v.plate as vehicle_plate
        FROM jobs j
        JOIN courts c ON j.court_id = c.id
        LEFT JOIN vehicles v ON j.vehicle_id = v.id
        WHERE j.court_id = ?
        ORDER BY j.created_at DESC
      `, [courtId])
      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error instanceof Error ? error.message : 'Bilinmeyen hata' }
    }
  })

  ipcMain.handle('job:getByVehicle', async (_, vehicleId: number): Promise<IPCResponse> => {
    try {
      const data = await all(`
        SELECT j.*, c.name as court_name, v.plate as vehicle_plate
        FROM jobs j
        JOIN courts c ON j.court_id = c.id
        LEFT JOIN vehicles v ON j.vehicle_id = v.id
        WHERE j.vehicle_id = ?
        ORDER BY j.created_at DESC
      `, [vehicleId])
      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error instanceof Error ? error.message : 'Bilinmeyen hata' }
    }
  })

  ipcMain.handle('job:statistics', async (): Promise<IPCResponse> => {
    try {
      const totalJobs = (await get('SELECT COUNT(*) as count FROM jobs')).count
      const totalAmountResult = await get('SELECT SUM(total_amount) as sum FROM jobs')
      const totalBaseAmountResult = await get('SELECT SUM(base_amount) as sum FROM jobs')
      const totalVatAmountResult = await get('SELECT SUM(vat_amount) as sum FROM jobs')
      const paidJobs = (await get("SELECT COUNT(*) as count FROM jobs WHERE payment_status = 'Ödendi'")).count
      const unpaidJobs = (await get("SELECT COUNT(*) as count FROM jobs WHERE payment_status = 'Ödenmedi'")).count
      const invoicedJobs = (await get("SELECT COUNT(*) as count FROM jobs WHERE invoice_status = 'Kesildi'")).count
      const notInvoicedJobs = (await get("SELECT COUNT(*) as count FROM jobs WHERE invoice_status = 'Kesilmedi'")).count

      return {
        success: true,
        data: {
          totalJobs,
          totalAmount: totalAmountResult.sum || 0,
          totalBaseAmount: totalBaseAmountResult.sum || 0,
          totalVatAmount: totalVatAmountResult.sum || 0,
          paidJobs,
          unpaidJobs,
          invoicedJobs,
          notInvoicedJobs,
        },
      }
    } catch (error: any) {
      return { success: false, error: error instanceof Error ? error.message : 'Bilinmeyen hata' }
    }
  })

  console.log('✅ Database IPC handlers kuruldu')
  console.log('📋 Kayıtlı handler\'lar:', [
    'vehicle:getAll', 'vehicle:getById', 'vehicle:create', 'vehicle:update', 'vehicle:delete',
    'court:getAll', 'court:getById', 'court:create', 'court:update', 'court:delete',
    'job:getAll', 'job:getById', 'job:create', 'job:update', 'job:delete'
  ])
}

export { databaseHandler }
