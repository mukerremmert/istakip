export interface Job {
  id: number
  receivedDate: string // İşin geldiği tarih (DD.MM.YYYY format)
  scheduledDate: string // İşin yapılacağı tarih (DD.MM.YYYY format)
  courtId: number
  courtName: string
  fileNumber: string // Serbest giriş (örn: 2025/757)
  vehicleId: number
  plate: string
  totalAmount: number // KDV dahil (kullanıcı girişi)
  baseAmount: number // KDV hariç (otomatik hesaplanan)
  vatAmount: number // KDV tutarı (otomatik hesaplanan)
  vatRate: number // %20 (sabit)
  paymentStatus: PaymentStatus
  invoiceStatus: InvoiceStatus
  status: JobStatus // İş durumu
  statusDate: string // Durum değişikliği tarihi (DD.MM.YYYY)
  statusNote?: string // Durum değişikliği notu
  invoiceNumber?: string // Fatura numarası (Kesildi durumunda)
  invoiceDate?: string // Fatura tarihi (DD.MM.YYYY format)
  paymentDate?: string // Ödeme tarihi (Ödendi durumunda)
  completionDate?: string // Tamamlanma tarihi (Tamamlandı durumunda)
  notes?: string // İsteğe bağlı notlar
  createdAt: string
  updatedAt: string
}

export interface CreateJobRequest {
  receivedDate: string
  scheduledDate: string
  courtId: number
  fileNumber?: string // Optional - mahkeme dosya numarası
  vehicleId?: number // Optional - sonra eklenebilir
  totalAmount?: number // Optional - sonra eklenebilir
  baseAmount?: number // Optional - otomatik hesaplanır
  vatAmount?: number // Optional - otomatik hesaplanır
  vatRate?: number // Optional - default 20
  paymentStatus: PaymentStatus
  invoiceStatus: InvoiceStatus
  status: JobStatus
  statusDate: string
  statusNote?: string
  invoiceNumber?: string
  invoiceDate?: string
  paymentDate?: string
  completionDate?: string
  notes?: string
}

export interface UpdateJobRequest extends CreateJobRequest {
  id: number
}

// Enum tanımları
export type PaymentStatus = 'Ödendi' | 'Ödenmedi'
export type InvoiceStatus = 'Kesildi' | 'Kesilmedi' | 'Beklemede'
export type JobStatus = 'Beklemede' | 'Devam Ediyor' | 'Tamamlandı' | 'İptal'

export const PAYMENT_STATUSES: PaymentStatus[] = [
  'Ödendi',
  'Ödenmedi'
]

export const INVOICE_STATUSES: InvoiceStatus[] = [
  'Kesildi',
  'Kesilmedi', 
  'Beklemede'
]

export const JOB_STATUSES: JobStatus[] = [
  'Beklemede',
  'Devam Ediyor',
  'Tamamlandı',
  'İptal'
]

// Durum renk kodları
export const JOB_STATUS_COLORS: Record<JobStatus, string> = {
  'Beklemede': 'bg-yellow-100 text-yellow-800',
  'Devam Ediyor': 'bg-orange-100 text-orange-800',
  'Tamamlandı': 'bg-green-100 text-green-800',
  'İptal': 'bg-red-100 text-red-800'
}

// Durum ikonları
export const JOB_STATUS_ICONS: Record<JobStatus, string> = {
  'Beklemede': '⏳',
  'Devam Ediyor': '🔄',
  'Tamamlandı': '✅',
  'İptal': '❌'
}

// KDV hesaplama fonksiyonu
export const calculateVAT = (totalAmount: number, vatRate: number = 20) => {
  const baseAmount = totalAmount / (1 + vatRate / 100)
  const vatAmount = totalAmount - baseAmount
  return {
    baseAmount: Math.round(baseAmount * 100) / 100, // 2 ondalık basamak
    vatAmount: Math.round(vatAmount * 100) / 100,
    vatRate
  }
}

// Tarih formatı yardımcı fonksiyonları
export const formatDate = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  return `${day}.${month}.${year}`
}

export const parseDate = (dateString: string): Date => {
  const [day, month, year] = dateString.split('.')
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
}

// Tutar formatı yardımcı fonksiyonları
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

export const parseCurrency = (currencyString: string): number => {
  // "1.200,00 ₺" -> 1200.00
  return parseFloat(currencyString.replace(/[^\d,]/g, '').replace(',', '.'))
}
