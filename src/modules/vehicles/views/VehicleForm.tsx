import React, { useState, useEffect } from 'react'
import { Vehicle, CreateVehicleRequest, UpdateVehicleRequest, VEHICLE_TYPES } from '../../../shared/types/Vehicle'
import { vehicleController, formatPlate, validatePlate } from '../controllers/VehicleController'
import SmartInput from '../../../shared/components/SmartInput'

interface VehicleFormProps {
  vehicle?: Vehicle | null // Düzenleme için mevcut araç
  onSubmit: (vehicle: Vehicle) => void
  onCancel: () => void
  isOpen: boolean
}

const VehicleForm: React.FC<VehicleFormProps> = ({
  vehicle,
  onSubmit,
  onCancel,
  isOpen
}) => {
  const [formData, setFormData] = useState({
    plate: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    type: 'Sedan'
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [plateSuggestions, setPlateSuggestions] = useState<any[]>([])

  // Form verilerini sıfırla
  const resetForm = () => {
    if (vehicle) {
      // Düzenleme modu
      setFormData({
        plate: vehicle.plate,
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year,
        type: vehicle.type
      })
    } else {
      // Yeni ekleme modu
      setFormData({
        plate: '',
        brand: '',
        model: '',
        year: new Date().getFullYear(),
        type: 'Sedan'
      })
    }
    setError(null)
  }

  // Modal açıldığında formu sıfırla
  useEffect(() => {
    if (isOpen) {
      resetForm()
      loadPlateSuggestions()
    }
  }, [isOpen, vehicle])

  // Plaka önerilerini yükle
  const loadPlateSuggestions = async () => {
    try {
      const allVehicles = await vehicleController.getVehicles()
      const suggestions = allVehicles
        .filter(v => vehicle ? v.id !== vehicle.id : true) // Düzenleme modunda mevcut aracı hariç tut
        .map(v => ({
          id: v.id,
          displayText: v.plate,
          subText: `${v.brand} ${v.model} (${v.year}) - ${v.type}`,
          data: v
        }))
      
      setPlateSuggestions(suggestions)
    } catch (err) {
      console.error('Error loading plate suggestions:', err)
    }
  }

  // Plaka değişikliği
  const handlePlateChange = (value: string) => {
    const formatted = formatPlate(value)
    setFormData({ ...formData, plate: formatted })
  }

  // Plaka önerisi seçimi
  const handlePlateSuggestionSelect = (suggestion: any) => {
    const selectedVehicle = suggestion.data as Vehicle
    alert(`Bu plaka zaten kayıtlı!\n${selectedVehicle.brand} ${selectedVehicle.model} (${selectedVehicle.year})`)
  }

  // Form gönderimi
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validatePlate(formData.plate)) {
      setError('Geçerli bir plaka giriniz (örn: 34 ABC 123)')
      return
    }

    if (!formData.brand.trim()) {
      setError('Marka alanı zorunludur')
      return
    }

    if (!formData.model.trim()) {
      setError('Model alanı zorunludur')
      return
    }

    if (formData.year < 1900 || formData.year > new Date().getFullYear() + 1) {
      setError('Geçerli bir yıl giriniz')
      return
    }

    try {
      setLoading(true)
      setError(null)

      let result: Vehicle

      if (vehicle) {
        // Güncelleme
        const updateData: UpdateVehicleRequest = {
          id: vehicle.id,
          ...formData
        }
        const updated = await vehicleController.updateVehicle(updateData)
        if (!updated) {
          throw new Error('Araç güncellenemedi')
        }
        result = updated
      } else {
        // Yeni ekleme
        const createData: CreateVehicleRequest = formData
        result = await vehicleController.createVehicle(createData)
      }

      onSubmit(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İşlem sırasında hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 backdrop-blur-sm overflow-y-auto h-full w-full z-[9999] flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onCancel()
        }
      }}
    >
      <div className="relative mx-auto p-6 border-0 w-full max-w-2xl shadow-2xl rounded-xl bg-white/95 backdrop-blur-md">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {vehicle ? 'Araç Düzenle' : 'Yeni Araç Ekle'}
          </h3>
          
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <SmartInput
                value={formData.plate}
                onChange={handlePlateChange}
                onSuggestionSelect={handlePlateSuggestionSelect}
                suggestions={plateSuggestions}
                label="Plaka"
                placeholder="34 ABC 12345"
                required
                similarityThreshold={80}
                warningText="⚠️ Bu plaka zaten kayıtlı:"
                successText="Dikkat: Aynı plakayı tekrar kaydetmeyiniz!"
                className={formData.plate && !validatePlate(formData.plate) ? 'border-red-300' : ''}
              />
              <div className="mt-1 text-xs text-gray-500">
                Otomatik format: Türkçe karakterler çevrilir (ş→S, ğ→G, ı/i→I, ö→O, ü→U, ç→C). Q, W, X kullanılmaz.
              </div>
              {formData.plate && !validatePlate(formData.plate) && (
                <div className="mt-1 text-xs text-red-600">
                  Geçerli format: 34 ABC 12345 (İl kodu 01-81 arası olmalı)
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Marka <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData({...formData, brand: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ford, Toyota, BMW..."
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Model <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => setFormData({...formData, model: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Focus, Corolla, 320i..."
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Yıl <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tip <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  {VEHICLE_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                disabled={loading}
              >
                İptal
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {vehicle ? 'Güncelleniyor...' : 'Ekleniyor...'}
                  </div>
                ) : (
                  vehicle ? 'Güncelle' : 'Ekle'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default VehicleForm
