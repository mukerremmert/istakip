import React, { useState, useEffect } from 'react'
import { 
  PlusIcon, 
  ClipboardDocumentListIcon, 
  CheckCircleIcon, 
  ClockIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  FunnelIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { Job, CreateJobRequest, UpdateJobRequest } from '../../../shared/types/Job'
import { jobController } from '../controllers/JobController'
import JobList from './JobList'
import JobForm from './JobForm'

const JobManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [showAddModal, setShowAddModal] = useState(false)
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<string | null>(null)

  // İşleri yükle
  const loadJobs = async () => {
    try {
      setLoading(true)
      const jobsData = await jobController.getJobs()
      setJobs(jobsData)
    } catch (error) {
      console.error('İşler yüklenirken hata:', error)
    } finally {
      setLoading(false)
    }
  }

  // İstatistikleri hesapla
  const totalJobs = jobs.length
  const completedJobs = jobs.filter(job => job.status === 'Tamamlandı').length
  const inProgressJobs = jobs.filter(job => job.status === 'Devam Ediyor').length
  const pendingJobs = jobs.filter(job => job.status === 'Beklemede').length
  const cancelledJobs = jobs.filter(job => job.status === 'İptal').length
  
  // Ödeme istatistikleri
  const paidJobs = jobs.filter(job => job.paymentStatus === 'Ödendi').length
  const unpaidJobs = jobs.filter(job => job.paymentStatus === 'Ödenmedi').length
  
  // Fatura istatistikleri
  const invoicedJobs = jobs.filter(job => job.invoiceStatus === 'Kesildi').length
  const notInvoicedJobs = jobs.filter(job => job.invoiceStatus === 'Kesilmedi').length
  const pendingInvoices = jobs.filter(job => job.invoiceStatus === 'Beklemede').length
  

  // İlk yükleme
  useEffect(() => {
    loadJobs()
  }, [refreshTrigger])

  // Yeni iş ekleme
  const handleAddClick = () => {
    setShowAddModal(true)
  }

  // İş ekleme/düzenleme tamamlandığında
  const handleJobSubmit = async (jobData: CreateJobRequest | UpdateJobRequest) => {
    try {
      if ('id' in jobData) {
        // Güncelleme
        await jobController.updateJob(jobData as UpdateJobRequest)
      } else {
        // Yeni ekleme
        await jobController.createJob(jobData as CreateJobRequest)
      }
      
      setShowAddModal(false)
      setRefreshTrigger(prev => prev + 1) // Listeyi yenile
      await loadJobs() // İstatistikleri yenile
    } catch (err) {
      console.error('Error submitting job:', err)
    }
  }

  // İş ekleme iptal
  const handleJobCancel = () => {
    setShowAddModal(false)
  }

  // Hızlı filtre seçimi (tek sefer)
  const selectFilter = (filterType: string) => {
    if (activeFilter === filterType) {
      setActiveFilter(null) // Aynı filtreye tıklanırsa kapat
    } else {
      setActiveFilter(filterType) // Yeni filtre seç
    }
  }

  // Tüm filtreleri temizle
  const clearAllFilters = () => {
    setActiveFilter(null)
  }

  // Filtrelenmiş işler (tek filtre)
  const getFilteredJobs = () => {
    if (!activeFilter) return jobs

    switch (activeFilter) {
      case 'unpaid':
        return jobs.filter(job => job.paymentStatus === 'Ödenmedi')
      case 'incomplete':
        return jobs.filter(job => job.status === 'Devam Ediyor' || job.status === 'Beklemede')
      case 'not-invoiced':
        return jobs.filter(job => job.invoiceStatus === 'Kesilmedi')
      case 'cancelled':
        return jobs.filter(job => job.status === 'İptal')
      default:
        return jobs
    }
  }

  // İş düzenleme
  const handleEdit = (job: Job) => {
    // JobList component'inde handleEditClick ile yönetiliyor
  }

  // İş silme
  const handleDelete = (job: Job) => {
    // JobList component'inde handleDeleteClick ile yönetiliyor
  }

  return (
    <div className="p-6 bg-gray-50 min-h-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">İş Kayıtları</h1>
          <p className="text-gray-600">İş kayıtlarını görüntüleyin ve yönetin</p>
        </div>
        
        <button
          onClick={handleAddClick}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Yeni İş Ekle
        </button>
      </div>

      {/* Dashboard'daki gibi küçük istatistik kartları */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {[
          {
            name: 'Toplam İş',
            value: totalJobs.toString(),
            icon: ClipboardDocumentListIcon,
            color: 'bg-blue-500',
            change: `${completedJobs} tamamlandı`
          },
          {
            name: 'Tamamlanan',
            value: completedJobs.toString(),
            icon: CheckCircleIcon,
            color: 'bg-green-500',
            change: `${totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 0}%`
          },
          {
            name: 'Devam Eden',
            value: inProgressJobs.toString(),
            icon: ClockIcon,
            color: 'bg-yellow-500',
            change: `${totalJobs > 0 ? Math.round((inProgressJobs / totalJobs) * 100) : 0}%`
          },
          {
            name: 'Bekleyen',
            value: pendingJobs.toString(),
            icon: ExclamationTriangleIcon,
            color: 'bg-red-500',
            change: `${totalJobs > 0 ? Math.round((pendingJobs / totalJobs) * 100) : 0}%`
          },
          {
            name: 'Ödenen',
            value: paidJobs.toString(),
            icon: CurrencyDollarIcon,
            color: 'bg-emerald-500',
            change: `${totalJobs > 0 ? Math.round((paidJobs / totalJobs) * 100) : 0}%`
          },
          {
            name: 'Fatura Kesilen',
            value: invoicedJobs.toString(),
            icon: DocumentTextIcon,
            color: 'bg-purple-500',
            change: `${totalJobs > 0 ? Math.round((invoicedJobs / totalJobs) * 100) : 0}%`
          }
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.name} className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div className="ml-2">
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-500">{stat.change}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Hızlı Filtreler */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <FunnelIcon className="h-5 w-5 text-gray-600 mr-2" />
            <h3 className="text-base font-semibold text-gray-800">Hızlı Filtreler</h3>
            {activeFilter && (
              <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                1 aktif filtre
              </span>
            )}
          </div>
          {activeFilter && (
            <button
              onClick={clearAllFilters}
              className="text-xs text-gray-500 hover:text-red-600 flex items-center"
            >
              <XMarkIcon className="h-4 w-4 mr-1" />
              Tümünü Temizle
            </button>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => selectFilter('unpaid')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeFilter === 'unpaid'
                ? 'bg-red-500 text-white shadow-md'
                : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
            }`}
          >
            💰 Ödenmeyenler ({unpaidJobs})
          </button>
          
          <button
            onClick={() => selectFilter('incomplete')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeFilter === 'incomplete'
                ? 'bg-yellow-500 text-white shadow-md'
                : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border border-yellow-200'
            }`}
          >
            ⏳ Aktif İşler ({inProgressJobs + pendingJobs})
          </button>
          
          <button
            onClick={() => selectFilter('not-invoiced')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeFilter === 'not-invoiced'
                ? 'bg-purple-500 text-white shadow-md'
                : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
            }`}
          >
            📄 Faturası Kesilmeyenler ({notInvoicedJobs})
          </button>
          
          <button
            onClick={() => selectFilter('cancelled')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeFilter === 'cancelled'
                ? 'bg-gray-500 text-white shadow-md'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            ❌ İptal Edilenler ({cancelledJobs})
          </button>
        </div>
        
        {/* Aktif Filtreler Göstergesi */}
        {activeFilter && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-600 mb-2">
              Gösterilen: {getFilteredJobs().length} / {jobs.length} iş
            </p>
          </div>
        )}
      </div>

      {/* İş Listesi */}
      <JobList
        onEdit={handleEdit}
        onDelete={handleDelete}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        refreshTrigger={refreshTrigger}
        filteredJobs={getFilteredJobs()}
      />

      {/* İş Ekleme Modalı */}
      <JobForm
        job={null}
        onSubmit={handleJobSubmit}
        onCancel={handleJobCancel}
        isOpen={showAddModal}
      />
    </div>
  )
}

export default JobManagement
