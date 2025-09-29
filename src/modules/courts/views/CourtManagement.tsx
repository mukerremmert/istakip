import React, { useState } from 'react'
import { PlusIcon } from '@heroicons/react/24/outline'
import { Court } from '../../../shared/types/Court'
import { courtController } from '../controllers/CourtController'
import CourtList from './CourtList'
import CourtForm from './CourtForm'

// Silme onay modalı
interface DeleteConfirmModalProps {
  court: Court | null
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  court,
  isOpen,
  onConfirm,
  onCancel,
  loading
}) => {
  if (!isOpen || !court) return null

  return (
    <div className="fixed inset-0 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-6 border-0 w-full max-w-md shadow-2xl rounded-xl bg-white/95 backdrop-blur-md">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Mahkemeyi Sil
          </h3>
          
          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-2">
              Bu mahkemeyi silmek istediğinizden emin misiniz?
            </p>
            <div className="bg-gray-50 rounded-lg p-3 text-left">
              <p className="text-sm font-medium text-gray-900">{court.name}</p>
              <p className="text-sm text-gray-600">{court.city} / {court.district}</p>
              <p className="text-xs text-gray-500">{court.type}</p>
            </div>
            <p className="text-xs text-red-600 mt-2">
              Bu işlem geri alınamaz!
            </p>
          </div>
          
          <div className="flex justify-center space-x-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
              disabled={loading}
            >
              İptal
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Siliniyor...
                </div>
              ) : (
                'Sil'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const CourtManagement: React.FC = () => {
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingCourt, setEditingCourt] = useState<Court | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [courtToDelete, setCourtToDelete] = useState<Court | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Yeni mahkeme ekleme modalını aç
  const handleAddClick = () => {
    setEditingCourt(null)
    setShowAddModal(true)
  }

  // Düzenleme modalını aç
  const handleEdit = (court: Court) => {
    setEditingCourt(court)
    setShowAddModal(true)
  }

  // Silme onayı modalını aç
  const handleDeleteClick = (court: Court) => {
    setCourtToDelete(court)
    setShowDeleteModal(true)
  }

  // Silme işlemini onayla
  const handleDeleteConfirm = async () => {
    if (!courtToDelete) return

    try {
      setDeleteLoading(true)
      const success = await courtController.deleteCourt(courtToDelete.id)
      
      if (success) {
        setShowDeleteModal(false)
        setCourtToDelete(null)
        setRefreshTrigger(prev => prev + 1) // Listeyi yenile
      } else {
        alert('Mahkeme silinemedi!')
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Mahkeme silinirken hata oluştu')
    } finally {
      setDeleteLoading(false)
    }
  }

  // Silme işlemini iptal et
  const handleDeleteCancel = () => {
    setShowDeleteModal(false)
    setCourtToDelete(null)
  }

  // Form gönderimi başarılı
  const handleFormSubmit = (court: Court) => {
    setShowAddModal(false)
    setEditingCourt(null)
    setRefreshTrigger(prev => prev + 1) // Listeyi yenile
  }

  // Form iptal
  const handleFormCancel = () => {
    setShowAddModal(false)
    setEditingCourt(null)
  }

  return (
    <div className="p-6 bg-gray-50 min-h-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mahkeme Yönetimi</h1>
          <p className="text-gray-600">Mahkeme kayıtlarını görüntüleyin ve yönetin</p>
        </div>
        
        <button
          onClick={handleAddClick}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Yeni Mahkeme Ekle
        </button>
      </div>

      {/* Court List */}
      <CourtList
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        refreshTrigger={refreshTrigger}
      />

      {/* Court Form Modal */}
      <CourtForm
        court={editingCourt}
        onSubmit={handleFormSubmit}
        onCancel={handleFormCancel}
        isOpen={showAddModal}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        court={courtToDelete}
        isOpen={showDeleteModal}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        loading={deleteLoading}
      />
    </div>
  )
}

export default CourtManagement
