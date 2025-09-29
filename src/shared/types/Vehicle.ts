export interface Vehicle {
  id: number
  plate: string
  brand: string
  model: string
  year: number
  type: string
}

export interface CreateVehicleRequest {
  plate: string
  brand: string
  model: string
  year: number
  type: string
}

export interface UpdateVehicleRequest extends CreateVehicleRequest {
  id: number
}

export type VehicleType = 'Hususi' | 'Kamyonet' | 'Kamyon' | 'Minibüs' | 'Otobüs' | 'Taksi'

export const VEHICLE_TYPES: VehicleType[] = [
  'Hususi',           // Özel araç
  'Kamyonet',         // Küçük kamyon
  'Kamyon',           // Kamyon
  'Minibüs',          // Minibüs
  'Otobüs',           // Otobüs
  'Taksi'             // Taksi
]
