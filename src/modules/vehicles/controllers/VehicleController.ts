import { vehicleService } from '../models/VehicleService'
import { Vehicle, CreateVehicleRequest, UpdateVehicleRequest } from '../../../shared/types/Vehicle'

// Plaka formatı ve validasyon fonksiyonları
export const formatPlate = (input: string): string => {
  // Türkçe karakterleri çevir
  const turkishToEnglish: { [key: string]: string } = {
    'ç': 'C', 'Ç': 'C',
    'ğ': 'G', 'Ğ': 'G', 
    'ı': 'I', 'İ': 'I', 'i': 'I',
    'ö': 'O', 'Ö': 'O',
    'ş': 'S', 'Ş': 'S',
    'ü': 'U', 'Ü': 'U'
  }
  
  // Türkçe karakterleri çevir ve büyük harfe çevir
  let cleaned = input.toUpperCase()
  Object.keys(turkishToEnglish).forEach(char => {
    cleaned = cleaned.replace(new RegExp(char, 'g'), turkishToEnglish[char])
  })
  
  // Sadece harf ve rakam bırak
  cleaned = cleaned.replace(/[^A-Z0-9]/g, '')
  
  // Yasak karakterleri kaldır (Q, W, X, Ç, Ğ, İ, Ö, Ş, Ü)
  cleaned = cleaned.replace(/[QWXÇĞIÖŞÜ]/g, '')
  
  // Format: 34ABC123 -> 34 ABC 123
  if (cleaned.length >= 2) {
    let formatted = cleaned.substring(0, 2) // İl kodu
    
    if (cleaned.length > 2) {
      const remaining = cleaned.substring(2)
      
      // Harfleri ayır
      const letters = remaining.match(/[A-Z]+/)?.[0] || ''
      const numbers = remaining.replace(/[A-Z]/g, '')
      
      if (letters) {
        formatted += ' ' + letters
      }
      
      if (numbers) {
        formatted += ' ' + numbers
      }
    }
    
    return formatted
  }
  
  return cleaned
}

export const validatePlate = (plate: string): boolean => {
  if (!plate) return false
  
  // Boşlukları kaldır
  const cleaned = plate.replace(/\s/g, '')
  
  // Uzunluk kontrolü: minimum 5, maksimum 8 karakter
  if (cleaned.length < 5 || cleaned.length > 8) return false
  
  // İl kodu kontrolü: 01-81 arası
  const ilKodu = parseInt(cleaned.substring(0, 2))
  if (ilKodu < 1 || ilKodu > 81) return false
  
  // Format kontrolü: 2 rakam + 1-3 harf + 1-5 rakam
  const plateRegex = /^[0-9]{2}[A-Z]{1,3}[0-9]{1,5}$/
  return plateRegex.test(cleaned)
}

class VehicleController {
  // Tüm araçları getir
  async getVehicles(): Promise<Vehicle[]> {
    try {
      return await vehicleService.getAllVehicles()
    } catch (error) {
      console.error('Error fetching vehicles:', error)
      throw new Error('Araçlar yüklenirken hata oluştu')
    }
  }

  // ID ile araç getir
  async getVehicle(id: number): Promise<Vehicle | null> {
    try {
      return await vehicleService.getVehicleById(id)
    } catch (error) {
      console.error('Error fetching vehicle:', error)
      throw new Error('Araç bilgileri yüklenirken hata oluştu')
    }
  }

  // Yeni araç ekle
  async createVehicle(vehicleData: CreateVehicleRequest): Promise<Vehicle> {
    try {
      // Plaka validasyonu
      if (!validatePlate(vehicleData.plate)) {
        throw new Error('Geçersiz plaka formatı')
      }

      // Plaka formatını düzelt
      const formattedData = {
        ...vehicleData,
        plate: formatPlate(vehicleData.plate)
      }

      return await vehicleService.createVehicle(formattedData)
    } catch (error) {
      console.error('Error creating vehicle:', error)
      throw error instanceof Error ? error : new Error('Araç eklenirken hata oluştu')
    }
  }

  // Araç güncelle
  async updateVehicle(vehicleData: UpdateVehicleRequest): Promise<Vehicle | null> {
    try {
      // Plaka validasyonu
      if (!validatePlate(vehicleData.plate)) {
        throw new Error('Geçersiz plaka formatı')
      }

      // Plaka formatını düzelt
      const formattedData = {
        ...vehicleData,
        plate: formatPlate(vehicleData.plate)
      }

      return await vehicleService.updateVehicle(formattedData)
    } catch (error) {
      console.error('Error updating vehicle:', error)
      throw error instanceof Error ? error : new Error('Araç güncellenirken hata oluştu')
    }
  }

  // Araç sil
  async deleteVehicle(id: number): Promise<boolean> {
    try {
      return await vehicleService.deleteVehicle(id)
    } catch (error) {
      console.error('Error deleting vehicle:', error)
      throw new Error('Araç silinirken hata oluştu')
    }
  }

  // Plaka benzerlik kontrolü
  async checkPlateSimilarity(plate: string, excludeId?: number): Promise<Vehicle[]> {
    try {
      const formattedPlate = formatPlate(plate)
      const similarVehicles = await vehicleService.searchVehicles(formattedPlate)
      
      // Düzenleme modunda mevcut aracı hariç tut
      if (excludeId) {
        return similarVehicles.filter(vehicle => vehicle.id !== excludeId)
      }
      
      return similarVehicles
    } catch (error) {
      console.error('Error checking plate similarity:', error)
      return []
    }
  }

  // Arama ve filtreleme
  async searchVehicles(searchTerm: string, type?: string): Promise<Vehicle[]> {
    try {
      if (type) {
        return await vehicleService.getVehiclesByType(type)
      }
      return await vehicleService.searchVehicles(searchTerm)
    } catch (error) {
      console.error('Error searching vehicles:', error)
      throw new Error('Araç arama işleminde hata oluştu')
    }
  }
}

// Singleton instance
export const vehicleController = new VehicleController()
export default VehicleController
