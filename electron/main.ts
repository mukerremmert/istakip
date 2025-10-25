import { app, BrowserWindow, Menu, ipcMain } from 'electron'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { setupAutoUpdater, checkForUpdates, downloadUpdate, quitAndInstall } from '../src/main/auto-updater'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

// Ana pencere referansı
const isDev = !app.isPackaged

// Ana pencere referansı
let mainWindow: BrowserWindow | null = null

// Uygulama hazır olduğunda
app.whenReady().then(() => {
  createWindow()
  
  // macOS'ta dock'ta tıklandığında pencere oluştur
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// Tüm pencereler kapatıldığında uygulamayı kapat (macOS hariç)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Ana pencere oluştur
function createWindow() {
  // Preload script yolu
  const preloadPath = isDev 
    ? join(__dirname, '../dist-electron/preload.cjs')
    : join(__dirname, 'preload.cjs')

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: preloadPath
    },
    titleBarStyle: 'default',
    show: false
  })

  // Pencere hazır olduğunda göster
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  // Her zaman Vite dev server'ı kullan (geliştirme modunda)
  const isDev = !app.isPackaged
  
  if (isDev) {
    // Geliştirme modunda Vite dev server'ı kullan
    mainWindow.loadURL('http://localhost:3000')
    mainWindow.webContents.openDevTools()
  } else {
    // Production'da build edilmiş dosyaları yükle
    mainWindow.loadFile(join(__dirname, '../dist/index.html'))
  }

  // Pencere kapatıldığında referansı temizle
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // Auto-updater'ı sadece production'da başlat
  if (!isDev) {
    setupAutoUpdater(mainWindow)
  }
}

// IPC handlers
ipcMain.handle('get-app-version', () => {
  return app.getVersion()
})

ipcMain.handle('get-app-name', () => {
  return app.getName()
})

// Auto-update IPC handlers
ipcMain.handle('check-for-updates', () => {
  checkForUpdates()
})

ipcMain.handle('start-download-update', () => {
  downloadUpdate()
})

ipcMain.handle('quit-and-install', () => {
  quitAndInstall()
})

// Menü oluştur
const template: Electron.MenuItemConstructorOptions[] = [
  {
    label: 'Dosya',
    submenu: [
      {
        label: 'Yeni',
        accelerator: 'CmdOrCtrl+N',
        click: () => {
          // Yeni iş ekleme fonksiyonu
        }
      },
      {
        label: 'Aç',
        accelerator: 'CmdOrCtrl+O',
        click: () => {
          // Dosya açma fonksiyonu
        }
      },
      { type: 'separator' },
      {
        label: 'Çıkış',
        accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
        click: () => {
          app.quit()
        }
      }
    ]
  },
  {
    label: 'Düzenle',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' }
    ]
  },
  {
    label: 'Görünüm',
    submenu: [
      { role: 'reload' },
      { role: 'forceReload' },
      { role: 'toggleDevTools' },
      { type: 'separator' },
      { role: 'resetZoom' },
      { role: 'zoomIn' },
      { role: 'zoomOut' },
      { type: 'separator' },
      { role: 'togglefullscreen' }
    ]
  }
]

const menu = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(menu)