import React, { useState, useEffect } from 'react'
import {
  XMarkIcon,
  CheckCircleIcon,
  TruckIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'
import { Job, UpdateJobRequest } from '../types/Job'
import { Vehicle } from '../types/Vehicle'
import { vehicleService } from '../../modules/vehicles/models/VehicleService'

interface JobCompletionModalProps {
  isOpen: boolean
  onClose: () => void
  job: Job | null
  onComplete: (updatedJob: UpdateJobRequest) => void
}

const JobCompletionModal: React.FC<JobCompletionModalProps> = ({
  isOpen,
  onClose,
  job,
  onComplete
}) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [formData, setFormData] = useState({
    fileNumber: '',
    vehicleId: 0,
    totalAmount: 0,
    completionDate: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Modal açıldığında verileri hazırla
  useEffect(() => {
    if (isOpen && job) {
      // Mevcut iş verilerini yükle
      setFormData({
        fileNumber: job.fileNumber || '',
        vehicleId: job.vehicleId || 0,
        totalAmount: job.totalAmount || 0,
        completionDate: formatDate(new Date()) // Bugün default
      })
      
      // Araçları yükle
      loadVehicles()
    }
  }, [isOpen, job])

  // Araçları yükle
  const loadVehicles = async () => {
    try {
      const vehiclesData = await vehicleService.getAllVehicles()
      setVehicles(vehiclesData)
    } catch (err) {
      console.error('Araçlar yüklenirken hata:', err)
    }
  }

  // Tarih formatla (DD.MM.YYYY)
  const formatDate = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    return `${day}.${month}.${year}`
  }

  // Form gönder
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!formData.fileNumber.trim()) {
      setError('Dosya numarası zorunludur')
      return
    }

    if (formData.vehicleId === 0) {
      setError('Araç seçimi zorunludur')
      return
    }

    if (formData.totalAmount <= 0) {
      setError('Tutar 0\'dan büyük olmalıdır')
      return
    }

    if (!formData.completionDate) {
      setError('Tamamlanma tarihi zorunludur')
      return
    }

    if (!job) return

    try {
      setLoading(true)

      // KDV hesapla
      const baseAmount = formData.totalAmount / 1.2
      const vatAmount = formData.totalAmount - baseAmount

      const updatedJob: UpdateJobRequest = {
        id: job.id,
        receivedDate: job.receivedDate,
        scheduledDate: job.scheduledDate,
        courtId: job.courtId,
        fileNumber: formData.fileNumber,
        vehicleId: formData.vehicleId,
        totalAmount: formData.totalAmount,
        baseAmount: Math.round(baseAmount * 100) / 100,
        vatAmount: Math.round(vatAmount * 100) / 100,
        vatRate: 20,
        paymentStatus: job.paymentStatus,
        invoiceStatus: job.invoiceStatus,
        status: 'Tamamlandı',
        statusDate: formatDate(new Date()),
        statusNote: 'İş tamamlandı - eksik bilgiler eklendi',
        completionDate: formData.completionDate,
        invoiceNumber: job.invoiceNumber,
        invoiceDate: job.invoiceDate,
        paymentDate: job.paymentDate,
        notes: job.notes
      }

      onComplete(updatedJob)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !job) return null

  return (
    <div className="fixed inset-0 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-6 border-0 w-full max-w-2xl shadow-2xl rounded-xl bg-white/95 backdrop-blur-md">
        <div className="mt-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="bg-green-100 p-2 rounded-lg mr-3">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">İş Tamamlandı</h3>
                <p className="text-sm text-gray-600">Eksik bilgileri tamamlayın</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* İş Bilgisi */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-gray-900 mb-2">İş Detayları</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Mahkeme:</span>
                <p className="font-medium">{job.courtName}</p>
              </div>
              <div>
                <span className="text-gray-600">Yapılacak Tarih:</span>
                <p className="font-medium">{job.scheduledDate}</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Dosya Numarası */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DocumentTextIcon className="h-4 w-4 inline mr-1" />
                Dosya Numarası <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.fileNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, fileNumber: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Mahkeme dosya no yazın"
                required
              />
            </div>

            {/* Araç Seçimi */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <TruckIcon className="h-4 w-4 inline mr-1" />
                Kullanılan Araç <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.vehicleId}
                onChange={(e) => setFormData(prev => ({ ...prev, vehicleId: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value={0}>Araç seçin...</option>
                {vehicles.map(vehicle => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.plate} - {vehicle.brand} {vehicle.model} ({vehicle.type})
                  </option>
                ))}
              </select>
            </div>

            {/* Tutar */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CurrencyDollarIcon className="h-4 w-4 inline mr-1" />
                İş Ücreti (KDV Dahil) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.totalAmount}
                onChange={(e) => setFormData(prev => ({ ...prev, totalAmount: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="1200.00"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                KDV otomatik hesaplanacak (%20)
              </p>
            </div>

            {/* Tamamlanma Tarihi */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CalendarIcon className="h-4 w-4 inline mr-1" />
                Tamamlanma Tarihi <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.completionDate ? formData.completionDate.split('.').reverse().join('-') : ''}
                onChange={(e) => {
                  const dateValue = e.target.value
                  if (dateValue) {
                    const [year, month, day] = dateValue.split('-')
                    setFormData(prev => ({ ...prev, completionDate: `${day}.${month}.${year}` }))
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                disabled={loading}
              >
                İptal
              </button>
              <button
                type="submit"
                className="px-6 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Tamamlanıyor...
                  </div>
                ) : (
                  'İş Tamamlandı Olarak İşaretle'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default JobCompletionModal


