const { contextBridge, ipcRenderer } = require('electron')

// IPC channel isimleri
const IPC_CHANNELS = {
  // Araç işlemleri
  VEHICLE_GET_ALL: 'vehicle:getAll',
  VEHICLE_GET_BY_ID: 'vehicle:getById',
  VEHICLE_CREATE: 'vehicle:create',
  VEHICLE_UPDATE: 'vehicle:update',
  VEHICLE_DELETE: 'vehicle:delete',
  VEHICLE_SEARCH: 'vehicle:search',
  VEHICLE_GET_BY_TYPE: 'vehicle:getByType',
  VEHICLE_STATISTICS: 'vehicle:statistics',
  
  // Mahkeme işlemleri
  COURT_GET_ALL: 'court:getAll',
  COURT_GET_BY_ID: 'court:getById',
  COURT_CREATE: 'court:create',
  COURT_UPDATE: 'court:update',
  COURT_DELETE: 'court:delete',
  COURT_SEARCH: 'court:search',
  COURT_GET_BY_CITY: 'court:getByCity',
  COURT_GET_BY_TYPE: 'court:getByType',
  
  // İş işlemleri
  JOB_GET_ALL: 'job:getAll',
  JOB_GET_BY_ID: 'job:getById',
  JOB_CREATE: 'job:create',
  JOB_UPDATE: 'job:update',
  JOB_DELETE: 'job:delete',
  JOB_GET_BY_DATE_RANGE: 'job:getByDateRange',
  JOB_GET_BY_PAYMENT_STATUS: 'job:getByPaymentStatus',
  JOB_GET_BY_INVOICE_STATUS: 'job:getByInvoiceStatus',
  JOB_GET_BY_COURT: 'job:getByCourt',
  JOB_GET_BY_VEHICLE: 'job:getByVehicle',
  JOB_STATISTICS: 'job:statistics'
}

// Database API - Main process'teki SQLite3 ile iletişim
const databaseAPI = {
  // Vehicle operations
  vehicle: {
    getAll: () => ipcRenderer.invoke(IPC_CHANNELS.VEHICLE_GET_ALL),
    getById: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.VEHICLE_GET_BY_ID, id),
    create: (data: any) => ipcRenderer.invoke(IPC_CHANNELS.VEHICLE_CREATE, data),
    update: (data: any) => ipcRenderer.invoke(IPC_CHANNELS.VEHICLE_UPDATE, data),
    delete: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.VEHICLE_DELETE, id),
    search: (term: string) => ipcRenderer.invoke(IPC_CHANNELS.VEHICLE_SEARCH, term),
    getByType: (type: string) => ipcRenderer.invoke(IPC_CHANNELS.VEHICLE_GET_BY_TYPE, type),
    getStatistics: () => ipcRenderer.invoke(IPC_CHANNELS.VEHICLE_STATISTICS)
  },
  
  // Court operations
  court: {
    getAll: () => ipcRenderer.invoke(IPC_CHANNELS.COURT_GET_ALL),
    getById: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.COURT_GET_BY_ID, id),
    create: (data: any) => ipcRenderer.invoke(IPC_CHANNELS.COURT_CREATE, data),
    update: (data: any) => ipcRenderer.invoke(IPC_CHANNELS.COURT_UPDATE, data),
    delete: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.COURT_DELETE, id),
    search: (term: string) => ipcRenderer.invoke(IPC_CHANNELS.COURT_SEARCH, term),
    getByCity: (city: string) => ipcRenderer.invoke(IPC_CHANNELS.COURT_GET_BY_CITY, city),
    getByType: (type: string) => ipcRenderer.invoke(IPC_CHANNELS.COURT_GET_BY_TYPE, type)
  },
  
  // Job operations
  job: {
    getAll: () => ipcRenderer.invoke(IPC_CHANNELS.JOB_GET_ALL),
    getById: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.JOB_GET_BY_ID, id),
    create: (data: any) => ipcRenderer.invoke(IPC_CHANNELS.JOB_CREATE, data),
    update: (data: any) => ipcRenderer.invoke(IPC_CHANNELS.JOB_UPDATE, data),
    delete: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.JOB_DELETE, id),
    getByDateRange: (startDate: string, endDate: string) => ipcRenderer.invoke(IPC_CHANNELS.JOB_GET_BY_DATE_RANGE, startDate, endDate),
    getByPaymentStatus: (status: string) => ipcRenderer.invoke(IPC_CHANNELS.JOB_GET_BY_PAYMENT_STATUS, status),
    getByInvoiceStatus: (status: string) => ipcRenderer.invoke(IPC_CHANNELS.JOB_GET_BY_INVOICE_STATUS, status),
    getByCourt: (courtId: number) => ipcRenderer.invoke(IPC_CHANNELS.JOB_GET_BY_COURT, courtId),
    getByVehicle: (vehicleId: number) => ipcRenderer.invoke(IPC_CHANNELS.JOB_GET_BY_VEHICLE, vehicleId),
    getStatistics: () => ipcRenderer.invoke(IPC_CHANNELS.JOB_STATISTICS)
  }
}

// Renderer process'e güvenli API exposure
contextBridge.exposeInMainWorld('electronAPI', {
  database: databaseAPI,
  vehicle: databaseAPI.vehicle,
  court: databaseAPI.court,
  job: databaseAPI.job
})

console.log('✅ Preload script yüklendi - SQLite3 API hazır')
