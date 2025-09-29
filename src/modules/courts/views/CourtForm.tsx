import React, { useState, useEffect } from 'react'
import { Court, CreateCourtRequest, UpdateCourtRequest, COURT_TYPES, TURKISH_CITIES } from '../../../shared/types/Court'
import { courtController, validateEmail, validatePhone, formatPhone } from '../controllers/CourtController'
import SmartInput from '../../../shared/components/SmartInput'

interface CourtFormProps {
  court?: Court | null // Düzenleme için mevcut mahkeme
  onSubmit: (court: Court) => void
  onCancel: () => void
  isOpen: boolean
}

const CourtForm: React.FC<CourtFormProps> = ({
  court,
  onSubmit,
  onCancel,
  isOpen
}) => {
  const [formData, setFormData] = useState({
    name: '',
    city: 'Antalya',
    phone: '',
    email: '',
    contact: '',
    notes: ''
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nameSuggestions, setNameSuggestions] = useState<any[]>([])

  // Form verilerini sıfırla
  const resetForm = () => {
    if (court) {
      // Düzenleme modu
      setFormData({
        name: court.name,
        city: court.city,
        phone: court.phone || '',
        email: court.email || '',
        contact: court.contact || '',
        notes: court.notes || ''
      })
    } else {
      // Yeni ekleme modu
      setFormData({
        name: '',
        city: 'Antalya',
        phone: '',
        email: '',
        contact: '',
        notes: ''
      })
    }
    setError(null)
  }

  // Modal açıldığında formu sıfırla
  useEffect(() => {
    if (isOpen) {
      resetForm()
      loadNameSuggestions()
    }
  }, [isOpen, court])

  // İsim önerilerini yükle
  const loadNameSuggestions = async () => {
    try {
      const allCourts = await courtController.getCourts()
      const suggestions = allCourts
        .filter(c => court ? c.id !== court.id : true) // Düzenleme modunda mevcut mahkemeyi hariç tut
        .map(c => ({
          id: c.id,
          displayText: c.name,
          subText: `${c.city} / ${c.district} - ${c.type}`,
          data: c
        }))
      
      setNameSuggestions(suggestions)
    } catch (err) {
      console.error('Error loading name suggestions:', err)
    }
  }

  // Mahkeme adını formatla (Kelime başları büyük, diğerleri küçük)
  const formatCourtName = (name: string): string => {
    // Eğer boş string ise direkt döndür
    if (!name || name.trim() === '') return name
    
    return name
      .split(' ') // Kelimelere ayır (boşlukları koru)
      .map(word => {
        if (word.length === 0) return word // Boş kelimeler için (çoklu boşluklar)
        // İlk harfi büyük, geri kalanı küçük
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      })
      .join(' ') // Kelimeleri birleştir
  }

  // Mahkeme adı değiştiğinde formatla (sadece kelime tamamlandığında)
  const handleNameChange = (value: string) => {
    // Eğer son karakter boşluk ise formatlamayı bekle
    if (value.endsWith(' ')) {
      setFormData({...formData, name: value})
    } else {
      // Son kelimeyi formatla
      const words = value.split(' ')
      const lastWordIndex = words.length - 1
      
      if (words[lastWordIndex] && words[lastWordIndex].length > 0) {
        words[lastWordIndex] = words[lastWordIndex].charAt(0).toUpperCase() + 
                              words[lastWordIndex].slice(1).toLowerCase()
      }
      
      const formattedName = words.join(' ')
      setFormData({...formData, name: formattedName})
    }
  }

  // İsim önerisi seçimi
  const handleNameSuggestionSelect = (suggestion: any) => {
    const selectedCourt = suggestion.data as Court
        setFormData({
          name: selectedCourt.name,
          city: selectedCourt.city,
          phone: selectedCourt.phone || '',
          email: selectedCourt.email || '',
          contact: selectedCourt.contact || '',
          notes: selectedCourt.notes || ''
        })
  }

  // Telefon formatı
  const handlePhoneChange = (value: string) => {
    const formatted = formatPhone(value)
    setFormData({ ...formData, phone: formatted })
  }

  // Form gönderimi
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Client-side validasyonlar - Sadece zorunlu alanlar
    if (!formData.name.trim()) {
      setError('Mahkeme adı zorunludur')
      return
    }

    if (!formData.city.trim()) {
      setError('Şehir alanı zorunludur')
      return
    }


    // İsteğe bağlı alanlar için validasyon (sadece dolu ise)
    if (formData.phone && formData.phone.trim() && !validatePhone(formData.phone)) {
      setError('Geçerli bir telefon numarası giriniz (örn: 0212 555 0101)')
      return
    }

    if (formData.email && formData.email.trim() && !validateEmail(formData.email)) {
      setError('Geçerli bir e-posta adresi giriniz')
      return
    }

    try {
      setLoading(true)
      setError(null)

      let result: Court

      if (court) {
        // Güncelleme
        const updateData: UpdateCourtRequest = {
          id: court.id,
          ...formData
        }
        const updated = await courtController.updateCourt(updateData)
        if (!updated) {
          throw new Error('Mahkeme güncellenemedi')
        }
        result = updated
      } else {
        // Yeni ekleme
        const createData: CreateCourtRequest = formData
        result = await courtController.createCourt(createData)
      }

      onSubmit(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İşlem sırasında hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 backdrop-blur-sm overflow-y-auto h-full w-full z-[9999] flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onCancel()
        }
      }}
    >
      <div className="relative mx-auto p-6 border-0 w-full max-w-4xl shadow-2xl rounded-xl bg-white/95 backdrop-blur-md">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {court ? 'Mahkeme Düzenle' : 'Yeni Mahkeme Ekle'}
          </h3>
          
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4" style={{overflow: 'visible'}}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{overflow: 'visible'}}>
              <div className="md:col-span-2">
                <SmartInput
                  value={formData.name}
                  onChange={handleNameChange}
                  onSuggestionSelect={handleNameSuggestionSelect}
                  suggestions={nameSuggestions}
                  label="Mahkeme Adı"
                  placeholder="1. Asliye Hukuk Mahkemesi"
                  required
                  similarityThreshold={30}
                  warningText="Benzer mahkemeler bulundu:"
                  successText="Bir öneriye tıklayarak formu otomatik doldurabilirsiniz"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Şehir <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Şehir adını giriniz"
                  required
                />
              </div>
              
            </div>

            {/* İsteğe Bağlı Alanlar */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">İsteğe Bağlı Bilgiler</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefon
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                      formData.phone && !validatePhone(formData.phone) 
                        ? 'border-red-300 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    placeholder="0212 555 0101"
                  />
                  {formData.phone && !validatePhone(formData.phone) && (
                    <div className="mt-1 text-xs text-red-600">
                      Geçerli format: 0212 555 0101
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    E-posta
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                      formData.email && !validateEmail(formData.email) 
                        ? 'border-red-300 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    placeholder="mahkeme@adalet.gov.tr"
                  />
                  {formData.email && !validateEmail(formData.email) && (
                    <div className="mt-1 text-xs text-red-600">
                      Geçerli bir e-posta adresi giriniz
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    İlgili Kişi
                  </label>
                  <input
                    type="text"
                    value={formData.contact}
                    onChange={(e) => setFormData({...formData, contact: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ahmet Yılmaz"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Not
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ek bilgiler..."
                    rows={2}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                disabled={loading}
              >
                İptal
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {court ? 'Güncelleniyor...' : 'Ekleniyor...'}
                  </div>
                ) : (
                  court ? 'Güncelle' : 'Ekle'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CourtForm
