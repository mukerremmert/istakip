import { jobService } from '../models/JobService'
import { Job, CreateJobRequest, UpdateJobRequest, formatDate, parseDate, formatCurrency, parseCurrency } from '../../../shared/types/Job'

// Validasyon fonksiyonları
const validateDate = (dateString: string): boolean => {
  const dateRegex = /^\d{2}\.\d{2}\.\d{4}$/
  if (!dateRegex.test(dateString)) return false
  
  const [day, month, year] = dateString.split('.')
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
  
  return date.getDate() === parseInt(day) && 
         date.getMonth() === parseInt(month) - 1 && 
         date.getFullYear() === parseInt(year)
}

const validateFileNumber = (fileNumber: string): boolean => {
  // Dosya numarası en az 3 karakter olmalı
  return fileNumber.trim().length >= 3
}

const validateAmount = (amount: number): boolean => {
  return amount > 0 && amount <= 1000000 // Maksimum 1 milyon TL
}

const validateCourtId = (courtId: number): boolean => {
  return courtId > 0
}

const validateVehicleId = (vehicleId: number): boolean => {
  return vehicleId > 0
}

class JobController {
  // Tüm işleri getir
  async getJobs(): Promise<Job[]> {
    try {
      return await jobService.getAllJobs()
    } catch (error) {
      console.error('Error getting jobs:', error)
      throw new Error('İşler yüklenirken hata oluştu')
    }
  }

  // ID ile iş getir
  async getJobById(id: number): Promise<Job | null> {
    try {
      if (!id || id <= 0) {
        throw new Error('Geçersiz iş ID')
      }
      return await jobService.getJobById(id)
    } catch (error) {
      console.error('Error getting job:', error)
      throw error instanceof Error ? error : new Error('İş getirilirken hata oluştu')
    }
  }

  // Yeni iş ekle
  async createJob(jobData: CreateJobRequest): Promise<Job> {
    try {
      // Validasyonlar - sadece zorunlu alanlar
      if (!validateDate(jobData.receivedDate)) {
        throw new Error('Geçerli bir geliş tarihi giriniz (DD.MM.YYYY formatında)')
      }

      if (!validateDate(jobData.scheduledDate)) {
        throw new Error('Geçerli bir yapılacak tarih giriniz (DD.MM.YYYY formatında)')
      }

      if (!validateCourtId(jobData.courtId)) {
        throw new Error('Geçerli bir mahkeme seçiniz')
      }

      // Optional alanlar - sadece dolu ise validate et
      if (jobData.fileNumber && !validateFileNumber(jobData.fileNumber)) {
        throw new Error('Dosya numarası en az 3 karakter olmalıdır')
      }

      if (jobData.totalAmount && !validateAmount(jobData.totalAmount)) {
        throw new Error('Tutar 0\'dan büyük ve 1.000.000 TL\'den küçük olmalıdır')
      }

      if (jobData.vehicleId && !validateVehicleId(jobData.vehicleId)) {
        throw new Error('Geçerli bir araç seçiniz')
      }

      // Dosya numarası trim
      const formattedData = {
        ...jobData,
        fileNumber: jobData.fileNumber ? jobData.fileNumber.trim() : ''
      }

      return await jobService.createJob(formattedData)
    } catch (error) {
      console.error('Error creating job:', error)
      throw error instanceof Error ? error : new Error('İş eklenirken hata oluştu')
    }
  }

