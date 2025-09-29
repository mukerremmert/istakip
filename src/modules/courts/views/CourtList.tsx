import React, { useState, useEffect } from 'react'
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { Court } from '../../../shared/types/Court'
import { courtController } from '../controllers/CourtController'
import DataTable from '../../../shared/components/DataTable'

interface CourtListProps {
  onEdit: (court: Court) => void
  onDelete: (court: Court) => void
  searchTerm: string
  onSearchChange: (term: string) => void
  refreshTrigger: number // Yenileme tetikleyicisi
}

const CourtList: React.FC<CourtListProps> = ({
  onEdit,
  onDelete,
  searchTerm,
  onSearchChange,
  refreshTrigger
}) => {
  const [courts, setCourts] = useState<Court[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pageSize, setPageSize] = useState(10)

  // Mahkemeleri yükle
  const loadCourts = async () => {
    try {
      setLoading(true)
      setError(null)
      const courtsData = await courtController.getCourts()
      setCourts(courtsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Mahkemeler yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  // İlk yükleme ve yenileme tetikleyicisi
  useEffect(() => {
    loadCourts()
  }, [refreshTrigger])

  // Arama ve filtreleme
  const filteredCourts = courts.filter(court => {
    if (!searchTerm) return true
    
    const term = searchTerm.toLowerCase()
    return (
      court.name.toLowerCase().includes(term) ||
      court.city.toLowerCase().includes(term) ||
      (court.district && court.district.toLowerCase().includes(term)) ||
      (court.type && court.type.toLowerCase().includes(term)) ||
      (court.address && court.address.toLowerCase().includes(term)) ||
      (court.phone && court.phone.includes(term)) ||
      (court.email && court.email.toLowerCase().includes(term)) ||
      (court.contact && court.contact.toLowerCase().includes(term)) ||
      (court.notes && court.notes.toLowerCase().includes(term))
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
      key: 'name',
      title: 'Mahkeme Adı',
      sortable: true,
      width: 'w-64',
      render: (value: string) => (
        <div className="font-medium text-gray-900 truncate" title={value}>
          {value}
        </div>
      )
    },
    {
      key: 'city',
      title: 'Şehir',
      sortable: true,
      width: 'w-24'
    },
    {
      key: 'contact',
      title: 'İlgili Kişi',
      width: 'w-32',
      render: (value: string) => value || '-'
    },
    {
      key: 'phone',
      title: 'Telefon',
      width: 'w-32',
      render: (value: string) => value || '-'
    },
    {
      key: 'email',
      title: 'E-posta',
      width: 'w-40',
      render: (value: string) => value || '-'
    },
    {
      key: 'actions',
      title: 'İşlemler',
      width: 'w-24',
      render: (value: any, court: Court) => (
        <div className="flex space-x-2">
          <button
            onClick={() => onEdit(court)}
            className="text-blue-600 hover:text-blue-800 transition-colors"
            title="Düzenle"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(court)}
            className="text-red-600 hover:text-red-800 transition-colors"
            title="Sil"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Mahkemeler yükleniyor...</span>
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
                onClick={loadCourts}
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
      {/* Mahkeme Listesi */}
      <DataTable
        data={filteredCourts}
        columns={columns}
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
        searchPlaceholder="Mahkeme adı, şehir, tip ile ara..."
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        emptyMessage="Mahkeme bulunamadı"
        emptyDescription="Henüz hiç mahkeme kaydı yok veya arama kriterlerinize uygun mahkeme bulunamadı."
        className="bg-white"
        enableExport={true}
        exportTitle="Mahkeme Kayıtları Raporu"
        exportFilename="mahkeme_kayitlari"
      />
    </div>
  )
}

export default CourtList
