import { autoUpdater } from 'electron-updater'
import { BrowserWindow } from 'electron'
import log from 'electron-log'

// Log yapılandırması
log.transports.file.level = 'info'
autoUpdater.logger = log

// Auto-updater ayarları
autoUpdater.autoDownload = false // Manuel onay iste
autoUpdater.autoInstallOnAppQuit = true // Uygulama kapanırken kur

export function setupAutoUpdater(mainWindow: BrowserWindow | null) {
  // 1. Güncelleme kontrolü yapılıyor
  autoUpdater.on('checking-for-update', () => {
    log.info('🔍 Güncelleme kontrol ediliyor...')
    mainWindow?.webContents.send('update-checking')
  })

  // 2. Güncelleme mevcut
  autoUpdater.on('update-available', (info) => {
    log.info('✨ Yeni güncelleme mevcut!', info.version)
    mainWindow?.webContents.send('update-available', info.version)
  })

  // 3. Güncelleme yok
  autoUpdater.on('update-not-available', (info) => {
    log.info('✅ Uygulama güncel', info.version)
    mainWindow?.webContents.send('update-not-available', info)
  })

  // 4. İndirme ilerlemesi
  autoUpdater.on('download-progress', (progressObj) => {
    const message = `İndiriliyor: ${Math.round(progressObj.percent)}%`
    log.info(message)
    mainWindow?.webContents.send('update-download-progress', progressObj)
    
    // Progress dialog göster
    mainWindow?.setProgressBar(progressObj.percent / 100)
  })

  // 5. İndirme tamamlandı
  autoUpdater.on('update-downloaded', (info) => {
    log.info('✅ Güncelleme indirildi!')
    mainWindow?.setProgressBar(-1) // Progress bar'ı kapat
    mainWindow?.webContents.send('update-downloaded', info.version)
  })

  // 6. Hata oluştu
  autoUpdater.on('error', (error) => {
    log.error('❌ Auto-updater hatası:', error)
    mainWindow?.webContents.send('update-error', error.message)
  })

  // Uygulama başladıktan 5 saniye sonra kontrol et
  setTimeout(() => {
    checkForUpdates()
  }, 5000)

  // Her 2 saatte bir otomatik kontrol et
  setInterval(() => {
    checkForUpdates()
  }, 2 * 60 * 60 * 1000) // 2 saat
}

// Manuel güncelleme kontrolü
export function checkForUpdates() {
  log.info('🔄 Manuel güncelleme kontrolü başlatıldı')
  autoUpdater.checkForUpdates().catch(err => {
    log.error('Güncelleme kontrolü başarısız:', err)
  })
}

// İndirme başlat
export function downloadUpdate() {
  log.info('📥 downloadUpdate fonksiyonu çağrıldı')
  autoUpdater.downloadUpdate()
}

// Yükle ve yeniden başlat
export function quitAndInstall() {
  log.info('🔄 quitAndInstall fonksiyonu çağrıldı')
  autoUpdater.quitAndInstall(false, true)
}
