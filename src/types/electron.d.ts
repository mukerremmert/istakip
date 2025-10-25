// Electron API type definitions
declare global {
  interface Window {
    electronAPI: {
      database: {
        vehicle: VehicleAPI
        court: CourtAPI
        job: JobAPI
      }
      vehicle: VehicleAPI
      court: CourtAPI
      job: JobAPI
    }
    electron: {
      invoke: (channel: string, ...args: any[]) => Promise<any>
      on: (channel: string, listener: (event: any, ...args: any[]) => void) => void
      removeListener: (channel: string, listener: (...args: any[]) => void) => void
    }
  }
}

interface VehicleAPI {
  [key: string]: (...args: any[]) => Promise<{ success: boolean; data?: any; error?: string }>
  getAll: () => Promise<{ success: boolean; data?: any; error?: string }>
  getById: (id: number) => Promise<{ success: boolean; data?: any; error?: string }>
  create: (data: any) => Promise<{ success: boolean; data?: any; error?: string }>
  update: (data: any) => Promise<{ success: boolean; data?: any; error?: string }>
  delete: (id: number) => Promise<{ success: boolean; data?: any; error?: string }>
  search: (term: string) => Promise<{ success: boolean; data?: any; error?: string }>
  getByType: (type: string) => Promise<{ success: boolean; data?: any; error?: string }>
  getStatistics: () => Promise<{ success: boolean; data?: any; error?: string }>
}

interface CourtAPI {
  [key: string]: (...args: any[]) => Promise<{ success: boolean; data?: any; error?: string }>
  getAll: () => Promise<{ success: boolean; data?: any; error?: string }>
  getById: (id: number) => Promise<{ success: boolean; data?: any; error?: string }>
  create: (data: any) => Promise<{ success: boolean; data?: any; error?: string }>
  update: (data: any) => Promise<{ success: boolean; data?: any; error?: string }>
  delete: (id: number) => Promise<{ success: boolean; data?: any; error?: string }>
  search: (term: string) => Promise<{ success: boolean; data?: any; error?: string }>
  getByCity: (city: string) => Promise<{ success: boolean; data?: any; error?: string }>
  getByType: (type: string) => Promise<{ success: boolean; data?: any; error?: string }>
  getStatistics: () => Promise<{ success: boolean; data?: any; error?: string }>
}

interface JobAPI {
  [key: string]: (...args: any[]) => Promise<{ success: boolean; data?: any; error?: string }>
  getAll: () => Promise<{ success: boolean; data?: any; error?: string }>
  getById: (id: number) => Promise<{ success: boolean; data?: any; error?: string }>
  create: (data: any) => Promise<{ success: boolean; data?: any; error?: string }>
  update: (data: any) => Promise<{ success: boolean; data?: any; error?: string }>
  delete: (id: number) => Promise<{ success: boolean; data?: any; error?: string }>
  getByDateRange: (startDate: string, endDate: string) => Promise<{ success: boolean; data?: any; error?: string }>
  getByPaymentStatus: (status: string) => Promise<{ success: boolean; data?: any; error?: string }>
  getByInvoiceStatus: (status: string) => Promise<{ success: boolean; data?: any; error?: string }>
  getByCourt: (courtId: number) => Promise<{ success: boolean; data?: any; error?: string }>
  getByVehicle: (vehicleId: number) => Promise<{ success: boolean; data?: any; error?: string }>
  getStatistics: () => Promise<{ success: boolean; data?: any; error?: string }>
}

export {}
