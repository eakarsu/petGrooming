import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface Column {
  header: string
  accessor: string | ((row: any) => string)
}

export function exportToCSV(data: any[], columns: Column[], filename: string) {
  const headers = columns.map((col) => col.header)
  const rows = data.map((row) =>
    columns.map((col) => {
      const value = typeof col.accessor === 'function' ? col.accessor(row) : row[col.accessor]
      // Escape commas and quotes in CSV
      const str = String(value ?? '')
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    })
  )

  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${filename}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
}

export function exportToPDF(data: any[], columns: Column[], filename: string, title: string) {
  const doc = new jsPDF()

  // Title
  doc.setFontSize(18)
  doc.text(title, 14, 22)
  doc.setFontSize(10)
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 30)

  const headers = columns.map((col) => col.header)
  const rows = data.map((row) =>
    columns.map((col) => {
      const value = typeof col.accessor === 'function' ? col.accessor(row) : row[col.accessor]
      return String(value ?? '')
    })
  )

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 36,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [79, 70, 229] },
  })

  doc.save(`${filename}.pdf`)
}
