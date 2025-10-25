import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  HomeIcon, 
  ClipboardDocumentListIcon, 
  ChartBarIcon, 
  TruckIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'
import UpdateNotification from './UpdateNotification'

// @ts-ignore - package.json'u import ediyoruz
import packageJson from '../../../package.json'

// Electron API tiplerini tanımla
declare global {
  interface Window {
    electronAPI: {
      database?: any
      vehicle?: any
      court?: any
      job?: any
      updater: {
        onUpdateChecking: (callback: () => void) => () => void
        onUpdateAvailable: (callback: (version: string) => void) => () => void
        onUpdateNotAvailable: (callback: () => void) => () => void
        onDownloadProgress: (callback: (progress: any) => void) => () => void
        onUpdateDownloaded: (callback: (version: string) => void) => () => void
        onUpdateError: (callback: (error: string) => void) => () => void
        downloadUpdate: () => Promise<any>
        quitAndInstall: () => Promise<any>
        checkForUpdates: () => Promise<any>
      }
    }
  }
}

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false) // Mobile toggle
  const [collapsed, setCollapsed] = useState(false) // Desktop collapse
  const location = useLocation()

  // Auto-update state
  const [updateStatus, setUpdateStatus] = useState<'checking' | 'available' | 'downloading' | 'downloaded' | 'not-available' | 'error' | null>(null)
  const [updateVersion, setUpdateVersion] = useState<string>()
  const [downloadProgress, setDownloadProgress] = useState(0)

  // Auto-update event listeners
  useEffect(() => {
    // Electron API kontrolü
    if (!window.electronAPI?.updater) {
      console.log('⚠️ Electron updater API bulunamadı (muhtemelen web modunda)')
      return
    }

    console.log('✅ Auto-update event listeners kuruluyor...')

    // Event listener'ları kur
    const unsubChecking = window.electronAPI.updater.onUpdateChecking(() => {
      console.log('🔍 Güncelleme kontrol ediliyor...')
      setUpdateStatus('checking')
    })

    const unsubAvailable = window.electronAPI.updater.onUpdateAvailable((version: string) => {
      console.log('✨ Yeni güncelleme mevcut:', version)
      setUpdateStatus('available')
      setUpdateVersion(version)
    })

    const unsubNotAvailable = window.electronAPI.updater.onUpdateNotAvailable(() => {
      console.log('✅ Uygulama güncel')
      setUpdateStatus('not-available')
      // 3 saniye sonra notification'ı gizle
      setTimeout(() => setUpdateStatus(null), 3000)
    })

    const unsubProgress = window.electronAPI.updater.onDownloadProgress((progress: any) => {
      console.log('📥 İndirme ilerlemesi:', Math.round(progress.percent) + '%')
      setUpdateStatus('downloading')
      setDownloadProgress(Math.round(progress.percent))
    })

    const unsubDownloaded = window.electronAPI.updater.onUpdateDownloaded((version: string) => {
      console.log('✅ Güncelleme indirildi:', version)
      setUpdateStatus('downloaded')
      setUpdateVersion(version)
      setDownloadProgress(100)
    })

    const unsubError = window.electronAPI.updater.onUpdateError((error: string) => {
      console.error('❌ Güncelleme hatası:', error)
      
      // İnternet/Network hatası kontrolü
      const networkErrorKeywords = [
        'net::',
        'ENOTFOUND',
        'ECONNREFUSED',
        'ETIMEDOUT',
        'ECONNRESET',
        'network',
        'internet',
        'connection',
        'offline',
        'getaddrinfo'
      ]
      
      const isNetworkError = networkErrorKeywords.some(keyword => 
        error.toLowerCase().includes(keyword.toLowerCase())
      )
      
      if (isNetworkError) {
        // Sessiz mod: İnternet yoksa kullanıcıya gösterme
        console.log('🔇 İnternet hatası - Sessiz mod aktif, bildirim gösterilmiyor')
        // UI'da hata gösterme, sadece log tut
      } else {
        // Diğer hatalar için göster
        console.error('⚠️ Gerçek hata - Kullanıcıya gösteriliyor')
        setUpdateStatus('error')
        // 5 saniye sonra notification'ı gizle
        setTimeout(() => setUpdateStatus(null), 5000)
      }
    })

    // Cleanup
    return () => {
      unsubChecking()
      unsubAvailable()
      unsubNotAvailable()
      unsubProgress()
      unsubDownloaded()
      unsubError()
    }
  }, [])

  const navigation = [
    { name: 'Dashboard', href: '/', icon: HomeIcon },
    { name: 'İşler', href: '/jobs', icon: ClipboardDocumentListIcon },
    { name: 'Araçlar', href: '/settings/vehicles/add', icon: TruckIcon },
    { name: 'Mahkemeler', href: '/settings/courts/add', icon: BuildingOfficeIcon },
    { name: 'Harcamalar', href: '/expenses', icon: CurrencyDollarIcon },
    { name: 'Raporlar', href: '/reports', icon: ChartBarIcon },
  ]

  const isActive = (path: string) => {
    return location.pathname === path
  }

  // Auto-update handlers
  const handleDownload = async () => {
    console.log('📥 İndirme başlatılıyor...')
    try {
      await window.electronAPI.updater.downloadUpdate()
      setUpdateStatus('downloading')
    } catch (error) {
      console.error('İndirme başlatma hatası:', error)
    }
  }

  const handleInstall = async () => {
    console.log('🔄 Yükleme ve yeniden başlatma...')
    try {
      await window.electronAPI.updater.quitAndInstall()
    } catch (error) {
      console.error('Yükleme hatası:', error)
    }
  }

  const handleDismiss = () => {
    console.log('👋 Güncelleme bildirimi kapatıldı')
    setUpdateStatus(null)
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-gray-600 opacity-75"></div>
        </div>
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 bg-white shadow-lg transform transition-all duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        ${collapsed ? 'lg:w-20' : 'w-64'}
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className={`flex items-center ${collapsed ? 'justify-center w-full' : 'space-x-3'}`}>
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">İ</span>
            </div>
            {!collapsed && (
              <div>
                <h1 className="text-lg font-bold text-gray-900">İş Takip ✨</h1>
                <p className="text-xs text-gray-500">v{packageJson.version}</p>
              </div>
            )}
          </div>
          
          {/* Mobile close button */}
          <button
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600"
            onClick={() => setSidebarOpen(false)}
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Desktop Collapse Toggle Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 bg-white border border-gray-300 rounded-full items-center justify-center shadow-md hover:bg-gray-50 transition-colors z-50"
          title={collapsed ? "Sidebar'ı Genişlet" : "Sidebar'ı Daralt"}
        >
          {collapsed ? (
            <ChevronRightIcon className="w-4 h-4 text-gray-600" />
          ) : (
            <ChevronLeftIcon className="w-4 h-4 text-gray-600" />
          )}
        </button>

        {/* Navigation */}
        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon
              const isReports = item.name === 'Raporlar'
              const isExpenses = item.name === 'Harcamalar'
              const isComingSoon = isReports || isExpenses
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    group relative flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200
                    ${isActive(item.href)
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                  onClick={() => setSidebarOpen(false)}
                  title={collapsed ? item.name : ''}
                >
                  <div className="flex items-center">
                    <Icon className={`h-5 w-5 flex-shrink-0 ${collapsed ? '' : 'mr-3'}`} />
                    {!collapsed && item.name}
                  </div>
                  
                  {/* Yakında Badge - Harcamalar ve Raporlar için (sadece expanded'da) */}
                  {isComingSoon && !collapsed && (
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white shadow-sm animate-pulse ${
                      isExpenses 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                        : 'bg-gradient-to-r from-purple-500 to-pink-500'
                    }`}>
                      ✨ Yakında
                    </span>
                  )}

                  {/* Collapsed durumda tooltip */}
                  {collapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                      {item.name}
                      {isComingSoon && ' ✨ Yakında'}
                    </div>
                  )}
                </Link>
              )
            })}
          </div>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-6">
            {/* Mobile menu button */}
            <button
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600"
              onClick={() => setSidebarOpen(true)}
            >
              <Bars3Icon className="w-6 h-6" />
            </button>

            {/* Page title */}
            <div className="flex-1 lg:ml-0 ml-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {navigation.find(item => item.href === location.pathname)?.name || 
                 navigation.find(item => item.href === location.pathname)?.name || 
                 'Dashboard'}
              </h2>
            </div>

            {/* Header actions */}
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ara..."
                  className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-400">🔍</span>
                </div>
              </div>

              {/* Notifications */}
              <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <span className="text-xl">🔔</span>
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* User menu */}
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">A</span>
                </div>
                <span className="text-sm font-medium text-gray-700">Admin</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto bg-gray-50">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>

      {/* Update Notification */}
      <UpdateNotification
        status={updateStatus}
        version={updateVersion}
        progress={downloadProgress}
        onDownload={handleDownload}
        onInstall={handleInstall}
        onDismiss={handleDismiss}
      />
    </div>
  )
}

export default Layout