import React, { useState, useEffect } from 'react'
import { 
  ClipboardDocumentListIcon, 
  CheckCircleIcon, 
  ClockIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'
import { jobService } from '../modules/jobs/models/JobService'
import { Job } from '../shared/types/Job'

const Jobs: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)

  // İşleri yükle
  useEffect(() => {
    const loadJobs = async () => {
      try {
        const jobsData = await jobService.getAllJobs()
        setJobs(jobsData)
      } catch (error) {
        console.error('İşler yüklenirken hata:', error)
      } finally {
        setLoading(false)
      }
    }
    loadJobs()
  }, [])

  // İstatistikleri hesapla
  const totalJobs = jobs.length
  const completedJobs = jobs.filter(job => job.status === 'Tamamlandı').length
  const inProgressJobs = jobs.filter(job => job.status === 'Devam Ediyor').length
  const pendingJobs = jobs.filter(job => job.status === 'Beklemede').length
  const paidJobs = jobs.filter(job => job.paymentStatus === 'Ödendi').length
  const invoicedJobs = jobs.filter(job => job.invoiceStatus === 'Kesildi').length

  const stats = [
    {
      name: 'Toplam',
      value: totalJobs,
      icon: ClipboardDocumentListIcon,
      color: 'bg-blue-500'
    },
    {
      name: 'Tamamlanan',
      value: completedJobs,
      icon: CheckCircleIcon,
      color: 'bg-green-500'
    },
    {
      name: 'Devam Eden',
      value: inProgressJobs,
      icon: ClockIcon,
      color: 'bg-yellow-500'
    },
    {
      name: 'Bekleyen',
      value: pendingJobs,
      icon: ExclamationTriangleIcon,
      color: 'bg-red-500'
    },
    {
      name: 'Ödenen',
      value: paidJobs,
      icon: CurrencyDollarIcon,
      color: 'bg-emerald-500'
    },
    {
      name: 'Fatura Kesilen',
      value: invoicedJobs,
      icon: DocumentTextIcon,
      color: 'bg-purple-500'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Küçük İstatistik Kartları */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.name} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div className="ml-3">
                  <p className="text-xs font-medium text-gray-600">{stat.name}</p>
                  <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* İş Listesi */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">İş Listesi</h3>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="text-center text-gray-500">Yükleniyor...</div>
          ) : jobs.length === 0 ? (
            <div className="text-center text-gray-500">Henüz iş kaydı bulunmuyor.</div>
          ) : (
            <div className="text-gray-600">
              Toplam {totalJobs} iş kaydı bulundu. Detaylı listeyi görmek için "İşler" menüsünü kullanın.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Jobs