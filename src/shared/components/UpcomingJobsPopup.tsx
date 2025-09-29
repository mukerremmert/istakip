import React from 'react'
import {
  XMarkIcon,
  CalendarDaysIcon,
  ClockIcon,
  DocumentTextIcon,
  TruckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { Job } from '../types/Job'

interface UpcomingJob extends Job {
  daysLeft: number
  urgencyLevel: 'critical' | 'high' | 'medium' | 'low'
  urgencyColor: string
  urgencyText: string
}

interface UpcomingJobsPopupProps {
  isOpen: boolean
  onClose: () => void
  jobs: Job[]
}

const UpcomingJobsPopup: React.FC<UpcomingJobsPopupProps> = ({
  isOpen,
  onClose,
  jobs
}) => {
  // Yaklaşan işleri analiz et
  const analyzeUpcomingJobs = (): UpcomingJob[] => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return jobs
      .filter(job => job.status !== 'Tamamlandı' && job.status !== 'İptal') // Aktif işler
      .map(job => {
        // Tarih parse et
        const [day, month, year] = job.scheduledDate.split('.')
        const scheduledDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
        const daysLeft = Math.ceil((scheduledDate.getTime() - today.getTime()) / (1000 * 3600 * 24))

        // Urgency level hesapla
        let urgencyLevel: UpcomingJob['urgencyLevel']
        let urgencyColor: string
        let urgencyText: string

        if (daysLeft < 0) {
          urgencyLevel = 'critical'
          urgencyColor = 'bg-red-100 text-red-800 border-red-300'
          urgencyText = `${Math.abs(daysLeft)} gün gecikmiş`
        } else if (daysLeft === 0) {
          urgencyLevel = 'critical'
          urgencyColor = 'bg-orange-100 text-orange-800 border-orange-300'
          urgencyText = 'Bugün'
        } else if (daysLeft === 1) {
          urgencyLevel = 'high'
          urgencyColor = 'bg-yellow-100 text-yellow-800 border-yellow-300'
          urgencyText = 'Yarın'
        } else if (daysLeft <= 3) {
          urgencyLevel = 'medium'
          urgencyColor = 'bg-blue-100 text-blue-800 border-blue-300'
          urgencyText = `${daysLeft} gün kaldı`
        } else {
          urgencyLevel = 'low'
          urgencyColor = 'bg-green-100 text-green-800 border-green-300'
          urgencyText = `${daysLeft} gün kaldı`
        }

        return {
          ...job,
          daysLeft,
          urgencyLevel,
          urgencyColor,
          urgencyText
        }
      })
      .filter(job => job.daysLeft >= 0 && job.daysLeft <= 7) // Bugün ve gelecek 7 gün
      .sort((a, b) => a.daysLeft - b.daysLeft) // Tarihe göre sırala
  }

  const upcomingJobs = analyzeUpcomingJobs()

  if (!isOpen || upcomingJobs.length === 0) return null

  return (
    <div 
      className="fixed inset-0 backdrop-blur-sm overflow-y-auto h-full w-full z-[9999] flex items-center justify-center p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      {/* Modal - Ekran ortasında, büyük */}
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden w-full max-w-4xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-white bg-opacity-20 p-3 rounded-lg mr-4">
                  <CalendarDaysIcon className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">
                    Yaklaşan İşler
                  </h3>
                  <p className="text-blue-100 text-base">
                    7 gün içinde yapılacak {upcomingJobs.length} iş
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors p-1 rounded-lg hover:bg-white hover:bg-opacity-20"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-8 py-6 max-h-96 overflow-y-auto">
            <div className="space-y-4">
              {upcomingJobs.map((job) => (
                <div key={job.id} className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Başlık ve Urgency Badge */}
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900 text-lg">
                          {job.courtName}
                        </h4>
                        <span className={`px-3 py-1 text-sm font-semibold rounded-full border ${job.urgencyColor}`}>
                          {job.urgencyLevel === 'critical' && '🚨'} 
                          {job.urgencyLevel === 'high' && '⚠️'} 
                          {job.urgencyLevel === 'medium' && '📅'} 
                          {job.urgencyLevel === 'low' && '✅'} 
                          {job.urgencyText}
                        </span>
                      </div>

                      {/* İş Detayları */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div className="flex items-center text-sm">
                          <DocumentTextIcon className="h-4 w-4 text-gray-500 mr-2" />
                          <div>
                            <p className="text-gray-500">Dosya No</p>
                            <p className="font-medium text-gray-900">
                              {job.fileNumber || 'Belirtilmemiş'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center text-sm">
                          <TruckIcon className="h-4 w-4 text-gray-500 mr-2" />
                          <div>
                            <p className="text-gray-500">Araç</p>
                            <p className="font-medium text-gray-900">
                              {job.plate || 'Seçilmemiş'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center text-sm">
                          <ClockIcon className="h-4 w-4 text-gray-500 mr-2" />
                          <div>
                            <p className="text-gray-500">Geliş Tarihi</p>
                            <p className="font-medium text-gray-900">{job.receivedDate}</p>
                          </div>
                        </div>

                        <div className="flex items-center text-sm">
                          <CalendarDaysIcon className="h-4 w-4 text-blue-500 mr-2" />
                          <div>
                            <p className="text-gray-500">Yapılacak</p>
                            <p className="font-medium text-blue-700">{job.scheduledDate}</p>
                          </div>
                        </div>
                      </div>

                      {/* Durum ve Ödeme */}
                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          job.status === 'Beklemede' ? 'bg-red-100 text-red-800' :
                          job.status === 'Devam Ediyor' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {job.status}
                        </span>
                        
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          job.paymentStatus === 'Ödendi' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {job.paymentStatus}
                        </span>

                        {job.totalAmount > 0 && (
                          <span className="text-sm font-semibold text-gray-700">
                            {job.totalAmount.toLocaleString('tr-TR')} ₺
                          </span>
                        )}
                      </div>

                      {/* Eksik Bilgiler Uyarısı */}
                      {(!job.fileNumber || !job.vehicleId || !job.totalAmount) && (
                        <div className="mt-3 flex items-center text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
                          <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
                          <span>
                            Eksik bilgiler: {[
                              !job.fileNumber && 'Dosya No',
                              !job.vehicleId && 'Araç',
                              !job.totalAmount && 'Tutar'
                            ].filter(Boolean).join(', ')}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* ID Badge */}
                    <div className="ml-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        #{job.id}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-8 py-5 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center text-base text-gray-600">
                <CheckCircleIcon className="h-6 w-6 mr-3" />
                <span>
                  Toplam {upcomingJobs.length} iş • 
                  {upcomingJobs.filter(j => j.daysLeft < 0).length} gecikmiş • 
                  {upcomingJobs.filter(j => j.daysLeft === 0).length} bugün • 
                  {upcomingJobs.filter(j => j.daysLeft === 1).length} yarın
                </span>
              </div>
              <button
                onClick={onClose}
                className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-base font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Anladım
              </button>
            </div>
          </div>
      </div>
    </div>
  )
}

export default UpcomingJobsPopup
