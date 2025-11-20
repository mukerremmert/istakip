# WARP.md

Bu dosya, WARP (warp.dev) için bu repository'de çalışırken rehberlik sağlar.

## Proje Hakkında

**Connex İş Takip Sistemi** - Mahkeme dosyalarının ve araç bilgilerinin takip edildiği bir Electron masaüstü uygulaması.

## Geliştirme Komutları

### Temel Komutlar

```powershell
# Geliştirme modunda çalıştır (web server)
npm run dev

# Electron geliştirme modunda çalıştır
npm run electron:dev

# Production build (web)
npm run build

# Build + Electron installer oluştur
npm run dist

# Hızlı test build (sadece win-unpacked, installer yok)
npm run dist:dir

# Portable exe oluştur
npm run build:portable
```

### Native Modül Rebuild

SQLite3 gibi native modüller sorun çıkarırsa:

```powershell
npm run rebuild
```

### Test ve Linting

Proje yapılandırılmış lint/test komutları içermiyor. Kod değişikliklerinden sonra:
- `npm run build` çalıştırarak TypeScript hatalarını kontrol edin
- `npm run dist:dir` ile hızlı test build oluşturup uygulamayı çalıştırın

## Mimari Genel Bakış

### Teknoloji Stack

- **Frontend**: React 19 + TypeScript + Vite
- **UI Framework**: TailwindCSS + HeadlessUI + Heroicons
- **Desktop**: Electron 38 (Main + Renderer + Preload)
- **Database**: SQLite3 (native modül)
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod
- **Routing**: React Router DOM (HashRouter)
- **Auto-Update**: electron-updater (GitHub Releases)
- **Build**: electron-builder (NSIS installer)

### Proje Yapısı

```
src/
├── main/                    # Electron main process
│   ├── main.ts             # Ana Electron entry point
│   ├── database-handler.ts # SQLite IPC handler'ları
│   └── auto-updater.ts     # Otomatik güncelleme sistemi
├── modules/                # Domain modülleri
│   ├── jobs/              # İş takip modülü
│   ├── courts/            # Mahkeme yönetimi
│   └── vehicles/          # Araç yönetimi
├── pages/                 # React sayfaları (routes)
│   ├── Dashboard.tsx      # Ana dashboard
│   ├── Jobs.tsx
│   ├── Reports.tsx
│   ├── Expenses.tsx
│   └── Settings.tsx
├── shared/
│   ├── components/        # Paylaşılan UI bileşenleri
│   ├── types/            # TypeScript type tanımları
│   └── utils/            # Yardımcı fonksiyonlar (export, format)
├── App.tsx               # Ana React bileşeni
├── main.tsx              # React entry point
├── preload.ts            # Electron preload script (IPC bridge)
└── index.css             # Global stiller
```

### Electron Mimari

**3-Process Architecture:**

1. **Main Process** (`src/main/main.ts`):
   - Pencere yönetimi (BrowserWindow)
   - SQLite3 database bağlantısı
   - IPC handler'lar (CRUD işlemleri)
   - Auto-updater
   - `dist-electron/main.cjs` olarak build edilir

2. **Preload Script** (`src/preload.ts`):
   - Main-Renderer arası güvenli IPC köprüsü
   - `window.electronAPI` API'sini expose eder
   - Context isolation ile güvenlik
   - `dist-electron/preload.cjs` olarak build edilir

3. **Renderer Process** (`src/main.tsx`):
   - React uygulaması
   - `preload` üzerinden Electron API'lerine erişir
   - `dist/` klasörüne build edilir

### Database Şeması

SQLite3 ile 3 ana tablo:

1. **vehicles**: Araçlar (plaka, marka, model, yıl, tip)
2. **courts**: Mahkemeler (ad, şehir, ilçe, tip, iletişim bilgileri)
3. **jobs**: İşler (mahkeme, araç, dosya no, tutar, KDV, durum takibi)

İlişkiler:
- `jobs.court_id` → `courts.id`
- `jobs.vehicle_id` → `vehicles.id`

### IPC İletişimi

**Frontend → Backend İletişim:**

```typescript
// Preload tarafından expose edilen API
window.electronAPI.job.getAll()
window.electronAPI.court.create(data)
window.electronAPI.vehicle.update(data)
```

**Main Process Handler Yapısı:**
- Pattern: `[entity]:[action]` (örn: `job:getAll`, `court:create`)
- Her handler `{ success: boolean, data?: any, error?: string }` döner

## Özel Notlar

### Path Aliasing

