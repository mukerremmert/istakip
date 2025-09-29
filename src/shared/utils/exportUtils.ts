import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// jsPDF için TypeScript declaration
declare module 'jspdf' {
  interface jsPDF {
    autoTable: typeof autoTable
  }
}

export interface ExportColumn {
  key: string
  title: string
  width?: number
}

export interface ExportData {
  [key: string]: any
}

// Excel export
export const exportToExcel = (
  data: ExportData[],
  columns: ExportColumn[],
  filename: string = 'export'
) => {
  try {
    // Sadece belirtilen kolonları al
    const exportData = data.map(row => {
      const newRow: any = {}
      columns.forEach(col => {
        newRow[col.title] = row[col.key] || ''
      })
      return newRow
    })

    // Workbook oluştur
    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    
    // Kolon genişliklerini ayarla
    const colWidths = columns.map(col => ({ wch: col.width || 15 }))
    ws['!cols'] = colWidths
    
    XLSX.utils.book_append_sheet(wb, ws, 'Veriler')
    
    // Dosyayı indir
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
    XLSX.writeFile(wb, `${filename}_${timestamp}.xlsx`)
    
    return true
  } catch (error) {
    console.error('Excel export hatası:', error)
    return false
  }
}

// PDF export - Canvas tabanlı tablo
export const exportToPDF = (
  data: ExportData[],
  columns: ExportColumn[],
  _title: string = 'Rapor', // Başlık kaldırıldığı için kullanılmıyor
  filename: string = 'export'
) => {
  try {
    const doc = new jsPDF('l', 'mm', 'a4') // Landscape orientation
    
    // Tablo parametreleri (başlık kaldırıldı, direkt tablo)
    const startY = 20
    const startX = 14
    const rowHeight = 8
    // A4 landscape genişliği - 297mm
    
    // Otomatik kolon genişliği hesaplama
    const calculateColumnWidths = () => {
      const availableWidth = 297 - 28 // A4 landscape - margins
      const columnWidths: { [key: string]: number } = {}
      
      // Her kolon için maksimum içerik uzunluğunu hesapla
      const maxLengths: { [key: string]: number } = {}
      
      columns.forEach(col => {
        // Başlık uzunluğu
        let maxLength = col.title.length
        
        // Veri uzunluklarını kontrol et (ilk 20 kayıt)
        data.slice(0, 20).forEach(row => {
          let value = String(row[col.key] || '')
          
          // Özel format düzenlemeleri
          if (col.key === 'totalAmount' && typeof row[col.key] === 'number') {
            value = row[col.key].toLocaleString('tr-TR') + ' TL'
          }
          
          if (value.length > maxLength) {
            maxLength = value.length
          }
        })
        
        maxLengths[col.key] = maxLength
      })
      
      // Minimum ve maksimum genişlikler
      const minWidths: { [key: string]: number } = {
        'id': 8,
        'date': 25,
        'fileNumber': 20,
        'totalAmount': 18
      }
      
      const maxWidths: { [key: string]: number } = {
        'courtName': 90,
        'status': 40,
        'paymentStatus': 35,
        'invoiceStatus': 35
      }
      
      // Her kolon için genişlik hesapla
      let totalCalculatedWidth = 0
      columns.forEach(col => {
        const contentLength = maxLengths[col.key]
        const minWidth = minWidths[col.key] || 25
        const maxWidth = maxWidths[col.key] || 50
        
        // Karakter başına ~2.5mm hesabı
        let calculatedWidth = Math.max(contentLength * 2.5, minWidth)
        calculatedWidth = Math.min(calculatedWidth, maxWidth)
        
        columnWidths[col.key] = Math.round(calculatedWidth)
        totalCalculatedWidth += columnWidths[col.key]
      })
      
      // Eğer toplam genişlik kullanılabilir alandan fazlaysa, orantılı küçült
      if (totalCalculatedWidth > availableWidth) {
        const scale = availableWidth / totalCalculatedWidth
        columns.forEach(col => {
          columnWidths[col.key] = Math.round(columnWidths[col.key] * scale)
        })
      }
      
      return columnWidths
    }
    
    const columnWidths = calculateColumnWidths()
    
    // Debug: Hesaplanan genişlikleri logla
    console.log('PDF Kolon Genişlikleri:', columnWidths)
    
    let currentY = startY
    let currentX = startX
    
    // Tablo genişliğini hesapla
    const totalTableWidth = columns.reduce((sum, col) => 
      sum + (columnWidths[col.key] || 25), 0
    )
    
    // Tablo çerçevesi ve başlık satırı
    doc.setFillColor(66, 139, 202) // Mavi başlık
    doc.rect(startX, currentY, totalTableWidth, rowHeight, 'F')
    
    // Başlık metinleri
    doc.setTextColor(255, 255, 255) // Beyaz metin
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    
    currentX = startX
    columns.forEach((col) => {
      const colWidth = columnWidths[col.key] || 25
      const x = currentX + 2
      const y = currentY + 5
      
      // Başlık Türkçe karakterlerini düzelt
      const cleanTitle = col.title.replace(/[çÇğĞıİöÖşŞüÜ]/g, (char) => {
        const map: { [key: string]: string } = {
          'ç': 'c', 'Ç': 'C', 'ğ': 'g', 'Ğ': 'G',
          'ı': 'i', 'İ': 'I', 'ö': 'o', 'Ö': 'O',
          'ş': 's', 'Ş': 'S', 'ü': 'u', 'Ü': 'U'
        }
        return map[char] || char
      })
      
      doc.text(cleanTitle, x, y)
      currentX += colWidth
    })
    
    currentY += rowHeight
    doc.setTextColor(0, 0, 0) // Siyah metin
    doc.setFont('helvetica', 'normal')
    
    // Veri satırları
    data.forEach((row, rowIndex) => {
      // Alternatif satır rengi
      if (rowIndex % 2 === 1) {
        doc.setFillColor(245, 245, 245)
        doc.rect(startX, currentY, totalTableWidth, rowHeight, 'F')
      }
      
      // Satır çerçevesi
      doc.setDrawColor(200, 200, 200)
      doc.rect(startX, currentY, totalTableWidth, rowHeight, 'S')
      
      // Hücre verileri
      currentX = startX
      columns.forEach((col, colIndex) => {
        const colWidth = columnWidths[col.key] || 25
        let value = String(row[col.key] || '')
        
        // Özel format düzenlemeleri
        if (col.key === 'totalAmount' && typeof row[col.key] === 'number') {
          // Tutar formatı - binlik ayraç
          value = row[col.key].toLocaleString('tr-TR') + ' TL'
        }
        
        // Tüm Türkçe karakterleri düzelt (PDF uyumluluğu için)
        value = value.replace(/[çÇğĞıİöÖşŞüÜ]/g, (char) => {
          const map: { [key: string]: string } = {
            'ç': 'c', 'Ç': 'C', 'ğ': 'g', 'Ğ': 'G',
            'ı': 'i', 'İ': 'I', 'ö': 'o', 'Ö': 'O',
            'ş': 's', 'Ş': 'S', 'ü': 'u', 'Ü': 'U'
          }
          return map[char] || char
        })
        
        const x = currentX + 2
        const y = currentY + 5
        
        // Metin uzunluğuna göre akıllı kısaltma
        let displayValue = value
        const maxLength = Math.floor(colWidth / 2.5) // Daha gerçekçi karakter sınırı
        
        if (value.length > maxLength) {
          if (col.key === 'courtName') {
            // Mahkeme isimlerinde "Mahkemesi" kısmını kısalt
            displayValue = value.replace(' Mahkemesi', ' Mah.').replace(' Hukuk', ' H.')
            if (displayValue.length > maxLength) {
              displayValue = displayValue.substring(0, maxLength - 3) + '...'
            }
          } else if (col.key === 'status') {
            // Durum kısaltmaları
            displayValue = value.replace('Devam Ediyor', 'Devam Ed.').replace('Beklemede', 'Beklem.')
          } else {
            // Diğer kolonlar için normal kısaltma
            displayValue = value.substring(0, maxLength - 3) + '...'
          }
        }
        
        doc.text(displayValue, x, y)
        
        // Hücre dikey çizgileri
        if (colIndex < columns.length - 1) {
          doc.line(currentX + colWidth, currentY, currentX + colWidth, currentY + rowHeight)
        }
        
        currentX += colWidth
      })
      
      currentY += rowHeight
      
      // Sayfa sonu kontrolü
      if (currentY > 200) {
        doc.addPage()
        currentY = 20
        
        // Yeni sayfada başlık tekrar
        doc.setFillColor(66, 139, 202)
        doc.rect(startX, currentY, totalTableWidth, rowHeight, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFont('helvetica', 'bold')
        
        currentX = startX
        columns.forEach((col) => {
          const colWidth = columnWidths[col.key] || 25
          const x = currentX + 2
          const y = currentY + 5
          
          // Başlık Türkçe karakterlerini düzelt
          const cleanTitle = col.title.replace(/[çÇğĞıİöÖşŞüÜ]/g, (char) => {
            const map: { [key: string]: string } = {
              'ç': 'c', 'Ç': 'C', 'ğ': 'g', 'Ğ': 'G',
              'ı': 'i', 'İ': 'I', 'ö': 'o', 'Ö': 'O',
              'ş': 's', 'Ş': 'S', 'ü': 'u', 'Ü': 'U'
            }
            return map[char] || char
          })
          
          doc.text(cleanTitle, x, y)
          currentX += colWidth
        })
        
        currentY += rowHeight
        doc.setTextColor(0, 0, 0)
        doc.setFont('helvetica', 'normal')
      }
    })
    
    // Alt bilgiler - Toplam kayıt ve tarih
    doc.setFontSize(8)
    doc.text(`Toplam ${data.length} kayit`, startX, currentY + 15)
    doc.text(`Olusturulma Tarihi: ${new Date().toLocaleDateString('tr-TR')}`, startX + 100, currentY + 15)
    
    // Dosyayı indir
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
    doc.save(`${filename}_${timestamp}.pdf`)
    
    return true
  } catch (error) {
    console.error('PDF export hatası:', error)
    return false
  }
}

// CSV export - Excel uyumlu
export const exportToCSV = (
  data: ExportData[],
  columns: ExportColumn[],
  filename: string = 'export'
) => {
  try {
    // CSV başlıkları (Türkçe karakterler korunur)
    const headers = columns.map(col => `"${col.title}"`).join(';') // Excel için noktalı virgül
    
    // CSV verileri
    const csvData = data.map(row => 
      columns.map(col => {
        let value = row[col.key] || ''
        
        // Özel format düzenlemeleri
        if (typeof value === 'number') {
          // Sayıları Türkçe formatla (virgül ondalık ayırıcı)
          value = value.toLocaleString('tr-TR')
        }
        
        // String'e çevir ve escape et
        const stringValue = String(value)
        const escapedValue = stringValue.replace(/"/g, '""')
        return `"${escapedValue}"`
      }).join(';') // Excel için noktalı virgül
    ).join('\n')
    
    // Tam CSV içeriği
    const csvContent = `${headers}\n${csvData}`
    
    // BOM ekleyerek UTF-8 desteği (Excel için önemli)
    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csvContent], { 
      type: 'text/csv;charset=utf-8;' 
    })
    
    // Dosyayı indir
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
    link.setAttribute('download', `${filename}_${timestamp}.csv`)
    
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Cleanup
    URL.revokeObjectURL(url)
    
    return true
  } catch (error) {
    console.error('CSV export hatası:', error)
    return false
  }
}

// Tarih formatını export için düzenle
export const formatDateForExport = (dateStr: string): string => {
  // DD.MM.YYYY formatını korur
  return dateStr || ''
}

// Para formatını export için düzenle
export const formatCurrencyForExport = (amount: number): string => {
  return amount.toLocaleString('tr-TR', {
    style: 'currency',
    currency: 'TRY'
  })
}
