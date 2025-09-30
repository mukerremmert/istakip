import React from 'react'
import { 
  ArrowDownTrayIcon, 
  CheckCircleIcon, 
  XMarkIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'

interface UpdateNotificationProps {
  status: 'checking' | 'available' | 'downloading' | 'downloaded' | 'not-available' | 'error' | null
  version?: string
  progress?: number
  onDownload?: () => void
  onInstall?: () => void
  onDismiss?: () => void
}

const UpdateNotification: React.FC<UpdateNotificationProps> = ({
  status,
  version,
  progress = 0,
  onDownload,
  onInstall,
  onDismiss
}) => {
  if (!status || status === 'not-available') return null

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-6 w-96 max-w-[calc(100vw-3rem)]">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {status === 'checking' && (
              <ArrowPathIcon className="w-6 h-6 text-blue-500 animate-spin" />
            )}
            {status === 'available' && (
              <ArrowDownTrayIcon className="w-6 h-6 text-blue-500" />
            )}
            {status === 'downloading' && (
              <ArrowDownTrayIcon className="w-6 h-6 text-blue-500 animate-pulse" />
            )}
            {status === 'downloaded' && (
              <CheckCircleIcon className="w-6 h-6 text-green-500" />
            )}
            {status === 'error' && (
              <XMarkIcon className="w-6 h-6 text-red-500" />
            )}
            
            <div>
              <h3 className="font-semibold text-gray-900">
                {status === 'checking' && 'Güncelleme Kontrol Ediliyor'}
                {status === 'available' && 'Yeni Güncelleme Mevcut!'}
                {status === 'downloading' && 'Güncelleme İndiriliyor'}
                {status === 'downloaded' && 'Güncelleme Hazır!'}
                {status === 'error' && 'Güncelleme Hatası'}
              </h3>
              {version && status !== 'checking' && (
                <p className="text-sm text-gray-600 mt-0.5">
                  Versiyon: <span className="font-medium text-blue-600">v{version}</span>
                </p>
              )}
            </div>
          </div>
          
          {onDismiss && status !== 'downloading' && (
            <button
              onClick={onDismiss}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="space-y-3">
          {status === 'checking' && (
            <p className="text-sm text-gray-600">
              Yeni güncellemeler aranıyor...
            </p>
          )}

          {status === 'available' && (
            <p className="text-sm text-gray-600">
              Yeni bir versiyon yayınlandı. Güncellemek ister misiniz?
            </p>
          )}

          {status === 'downloading' && (
            <>
              <p className="text-sm text-gray-600 mb-2">
                Güncelleme indiriliyor, lütfen bekleyin...
              </p>
              
              {/* Progress Bar */}
              <div className="relative">
                <div className="overflow-hidden h-2 text-xs flex rounded-full bg-gray-200">
                  <div
                    style={{ width: `${progress}%` }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300 ease-out"
                  />
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs font-medium text-gray-600">
                    {Math.round(progress)}% tamamlandı
                  </span>
                  <span className="text-xs text-gray-500">
                    {progress < 100 ? 'İndiriliyor...' : 'Tamamlandı'}
                  </span>
                </div>
              </div>
            </>
          )}

          {status === 'downloaded' && (
            <p className="text-sm text-gray-600">
              Güncelleme başarıyla indirildi. Yüklemek için uygulamayı yeniden başlatın.
            </p>
          )}

          {status === 'error' && (
            <p className="text-sm text-red-600">
              Güncelleme sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.
            </p>
          )}
        </div>

        {/* Actions */}
        {status === 'available' && (
          <div className="flex gap-3 mt-4">
            <button
              onClick={onDownload}
              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
            >
              <ArrowDownTrayIcon className="w-5 h-5" />
              Şimdi İndir
            </button>
            <button
              onClick={onDismiss}
              className="px-4 py-2.5 text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              Daha Sonra
            </button>
          </div>
        )}

        {status === 'downloaded' && (
          <div className="flex gap-3 mt-4">
            <button
              onClick={onInstall}
              className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
            >
              <ArrowPathIcon className="w-5 h-5" />
              Yeniden Başlat
            </button>
            <button
              onClick={onDismiss}
              className="px-4 py-2.5 text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              Daha Sonra
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default UpdateNotification
