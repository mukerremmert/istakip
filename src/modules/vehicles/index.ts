// Vehicle Module Exports
export { default as VehicleList } from './views/VehicleList'
export { default as VehicleForm } from './views/VehicleForm'
export { vehicleController, formatPlate, validatePlate } from './controllers/VehicleController'
export { vehicleService } from './models/VehicleService'
export type { Vehicle, CreateVehicleRequest, UpdateVehicleRequest, VehicleType } from '../../shared/types/Vehicle'
export { VEHICLE_TYPES } from '../../shared/types/Vehicle'
