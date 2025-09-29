import React, { useState, useEffect } from 'react'
import { Job, CreateJobRequest, UpdateJobRequest, PAYMENT_STATUSES, INVOICE_STATUSES, JOB_STATUSES, formatDate } from '../../../shared/types/Job'
import { jobController } from '../controllers/JobController'
import { courtService } from '../../courts/models/CourtService'
import { vehicleService } from '../../vehicles/models/VehicleService'
import { Court } from '../../../shared/types/Court'
import { Vehicle } from '../../../shared/types/Vehicle'

interface JobFormProps {
  job?: Job | null // Düzenleme için mevcut iş
  onSubmit: (job: CreateJobRequest | UpdateJobRequest) => void
  onCancel: () => void
  isOpen: boolean
}

const JobForm: React.FC<JobFormProps> = ({
  job,
  onSubmit,
  onCancel,
  isOpen
}) => {
  const [formData, setFormData] = useState({
    receivedDate: formatDate(new Date()),
    scheduledDate: '',
    courtId: 0,
    fileNumber: '',
    vehicleId: 0,
    totalAmount: 0,
    baseAmount: 0,
    vatAmount: 0,
    vatRate: 20,
    paymentStatus: 'Ödenmedi',
    invoiceStatus: 'Kesilmedi',
    status: 'Beklemede',
    statusDate: formatDate(new Date()),
    statusNote: '',
    invoiceNumber: '',
    invoiceDate: '',
    paymentDate: '',
    completionDate: '',
    notes: ''
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [courts, setCourts] = useState<Court[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  
  // Dropdown states
  const [showCourtDropdown, setShowCourtDropdown] = useState(false)
  const [showVehicleDropdown, setShowVehicleDropdown] = useState(false)
  const [courtSearchTerm, setCourtSearchTerm] = useState('')
  const [vehicleSearchTerm, setVehicleSearchTerm] = useState('')

  // Form verilerini sıfırla
  const resetForm = () => {
    if (job) {
      // Düzenleme modu
      setFormData({
        receivedDate: job.receivedDate,
        scheduledDate: job.scheduledDate,
        courtId: job.courtId,
        fileNumber: job.fileNumber,
        vehicleId: job.vehicleId,
        totalAmount: job.totalAmount,
        baseAmount: job.baseAmount,
        vatAmount: job.vatAmount,
        vatRate: job.vatRate,
        paymentStatus: job.paymentStatus,
        invoiceStatus: job.invoiceStatus,
        status: job.status,
        statusDate: job.statusDate,
        statusNote: job.statusNote || '',
        invoiceNumber: job.invoiceNumber || '',
        invoiceDate: job.invoiceDate || '',
        paymentDate: job.paymentDate || '',
        completionDate: job.completionDate || '',
        notes: job.notes || ''
      })
    } else {
      // Yeni ekleme modu
      setFormData({
        receivedDate: formatDate(new Date()),
        scheduledDate: '', // Boş bırak, müşteri söyleyecek
        courtId: 0,
        fileNumber: '',
        vehicleId: 0, // 0 = seçilmemiş
        totalAmount: 0, // 0 = girilmemiş
        baseAmount: 0,
        vatAmount: 0,
        vatRate: 20,
        paymentStatus: 'Ödenmedi',
        invoiceStatus: 'Kesilmedi',
        status: 'Beklemede',
        statusDate: formatDate(new Date()),
        statusNote: '',
        invoiceNumber: '',
        invoiceDate: '',
        paymentDate: '',
        completionDate: '',
        notes: ''
      })
    }
    setError(null)
  }

  // Mahkeme ve araç verilerini yükle
  useEffect(() => {
    const loadData = async () => {
      try {
        const [courtsData, vehiclesData] = await Promise.all([
          courtService.getAllCourts(),
          vehicleService.getAllVehicles()
        ])
        console.log('JobForm loaded data:', { courts: courtsData.length, vehicles: vehiclesData.length })
        setCourts(courtsData)
        setVehicles(vehiclesData)
      } catch (err) {
        console.error('Error loading data:', err)
      }
    }
    loadData()
  }, [])

  // Form açıldığında sıfırla
  useEffect(() => {
    if (isOpen) {
      resetForm()
    }
  }, [isOpen, job])

  // KDV hesaplama fonksiyonu
  const calculateVAT = (totalAmount: number, vatRate: number = 20) => {
    const baseAmount = totalAmount / (1 + vatRate / 100)
    const vatAmount = totalAmount - baseAmount
    return {
      baseAmount: Math.round(baseAmount * 100) / 100,
      vatAmount: Math.round(vatAmount * 100) / 100
    }
  }

  // Toplam tutar değiştiğinde KDV hesapla
  useEffect(() => {
    if (formData.totalAmount > 0) {
      const { baseAmount, vatAmount } = calculateVAT(formData.totalAmount, formData.vatRate)
      setFormData(prev => ({
        ...prev,
        baseAmount,
        vatAmount,
        vatRate: prev.vatRate
      }))
    }
  }, [formData.totalAmount, formData.vatRate])
  
  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.dropdown-container')) {
        setShowCourtDropdown(false)
        setShowVehicleDropdown(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Tutar değiştiğinde KDV hesapla
  
  // Filtrelenmiş mahkemeler
  const filteredCourts = courts.filter(court =>
    court.name.toLowerCase().includes(courtSearchTerm.toLowerCase()) ||
    court.city.toLowerCase().includes(courtSearchTerm.toLowerCase())
  )
  
  // Filtrelenmiş araçlar
  const filteredVehicles = vehicles.filter(vehicle =>
    vehicle.plate.toLowerCase().includes(vehicleSearchTerm.toLowerCase()) ||
    vehicle.brand.toLowerCase().includes(vehicleSearchTerm.toLowerCase()) ||
    vehicle.model.toLowerCase().includes(vehicleSearchTerm.toLowerCase())
  )

  // Form gönderimi
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation errors listesini temizle
    const errors: string[] = []
    setValidationErrors([])
    setError(null)
    
    // Client-side validasyonlar
    if (!formData.receivedDate || !formData.receivedDate.trim()) {
      setError('İş geliş tarihi zorunludur')
      errors.push('receivedDate')
    }

    if (!formData.scheduledDate || !formData.scheduledDate.trim()) {
      setError('İş yapılacak tarihi zorunludur')
      errors.push('scheduledDate')
    }

    if (formData.courtId === 0) {
      setError('Mahkeme seçimi zorunludur')
      errors.push('courtId')
    }

    // Eğer durum "Tamamlandı" ise, eksik bilgiler zorunlu
    if (formData.status === 'Tamamlandı') {
      if (!formData.fileNumber || !formData.fileNumber.trim()) {
        setError('Tamamlanan iş için dosya numarası zorunludur')
        errors.push('fileNumber')
      }
      
      if (!formData.vehicleId || formData.vehicleId === 0) {
        setError('Tamamlanan iş için araç seçimi zorunludur')
        errors.push('vehicleId')
      }
      
      if (!formData.totalAmount || formData.totalAmount <= 0) {
        setError('Tamamlanan iş için tutar girişi zorunludur')
        errors.push('totalAmount')
      }
      
      if (!formData.completionDate || !formData.completionDate.trim()) {
        setError('Tamamlanma tarihi zorunludur')
        errors.push('completionDate')
      }
    }

    // Validation hatası varsa, hatalı alanları işaretle ve dur
    if (errors.length > 0) {
      setValidationErrors(errors)
      return
    }

    try {
      setLoading(true)
      setError(null)

      let dataToSubmit: CreateJobRequest | UpdateJobRequest

      if (job) {
        // Düzenleme modu
        dataToSubmit = {
          ...formData,
          id: job.id
        } as UpdateJobRequest
      } else {
        // Yeni ekleme modu
        dataToSubmit = formData as CreateJobRequest
      }

      console.log('JobForm submitting data:', dataToSubmit)
      onSubmit(dataToSubmit)
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu.')
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
      <div 
        className="w-full max-w-4xl shadow-2xl rounded-xl bg-white border border-gray-200 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {job ? 'İş Düzenle' : 'Yeni İş Ekle'}
          </h3>
          
          {!job && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800">
                <strong>📞 Müşteri Araması:</strong> Sadece tarih ve mahkeme bilgisi belli. 
                Dosya no, araç ve tutar bilgileri sonra eklenebilir.
              </p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4" style={{overflow: 'visible'}}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{overflow: 'visible'}}>
              {/* Tarih */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  İş Geliş Tarihi <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.receivedDate ? formData.receivedDate.split('.').reverse().join('-') : ''} // DD.MM.YYYY -> YYYY-MM-DD
                  onChange={(e) => {
                    const dateValue = e.target.value
                    if (dateValue) {
                      const [year, month, day] = dateValue.split('-')
                      const formattedDate = `${day}.${month}.${year}`
                      setFormData({...formData, receivedDate: formattedDate})
                      // Hata varsa temizle
                      if (validationErrors.includes('receivedDate')) {
                        setValidationErrors(prev => prev.filter(err => err !== 'receivedDate'))
                      }
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    validationErrors.includes('receivedDate')
                      ? 'border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'
                  }`}
                  required
                />
                <div className="mt-1 text-xs text-gray-500">
                  İşin müşteriden geldiği tarih
                </div>
              </div>

              {/* Yapılacak Tarih */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  İş Yapılacak Tarihi <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.scheduledDate ? formData.scheduledDate.split('.').reverse().join('-') : ''} // DD.MM.YYYY -> YYYY-MM-DD
                  onChange={(e) => {
                    const dateValue = e.target.value
                    if (dateValue) {
                      const [year, month, day] = dateValue.split('-')
                      setFormData({...formData, scheduledDate: `${day}.${month}.${year}`})
                      // Hata varsa temizle
                      if (validationErrors.includes('scheduledDate')) {
                        setValidationErrors(prev => prev.filter(err => err !== 'scheduledDate'))
                      }
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    validationErrors.includes('scheduledDate')
                      ? 'border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'
                  }`}
                  required
                />
                <div className="mt-1 text-xs text-gray-500">
                  İşin planlandığı yapılacak tarih
                </div>
              </div>

              {/* Mahkeme */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mahkeme <span className="text-red-500">*</span>
                </label>
                <div className="relative dropdown-container">
                  <input
                    type="text"
                    value={courts.find(c => c.id === formData.courtId)?.name || ''}
                    onChange={(e) => {
                      const value = e.target.value
                      setFormData({...formData, courtId: 0}) // Reset selection
                      setCourtSearchTerm(value)
                      // Hata varsa temizle
                      if (validationErrors.includes('courtId')) {
                        setValidationErrors(prev => prev.filter(err => err !== 'courtId'))
                      }
                    }}
                    onFocus={() => setShowCourtDropdown(true)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                      validationErrors.includes('courtId')
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50'
                        : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'
                    }`}
                    placeholder="Mahkeme adı yazın..."
                    required
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  
                  {/* Dropdown */}
                  {showCourtDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      <div className="p-2 border-b border-gray-200">
                        <input
                          type="text"
                          value={courtSearchTerm}
                          onChange={(e) => setCourtSearchTerm(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="Mahkeme ara..."
                          autoFocus
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {filteredCourts.length > 0 ? (
                          filteredCourts.map(court => (
                            <button
                              key={court.id}
                              type="button"
                              onClick={() => {
                                setFormData({...formData, courtId: court.id})
                                setShowCourtDropdown(false)
                                setCourtSearchTerm('')
                                // Hata varsa temizle
                                if (validationErrors.includes('courtId')) {
                                  setValidationErrors(prev => prev.filter(err => err !== 'courtId'))
                                }
                              }}
                              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                            >
                              <div className="font-medium text-gray-900">{court.name}</div>
                              <div className="text-sm text-gray-500">
                                {court.city} - {court.contact || 'İletişim bilgisi yok'}
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-gray-500 text-sm">
                            Mahkeme bulunamadı
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  Mahkeme adını yazarak arayın veya listeden seçin
                </div>
              </div>

              {/* Dosya Numarası */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dosya Numarası <span className="text-gray-400 text-xs">(İsteğe bağlı)</span>
                </label>
                <input
                  type="text"
                  value={formData.fileNumber}
                  onChange={(e) => {
                    setFormData({...formData, fileNumber: e.target.value})
                    // Hata varsa temizle
                    if (validationErrors.includes('fileNumber')) {
                      setValidationErrors(prev => prev.filter(err => err !== 'fileNumber'))
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    validationErrors.includes('fileNumber')
                      ? 'border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'
                  }`}
                  placeholder="Mahkeme dosya no yazın"
                />
              </div>

              {/* Araç */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Araç <span className="text-gray-400 text-xs">(İsteğe bağlı)</span>
                </label>
                <div className="relative dropdown-container">
                  <input
                    type="text"
                    value={vehicles.find(v => v.id === formData.vehicleId) ? 
                      `${vehicles.find(v => v.id === formData.vehicleId)?.plate} - ${vehicles.find(v => v.id === formData.vehicleId)?.brand} ${vehicles.find(v => v.id === formData.vehicleId)?.model}` : ''}
                    onChange={(e) => {
                      const value = e.target.value
                      setFormData({...formData, vehicleId: 0}) // Reset selection
                      setVehicleSearchTerm(value)
                      // Hata varsa temizle
                      if (validationErrors.includes('vehicleId')) {
                        setValidationErrors(prev => prev.filter(err => err !== 'vehicleId'))
                      }
                    }}
                    onFocus={() => setShowVehicleDropdown(true)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                      validationErrors.includes('vehicleId')
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50'
                        : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'
                    }`}
                    placeholder="Sonra seçilebilir..."
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  
                  {/* Dropdown */}
                  {showVehicleDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      <div className="p-2 border-b border-gray-200">
                        <input
                          type="text"
                          value={vehicleSearchTerm}
                          onChange={(e) => setVehicleSearchTerm(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="Araç ara..."
                          autoFocus
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {filteredVehicles.length > 0 ? (
                          filteredVehicles.map(vehicle => (
                            <button
                              key={vehicle.id}
                              type="button"
                              onClick={() => {
                                setFormData({...formData, vehicleId: vehicle.id})
                                setShowVehicleDropdown(false)
                                setVehicleSearchTerm('')
                                // Hata varsa temizle
                                if (validationErrors.includes('vehicleId')) {
                                  setValidationErrors(prev => prev.filter(err => err !== 'vehicleId'))
                                }
                              }}
                              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                            >
                              <div className="font-medium text-gray-900">
                                {vehicle.plate} - {vehicle.brand} {vehicle.model}
                              </div>
                              <div className="text-sm text-gray-500">
                                {vehicle.type} ({vehicle.year})
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-gray-500 text-sm">
                            Araç bulunamadı
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  Plaka, marka veya model yazarak arayın veya listeden seçin
                </div>
              </div>

              {/* Tutar */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tutar (KDV Dahil) <span className="text-gray-400 text-xs">(İsteğe bağlı)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.totalAmount || ''}
                  onChange={(e) => {
                    setFormData({...formData, totalAmount: parseFloat(e.target.value) || 0})
                    // Hata varsa temizle
                    if (validationErrors.includes('totalAmount')) {
                      setValidationErrors(prev => prev.filter(err => err !== 'totalAmount'))
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    validationErrors.includes('totalAmount')
                      ? 'border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'
                  }`}
                  placeholder="Sonra eklenebilir"
                />
              </div>

              {/* Ödeme Durumu */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ödeme Durumu
                </label>
                <select
                  value={formData.paymentStatus}
                  onChange={(e) => setFormData({...formData, paymentStatus: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {PAYMENT_STATUSES.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              {/* Fatura Durumu */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fatura Durumu
                </label>
                <select
                  value={formData.invoiceStatus}
                  onChange={(e) => setFormData({...formData, invoiceStatus: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {INVOICE_STATUSES.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              {/* İş Durumu */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  İş Durumu
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => {
                    const newStatus = e.target.value as any
                    setFormData({
                      ...formData, 
                      status: newStatus,
                      statusDate: formatDate(new Date()) // Durum değiştiğinde tarihi güncelle
                    })
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {JOB_STATUSES.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              {/* Durum Değişikliği Tarihi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Durum Değişikliği Tarihi
                </label>
                <input
                  type="date"
                  value={formData.statusDate.split('.').reverse().join('-')} // DD.MM.YYYY -> YYYY-MM-DD
                  onChange={(e) => {
                    const dateValue = e.target.value
                    if (dateValue) {
                      const [year, month, day] = dateValue.split('-')
                      const formattedDate = `${day}.${month}.${year}`
                      setFormData({...formData, statusDate: formattedDate})
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Durum Notu */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Durum Notu
                </label>
                <textarea
                  value={formData.statusNote}
                  onChange={(e) => setFormData({...formData, statusNote: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Durum değişikliği hakkında not..."
                  rows={2}
                />
              </div>

              {/* Fatura Bilgileri - Sadece Kesildi durumunda göster */}
              {formData.invoiceStatus === 'Kesildi' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fatura Numarası
                    </label>
                    <input
                      type="text"
                      value={formData.invoiceNumber}
                      onChange={(e) => setFormData({...formData, invoiceNumber: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Fatura numarasını giriniz"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fatura Tarihi
                    </label>
                    <input
                      type="date"
                      value={formData.invoiceDate.split('.').reverse().join('-')} // DD.MM.YYYY -> YYYY-MM-DD
                      onChange={(e) => {
                        const dateValue = e.target.value
                        if (dateValue) {
                          const [year, month, day] = dateValue.split('-')
                          const formattedDate = `${day}.${month}.${year}`
                          setFormData({...formData, invoiceDate: formattedDate})
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </>
              )}

              {/* Ödeme Tarihi - Sadece Ödendi durumunda göster */}
              {formData.paymentStatus === 'Ödendi' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ödeme Tarihi
                  </label>
                  <input
                    type="date"
                    value={formData.paymentDate.split('.').reverse().join('-')} // DD.MM.YYYY -> YYYY-MM-DD
                    onChange={(e) => {
                      const dateValue = e.target.value
                      if (dateValue) {
                        const [year, month, day] = dateValue.split('-')
                        const formattedDate = `${day}.${month}.${year}`
                        setFormData({...formData, paymentDate: formattedDate})
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}

              {/* Tamamlanma Tarihi - Sadece Tamamlandı durumunda göster */}
              {formData.status === 'Tamamlandı' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tamamlanma Tarihi
                  </label>
                  <input
                    type="date"
                    value={formData.completionDate.split('.').reverse().join('-')} // DD.MM.YYYY -> YYYY-MM-DD
                    onChange={(e) => {
                      const dateValue = e.target.value
                      if (dateValue) {
                        const [year, month, day] = dateValue.split('-')
                        const formattedDate = `${day}.${month}.${year}`
                        setFormData({...formData, completionDate: formattedDate})
                        // Hata varsa temizle
                        if (validationErrors.includes('completionDate')) {
                          setValidationErrors(prev => prev.filter(err => err !== 'completionDate'))
                        }
                      }
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                      validationErrors.includes('completionDate')
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50'
                        : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'
                    }`}
                  />
                </div>
              )}
            </div>

            {/* KDV Hesaplama Gösterimi */}
            {formData.totalAmount > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Tutar Detayları</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700">KDV Hariç Tutar:</span>
                    <div className="font-medium text-blue-900">
                      {formData.baseAmount.toLocaleString('tr-TR', { 
                        style: 'currency', 
                        currency: 'TRY' 
                      })}
                    </div>
                  </div>
                  <div>
                    <span className="text-blue-700">KDV Tutarı (%{formData.vatRate}):</span>
                    <div className="font-medium text-blue-900">
                      {formData.vatAmount.toLocaleString('tr-TR', { 
                        style: 'currency', 
                        currency: 'TRY' 
                      })}
                    </div>
                  </div>
                  <div>
                    <span className="text-blue-700">KDV Dahil Toplam:</span>
                    <div className="font-medium text-blue-900">
                      {formData.totalAmount.toLocaleString('tr-TR', { 
                        style: 'currency', 
                        currency: 'TRY' 
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notlar */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notlar
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ek bilgiler..."
                rows={3}
              />
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
              >
                {loading ? 'Kaydediliyor...' : (job ? 'Güncelle' : 'Ekle')}
              </button>
            </div>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </form>
        </div>
      </div>
    </div>
  )
}

export default JobForm
