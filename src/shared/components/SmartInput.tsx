import React, { useState, useCallback, useRef, useEffect } from 'react'

// Fuzzy matching fonksiyonları
const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix = []
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }
  
  return matrix[str2.length][str1.length]
}

const calculateSimilarity = (str1: string, str2: string): number => {
  const normalizeString = (str: string) => {
    return str
      .toLowerCase()
      .replace(/[çÇ]/g, 'c')
      .replace(/[ğĞ]/g, 'g')
      .replace(/[ıİI]/g, 'i')
      .replace(/[öÖ]/g, 'o')
      .replace(/[şŞ]/g, 's')
      .replace(/[üÜ]/g, 'u')
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  }
  
  const norm1 = normalizeString(str1)
  const norm2 = normalizeString(str2)
  
  if (norm1 === norm2) return 100
  
  const distance = levenshteinDistance(norm1, norm2)
  const maxLength = Math.max(norm1.length, norm2.length)
  
  if (maxLength === 0) return 100
  
  const similarity = ((maxLength - distance) / maxLength) * 100
  return Math.round(similarity)
}

// Suggestion item interface
interface SuggestionItem {
  id: string | number
  displayText: string
  subText?: string
  data: any
}

interface SmartInputProps {
  value: string
  onChange: (value: string) => void
  onSuggestionSelect?: (item: SuggestionItem) => void
  suggestions: SuggestionItem[]
  placeholder?: string
  label?: string
  required?: boolean
  className?: string
  minChars?: number
  maxSuggestions?: number
  similarityThreshold?: number
  debounceMs?: number
  compareField?: string // Hangi field ile karşılaştırılacak
  disabled?: boolean
  warningText?: string
  successText?: string
}

const SmartInput: React.FC<SmartInputProps> = ({
  value,
  onChange,
  onSuggestionSelect,
  suggestions = [],
  placeholder = '',
  label,
  required = false,
  className = '',
  minChars = 3,
  maxSuggestions = 5,
  similarityThreshold = 60,
  debounceMs = 300,
  compareField = 'displayText',
  disabled = false,
  warningText = 'Benzer kayıtlar bulundu:',
  successText = 'Bir öneriye tıklayarak otomatik doldurabilirsiniz'
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [similarItems, setSimilarItems] = useState<Array<{item: SuggestionItem, similarity: number}>>([])
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Benzerlik kontrolü
  const checkSimilarity = useCallback((inputValue: string) => {
    console.log('SmartInput checkSimilarity:', { inputValue, suggestions: suggestions.length, minChars })
    
    if (!inputValue || inputValue.length < minChars) {
      setSimilarItems([])
      setShowSuggestions(false)
      return
    }

    const similarities = suggestions
      .map(item => {
        const compareText = item[compareField as keyof SuggestionItem] as string || item.displayText
        const similarity = calculateSimilarity(inputValue, compareText)
        return {
          item,
          similarity
        }
      })
      .filter(item => item.similarity >= similarityThreshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, maxSuggestions)

    console.log('SmartInput similarities:', similarities)
    setSimilarItems(similarities)
    setShowSuggestions(similarities.length > 0)
    
    // Position dropdown
    if (similarities.length > 0 && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      })
    }
  }, [suggestions, minChars, maxSuggestions, similarityThreshold, compareField])

  // Debounced input handler
  const handleInputChange = useCallback((inputValue: string) => {
    onChange(inputValue)
    
    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }
    
    // Set new timer
    debounceTimer.current = setTimeout(() => {
      checkSimilarity(inputValue)
    }, debounceMs)
  }, [onChange, checkSimilarity, debounceMs])

  // Suggestion selection
  const handleSuggestionClick = (item: SuggestionItem) => {
    onChange(item.displayText)
    setShowSuggestions(false)
    if (onSuggestionSelect) {
      onSuggestionSelect(item)
    }
  }

  // Input styling based on similarity
  const getInputStyling = () => {
    if (similarItems.length === 0) return 'border-gray-300 focus:ring-blue-500'
    
    const highestSimilarity = similarItems[0]?.similarity || 0
    
    if (highestSimilarity >= 90) {
      return 'border-red-300 focus:ring-red-500 bg-red-50'
    } else if (highestSimilarity >= 75) {
      return 'border-yellow-300 focus:ring-yellow-500 bg-yellow-50'
    } else {
      return 'border-blue-300 focus:ring-blue-500 bg-blue-50'
    }
  }

  return (
    <div className={`relative ${className}`} style={{overflow: 'visible'}}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={() => value.length >= minChars && checkSimilarity(value)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${getInputStyling()}`}
      />
      
      {/* Suggestions Dropdown - Basit Çözüm */}
      {showSuggestions && similarItems.length > 0 && (
        <div 
          className="absolute w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto" 
          style={{
            zIndex: 999999,
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0
          }}
        >
          {/* Header */}
          <div className="p-2 bg-gray-50 border-b">
            <div className="flex items-center text-sm text-gray-600">
              <svg className="w-4 h-4 mr-2 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {warningText}
            </div>
          </div>
          
          {/* Suggestions List */}
          {similarItems.map((item, index) => (
            <div
              key={item.item.id}
              className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
              onClick={() => handleSuggestionClick(item.item)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    {item.item.displayText}
                  </div>
                  {item.item.subText && (
                    <div className="text-xs text-gray-500">
                      {item.item.subText}
                    </div>
                  )}
                </div>
                <div className="ml-2 flex items-center">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    item.similarity >= 90
                      ? 'bg-red-100 text-red-800'
                      : item.similarity >= 75
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    %{item.similarity}
                  </span>
                  {item.similarity >= 90 && (
                    <svg className="w-4 h-4 ml-1 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {/* Footer */}
          <div className="p-2 bg-gray-50 text-xs text-gray-500 text-center">
            💡 {successText}
          </div>
        </div>
      )}
    </div>
  )
}

export default SmartInput
