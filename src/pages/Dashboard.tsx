import React, { useState, useEffect } from 'react'
import { 
  ClipboardDocumentListIcon, 
  CheckCircleIcon, 
  ClockIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  CalendarIcon,
  TruckIcon
} from '@heroicons/react/24/outline'
import { jobService } from '../modules/jobs/models/JobService'
import { Job } from '../shared/types/Job'
import UpcomingJobsPopup from '../shared/components/UpcomingJobsPopup'

const Dashboard: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [showUpcomingPopup, setShowUpcomingPopup] = useState(false)

  // İşleri yükle
  useEffect(() => {
    const loadJobs = async () => {
      try {
        const jobsData = await jobService.getAllJobs()
        console.log('📊 Frontend\'e yüklenen iş sayısı:', jobsData.length)
        console.log('📅 Gelecek tarihli işler:', jobsData.filter(j => {
          const [day, month, year] = j.scheduledDate.split('.')
          const scheduledDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
          const daysLeft = Math.ceil((scheduledDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24))
          return daysLeft >= 0 && daysLeft <= 7 && j.status !== 'Tamamlandı' && j.status !== 'İptal'
        }).map(j => `#${j.id}: ${j.scheduledDate}`))
        setJobs(jobsData)
        
        // Yaklaşan işler popup kontrolü (3 saniye bekle)
        setTimeout(() => {
          const hasUpcomingJobs = checkUpcomingJobs(jobsData)
          console.log('🔍 Yaklaşan işler kontrolü:', {
            totalJobs: jobsData.length,
            hasUpcomingJobs,
            willShowPopup: hasUpcomingJobs
          })
          
          if (hasUpcomingJobs) {
            console.log('📅 Popup açılıyor...')
            setShowUpcomingPopup(true)
          } else {
            console.log('ℹ️ Yaklaşan iş yok, popup açılmıyor')
          }
        }, 3000)
      } catch (error) {
        console.error('İşler yüklenirken hata:', error)
      } finally {
        setLoading(false)
      }
    }
    loadJobs()
  }, [])

  // Yaklaşan işler kontrolü
  const checkUpcomingJobs = (jobsData: Job[]): boolean => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    console.log('📅 Bugünün tarihi:', today.toLocaleDateString('tr-TR'))

    const upcomingJobs = jobsData.filter(job => {
      // Sadece aktif işler
      if (job.status === 'Tamamlandı' || job.status === 'İptal') return false

      // Tarih parse et
      const [day, month, year] = job.scheduledDate.split('.')
      const scheduledDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      const daysLeft = Math.ceil((scheduledDate.getTime() - today.getTime()) / (1000 * 3600 * 24))

      console.log(`📋 İş #${job.id}: ${job.scheduledDate} → ${daysLeft} gün kaldı (${daysLeft >= 0 && daysLeft <= 7 ? 'DAHİL' : 'HARİÇ'})`)

      // Bugün ve gelecek 7 gün içindeki işler (geçmiş hariç)
      return daysLeft >= 0 && daysLeft <= 7
    })

    console.log(`📊 Filtrelenen işler: ${upcomingJobs.length} / ${jobsData.length}`)
    return upcomingJobs.length > 0
  }

  // İstatistikleri hesapla
  const totalJobs = jobs.length
  const completedJobs = jobs.filter(job => job.status === 'Tamamlandı').length
  const inProgressJobs = jobs.filter(job => job.status === 'Devam Ediyor').length
  const pendingJobs = jobs.filter(job => job.status === 'Beklemede').length
  // Ödeme istatistikleri
  const paidJobs = jobs.filter(job => job.paymentStatus === 'Ödendi').length
  
  // Fatura istatistikleri
  const invoicedJobs = jobs.filter(job => job.invoiceStatus === 'Kesildi').length
  
  // Toplam tutar hesaplama
  const totalAmount = jobs.reduce((sum, job) => sum + job.totalAmount, 0)
  const paidAmount = jobs
    .filter(job => job.paymentStatus === 'Ödendi')
    .reduce((sum, job) => sum + job.totalAmount, 0)
  const unpaidAmount = jobs
    .filter(job => job.paymentStatus === 'Ödenmedi')
    .reduce((sum, job) => sum + job.totalAmount, 0)

  const stats = [
    {
      name: 'Toplam İş',
      value: totalJobs.toString(),
      icon: ClipboardDocumentListIcon,
      color: 'bg-blue-500',
      change: `${completedJobs} tamamlandı`,
      changeType: 'positive'
    },
    {
      name: 'Tamamlanan',
      value: completedJobs.toString(),
      icon: CheckCircleIcon,
      color: 'bg-green-500',
      change: `${Math.round((completedJobs / totalJobs) * 100)}%`,
      changeType: 'positive'
    },
    {
      name: 'Devam Eden',
      value: inProgressJobs.toString(),
      icon: ClockIcon,
      color: 'bg-yellow-500',
      change: `${Math.round((inProgressJobs / totalJobs) * 100)}%`,
      changeType: 'neutral'
    },
    {
      name: 'Bekleyen',
      value: pendingJobs.toString(),
      icon: ExclamationTriangleIcon,
      color: 'bg-red-500',
      change: `${Math.round((pendingJobs / totalJobs) * 100)}%`,
      changeType: 'negative'
    },
    {
      name: 'Ödenen',
      value: paidJobs.toString(),
      icon: CurrencyDollarIcon,
      color: 'bg-emerald-500',
      change: `${Math.round((paidJobs / totalJobs) * 100)}%`,
      changeType: 'positive'
    },
    {
      name: 'Fatura Kesilen',
      value: invoicedJobs.toString(),
      icon: DocumentTextIcon,
      color: 'bg-purple-500',
      change: `${Math.round((invoicedJobs / totalJobs) * 100)}%`,
      changeType: 'positive'
    },
    {
      name: 'Toplam Tutar',
      value: `${totalAmount.toLocaleString('tr-TR')} ₺`,
      icon: CalendarIcon,
      color: 'bg-indigo-500',
      change: `${paidAmount.toLocaleString('tr-TR')} ₺ ödendi`,
      changeType: 'positive'
    },
    {
      name: 'Bekleyen Tutar',
      value: `${unpaidAmount.toLocaleString('tr-TR')} ₺`,
      icon: TruckIcon,
      color: 'bg-orange-500',
      change: `${Math.round((unpaidAmount / totalAmount) * 100)}%`,
      changeType: 'negative'
    }
  ]

  // Yaklaşan işleri al (tamamlanmamış ve süresi yaklaşan)
  const getUpcomingJobs = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    return jobs
      .filter(job => job.status !== 'Tamamlandı' && job.status !== 'İptal') // Aktif işler
      .map(job => {
        // Tarih parse et
        const [day, month, year] = job.scheduledDate.split('.')
        const scheduledDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
        const daysLeft = Math.ceil((scheduledDate.getTime() - today.getTime()) / (1000 * 3600 * 24))
        
        return {
          id: job.id,
          title: `${job.courtName} - ${job.fileNumber}`,
          status: job.status,
          priority: job.paymentStatus,
          assignee: job.plate,
          dueDate: job.scheduledDate,
          receivedDate: job.receivedDate,
          daysLeft,
          statusColor: getStatusColor(job.status),
          paymentColor: getPaymentColor(job.paymentStatus),
          dueDateColor: getDueDateColor(daysLeft),
          amount: job.totalAmount
        }
      })
      .sort((a, b) => a.daysLeft - b.daysLeft) // Tarihe göre sırala (en yakın önce)
      .slice(0, 8) // İlk 8 tanesini al
  }
  
  const upcomingJobs = getUpcomingJobs()

  // Durum renkleri
  function getStatusColor(status: string) {
    switch (status) {
      case 'Tamamlandı': return 'bg-green-100 text-green-800'
      case 'Devam Ediyor': return 'bg-yellow-100 text-yellow-800'
      case 'Beklemede': return 'bg-red-100 text-red-800'
      case 'İptal': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Ödeme durumu renkleri
  function getPaymentColor(status: string) {
    switch (status) {
      case 'Ödendi': return 'bg-green-100 text-green-800'
      case 'Ödenmedi': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }


  // Tarih yakınlığı renkleri
  function getDueDateColor(daysLeft: number) {
    if (daysLeft < 0) return 'bg-red-100 text-red-800 font-bold' // Gecikmiş
    if (daysLeft === 0) return 'bg-orange-100 text-orange-800 font-bold' // Bugün
    if (daysLeft === 1) return 'bg-yellow-100 text-yellow-800 font-semibold' // Yarın
    if (daysLeft <= 3) return 'bg-blue-100 text-blue-800' // 3 gün içinde
    if (daysLeft <= 7) return 'bg-green-100 text-green-800' // Bu hafta
    return 'bg-gray-100 text-gray-800' // Uzak gelecek
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">📊 İş Takip Sistemi Dashboard</h1>
            <p className="text-blue-100">
              {loading ? 'Veriler yükleniyor...' : 
               `Toplam ${totalJobs} iş kaydı, ${completedJobs} tamamlandı, ${paidAmount.toLocaleString('tr-TR')} ₺ ödendi`}
            </p>
          </div>
          <button
            onClick={() => setShowUpcomingPopup(true)}
            className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg transition-all"
          >
            📅 Yaklaşan İşler
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.name} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className={`text-sm font-medium ${
                  stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change}
                </span>
                <span className="text-sm text-gray-500 ml-2">geçen haftaya göre</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent Jobs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Yaklaşan İşler</h3>
          <p className="text-sm text-gray-600 mt-1">Tamamlanmamış işler, yakın tarihe göre sıralı</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İş Bilgisi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Geliş Tarihi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Yapılacak Tarih
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ödeme
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tutar
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    Yükleniyor...
                  </td>
                </tr>
              ) : upcomingJobs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    Yaklaşan aktif iş bulunmuyor.
                  </td>
                </tr>
              ) : (
                upcomingJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{job.title}</div>
                      <div className="text-sm text-gray-500">#{job.id} • {job.assignee}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{job.receivedDate}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${job.dueDateColor}`}>
                          {job.dueDate}
                        </span>
                        <span className="ml-2 text-xs text-gray-500">
                          {job.daysLeft < 0 ? `${Math.abs(job.daysLeft)} gün gecikmiş` :
                           job.daysLeft === 0 ? 'Bugün' :
                           job.daysLeft === 1 ? 'Yarın' :
                           `${job.daysLeft} gün kaldı`}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${job.statusColor}`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${job.paymentColor}`}>
                        {job.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {job.amount.toLocaleString('tr-TR')} ₺
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Yaklaşan İşler Popup */}
      <UpcomingJobsPopup
        isOpen={showUpcomingPopup}
        onClose={() => setShowUpcomingPopup(false)}
        jobs={jobs}
      />
    </div>
  )
}

export default Dashboard