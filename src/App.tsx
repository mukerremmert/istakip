import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Layout from './shared/components/Layout'
import Dashboard from './pages/Dashboard'
import Reports from './pages/Reports'
import Expenses from './pages/Expenses'
import Settings from './pages/Settings'
import VehicleManagement from './modules/vehicles/views/VehicleManagement'
import CourtManagement from './modules/courts/views/CourtManagement'
import JobManagement from './modules/jobs/views/JobManagement'
import UpdateNotification from './shared/components/UpdateNotification'

type UpdateStatus = 'checking' | 'available' | 'downloading' | 'downloaded' | 'not-available' | 'error' | null

function App() {
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>(null)
  const [updateVersion, setUpdateVersion] = useState<string>('')
  const [downloadProgress, setDownloadProgress] = useState<number>(0)

  useEffect(() => {
    // Auto-update event listeners
    if (window.electron) {
      // Güncelleme kontrol ediliyor
      window.electron.on('update-checking', () => {
        setUpdateStatus('checking')
      })

      // Yeni güncelleme mevcut
      window.electron.on('update-available', (_event: any, version: string) => {
        setUpdateStatus('available')
        setUpdateVersion(version)
      })

      // Güncelleme yok
      window.electron.on('update-not-available', () => {
        setUpdateStatus('not-available')
        // 3 saniye sonra bildirimi kapat
        setTimeout(() => setUpdateStatus(null), 3000)
      })

      // İndirme ilerlemesi
      window.electron.on('update-download-progress', (_event: any, progress: any) => {
        setUpdateStatus('downloading')
        setDownloadProgress(progress.percent)
      })

      // İndirme tamamlandı
      window.electron.on('update-downloaded', (_event: any, version: string) => {
        setUpdateStatus('downloaded')
        setUpdateVersion(version)
        setDownloadProgress(100)
      })

      // Hata oluştu
      window.electron.on('update-error', () => {
        setUpdateStatus('error')
        // 5 saniye sonra bildirimi kapat
        setTimeout(() => setUpdateStatus(null), 5000)
      })
    }
  }, [])

  const handleDownloadUpdate = () => {
    if (window.electron) {
      window.electron.invoke('start-download-update')
    }
  }

  const handleInstallUpdate = () => {
    if (window.electron) {
      window.electron.invoke('quit-and-install')
    }
  }

  const handleDismiss = () => {
    setUpdateStatus(null)
  }

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/jobs" element={<JobManagement />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/settings/vehicles/add" element={<VehicleManagement />} />
          <Route path="/settings/courts/add" element={<CourtManagement />} />
        </Routes>
      </Layout>
      
      {/* Update Notification */}
      <UpdateNotification
        status={updateStatus}
        version={updateVersion}
        progress={downloadProgress}
        onDownload={handleDownloadUpdate}
        onInstall={handleInstallUpdate}
        onDismiss={handleDismiss}
      />
    </Router>
  )
}

export default App