import React, { useState, useEffect } from 'react'
import { PencilIcon, TrashIcon, DocumentTextIcon, EyeIcon } from '@heroicons/react/24/outline'
import { Job } from '../../../shared/types/Job'
import { jobController } from '../controllers/JobController'
import DataTable from '../../../shared/components/DataTable'
import CustomDeleteModal from '../../../shared/components/CustomDeleteModal'
import { formatCurrency, JOB_STATUS_COLORS, JOB_STATUS_ICONS, JOB_STATUSES, PAYMENT_STATUSES, INVOICE_STATUSES } from '../../../shared/types/Job'
import JobForm from './JobForm'
import JobCompletionModal from '../../../shared/components/JobCompletionModal'

interface JobListProps {
  onEdit: (job: Job) => void
  onDelete: (job: Job) => void
  searchTerm: string
  onSearchChange: (term: string) => void
  refreshTrigger: number // Yenileme tetikleyicisi
  filteredJobs?: Job[] // Dışarıdan filtreli veri
  onRefresh?: () => void // Parent component'i yenileme fonksiyonu
}

const JobList: React.FC<JobListProps> = ({
  onEdit,
  onDelete,
  searchTerm,
  onSearchChange,
  refreshTrigger,
  filteredJobs,
  onRefresh
}) => {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pageSize, setPageSize] = useState(10)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingJob, setEditingJob] = useState<Job | null>(null)
  
  // Inline editing states
  const [editingField, setEditingField] = useState<{
    jobId: number
    field: 'status' | 'paymentStatus' | 'invoiceStatus'
  } | null>(null)
  const [editingValue, setEditingValue] = useState<string>('')
  const [isUpdating, setIsUpdating] = useState(false)
  
  // Fatura detayları için ek state'ler
  const [invoiceDetails, setInvoiceDetails] = useState<{
    jobId: number
    invoiceNumber: string
    invoiceDate: string
  } | null>(null)
  
  // Ödeme tarihi için state
  const [paymentDetails, setPaymentDetails] = useState<{
    jobId: number
    paymentDate: string
  } | null>(null)
  
  // Tamamlanma tarihi için state
  const [completionDetails, setCompletionDetails] = useState<{
    jobId: number
    completionDate: string
  } | null>(null)

  // İş tamamlama modal'ı için state
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  const [jobToComplete, setJobToComplete] = useState<Job | null>(null)
  
  // İş detay modal'ı için state
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)

  // İşleri yükle
  const loadJobs = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await jobController.getJobs()
      setJobs(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İşler yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  // İlk yükleme ve yenileme tetikleyicisi
  useEffect(() => {
    loadJobs()
  }, [refreshTrigger])

  // Arama ve filtreleme
  const jobsToFilter = filteredJobs || jobs
  const searchFilteredJobs = jobsToFilter.filter(job => {
    if (!searchTerm) return true
    
    const term = searchTerm.toLowerCase()
    return (
      job.receivedDate.toLowerCase().includes(term) ||
      job.scheduledDate.toLowerCase().includes(term) ||
      job.courtName.toLowerCase().includes(term) ||
      job.fileNumber.toLowerCase().includes(term) ||
      job.plate.toLowerCase().includes(term) ||
      job.paymentStatus.toLowerCase().includes(term) ||
      job.invoiceStatus.toLowerCase().includes(term) ||
      (job.notes && job.notes.toLowerCase().includes(term))
    )
  })

  // Silme işlemi
  const handleDeleteClick = (job: Job) => {
    setJobToDelete(job)
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (!jobToDelete) return

    try {
      await jobController.deleteJob(jobToDelete.id)
      // Silme başarılı, listeyi yenile
      await loadJobs()
      onRefresh?.() // Parent component'i yenile (filteredJobs & istatistikler için)
      setShowDeleteModal(false)
      setJobToDelete(null)
    } catch (err) {
      console.error('❌ Silme hatası:', err)
      setError(err instanceof Error ? err.message : 'İş silinirken hata oluştu')
      // Hata olsa bile listeyi yenile (belki başka bir yerden silindi)
      try {
        await loadJobs()
        onRefresh?.() // Hata durumunda da parent'ı yenile
      } catch (loadError) {
        console.error('❌ Liste yenileme hatası:', loadError)
      }
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteModal(false)
    setJobToDelete(null)
  }

  // Düzenleme işlemi
  const handleEditClick = (job: Job) => {
    setEditingJob(job)
    setShowEditModal(true)
  }

  // Inline editing başlat
  const startInlineEdit = (job: Job, field: 'status' | 'paymentStatus' | 'invoiceStatus') => {
    setEditingField({ jobId: job.id, field })
    setEditingValue(job[field])
  }

  // Inline editing iptal
  const cancelInlineEdit = () => {
    setEditingField(null)
    setEditingValue('')
  }

  // Inline editing kaydet
  const saveInlineEdit = async () => {
    if (!editingField) return

    try {
      setIsUpdating(true)
      const job = jobs.find(j => j.id === editingField.jobId)
      if (!job) return

      // Eğer fatura durumu "Kesildi" seçildiyse ve fatura detayları yoksa, fatura detayları iste
      if (editingField.field === 'invoiceStatus' && editingValue === 'Kesildi' && !job.invoiceNumber) {
        setInvoiceDetails({
          jobId: job.id,
          invoiceNumber: job.invoiceNumber || '',
          invoiceDate: job.invoiceDate || new Date().toLocaleDateString('tr-TR')
        })
        return // Fatura detayları girilene kadar bekle
      }

      // Eğer ödeme durumu "Ödendi" seçildiyse ve ödeme tarihi yoksa, ödeme tarihi iste
      if (editingField.field === 'paymentStatus' && editingValue === 'Ödendi' && !job.paymentDate) {
        setPaymentDetails({
          jobId: job.id,
          paymentDate: job.paymentDate || new Date().toLocaleDateString('tr-TR')
        })
        return // Ödeme tarihi girilene kadar bekle
      }

      // Eğer durum "Tamamlandı" seçildiyse, eksik bilgiler kontrolü yap
      if (editingField.field === 'status' && editingValue === 'Tamamlandı') {
        const missingInfo = !job.fileNumber || !job.vehicleId || !job.totalAmount
        
        if (missingInfo) {
          // Eksik bilgiler varsa completion modal'ı aç
          setJobToComplete(job)
          setShowCompletionModal(true)
          setEditingField(null) // Inline editing'i kapat
          return
        } else if (!job.completionDate) {
          // Sadece tamamlanma tarihi eksikse
          setCompletionDetails({
            jobId: job.id,
            completionDate: job.completionDate || new Date().toLocaleDateString('tr-TR')
          })
          return
        }
      }

      const updateData = {
        ...job,
        [editingField.field]: editingValue,
        statusDate: editingField.field === 'status' ? new Date().toLocaleDateString('tr-TR') : job.statusDate,
        updatedAt: new Date().toISOString()
      }

      await jobController.updateJob(updateData as any)
      await loadJobs() // Listeyi yenile
      
      setEditingField(null)
      setEditingValue('')
    } catch (err) {
      console.error('Güncelleme hatası:', err)
      setError(err instanceof Error ? err.message : 'Güncelleme sırasında hata oluştu')
    } finally {
      setIsUpdating(false)
    }
  }

  // Fatura detaylarını kaydet
  const saveInvoiceDetails = async () => {
    if (!invoiceDetails) return

    try {
      setIsUpdating(true)
      const job = jobs.find(j => j.id === invoiceDetails.jobId)
      if (!job) return

      const updateData = {
        ...job,
        invoiceStatus: 'Kesildi',
        invoiceNumber: invoiceDetails.invoiceNumber,
        invoiceDate: invoiceDetails.invoiceDate,
        statusDate: new Date().toLocaleDateString('tr-TR'),
        updatedAt: new Date().toISOString()
      }

      await jobController.updateJob(updateData as any)
      await loadJobs() // Local listeyi yenile
      onRefresh?.() // Parent component'i yenile (istatistikler için)
      
      setInvoiceDetails(null)
      setEditingField(null)
      setEditingValue('')
    } catch (err) {
      console.error('Fatura detayları kaydetme hatası:', err)
      setError(err instanceof Error ? err.message : 'Fatura detayları kaydedilirken hata oluştu')
    } finally {
      setIsUpdating(false)
    }
  }

  // Ödeme tarihini kaydet
  const savePaymentDetails = async () => {
    if (!paymentDetails) return

    try {
      setIsUpdating(true)
      const job = jobs.find(j => j.id === paymentDetails.jobId)
      if (!job) return

      const updateData = {
        ...job,
        paymentStatus: 'Ödendi',
        paymentDate: paymentDetails.paymentDate,
        statusDate: new Date().toLocaleDateString('tr-TR'),
        updatedAt: new Date().toISOString()
      }

      await jobController.updateJob(updateData as any)
      await loadJobs() // Local listeyi yenile
      onRefresh?.() // Parent component'i yenile (istatistikler için)
      
      setPaymentDetails(null)
      setEditingField(null)
      setEditingValue('')
    } catch (err) {
      console.error('Ödeme tarihi kaydetme hatası:', err)
      setError(err instanceof Error ? err.message : 'Ödeme tarihi kaydedilirken hata oluştu')
    } finally {
      setIsUpdating(false)
    }
  }

  // Tamamlanma tarihini kaydet
  const saveCompletionDetails = async () => {
    if (!completionDetails) return

    try {
      setIsUpdating(true)
      const job = jobs.find(j => j.id === completionDetails.jobId)
      if (!job) return

      const updateData = {
        ...job,
        status: 'Tamamlandı',
        completionDate: completionDetails.completionDate,
        statusDate: new Date().toLocaleDateString('tr-TR'),
        updatedAt: new Date().toISOString()
      }

      await jobController.updateJob(updateData as any)
      await loadJobs() // Local listeyi yenile
      onRefresh?.() // Parent component'i yenile (istatistikler için)
      
      setCompletionDetails(null)
      setEditingField(null)
      setEditingValue('')
    } catch (err) {
      console.error('Tamamlanma tarihi kaydetme hatası:', err)
      setError(err instanceof Error ? err.message : 'Tamamlanma tarihi kaydedilirken hata oluştu')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleEditSubmit = async (jobData: any) => {
    try {
      await loadJobs() // Local listeyi yenile
      onRefresh?.() // Parent component'i yenile (istatistikler için)
      setShowEditModal(false)
      setEditingJob(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İş güncellenirken hata oluştu')
    }
  }

  const handleEditCancel = () => {
    setShowEditModal(false)
    setEditingJob(null)
  }

  // İş tamamlama modal handler'ları
  const handleJobCompletion = async (updatedJob: any) => {
    try {
      await jobController.updateJob(updatedJob)
      setShowCompletionModal(false)
      setJobToComplete(null)
      loadJobs() // Local listeyi yenile
      onRefresh?.() // Parent component'i yenile (istatistikler için)
    } catch (error) {
      console.error('İş tamamlama hatası:', error)
    }
  }

  const handleCompletionCancel = () => {
    setShowCompletionModal(false)
    setJobToComplete(null)
  }
  
  // İş detay gösterme
  const handleViewClick = (job: Job) => {
    setSelectedJob(job)
    setShowDetailModal(true)
  }
  
  const handleDetailClose = () => {
    setShowDetailModal(false)
    setSelectedJob(null)
  }

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
      key: 'receivedDate',
      title: 'Geliş Tarihi',
      sortable: true,
      width: 'w-24',
      render: (value: string) => (
        <div className="text-sm text-gray-900">
          {value}
        </div>
      )
    },
    {
      key: 'scheduledDate',
      title: 'Yapılacak Tarih',
      sortable: true,
      width: 'w-24',
      render: (value: string) => (
        <div className="text-sm text-blue-600 font-medium">
          {value}
        </div>
      )
    },
    {
      key: 'courtName',
      title: 'Mahkeme',
      sortable: true,
      width: 'w-48',
      render: (value: string) => (
        <div className="text-sm text-gray-900 truncate" title={value}>
          {value}
        </div>
      )
    },
    {
      key: 'fileNumber',
      title: 'Dosya No',
      sortable: true,
      width: 'w-24',
      render: (value: string) => (
        <div className="text-sm font-medium text-gray-900">
          {value}
        </div>
      )
    },
    {
      key: 'plate',
      title: 'Plaka',
      sortable: true,
      width: 'w-24',
      render: (value: string) => (
        <div className="text-sm font-mono text-gray-900">
          {value}
        </div>
      )
    },
    {
      key: 'totalAmount',
      title: 'Tutar',
      sortable: true,
      width: 'w-28',
      render: (value: number) => (
        <div className="text-sm font-medium text-gray-900">
          {formatCurrency(value)}
        </div>
      )
    },
    {
      key: 'status',
      title: 'Durum',
      sortable: true,
      width: 'w-32',
      render: (value: string, job: Job) => {
        const isEditing = editingField?.jobId === job.id && editingField?.field === 'status'
        
        if (isEditing) {
          return (
            <div className="flex items-center space-x-2 bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-xl border border-blue-200 shadow-lg">
              <select
                value={editingValue}
                onChange={(e) => setEditingValue(e.target.value)}
                className="text-xs border-0 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 bg-white shadow-sm font-medium text-gray-700"
                disabled={isUpdating}
              >
                {JOB_STATUSES.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              <div className="flex space-x-1">
                <button
                  onClick={saveInlineEdit}
                  disabled={isUpdating}
                  className="inline-flex items-center justify-center w-8 h-8 text-white bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                  title="Kaydet"
                >
                  {isUpdating ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span className="text-sm font-bold">✓</span>
                  )}
                </button>
                <button
                  onClick={cancelInlineEdit}
                  disabled={isUpdating}
                  className="inline-flex items-center justify-center w-8 h-8 text-white bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                  title="İptal"
                >
                  <span className="text-sm font-bold">✕</span>
                </button>
              </div>
            </div>
          )
        }
        
        return (
          <div 
            className="flex items-center cursor-pointer hover:bg-blue-50 hover:shadow-sm rounded-lg px-2 py-1 transition-all duration-200 group"
            onClick={() => startInlineEdit(job, 'status')}
            title="Düzenlemek için tıklayın"
          >
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium transition-all duration-200 group-hover:shadow-md ${JOB_STATUS_COLORS[job.status as keyof typeof JOB_STATUS_COLORS]}`}>
              {job.status}
            </span>
          </div>
        )
      }
    },
    {
      key: 'paymentStatus',
      title: 'Ödeme',
      sortable: true,
      width: 'w-24',
      render: (value: string, job: Job) => {
        const isEditing = editingField?.jobId === job.id && editingField?.field === 'paymentStatus'
        
        if (isEditing) {
          return (
            <div className="flex items-center space-x-2 bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-xl border border-green-200 shadow-lg">
              <select
                value={editingValue}
                onChange={(e) => setEditingValue(e.target.value)}
                className="text-xs border-0 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-50 bg-white shadow-sm font-medium text-gray-700"
                disabled={isUpdating}
              >
                {PAYMENT_STATUSES.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              <div className="flex space-x-1">
                <button
                  onClick={saveInlineEdit}
                  disabled={isUpdating}
                  className="inline-flex items-center justify-center w-8 h-8 text-white bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                  title="Kaydet"
                >
                  {isUpdating ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span className="text-sm font-bold">✓</span>
                  )}
                </button>
                <button
                  onClick={cancelInlineEdit}
                  disabled={isUpdating}
                  className="inline-flex items-center justify-center w-8 h-8 text-white bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                  title="İptal"
                >
                  <span className="text-sm font-bold">✕</span>
                </button>
              </div>
            </div>
          )
        }
        
        return (
          <span 
            className={`px-2 py-1 text-xs font-medium rounded-full cursor-pointer hover:shadow-md transition-all duration-200 group ${
              value === 'Ödendi' 
                ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                : 'bg-red-100 text-red-800 hover:bg-red-200'
            }`}
            onClick={() => startInlineEdit(job, 'paymentStatus')}
            title="Düzenlemek için tıklayın"
          >
            {value}
          </span>
        )
      }
    },
    {
      key: 'invoiceStatus',
      title: 'Fatura',
      sortable: true,
      width: 'w-24',
      render: (value: string, job: Job) => {
        const isEditing = editingField?.jobId === job.id && editingField?.field === 'invoiceStatus'
        
        if (isEditing) {
          return (
            <div className="flex items-center space-x-2 bg-gradient-to-r from-orange-50 to-amber-50 p-3 rounded-xl border border-orange-200 shadow-lg">
              <select
                value={editingValue}
                onChange={(e) => setEditingValue(e.target.value)}
                className="text-xs border-0 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-opacity-50 bg-white shadow-sm font-medium text-gray-700"
                disabled={isUpdating}
              >
                {INVOICE_STATUSES.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              <div className="flex space-x-1">
                <button
                  onClick={saveInlineEdit}
                  disabled={isUpdating}
                  className="inline-flex items-center justify-center w-8 h-8 text-white bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                  title="Kaydet"
                >
                  {isUpdating ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span className="text-sm font-bold">✓</span>
                  )}
                </button>
                <button
                  onClick={cancelInlineEdit}
                  disabled={isUpdating}
                  className="inline-flex items-center justify-center w-8 h-8 text-white bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                  title="İptal"
                >
                  <span className="text-sm font-bold">✕</span>
                </button>
              </div>
            </div>
          )
        }
        
        return (
          <span 
            className={`px-2 py-1 text-xs font-medium rounded-full cursor-pointer hover:shadow-md transition-all duration-200 group ${
              value === 'Kesildi' 
                ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                : value === 'Beklemede'
                ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                : 'bg-red-100 text-red-800 hover:bg-red-200'
            }`}
            onClick={() => startInlineEdit(job, 'invoiceStatus')}
            title="Düzenlemek için tıklayın"
          >
            {value}
          </span>
        )
      }
    },
    {
      key: 'actions',
      title: 'İşlemler',
      width: 'w-32',
      render: (value: any, job: Job) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleViewClick(job)}
            className="text-gray-600 hover:text-gray-900"
            title="Görüntüle"
          >
            <EyeIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => handleEditClick(job)}
            className="text-blue-600 hover:text-blue-900"
            title="Düzenle"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => handleDeleteClick(job)}
            className="text-red-600 hover:text-red-900"
            title="Sil"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      )
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-red-800">{error}</div>
        <button
          onClick={loadJobs}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          Tekrar dene
        </button>
      </div>
    )
  }

  return (
    <>
      <DataTable
        data={searchFilteredJobs}
        columns={columns}
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        searchPlaceholder="Tarih, mahkeme, dosya no, plaka ara..."
        emptyMessage="İş kaydı bulunamadı"
        emptyDescription="Arama kriterlerinizi değiştirip tekrar deneyin."
        enableExport={true}
        exportTitle="İş Kayıtları Raporu"
        exportFilename="is_kayitlari"
      />

      {/* Silme Onay Modalı */}
      <CustomDeleteModal
        isOpen={showDeleteModal}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="İş Kaydını Sil"
        message={`"${jobToDelete?.fileNumber}" dosya numaralı iş kaydını silmek istediğinizden emin misiniz?`}
        confirmText="Sil"
        cancelText="İptal"
      />

      {/* Düzenleme Modalı */}
      <JobForm
        job={editingJob}
        onSubmit={handleEditSubmit}
        onCancel={handleEditCancel}
        isOpen={showEditModal}
      />

      {/* Fatura Detayları Modal */}
      {invoiceDetails && (
        <div className="fixed inset-0 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border-0 w-96 shadow-2xl rounded-xl bg-white/95 backdrop-blur-md">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Fatura Detayları
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Fatura durumu "Kesildi" olarak işaretlendi. Lütfen fatura bilgilerini giriniz.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fatura Numarası <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={invoiceDetails.invoiceNumber}
                    onChange={(e) => setInvoiceDetails({
                      ...invoiceDetails,
                      invoiceNumber: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Fatura numarasını giriniz"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fatura Tarihi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={invoiceDetails.invoiceDate.split('.').reverse().join('-')} // DD.MM.YYYY -> YYYY-MM-DD
                    onChange={(e) => {
                      const dateValue = e.target.value
                      if (dateValue) {
                        const [year, month, day] = dateValue.split('-')
                        const formattedDate = `${day}.${month}.${year}`
                        setInvoiceDetails({
                          ...invoiceDetails,
                          invoiceDate: formattedDate
                        })
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setInvoiceDetails(null)
                    setEditingField(null)
                    setEditingValue('')
                  }}
                  disabled={isUpdating}
                  className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  İptal
                </button>
                <button
                  type="button"
                  onClick={saveInvoiceDetails}
                  disabled={isUpdating || !invoiceDetails.invoiceNumber.trim()}
                  className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ödeme Tarihi Modal */}
      {paymentDetails && (
        <div className="fixed inset-0 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border-0 w-96 shadow-2xl rounded-xl bg-white/95 backdrop-blur-md">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Ödeme Tarihi
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Ödeme durumu "Ödendi" olarak işaretlendi. Lütfen ödeme tarihini giriniz.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ödeme Tarihi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={paymentDetails.paymentDate.split('.').reverse().join('-')} // DD.MM.YYYY -> YYYY-MM-DD
                    onChange={(e) => {
                      const dateValue = e.target.value
                      if (dateValue) {
                        const [year, month, day] = dateValue.split('-')
                        const formattedDate = `${day}.${month}.${year}`
                        setPaymentDetails({
                          ...paymentDetails,
                          paymentDate: formattedDate
                        })
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentDetails(null)
                    setEditingField(null)
                    setEditingValue('')
                  }}
                  disabled={isUpdating}
                  className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  İptal
                </button>
                <button
                  type="button"
                  onClick={savePaymentDetails}
                  disabled={isUpdating}
                  className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tamamlanma Tarihi Modal */}
      {completionDetails && (
        <div className="fixed inset-0 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border-0 w-96 shadow-2xl rounded-xl bg-white/95 backdrop-blur-md">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Tamamlanma Tarihi
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                İş durumu "Tamamlandı" olarak işaretlendi. Lütfen tamamlanma tarihini giriniz.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tamamlanma Tarihi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={completionDetails.completionDate.split('.').reverse().join('-')} // DD.MM.YYYY -> YYYY-MM-DD
                    onChange={(e) => {
                      const dateValue = e.target.value
                      if (dateValue) {
                        const [year, month, day] = dateValue.split('-')
                        const formattedDate = `${day}.${month}.${year}`
                        setCompletionDetails({
                          ...completionDetails,
                          completionDate: formattedDate
                        })
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setCompletionDetails(null)
                    setEditingField(null)
                    setEditingValue('')
                  }}
                  disabled={isUpdating}
                  className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  İptal
                </button>
                <button
                  type="button"
                  onClick={saveCompletionDetails}
                  disabled={isUpdating}
                  className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-purple-600 text-base font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* İş Tamamlama Modal'ı */}
      <JobCompletionModal
        isOpen={showCompletionModal}
        onClose={handleCompletionCancel}
        job={jobToComplete}
        onComplete={handleJobCompletion}
      />
      
      {/* İş Detay Modal'ı */}
      {showDetailModal && selectedJob && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold flex items-center">
                  <DocumentTextIcon className="h-6 w-6 mr-2" />
                  İş Detayları
                </h3>
                <button
                  onClick={handleDetailClose}
                  className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Genel Bilgiler */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Genel Bilgiler
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">İş No</label>
                    <div className="text-base text-gray-900 font-mono">#{selectedJob.id}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Dosya No</label>
                    <div className="text-base text-gray-900 font-semibold">{selectedJob.fileNumber}</div>
                  </div>
                </div>
              </div>

              {/* Tarihler */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Tarihler
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Geliş Tarihi</label>
                    <div className="text-base text-gray-900">{selectedJob.receivedDate}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Yapılacak Tarih</label>
                    <div className="text-base text-blue-600 font-semibold">{selectedJob.scheduledDate}</div>
                  </div>
                  {selectedJob.completionDate && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Tamamlanma Tarihi</label>
                      <div className="text-base text-green-600">{selectedJob.completionDate}</div>
                    </div>
                  )}
                  {selectedJob.paymentDate && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Ödeme Tarihi</label>
                      <div className="text-base text-green-600">{selectedJob.paymentDate}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Mahkeme ve Araç */}
              <div className="bg-purple-50 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Mahkeme ve Araç
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Mahkeme</label>
                    <div className="text-base text-gray-900">{selectedJob.courtName}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Araç Plakası</label>
                    <div className="text-base text-gray-900 font-mono bg-yellow-100 inline-block px-3 py-1 rounded">
                      {selectedJob.plate}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tutar Bilgileri */}
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Tutar Bilgileri
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Matrah (KDV Hariç)</span>
                    <span className="text-base text-gray-900">{formatCurrency(selectedJob.baseAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">KDV (%{selectedJob.vatRate})</span>
                    <span className="text-base text-gray-900">{formatCurrency(selectedJob.vatAmount)}</span>
                  </div>
                  <div className="border-t border-green-200 pt-2 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-base font-semibold text-gray-900">Toplam Tutar</span>
                      <span className="text-xl font-bold text-green-600">{formatCurrency(selectedJob.totalAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Durum Bilgileri */}
              <div className="bg-orange-50 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Durum Bilgileri
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">İş Durumu</label>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${JOB_STATUS_COLORS[selectedJob.status as keyof typeof JOB_STATUS_COLORS]}`}>
                      {selectedJob.status}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Ödeme Durumu</label>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      selectedJob.paymentStatus === 'Ödendi' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedJob.paymentStatus}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Fatura Durumu</label>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      selectedJob.invoiceStatus === 'Kesildi' 
                        ? 'bg-green-100 text-green-800' 
                        : selectedJob.invoiceStatus === 'Beklemede'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedJob.invoiceStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* Fatura Bilgileri */}
              {(selectedJob.invoiceNumber || selectedJob.invoiceDate) && (
                <div className="bg-indigo-50 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Fatura Bilgileri
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedJob.invoiceNumber && (
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Fatura Numarası</label>
                        <div className="text-base text-gray-900 font-mono">{selectedJob.invoiceNumber}</div>
                      </div>
                    )}
                    {selectedJob.invoiceDate && (
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Fatura Tarihi</label>
                        <div className="text-base text-gray-900">{selectedJob.invoiceDate}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notlar */}
              {selectedJob.notes && (
                <div className="bg-yellow-50 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                    Notlar
                  </h4>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedJob.notes}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 rounded-b-xl border-t">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    handleDetailClose()
                    handleEditClick(selectedJob)
                  }}
                  className="inline-flex items-center px-4 py-2 border border-blue-300 text-sm font-medium rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Düzenle
                </button>
                <button
                  onClick={handleDetailClose}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default JobList
