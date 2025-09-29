export interface Court {
  id: number
  name: string
  city: string
  district?: string // İsteğe bağlı
  type?: string // İsteğe bağlı (eski veriler için)
  address?: string // İsteğe bağlı
  phone?: string // İsteğe bağlı
  email?: string // İsteğe bağlı
  contact?: string // İlgili kişi - İsteğe bağlı
  notes?: string // Not - İsteğe bağlı
  createdAt?: string // Oluşturulma tarihi
  updatedAt?: string // Güncellenme tarihi
}

export interface CreateCourtRequest {
  name: string
  city: string
  district?: string // İsteğe bağlı
  type?: string // İsteğe bağlı (eski veriler için)
  address?: string // İsteğe bağlı
  phone?: string // İsteğe bağlı
  email?: string // İsteğe bağlı
  contact?: string // İlgili kişi - İsteğe bağlı
  notes?: string // Not - İsteğe bağlı
}

export interface UpdateCourtRequest extends CreateCourtRequest {
  id: number
}

export type CourtType = 
  | 'Asliye Hukuk' 
  | 'Asliye Ceza' 
  | 'Aile' 
  | 'İcra Hukuk' 
  | 'İş' 
  | 'Ticaret' 
  | 'Sulh Hukuk' 
  | 'Sulh Ceza'
  | 'İdare'
  | 'Vergi'

export const COURT_TYPES: CourtType[] = [
  'Asliye Hukuk',
  'Asliye Ceza',
  'Aile',
  'İcra Hukuk',
  'İş',
  'Ticaret',
  'Sulh Hukuk',
  'Sulh Ceza',
  'İdare',
  'Vergi'
]

// Türkiye'nin tüm şehirleri (81 il)
export const TURKISH_CITIES = [
  'Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Amasya', 'Ankara', 'Antalya', 'Artvin',
  'Aydın', 'Balıkesir', 'Bilecik', 'Bingöl', 'Bitlis', 'Bolu', 'Burdur', 'Bursa',
  'Çanakkale', 'Çankırı', 'Çorum', 'Denizli', 'Diyarbakır', 'Edirne', 'Elazığ', 'Erzincan',
  'Erzurum', 'Eskişehir', 'Gaziantep', 'Giresun', 'Gümüşhane', 'Hakkâri', 'Hatay', 'Isparta',
  'Mersin', 'İstanbul', 'İzmir', 'Kars', 'Kastamonu', 'Kayseri', 'Kırklareli', 'Kırşehir',
  'Kocaeli', 'Konya', 'Kütahya', 'Malatya', 'Manisa', 'Kahramanmaraş', 'Mardin', 'Muğla',
  'Muş', 'Nevşehir', 'Niğde', 'Ordu', 'Rize', 'Sakarya', 'Samsun', 'Siirt',
  'Sinop', 'Sivas', 'Tekirdağ', 'Tokat', 'Trabzon', 'Tunceli', 'Şanlıurfa', 'Uşak',
  'Van', 'Yozgat', 'Zonguldak', 'Aksaray', 'Bayburt', 'Karaman', 'Kırıkkale', 'Batman',
  'Şırnak', 'Bartın', 'Ardahan', 'Iğdır', 'Yalova', 'Karabük', 'Kilis', 'Osmaniye', 'Düzce'
].sort() // Alfabetik sıralama
