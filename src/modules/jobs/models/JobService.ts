import { Job, CreateJobRequest, UpdateJobRequest, calculateVAT } from '../../../shared/types/Job'

class JobService {
  // IPC ile main process'teki SQLite3 ile iletişim
  private async callIPC(channel: string, ...args: any[]): Promise<any> {
    console.log(`📡 callIPC çağrıldı - channel: "${channel}", args:`, args)
    
    if (!window.electronAPI?.job) {
      console.error('❌ ElectronAPI henüz hazır değil')
      throw new Error('ElectronAPI henüz hazır değil. Lütfen sayfayı yenileyin.')
    }
    
    const method = (window.electronAPI.job as any)[channel]
    if (!method) {
      console.error(`❌ Method bulunamadı: job.${channel}`)
      throw new Error(`Method bulunamadı: job.${channel}`)
    }
    
    console.log(`📞 window.electronAPI.job.${channel} çağrılıyor...`)
    const result = await method(...args)
    console.log(`📥 IPC sonucu (${channel}):`, result)
    
    if (!result.success) {
      console.error(`❌ IPC hatası (${channel}):`, result.error)
      throw new Error(result.error || 'Database işlemi başarısız')
    }
    return result.data
  }

  // Tüm işleri getir
  async getAllJobs(): Promise<Job[]> {
    try {
      const rows = await this.callIPC('getAll')
      return rows.map((row: any) => ({
        id: row.id,
        receivedDate: row.received_date || row.date,
        scheduledDate: row.scheduled_date || row.date,
        courtId: row.court_id,
        courtName: row.court_name || '',
        fileNumber: row.file_number,
        vehicleId: row.vehicle_id,
        plate: row.vehicle_plate || '',
        totalAmount: row.total_amount,
        baseAmount: row.base_amount,
        vatAmount: row.vat_amount,
        vatRate: row.vat_rate,
        paymentStatus: row.payment_status,
        invoiceStatus: row.invoice_status,
        status: row.status,
        statusDate: row.status_date,
        statusNote: row.status_note,
        invoiceNumber: row.invoice_number,
        invoiceDate: row.invoice_date,
        paymentDate: row.payment_date,
        completionDate: row.completion_date,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }))
    } catch (error) {
      console.error('Error getting jobs:', error)
      throw error
    }
  }

  // ID ile iş getir
  async getJobById(id: number): Promise<Job | null> {
    try {
      const row = await this.callIPC('getById', id)
      if (!row) return null
      
      return {
        id: row.id,
        receivedDate: row.received_date || row.date,
        scheduledDate: row.scheduled_date || row.date,
        courtId: row.court_id,
        courtName: row.court_name || '',
        fileNumber: row.file_number,
        vehicleId: row.vehicle_id,
        plate: row.vehicle_plate || '',
        totalAmount: row.total_amount,
        baseAmount: row.base_amount,
        vatAmount: row.vat_amount,
        vatRate: row.vat_rate,
        paymentStatus: row.payment_status,
        invoiceStatus: row.invoice_status,
        status: row.status,
        statusDate: row.status_date,
        statusNote: row.status_note,
        invoiceNumber: row.invoice_number,
        invoiceDate: row.invoice_date,
        paymentDate: row.payment_date,
        completionDate: row.completion_date,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }
    } catch (error) {
      console.error('Error getting job:', error)
      throw error
    }
  }

  // Yeni iş ekle
  async createJob(jobData: CreateJobRequest): Promise<Job> {
    try {
      const result = await this.callIPC('create', jobData)
      return result
    } catch (error) {
      console.error('Error creating job:', error)
      throw error
    }
  }

  // İş güncelle
  async updateJob(jobData: UpdateJobRequest): Promise<Job | null> {
    try {
      const result = await this.callIPC('update', jobData)
      return result
    } catch (error) {
      console.error('Error updating job:', error)
      throw error
    }
  }

  // İş sil
  async deleteJob(id: number): Promise<boolean> {
    try {
      console.log('🗑️ JobService.deleteJob çağrıldı, ID:', id)
      console.log('🔍 window.electronAPI.job:', window.electronAPI?.job)
      
      if (!window.electronAPI?.job) {
        console.error('❌ ElectronAPI.job mevcut değil!')
        throw new Error('ElectronAPI henüz hazır değil. Lütfen sayfayı yenileyin.')
      }
      
      console.log('📞 callIPC("delete", id) çağrılıyor...')
      const result = await this.callIPC('delete', id)
      console.log('✅ callIPC sonucu:', result)
      return true
    } catch (error) {
      console.error('❌ Error deleting job:', error)
      throw error
    }
  }

  // Tarih aralığına göre işler
  async getJobsByDateRange(startDate: string, endDate: string): Promise<Job[]> {
    try {
      const rows = await this.callIPC('getByDateRange', startDate, endDate)
      return rows.map((row: any) => ({
        id: row.id,
        receivedDate: row.received_date || row.date,
        scheduledDate: row.scheduled_date || row.date,
        courtId: row.court_id,
        courtName: row.court_name || '',
        fileNumber: row.file_number,
        vehicleId: row.vehicle_id,
        plate: row.vehicle_plate || '',
        totalAmount: row.total_amount,
        baseAmount: row.base_amount,
        vatAmount: row.vat_amount,
        vatRate: row.vat_rate,
        paymentStatus: row.payment_status,
        invoiceStatus: row.invoice_status,
        status: row.status,
        statusDate: row.status_date,
        statusNote: row.status_note,
        invoiceNumber: row.invoice_number,
        invoiceDate: row.invoice_date,
        paymentDate: row.payment_date,
        completionDate: row.completion_date,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }))
    } catch (error) {
      console.error('Error getting jobs by date range:', error)
      throw error
    }
  }

