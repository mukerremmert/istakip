# .NET 8.0 + WPF Geçiş Planı

## 🎯 Neden .NET?

### Sorun: Electron Build Zorlukları
- ❌ 150MB+ installer boyutu
- ❌ Native modül rebuild sorunları
- ❌ Code signing maliyeti ($300-400/yıl)
- ❌ Windows Defender / SmartScreen engelleri
- ❌ Her güncelleme 150MB download
- ❌ RAM kullanımı 200-300MB

### Çözüm: .NET 8.0 + WPF
- ✅ 5-10MB installer boyutu (self-contained: 50MB)
- ✅ Native Windows app, build sorun yok
- ✅ Ücretsiz ClickOnce publishing
- ✅ SmartScreen sorunu yok
- ✅ Delta update (~5MB)
- ✅ RAM kullanımı 50-80MB

## 📊 Detaylı Karşılaştırma

| Özellik | Electron | .NET WPF | Kazanç |
|---------|----------|----------|--------|
| **Installer Boyutu** | 150-180 MB | 5-10 MB | **95% daha küçük** |
| **RAM Kullanımı** | 200-300 MB | 50-80 MB | **70% daha az** |
| **Başlangıç Süresi** | 3-5 saniye | 0.5-1 saniye | **5x daha hızlı** |
| **Update Boyutu** | 150 MB | 5-10 MB | **95% daha küçük** |
| **Native Performance** | JavaScript VM | Native Code | **3-5x daha hızlı** |
| **Build Süresi** | 5-10 dakika | 1-2 dakika | **5x daha hızlı** |
| **Database** | sqlite3 (native) | EF Core (native) | Sorunsuz |
| **E-İmza Desteği** | node-pcsc + pkcs11js | Pkcs11Interop ✅ | Yerli desteği |
| **Code Signing** | $300-400/yıl | **Ücretsiz** (ClickOnce) | Maliyet yok |
| **SmartScreen** | Problem var | Problem yok | ✅ |

## 🏗️ .NET Proje Yapısı

```
İşTakipSistemi.WPF/
├── App.xaml                      # Application entry
├── App.xaml.cs
├── MainWindow.xaml               # Ana pencere
├── MainWindow.xaml.cs
│
├── Models/                       # Veri modelleri
│   ├── Court.cs
│   ├── Vehicle.cs
│   └── Job.cs
│
├── ViewModels/                   # MVVM ViewModels
│   ├── MainViewModel.cs
│   ├── CourtViewModel.cs
│   ├── VehicleViewModel.cs
│   └── JobViewModel.cs
│
├── Views/                        # XAML Views
│   ├── Dashboard.xaml
│   ├── CourtManagement.xaml
│   ├── VehicleManagement.xaml
│   └── JobManagement.xaml
│
├── Services/                     # Business Logic
│   ├── DatabaseService.cs
│   ├── CourtService.cs
│   ├── VehicleService.cs
│   └── JobService.cs
│
├── Data/                         # Database Context
│   ├── AppDbContext.cs
│   └── Migrations/
│
├── Helpers/                      # Utility classes
│   ├── ExportHelper.cs
│   └── ValidationHelper.cs
│
└── Resources/                    # Images, Icons
    ├── Images/
    └── Styles/
        └── ModernDark.xaml
```

## 🔧 Teknoloji Stack

### NuGet Packages

```xml
<ItemGroup>
  <!-- UI Framework -->
  <PackageReference Include="ModernWpfUI" Version="0.9.6" />
  <PackageReference Include="MaterialDesignThemes" Version="4.9.0" />
  
  <!-- MVVM -->
  <PackageReference Include="CommunityToolkit.Mvvm" Version="8.4.0" />
  
  <!-- Database -->
  <PackageReference Include="Microsoft.EntityFrameworkCore.Sqlite" Version="8.0.0" />
  <PackageReference Include="Microsoft.EntityFrameworkCore.Tools" Version="8.0.0" />
  
  <!-- Export -->
  <PackageReference Include="ClosedXML" Version="0.104.0" />
  <PackageReference Include="QuestPDF" Version="2024.10.2" />
  
  <!-- E-İmza (İstakip için) -->
  <PackageReference Include="Pkcs11Interop" Version="5.3.0" />
  <PackageReference Include="PCSC" Version="7.0.1" />
</ItemGroup>
```

## 🎨 UI Framework Seçenekleri

### 1. ModernWpfUI (Önerilen)
```csharp
// Windows 11 tarzı modern UI
// Fluent Design System
// Kolay entegrasyon
```