`@/` ile src klasörüne referans verebilirsiniz:

```typescript
import { Court } from '@/shared/types/Court'
```

### Tarih Formatı

Proje genelinde Türk formatı kullanılır: `DD.MM.YYYY`

```typescript
import { formatDate, parseDate } from '@/shared/types/Job'
```

### Para Birimi

TRY (₺) formatı ile gösterilir:

```typescript
import { formatCurrency } from '@/shared/types/Job'
```

### KDV Hesaplama

KDV %20 sabit, toplam tutardan otomatik hesaplanır:

```typescript
import { calculateVAT } from '@/shared/types/Job'
const { baseAmount, vatAmount } = calculateVAT(totalAmount, 20)
```

### Auto-Update Sistemi

- GitHub Releases üzerinden çalışır
- Development modda devre dışı
- İlk kontrol: Uygulama başladıktan 5 saniye sonra
- Periyodik kontrol: Her 2 saatte bir
- Delta update destekli (sadece değişen dosyalar indirilir)

**Yeni versiyon yayınlama:**
1. `package.json` → version artır
2. `npm run dist`
3. GitHub'da yeni release oluştur ve dosyaları yükle:
   - `Connex İş Takip Sistemi - X.X.X.exe`
   - `Connex İş Takip Sistemi - X.X.X.exe.blockmap`
   - `latest.yml`

### Production Build

**Build çıktıları:**
- `dist/` - React app (HTML, JS, CSS)
- `dist-electron/` - Electron main ve preload (CJS)
- `dist-installer/` - Windows installer ve portable exe

**Installer:**
- NSIS tabanlı
- Kullanıcı installation path seçebilir
- Desktop ve Start Menu kısayolu oluşturur
- ~150 MB boyutunda

### Database Location

**Development:**
```
C:\Users\[USER]\AppData\Roaming\Electron\database.sqlite
```

**Production:**
```
C:\Users\[USER]\AppData\Roaming\Connex İş Takip Sistemi\database.sqlite
```

Her zaman `app.getPath('userData')` kullanılmalı.

### Windows Build Optimizasyonu

- ASAR packaging aktif (native modüller hariç)
- sqlite3 ve better-sqlite3 asarUnpack'e dahil
- Node modules fazlalıkları filtrelenir (test, docs vb.)
- Terser ile minification

### TailwindCSS Tema

Özel renk paleti tanımlanmış:
- **primary**: Mavi tonları (50-950)
- **secondary**: Gri tonları (50-950)
- Font: Inter
- Custom animasyonlar: fade-in, slide-up, scale-in

## Sık Karşılaşılan Sorunlar

### SQLite3 Native Modül Hatası

```powershell
npm run rebuild
```

veya

```powershell
npm run postinstall
```

### HTML Dosyası Yüklenmiyor

Production'da path kontrolü: `dist-electron/main.cjs` içinde `join(__dirname, '../dist/index.html')` olmalı.

### DevTools Açma

`src/main/main.ts` içinde:

```typescript
mainWindow?.webContents.openDevTools()
```

### Build Sırasında Uyarılar

**Normal uyarılar (göz ardı edilebilir):**
- Large chunks (React kütüphaneleri büyük)
- Default Electron icon (özel icon eklenmemiş)
- postcss.config.js type warning

### SmartScreen Uyarısı

Kod imzası olmadığı için Windows SmartScreen uyarı verir. Kullanıcılar "Yine de çalıştır" seçeneğini kullanmalı veya portable exe tercih edilebilir.

## Dosya İsimlendirme Kuralları

- React bileşenleri: PascalCase (`JobManagement.tsx`)
- Utility fonksiyonlar: camelCase (`exportUtils.ts`)
- Types: PascalCase (`Job.ts`, `Court.ts`)
- Electron scripts: kebab-case (`auto-updater.ts`)

## Git Repository

- **GitHub**: https://github.com/mukerremmert/istakip.git
- **Auto-Update Provider**: GitHub Releases
- electron-builder yayın için `GH_TOKEN` environment variable gerektirir

## Geliştirme İpuçları

1. **SQLite debug**: `src/main/main.ts` içinde console.log'lar `app-debug.log` dosyasına yazılır
2. **IPC test**: Renderer'da `window.electronAPI` console'dan test edilebilir
3. **Hızlı test**: `npm run dist:dir` ile installer oluşturmadan test
4. **Type safety**: TypeScript strict mode kapalı ama type definitions mevcut
5. **Hot reload**: `npm run electron:dev` ile otomatik reload aktif
