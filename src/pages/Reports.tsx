import React from 'react'
import {
  ChartBarIcon,
  ClockIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'

const Reports: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-full bg-gray-50">
      <div className="text-center max-w-md">
        {/* Ana İkon */}
        <div className="relative mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
            <ChartBarIcon className="h-12 w-12 text-white" />
          </div>
          {/* Sparkle efekti */}
          <SparklesIcon className="absolute -top-2 -right-2 h-8 w-8 text-yellow-400 animate-pulse" />
        </div>

        {/* Başlık */}
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          Raporlar Modülü
        </h2>
        
        {/* Açıklama */}
        <p className="text-gray-600 mb-6 leading-relaxed">
          Detaylı analiz ve raporlama özellikleri yakında kullanıma sunulacak. 
          Mali raporlar, iş durumu analizleri ve grafik gösterimleri için bizi takip edin.
        </p>

        {/* Yakında Badge */}
        <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full shadow-lg">
          <ClockIcon className="h-5 w-5 mr-2" />
          <span className="font-semibold">Yakında Geliyor</span>
          <div className="ml-3 flex space-x-1">
            <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>

        {/* Gelecek Özellikler */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h4 className="font-semibold text-gray-800 mb-2">📊 Mali Raporlar</h4>
            <p className="text-sm text-gray-600">Gelir analizi, KDV raporları</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h4 className="font-semibold text-gray-800 mb-2">📈 İş Durumu</h4>
            <p className="text-sm text-gray-600">Durum analizi, trend grafikleri</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h4 className="font-semibold text-gray-800 mb-2">📅 Zaman Analizi</h4>
            <p className="text-sm text-gray-600">Günlük, aylık, yıllık raporlar</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h4 className="font-semibold text-gray-800 mb-2">📄 Export</h4>
            <p className="text-sm text-gray-600">PDF, Excel, CSV formatları</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Reports