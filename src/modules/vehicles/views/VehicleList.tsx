import React, { useState, useEffect } from 'react'
import { PencilIcon, TrashIcon, TruckIcon } from '@heroicons/react/24/outline'
import { Vehicle, VEHICLE_TYPES } from '../../../shared/types/Vehicle'
import { vehicleController } from '../controllers/VehicleController'
import DataTable from '../../../shared/components/DataTable'

interface VehicleListProps {
  onEdit: (vehicle: Vehicle) => void
  onDelete: (vehicle: Vehicle) => void
  searchTerm: string
  onSearchChange: (term: string) => void
  refreshTrigger: number // Yenileme tetikleyicisi
}

const VehicleList: React.FC<VehicleListProps> = ({
  onEdit,
  onDelete,
  searchTerm,
  onSearchChange,
  refreshTrigger
}) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pageSize, setPageSize] = useState(10)

  // Araçları yükle
  const loadVehicles = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await vehicleController.getVehicles()
      setVehicles(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Araçlar yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  // İlk yükleme ve yenileme tetikleyicisi
  useEffect(() => {
    loadVehicles()
  }, [refreshTrigger])

  // Arama ve filtreleme
  const filteredVehicles = vehicles.filter(vehicle => {
    if (!searchTerm) return true
    
    const term = searchTerm.toLowerCase()
    return (
      (vehicle.plate && vehicle.plate.toLowerCase().includes(term)) ||
      (vehicle.brand && vehicle.brand.toLowerCase().includes(term)) ||
      (vehicle.model && vehicle.model.toLowerCase().includes(term)) ||
      (vehicle.year && vehicle.year.toString().includes(term)) ||
      (vehicle.type && vehicle.type.toLowerCase().includes(term))
    )
  })

  // Tablo kolonları
  const columns = [
    {
      key: 'id',
      title: 'ID',
      sortable: true,
      width: 'w-16',
      render: (value: number) => (
        <div className="text-sm font-mono text-gray-600">
          #{value}
        </div>
      )
    },
    {
      key: 'plate',
      title: 'Plaka',
      sortable: true,
      width: 'w-32'
    },
    {
      key: 'brand',
      title: 'Marka',
      sortable: true,
      width: 'w-28'
    },
    {
      key: 'model',
      title: 'Model',
      sortable: true,
      width: 'w-32'
    },
    {
      key: 'year',
      title: 'Yıl',
      sortable: true,
      width: 'w-20'
    },
    {
      key: 'type',
      title: 'Tip',
      sortable: true,
      width: 'w-28'
    },
    {
      key: 'actions',
      title: 'İşlemler',
      width: 'w-24',
      render: (value: any, vehicle: Vehicle) => (
        <div className="flex space-x-2">
          <button
            onClick={() => onEdit(vehicle)}
            className="text-blue-600 hover:text-blue-800 transition-colors"
            title="Düzenle"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(vehicle)}
            className="text-red-600 hover:text-red-800 transition-colors"
            title="Sil"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ]

  // Tip filtreleme seçenekleri
  const filterOptions = [
    { value: 'all', label: 'Tüm Tipler' },
    ...VEHICLE_TYPES.map(type => ({ value: type, label: type }))
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Araçlar yükleniyor...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Hata</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <button
                onClick={loadVehicles}
                className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200 transition-colors"
              >
                Tekrar Dene
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <TruckIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Toplam Araç</p>
              <p className="text-2xl font-semibold text-gray-900">{vehicles.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 font-semibold text-sm">S</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Sedan</p>
              <p className="text-2xl font-semibold text-gray-900">
                {vehicles.filter(v => v.type === 'Sedan').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <span className="text-yellow-600 font-semibold text-sm">H</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Hatchback</p>
              <p className="text-2xl font-semibold text-gray-900">
                {vehicles.filter(v => v.type === 'Hatchback').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-red-600 font-semibold text-sm">K</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Kamyonet</p>
              <p className="text-2xl font-semibold text-gray-900">
                {vehicles.filter(v => v.type === 'Kamyonet').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Araç Listesi */}
      <DataTable
        data={filteredVehicles}
        columns={columns}
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
        searchPlaceholder="Plaka, marka, model ile ara..."
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        emptyMessage="Araç bulunamadı"
        emptyDescription="Henüz hiç araç kaydı yok veya arama kriterlerinize uygun araç bulunamadı."
        className="bg-white"
        enableExport={true}
        exportTitle="Araç Kayıtları Raporu"
        exportFilename="arac_kayitlari"
      />
    </div>
  )
}

export default VehicleList
