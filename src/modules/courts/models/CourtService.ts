import { Court, CreateCourtRequest, UpdateCourtRequest } from '../../../shared/types/Court'

class CourtService {
  // IPC ile main process'teki SQLite3 ile iletişim
  private async callIPC(channel: string, ...args: any[]): Promise<any> {
    if (!window.electronAPI?.court) {
      console.error('❌ ElectronAPI henüz hazır değil')
      throw new Error('ElectronAPI henüz hazır değil. Lütfen sayfayı yenileyin.')
    }
    
    const result = await (window.electronAPI.court as any)[channel](...args)
    if (!result.success) {
      throw new Error(result.error || 'Database işlemi başarısız')
    }
    return result.data
  }

  // Tüm mahkemeleri getir
  async getAllCourts(): Promise<Court[]> {
    try {
      const rows = await this.callIPC('getAll')
      return rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        city: row.city,
        district: row.district,
        type: row.type,
        address: row.address,
        phone: row.phone,
        email: row.email,
        contact: row.contact,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }))
    } catch (error) {
      console.error('Error getting courts:', error)
      throw error
    }
  }

  // ID ile mahkeme getir
  async getCourtById(id: number): Promise<Court | null> {
    try {
      const row = await this.callIPC('getById', id)
      if (!row) return null
      
      return {
        id: row.id,
        name: row.name,
        city: row.city,
        district: row.district,
        type: row.type,
        address: row.address,
        phone: row.phone,
        email: row.email,
        contact: row.contact,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }
    } catch (error) {
      console.error('Error getting court:', error)
      throw error
    }
  }

  // Yeni mahkeme ekle
  async createCourt(courtData: CreateCourtRequest): Promise<Court> {
    try {
      const result = await this.callIPC('create', courtData)
      return result
    } catch (error) {
      console.error('Error creating court:', error)
      throw error
    }
  }

  // Mahkeme güncelle
  async updateCourt(courtData: UpdateCourtRequest): Promise<Court | null> {
    try {
      const result = await this.callIPC('update', courtData)
      return result
    } catch (error) {
      console.error('Error updating court:', error)
      throw error
    }
  }

  // Mahkeme sil
  async deleteCourt(id: number): Promise<boolean> {
    try {
      await this.callIPC('delete', id)
      return true
    } catch (error) {
      console.error('Error deleting court:', error)
      throw error
    }
  }

  // İsim ile mahkeme ara (benzerlik kontrolü için)
  async findCourtsByName(name: string): Promise<Court[]> {
    try {
      const rows = await this.callIPC('search', name)
      return rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        city: row.city,
        district: row.district,
        type: row.type,
        address: row.address,
        phone: row.phone,
        email: row.email,
        contact: row.contact,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }))
    } catch (error) {
      console.error('Error finding courts by name:', error)
      throw error
    }
  }

  // Arama ve filtreleme
  async searchCourts(searchTerm: string, type?: string, city?: string): Promise<Court[]> {
    try {
      let rows = await this.callIPC('search', searchTerm)
      
      if (type && type !== 'all') {
        rows = rows.filter((row: any) => row.type === type)
      }
      
      if (city && city !== 'all') {
        rows = rows.filter((row: any) => row.city === city)
      }
      
      return rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        city: row.city,
        district: row.district,
        type: row.type,
        address: row.address,
        phone: row.phone,
        email: row.email,
        contact: row.contact,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }))
    } catch (error) {
      console.error('Error searching courts:', error)
      throw error
    }
  }

  // Şehre göre mahkeme getir
  async getCourtsByCity(city: string): Promise<Court[]> {
    try {
      const rows = await this.callIPC('getByCity', city)
      return rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        city: row.city,
        district: row.district,
        type: row.type,
        address: row.address,
        phone: row.phone,
        email: row.email,
        contact: row.contact,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }))
    } catch (error) {
      console.error('Error getting courts by city:', error)
      throw error
    }
  }

  // Tipe göre mahkeme getir
  async getCourtsByType(type: string): Promise<Court[]> {
    try {
      const rows = await this.callIPC('getByType', type)
      return rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        city: row.city,
        district: row.district,
        type: row.type,
        address: row.address,
        phone: row.phone,
        email: row.email,
        contact: row.contact,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }))
    } catch (error) {
      console.error('Error getting courts by type:', error)
      throw error
    }
  }

}

export const courtService = new CourtService()
export default CourtService