  // İş güncelle
  async updateJob(jobData: UpdateJobRequest): Promise<Job | null> {
    try {
      // Validasyonlar - sadece zorunlu alanlar
      if (!validateDate(jobData.receivedDate)) {
        throw new Error('Geçerli bir geliş tarihi giriniz (DD.MM.YYYY formatında)')
      }

      if (!validateDate(jobData.scheduledDate)) {
        throw new Error('Geçerli bir yapılacak tarih giriniz (DD.MM.YYYY formatında)')
      }

      if (!validateCourtId(jobData.courtId)) {
        throw new Error('Geçerli bir mahkeme seçiniz')
      }

      // Optional alanlar - sadece dolu ise validate et
      if (jobData.fileNumber && !validateFileNumber(jobData.fileNumber)) {
        throw new Error('Dosya numarası en az 3 karakter olmalıdır')
      }

      if (jobData.totalAmount && !validateAmount(jobData.totalAmount)) {
        throw new Error('Tutar 0\'dan büyük ve 1.000.000 TL\'den küçük olmalıdır')
      }

      if (jobData.vehicleId && !validateVehicleId(jobData.vehicleId)) {
        throw new Error('Geçerli bir araç seçiniz')
      }

      // Dosya numarası trim
      const formattedData = {
        ...jobData,
        fileNumber: jobData.fileNumber ? jobData.fileNumber.trim() : ''
      }

      return await jobService.updateJob(formattedData)
    } catch (error) {
      console.error('Error updating job:', error)
      throw error instanceof Error ? error : new Error('İş güncellenirken hata oluştu')
    }
  }

  // İş sil
  async deleteJob(id: number): Promise<boolean> {
    try {
      if (!id || id <= 0) {
        throw new Error('Geçersiz iş ID')
      }
      return await jobService.deleteJob(id)
    } catch (error) {
      console.error('Error deleting job:', error)
      throw error instanceof Error ? error : new Error('İş silinirken hata oluştu')
    }
  }

  // Tarih aralığına göre işleri getir
  async getJobsByDateRange(startDate: string, endDate: string): Promise<Job[]> {
    try {
      if (!validateDate(startDate) || !validateDate(endDate)) {
        throw new Error('Geçerli tarih aralığı giriniz')
      }
      return await jobService.getJobsByDateRange(startDate, endDate)
    } catch (error) {
      console.error('Error getting jobs by date range:', error)
      throw error instanceof Error ? error : new Error('Tarih aralığına göre işler getirilirken hata oluştu')
    }
  }

  // Ödeme durumuna göre işleri getir
  async getJobsByPaymentStatus(status: string): Promise<Job[]> {
    try {
      return await jobService.getJobsByPaymentStatus(status)
    } catch (error) {
      console.error('Error getting jobs by payment status:', error)
      throw error instanceof Error ? error : new Error('Ödeme durumuna göre işler getirilirken hata oluştu')
    }
  }

  // Fatura durumuna göre işleri getir
  async getJobsByInvoiceStatus(status: string): Promise<Job[]> {
    try {
      return await jobService.getJobsByInvoiceStatus(status)
    } catch (error) {
      console.error('Error getting jobs by invoice status:', error)
      throw error instanceof Error ? error : new Error('Fatura durumuna göre işler getirilirken hata oluştu')
    }
  }

  // Mahkeme bazlı işleri getir
  async getJobsByCourt(courtId: number): Promise<Job[]> {
    try {
      if (!validateCourtId(courtId)) {
        throw new Error('Geçerli bir mahkeme ID giriniz')
      }
      return await jobService.getJobsByCourt(courtId)
    } catch (error) {
      console.error('Error getting jobs by court:', error)
      throw error instanceof Error ? error : new Error('Mahkeme bazlı işler getirilirken hata oluştu')
    }
  }

  // Araç bazlı işleri getir
  async getJobsByVehicle(vehicleId: number): Promise<Job[]> {
    try {
      if (!validateVehicleId(vehicleId)) {
        throw new Error('Geçerli bir araç ID giriniz')
      }
      return await jobService.getJobsByVehicle(vehicleId)
    } catch (error) {
      console.error('Error getting jobs by vehicle:', error)
      throw error instanceof Error ? error : new Error('Araç bazlı işler getirilirken hata oluştu')
    }
  }

  // İstatistikleri getir
  async getJobStatistics(): Promise<any> {
    try {
      return await jobService.getJobStatistics()
    } catch (error) {
      console.error('Error getting job statistics:', error)
      throw error instanceof Error ? error : new Error('İstatistikler getirilirken hata oluştu')
    }
  }

  // Yardımcı fonksiyonlar
  formatDate = formatDate
  parseDate = parseDate
  formatCurrency = formatCurrency
  parseCurrency = parseCurrency
}

export const jobController = new JobController()