### 2. MaterialDesignInXAML
```csharp
// Material Design
// Renkli, modern
// Çok bileşen
```

### 3. HandyControl
```csharp
// Modern Çin kaynaklı
// Çok özellik
// İyi dokümantasyon
```

## 📅 Geçiş Planı - 3 Hafta

### Hafta 1: Temel Altyapı
**Gün 1-2: Proje Setup**
- [ ] Visual Studio 2022 kurulumu
- [ ] .NET 8.0 SDK
- [ ] WPF projesi oluştur
- [ ] NuGet paketleri yükle
- [ ] Git repository

**Gün 3-4: Database**
- [ ] Entity Framework Core setup
- [ ] Models oluştur (Court, Vehicle, Job)
- [ ] DbContext yapılandır
- [ ] Migrations oluştur
- [ ] Seed data ekle

**Gün 5: Test**
- [ ] Database CRUD testleri
- [ ] Migration testleri
- [ ] Seed data doğrula

### Hafta 2: Core Features
**Gün 6-8: MVVM Setup**
- [ ] ViewModels oluştur
- [ ] Commands setup
- [ ] Services layer
- [ ] Dependency Injection

**Gün 9-11: Mahkeme Modülü**
- [ ] CourtManagement.xaml
- [ ] CourtViewModel
- [ ] CRUD işlemleri
- [ ] DataGrid entegrasyonu

**Gün 12: Araç Modülü**
- [ ] VehicleManagement.xaml
- [ ] VehicleViewModel
- [ ] CRUD işlemleri

### Hafta 3: İş Modülü ve Finalizasyon
**Gün 13-15: İş Modülü**
- [ ] JobManagement.xaml
- [ ] JobViewModel
- [ ] Foreign key ilişkileri
- [ ] Filtreler

**Gün 16-17: Export**
- [ ] Excel export (ClosedXML)
- [ ] PDF export (QuestPDF)

**Gün 18-19: Dashboard**
- [ ] İstatistikler
- [ ] Grafikler (LiveCharts2)

**Gün 20-21: Publishing**
- [ ] ClickOnce publishing
- [ ] Auto-update setup
- [ ] Installer test

## 💻 Örnek Kod - Court Management

### Model (Court.cs)
```csharp
public class Court
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string City { get; set; }
    public string Phone { get; set; }
    public DateTime CreatedAt { get; set; }
    
    // Navigation
    public ICollection<Job> Jobs { get; set; }
}
```

### ViewModel (CourtViewModel.cs)
```csharp
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;

public partial class CourtViewModel : ObservableObject
{
    private readonly CourtService _courtService;
    
    [ObservableProperty]
    private ObservableCollection<Court> courts;
    
    [ObservableProperty]
    private Court selectedCourt;
    
    public CourtViewModel(CourtService courtService)
    {
        _courtService = courtService;
        LoadCourts();
    }
    
    [RelayCommand]
    private async Task LoadCourts()
    {
        Courts = new ObservableCollection<Court>(
            await _courtService.GetAllAsync()
        );
    }
    
    [RelayCommand]
    private async Task SaveCourt()
    {
        await _courtService.SaveAsync(SelectedCourt);
        await LoadCourts();
    }
    
    [RelayCommand]
    private async Task DeleteCourt(Court court)
    {
        await _courtService.DeleteAsync(court.Id);
        await LoadCourts();
    }
}
```

### View (CourtManagement.xaml)
```xml
<Page x:Class="IsTakip.Views.CourtManagement"
      xmlns:ui="http://schemas.modernwpf.com/2019">
    
    <Grid>
        <Grid.RowDefinitions>
            <RowDefinition Height="Auto"/>
            <RowDefinition Height="*"/>
        </Grid.RowDefinitions>
        
        <!-- Toolbar -->
        <StackPanel Orientation="Horizontal" Margin="10">
            <Button Content="Yeni Mahkeme" 
                    Command="{Binding NewCourtCommand}"
                    Style="{StaticResource AccentButtonStyle}"/>
            <Button Content="Kaydet" 
                    Command="{Binding SaveCourtCommand}"/>
            <Button Content="Sil" 
                    Command="{Binding DeleteCourtCommand}"/>
        </StackPanel>
        
        <!-- DataGrid -->
        <DataGrid Grid.Row="1"
                  ItemsSource="{Binding Courts}"
                  SelectedItem="{Binding SelectedCourt}"
                  AutoGenerateColumns="False">
            <DataGrid.Columns>
                <DataGridTextColumn Header="ID" Binding="{Binding Id}"/>
                <DataGridTextColumn Header="Ad" Binding="{Binding Name}"/>
                <DataGridTextColumn Header="Şehir" Binding="{Binding City}"/>
                <DataGridTextColumn Header="Telefon" Binding="{Binding Phone}"/>
            </DataGrid.Columns>
        </DataGrid>
    </Grid>
</Page>
```

