import React from 'react'
import {
  CurrencyDollarIcon,
  ClockIcon,
  SparklesIcon,
  ReceiptPercentIcon
} from '@heroicons/react/24/outline'

const Expenses: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-full bg-gray-50">
      <div className="text-center max-w-md">
        {/* Ana İkon */}
        <div className="relative mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
            <CurrencyDollarIcon className="h-12 w-12 text-white" />
          </div>
          {/* Sparkle efekti */}
          <SparklesIcon className="absolute -top-2 -right-2 h-8 w-8 text-yellow-400 animate-pulse" />
        </div>

        {/* Başlık */}
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          Harcamalar Modülü
        </h2>
        
        {/* Açıklama */}
        <p className="text-gray-600 mb-6 leading-relaxed">
          İş giderleri, araç masrafları ve operasyonel harcama takibi özellikleri 
          yakında kullanıma sunulacak. Detaylı gider analizi için bizi takip edin.
        </p>

        {/* Yakında Badge */}
        <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full shadow-lg">
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
            <h4 className="font-semibold text-gray-800 mb-2">🚗 Araç Giderleri</h4>
            <p className="text-sm text-gray-600">Yakıt, bakım, sigorta masrafları</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h4 className="font-semibold text-gray-800 mb-2">🏢 Operasyonel</h4>
            <p className="text-sm text-gray-600">Ofis, personel, genel giderler</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h4 className="font-semibold text-gray-800 mb-2">📊 Gider Analizi</h4>
            <p className="text-sm text-gray-600">Kategori bazlı harcama raporları</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h4 className="font-semibold text-gray-800 mb-2">💰 Kar/Zarar</h4>
            <p className="text-sm text-gray-600">Gelir-gider karşılaştırması</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Expenses
