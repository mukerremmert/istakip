import { courtService } from '../models/CourtService'
import { Court, CreateCourtRequest, UpdateCourtRequest } from '../../../shared/types/Court'

// Validasyon fonksiyonları
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validatePhone = (phone: string): boolean => {
  // Türkiye telefon numarası formatı: 0XXX XXX XXXX
  const phoneRegex = /^0[0-9]{3}\s?[0-9]{3}\s?[0-9]{4}$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}

export const formatPhone = (phone: string): string => {
  // Sadece rakamları al
  const cleaned = phone.replace(/\D/g, '')
  
  // 0XXX XXX XXXX formatına çevir
  if (cleaned.length === 11 && cleaned.startsWith('0')) {
    return `${cleaned.substring(0, 4)} ${cleaned.substring(4, 7)} ${cleaned.substring(7)}`
  }
  
  return phone
}

class CourtController {
  // Tüm mahkemeleri getir
  async getCourts(): Promise<Court[]> {
    try {
      return await courtService.getAllCourts()
    } catch (error) {
      console.error('Error fetching courts:', error)
      throw new Error('Mahkemeler yüklenirken hata oluştu')
    }
  }

  // ID ile mahkeme getir
  async getCourt(id: number): Promise<Court | null> {
    try {
      return await courtService.getCourtById(id)
    } catch (error) {
      console.error('Error fetching court:', error)
      throw new Error('Mahkeme bilgileri yüklenirken hata oluştu')
    }
  }

  // Yeni mahkeme ekle
  async createCourt(courtData: CreateCourtRequest): Promise<Court> {
    try {
      // Zorunlu alan validasyonları
      if (!courtData.name.trim()) {
        throw new Error('Mahkeme adı zorunludur')
      }

      if (!courtData.city.trim()) {
        throw new Error('Şehir alanı zorunludur')
      }

      // İsteğe bağlı alanlar için validasyon (sadece dolu ise)
      if (courtData.phone && courtData.phone.trim() && !validatePhone(courtData.phone)) {
        throw new Error('Geçerli bir telefon numarası giriniz (örn: 0212 555 0101)')
      }

      if (courtData.email && courtData.email.trim() && !validateEmail(courtData.email)) {
        throw new Error('Geçerli bir e-posta adresi giriniz')
      }

      // Formatları düzelt
      const formattedData = {
        ...courtData,
        phone: courtData.phone ? formatPhone(courtData.phone) : undefined,
        email: courtData.email ? courtData.email.toLowerCase().trim() : undefined,
        contact: courtData.contact ? courtData.contact.trim() : undefined,
        notes: courtData.notes ? courtData.notes.trim() : undefined
      }

      return await courtService.createCourt(formattedData)
    } catch (error) {
      console.error('Error creating court:', error)
      throw error instanceof Error ? error : new Error('Mahkeme eklenirken hata oluştu')
    }
  }

  // Mahkeme güncelle
  async updateCourt(courtData: UpdateCourtRequest): Promise<Court | null> {
    try {
      // Zorunlu alan validasyonları
      if (!courtData.name.trim()) {
        throw new Error('Mahkeme adı zorunludur')
      }

      if (!courtData.city.trim()) {
        throw new Error('Şehir alanı zorunludur')
      }

      // İsteğe bağlı alanlar için validasyon (sadece dolu ise)
      if (courtData.phone && courtData.phone.trim() && !validatePhone(courtData.phone)) {
        throw new Error('Geçerli bir telefon numarası giriniz (örn: 0212 555 0101)')
      }

      if (courtData.email && courtData.email.trim() && !validateEmail(courtData.email)) {
        throw new Error('Geçerli bir e-posta adresi giriniz')
      }

      // Formatları düzelt
      const formattedData = {
        ...courtData,
        phone: courtData.phone ? formatPhone(courtData.phone) : undefined,
        email: courtData.email ? courtData.email.toLowerCase().trim() : undefined,
        contact: courtData.contact ? courtData.contact.trim() : undefined,
        notes: courtData.notes ? courtData.notes.trim() : undefined
      }

      return await courtService.updateCourt(formattedData)
    } catch (error) {
      console.error('Error updating court:', error)
      throw error instanceof Error ? error : new Error('Mahkeme güncellenirken hata oluştu')
    }
  }

  // Mahkeme sil
  async deleteCourt(id: number): Promise<boolean> {
    try {
      return await courtService.deleteCourt(id)
    } catch (error) {
      console.error('Error deleting court:', error)
      throw new Error('Mahkeme silinirken hata oluştu')
    }
  }

  // İsim benzerlik kontrolü
  async checkNameSimilarity(name: string, excludeId?: number): Promise<Court[]> {
    try {
      const similarCourts = await courtService.findCourtsByName(name)
      
      // Düzenleme modunda mevcut mahkemeyi hariç tut
      if (excludeId) {
        return similarCourts.filter(court => court.id !== excludeId)
      }
      
      return similarCourts
    } catch (error) {
      console.error('Error checking name similarity:', error)
      return []
    }
  }

  // Arama ve filtreleme
  async searchCourts(searchTerm: string, type?: string, city?: string): Promise<Court[]> {
    try {
      return await courtService.searchCourts(searchTerm, type, city)
    } catch (error) {
      console.error('Error searching courts:', error)
      throw new Error('Mahkeme arama işleminde hata oluştu')
    }
  }

}

// Singleton instance
export const courtController = new CourtController()
export default CourtController