### Service (CourtService.cs)
```csharp
public class CourtService
{
    private readonly AppDbContext _context;
    
    public CourtService(AppDbContext context)
    {
        _context = context;
    }
    
    public async Task<List<Court>> GetAllAsync()
    {
        return await _context.Courts
            .OrderBy(c => c.Name)
            .ToListAsync();
    }
    
    public async Task<Court> GetByIdAsync(int id)
    {
        return await _context.Courts
            .Include(c => c.Jobs)
            .FirstOrDefaultAsync(c => c.Id == id);
    }
    
    public async Task SaveAsync(Court court)
    {
        if (court.Id == 0)
            _context.Courts.Add(court);
        else
            _context.Courts.Update(court);
            
        await _context.SaveChangesAsync();
    }
    
    public async Task DeleteAsync(int id)
    {
        var court = await GetByIdAsync(id);
        if (court != null)
        {
            _context.Courts.Remove(court);
            await _context.SaveChangesAsync();
        }
    }
}
```

## 🚀 Publishing - ClickOnce

### 1. Visual Studio'da Publish
```
Sağ tık proje → Publish → ClickOnce
```

### 2. Ayarlar
- **Install Location**: File share veya web server
- **Update Settings**: Auto-update enable
- **Prerequisites**: .NET 8.0 Runtime

### 3. Çıktı
```
publish/
├── İşTakipSistemi.application     # ~5KB
├── setup.exe                       # ~500KB
└── Application Files/
    └── İşTakipSistemi_1_0_0_0/    # ~10MB (ilk yükleme)
```

### 4. Update
Yeni versiyonu publish et, kullanıcılar otomatik alır (delta: ~5MB)

## 📊 Maliyet ve Süre Karşılaştırması

### Electron ile Devam
- ✅ Mevcut kod çalışıyor
- ❌ Her build 5-10 dakika
- ❌ Build sorunlarıyla uğraşma
- ❌ 150MB update'ler
- ❌ Yavaş performans
- ❌ Code signing maliyeti

**Toplam Maliyet**: 
- Zaman: Her build'de 1-2 saat troubleshooting
- Para: $300-400/yıl code signing
- Kullanıcı deneyimi: Kötü

### .NET'e Geçiş
- ❌ 3 hafta geliştirme
- ✅ Build sorunsuz (1-2 dakika)
- ✅ 5-10MB update'ler
- ✅ Hızlı performans
- ✅ Ücretsiz publishing

**Toplam Maliyet**:
- Zaman: 3 hafta geliştirme (bir kerelik)
- Para: $0
- Kullanıcı deneyimi: Mükemmel

## 🎯 Karar

### Electron ile Devam Et Eğer:
- ❌ Cross-platform şart
- ❌ Web teknolojilerinde uzman ekip
- ❌ 3 hafta ayıramıyorsun

### .NET'e Geç Eğer:
- ✅ Sadece Windows kullanıcıları var
- ✅ E-imza entegrasyonu gerekecek (istakip için)
- ✅ Performans ve boyut önemli
- ✅ Profesyonel görünüm istiyorsun
- ✅ Build sorunlarından kurtulmak istiyorsun

## 📞 Sonuç

**Benim önerim**: İş Takip Sistemi için Electron'da kal, **ama istakip projesini .NET ile yap**.

Sebep:
1. Ramazancatal projesi zaten çalışıyor, kod hazır
2. E-imza gerekmiyor bu projede
3. İstakip için e-imza kritik, .NET ideal
4. İki proje arasında deneyim karşılaştırması yapabilirsin

## 🚀 Başlangıç Komutu

```bash
# Visual Studio 2022 Community (Ücretsiz)
# WPF App (.NET 8.0) template seç
# Proje adı: IsTakipSistemi.WPF

dotnet new wpf -n IsTakipSistemi.WPF
cd IsTakipSistemi.WPF
dotnet add package CommunityToolkit.Mvvm
dotnet add package ModernWpfUI
dotnet add package Microsoft.EntityFrameworkCore.Sqlite
dotnet run
```
