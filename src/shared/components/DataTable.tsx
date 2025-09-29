import React, { useState, useMemo } from 'react'
import { ChevronLeftIcon, ChevronRightIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import { exportToExcel, exportToPDF, exportToCSV, ExportColumn } from '../utils/exportUtils'

interface Column<T> {
  key: keyof T | string
  title: string
  render?: (value: any, item: T) => React.ReactNode
  sortable?: boolean
  width?: string
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  searchTerm?: string
  filterValue?: string
  onSearchChange?: (value: string) => void
  onFilterChange?: (value: string) => void
  filterOptions?: { value: string; label: string }[]
  filterPlaceholder?: string
  searchPlaceholder?: string
  pageSize?: number
  pageSizeOptions?: number[]
  onPageSizeChange?: (size: number) => void
  emptyMessage?: string
  emptyDescription?: string
  className?: string
  enableExport?: boolean
  exportTitle?: string
  exportFilename?: string
}

function DataTable<T extends { id: number | string }>({
  data,
  columns,
  searchTerm = '',
  filterValue = 'all',
  onSearchChange,
  onFilterChange,
  filterOptions = [],
  filterPlaceholder = 'Filtrele',
  searchPlaceholder = 'Ara...',
  pageSize = 10,
  pageSizeOptions = [10, 25, 50, 100],
  onPageSizeChange,
  emptyMessage = 'Veri bulunamadı',
  emptyDescription = 'Arama kriterlerinizi değiştirip tekrar deneyin.',
  className = '',
  enableExport = false,
  exportTitle = 'Veri Raporu',
  exportFilename = 'veri'
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1)
  const [sortConfig, setSortConfig] = useState<{
    key: string
    direction: 'asc' | 'desc'
  } | null>(null)

  // Sıralama
  const sortedData = useMemo(() => {
    if (!sortConfig) return data

    return [...data].sort((a, b) => {
      const aValue = (a as any)[sortConfig.key]
      const bValue = (b as any)[sortConfig.key]

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1
      }
      return 0
    })
  }, [data, sortConfig])

  // Sayfalama hesaplamaları
  const totalPages = Math.ceil(sortedData.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const currentData = sortedData.slice(startIndex, endIndex)

  // Sayfa değiştiğinde başa dön
  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, pageSize])

  const handleSort = (key: string) => {
    setSortConfig(current => {
      if (current?.key === key) {
        return {
          key,
          direction: current.direction === 'asc' ? 'desc' : 'asc'
        }
      }
      return { key, direction: 'asc' }
    })
  }

  const renderSortIcon = (key: string) => {
    if (sortConfig?.key !== key) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      )
    }

    return sortConfig.direction === 'asc' ? (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    )
  }

  // Export fonksiyonları
  const handleExportExcel = () => {
    const exportColumns: ExportColumn[] = columns
      .filter(col => col.key !== 'actions') // İşlemler kolonunu hariç tut
      .map(col => ({
        key: col.key as string,
        title: col.title,
        width: 15
      }))

    const exportData = sortedData.map(item => {
      const exportItem: any = {}
      exportColumns.forEach(col => {
        const value = (item as any)[col.key]
        // Render fonksiyonu varsa ham veriyi al, yoksa değeri olduğu gibi al
        exportItem[col.key] = value
      })
      return exportItem
    })

    exportToExcel(exportData, exportColumns, exportFilename)
  }

  const handleExportPDF = () => {
    const exportColumns: ExportColumn[] = columns
      .filter(col => col.key !== 'actions')
      .map(col => ({
        key: col.key as string,
        title: col.title,
        width: 15
      }))

    const exportData = sortedData.map(item => {
      const exportItem: any = {}
      exportColumns.forEach(col => {
        const value = (item as any)[col.key]
        exportItem[col.key] = value
      })
      return exportItem
    })

    exportToPDF(exportData, exportColumns, exportTitle, exportFilename)
  }

  const handleExportCSV = () => {
    const exportColumns: ExportColumn[] = columns
      .filter(col => col.key !== 'actions')
      .map(col => ({
        key: col.key as string,
        title: col.title,
        width: 15
      }))

    const exportData = sortedData.map(item => {
      const exportItem: any = {}
      exportColumns.forEach(col => {
        const value = (item as any)[col.key]
        exportItem[col.key] = value
      })
      return exportItem
    })

    exportToCSV(exportData, exportColumns, exportFilename)
  }

  const renderPaginationButton = (page: number, label?: string) => (
    <button
      key={page}
      onClick={() => setCurrentPage(page)}
      className={`relative inline-flex items-center px-4 py-2 text-sm font-medium border ${
        currentPage === page
          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
      } ${page === 1 ? 'rounded-l-md' : ''} ${page === totalPages ? 'rounded-r-md' : ''}`}
    >
      {label || page}
    </button>
  )

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header with Search and Filter */}
      {(onSearchChange || onFilterChange || enableExport) && (
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex-1 max-w-xs">
              {onSearchChange && (
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder={searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => onSearchChange('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      <svg className="h-4 w-4 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              )}
            </div>
            
            {/* Export Butonları ve Sayfa Boyutu */}
            <div className="flex items-center gap-4">
              {/* Export Butonları */}
              {enableExport && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center text-sm text-gray-600 mr-2">
                    <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                    Dışarı Aktar:
                  </div>
                  <button
                    onClick={handleExportExcel}
                    className="px-3 py-2 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors"
                    title="Excel formatında indir"
                  >
                    📊 Excel
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="px-3 py-2 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-colors"
                    title="PDF formatında indir"
                  >
                    📄 PDF
                  </button>
                  <button
                    onClick={handleExportCSV}
                    className="px-3 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    title="CSV formatında indir"
                  >
                    📋 CSV
                  </button>
                </div>
              )}

              {/* Page Size Selector */}
              {onPageSizeChange && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Sayfa:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => onPageSizeChange(Number(e.target.value))}
                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {pageSizeOptions.map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                  } ${column.width ? column.width : ''}`}
                  onClick={() => column.sortable && handleSort(String(column.key))}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.title}</span>
                    {column.sortable && renderSortIcon(String(column.key))}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center">
                    <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.562M15 6.306a7.962 7.962 0 00-6 0m6 0V5a2 2 0 00-2-2H9a2 2 0 00-2 2v1.306" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">{emptyMessage}</h3>
                    <p className="text-gray-500 text-center max-w-sm">{emptyDescription}</p>
                  </div>
                </td>
              </tr>
            ) : (
              currentData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  {columns.map((column) => (
                    <td key={String(column.key)} className="px-6 py-4 whitespace-nowrap">
                      {column.render 
                        ? column.render((item as any)[column.key], item)
                        : <div className="text-sm text-gray-900">{(item as any)[column.key]}</div>
                      }
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Önceki
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sonraki
            </button>
          </div>
          
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                <span className="font-medium">{startIndex + 1}</span> - <span className="font-medium">{Math.min(endIndex, sortedData.length)}</span> arası, 
                toplam <span className="font-medium">{sortedData.length}</span> kayıt
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let page: number
                  if (totalPages <= 5) {
                    page = i + 1
                  } else if (currentPage <= 3) {
                    page = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    page = totalPages - 4 + i
                  } else {
                    page = currentPage - 2 + i
                  }
                  return renderPaginationButton(page)
                })}
                
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DataTable