  // Ödeme durumuna göre işler
  async getJobsByPaymentStatus(status: string): Promise<Job[]> {
    try {
      const rows = await this.callIPC('getByPaymentStatus', status)
      return rows.map((row: any) => ({
        id: row.id,
        receivedDate: row.received_date || row.date,
        scheduledDate: row.scheduled_date || row.date,
        courtId: row.court_id,
        courtName: row.court_name || '',
        fileNumber: row.file_number,
        vehicleId: row.vehicle_id,
        plate: row.vehicle_plate || '',
        totalAmount: row.total_amount,
        baseAmount: row.base_amount,
        vatAmount: row.vat_amount,
        vatRate: row.vat_rate,
        paymentStatus: row.payment_status,
        invoiceStatus: row.invoice_status,
        status: row.status,
        statusDate: row.status_date,
        statusNote: row.status_note,
        invoiceNumber: row.invoice_number,
        invoiceDate: row.invoice_date,
        paymentDate: row.payment_date,
        completionDate: row.completion_date,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }))
    } catch (error) {
      console.error('Error getting jobs by payment status:', error)
      throw error
    }
  }

  // Fatura durumuna göre işler
  async getJobsByInvoiceStatus(status: string): Promise<Job[]> {
    try {
      const rows = await this.callIPC('getByInvoiceStatus', status)
      return rows.map((row: any) => ({
        id: row.id,
        receivedDate: row.received_date || row.date,
        scheduledDate: row.scheduled_date || row.date,
        courtId: row.court_id,
        courtName: row.court_name || '',
        fileNumber: row.file_number,
        vehicleId: row.vehicle_id,
        plate: row.vehicle_plate || '',
        totalAmount: row.total_amount,
        baseAmount: row.base_amount,
        vatAmount: row.vat_amount,
        vatRate: row.vat_rate,
        paymentStatus: row.payment_status,
        invoiceStatus: row.invoice_status,
        status: row.status,
        statusDate: row.status_date,
        statusNote: row.status_note,
        invoiceNumber: row.invoice_number,
        invoiceDate: row.invoice_date,
        paymentDate: row.payment_date,
        completionDate: row.completion_date,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }))
    } catch (error) {
      console.error('Error getting jobs by invoice status:', error)
      throw error
    }
  }

  // Mahkemeye göre işler
  async getJobsByCourt(courtId: number): Promise<Job[]> {
    try {
      const rows = await this.callIPC('getByCourt', courtId)
      return rows.map((row: any) => ({
        id: row.id,
        receivedDate: row.received_date || row.date,
        scheduledDate: row.scheduled_date || row.date,
        courtId: row.court_id,
        courtName: row.court_name || '',
        fileNumber: row.file_number,
        vehicleId: row.vehicle_id,
        plate: row.vehicle_plate || '',
        totalAmount: row.total_amount,
        baseAmount: row.base_amount,
        vatAmount: row.vat_amount,
        vatRate: row.vat_rate,
        paymentStatus: row.payment_status,
        invoiceStatus: row.invoice_status,
        status: row.status,
        statusDate: row.status_date,
        statusNote: row.status_note,
        invoiceNumber: row.invoice_number,
        invoiceDate: row.invoice_date,
        paymentDate: row.payment_date,
        completionDate: row.completion_date,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }))
    } catch (error) {
      console.error('Error getting jobs by court:', error)
      throw error
    }
  }

  // Araca göre işler
  async getJobsByVehicle(vehicleId: number): Promise<Job[]> {
    try {
      const rows = await this.callIPC('getByVehicle', vehicleId)
      return rows.map((row: any) => ({
        id: row.id,
        receivedDate: row.received_date || row.date,
        scheduledDate: row.scheduled_date || row.date,
        courtId: row.court_id,
        courtName: row.court_name || '',
        fileNumber: row.file_number,
        vehicleId: row.vehicle_id,
        plate: row.vehicle_plate || '',
        totalAmount: row.total_amount,
        baseAmount: row.base_amount,
        vatAmount: row.vat_amount,
        vatRate: row.vat_rate,
        paymentStatus: row.payment_status,
        invoiceStatus: row.invoice_status,
        status: row.status,
        statusDate: row.status_date,
        statusNote: row.status_note,
        invoiceNumber: row.invoice_number,
        invoiceDate: row.invoice_date,
        paymentDate: row.payment_date,
        completionDate: row.completion_date,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }))
    } catch (error) {
      console.error('Error getting jobs by vehicle:', error)
      throw error
    }
  }

  // İstatistikler
  async getJobStatistics(): Promise<{
    totalJobs: number
    totalAmount: number
    totalBaseAmount: number
    totalVatAmount: number
    paidJobs: number
    unpaidJobs: number
    invoicedJobs: number
    notInvoicedJobs: number
  }> {
    try {
      const stats = await this.callIPC('getStatistics')
      return stats
    } catch (error) {
      console.error('Error getting job statistics:', error)
      throw error
    }
  }
}

export const jobService = new JobService()