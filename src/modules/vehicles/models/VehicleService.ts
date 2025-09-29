import { Vehicle, CreateVehicleRequest, UpdateVehicleRequest } from '../../../shared/types/Vehicle'

class VehicleService {
  // IPC ile main process'teki SQLite3 ile iletişim
  private async callIPC(channel: string, ...args: any[]): Promise<any> {
    if (!window.electronAPI?.vehicle) {
      console.error('❌ ElectronAPI henüz hazır değil')
      throw new Error('ElectronAPI henüz hazır değil. Lütfen sayfayı yenileyin.')
    }
    
    const result = await (window.electronAPI.vehicle as any)[channel](...args)
    if (!result.success) {
      throw new Error(result.error || 'Database işlemi başarısız')
    }
    return result.data
  }

  // Tüm araçları getir
  async getAllVehicles(): Promise<Vehicle[]> {
    try {
      const rows = await this.callIPC('getAll')
      return rows.map((row: any) => ({
        id: row.id,
        plate: row.plate,
        brand: row.brand,
        model: row.model,
        year: row.year,
        type: row.type
      }))
    } catch (error) {
      console.error('Error getting vehicles:', error)
      throw error
    }
  }

  // ID ile araç getir
  async getVehicleById(id: number): Promise<Vehicle | null> {
    try {
      const row = await this.callIPC('getById', id)
      if (!row) return null
      
      return {
        id: row.id,
        plate: row.plate,
        brand: row.brand,
        model: row.model,
        year: row.year,
        type: row.type
      }
    } catch (error) {
      console.error('Error getting vehicle:', error)
      throw error
    }
  }

  // Yeni araç ekle
  async createVehicle(vehicleData: CreateVehicleRequest): Promise<Vehicle> {
    try {
      const result = await this.callIPC('create', vehicleData)
      return result
    } catch (error) {
      console.error('Error creating vehicle:', error)
      throw error
    }
  }

  // Araç güncelle
  async updateVehicle(vehicleData: UpdateVehicleRequest): Promise<Vehicle | null> {
    try {
      const result = await this.callIPC('update', vehicleData)
      return result
    } catch (error) {
      console.error('Error updating vehicle:', error)
      throw error
    }
  }

  // Araç sil
  async deleteVehicle(id: number): Promise<boolean> {
    try {
      await this.callIPC('delete', id)
      return true
    } catch (error) {
      console.error('Error deleting vehicle:', error)
      throw error
    }
  }

  // Araç ara
  async searchVehicles(searchTerm: string): Promise<Vehicle[]> {
    try {
      const rows = await this.callIPC('search', searchTerm)
      return rows.map((row: any) => ({
        id: row.id,
        plate: row.plate,
        brand: row.brand,
        model: row.model,
        year: row.year,
        type: row.type
      }))
    } catch (error) {
      console.error('Error searching vehicles:', error)
      throw error
    }
  }

  // Tip bazında araç getir
  async getVehiclesByType(type: string): Promise<Vehicle[]> {
    try {
      const rows = await this.callIPC('getByType', type)
      return rows.map((row: any) => ({
        id: row.id,
        plate: row.plate,
        brand: row.brand,
        model: row.model,
        year: row.year,
        type: row.type
      }))
    } catch (error) {
      console.error('Error getting vehicles by type:', error)
      throw error
    }
  }

  // İstatistikler
  async getVehicleStatistics(): Promise<{
    totalVehicles: number
    vehiclesByType: { [type: string]: number }
    vehiclesByYear: { [year: number]: number }
  }> {
    try {
      const stats = await this.callIPC('getStatistics')
      return stats
    } catch (error) {
      console.error('Error getting vehicle statistics:', error)
      throw error
    }
  }
}

export const vehicleService = new VehicleService()