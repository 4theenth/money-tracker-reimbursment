import { NextRequest, NextResponse } from 'next/server'
import * as ExcelJS from 'exceljs'
import { getPassbookData } from '@/lib/passbook'
import { formatCurrency, formatDate } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const month = searchParams.get('month')
    const year = searchParams.get('year')
    const location = searchParams.get('location') || 'all'

    if (!month || !year) {
      return NextResponse.json(
        { error: 'Month and year required' },
        { status: 400 }
      )
    }

    const data = await getPassbookData(parseInt(month), parseInt(year), location)

    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'Money Tracker'
    workbook.created = new Date()

    const worksheet = workbook.addWorksheet('Buku Tabungan')

    // Page setup
    worksheet.pageSetup = {
      orientation: 'landscape',
      paperSize: 9, // A4
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
    }

    // Set Column Widths
    worksheet.columns = [
      { key: 'no', width: 6 },
      { key: 'date', width: 14 },
      { key: 'category', width: 22 },
      { key: 'description', width: 34 },
      { key: 'account', width: 20 },
      { key: 'debit', width: 18 },
      { key: 'credit', width: 18 },
      { key: 'balance', width: 20 },
    ]

    let currentRow = 1

    // 1. Header Banner
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`)
    const titleCell = worksheet.getCell(`A${currentRow}`)
    titleCell.value = 'BUKU TABUNGAN & REKENING KORAN'
    titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } }
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E40AF' }, // Blue 800
    }
    worksheet.getRow(currentRow).height = 36
    currentRow++

    // 2. Subtitle / Metadata
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`)
    const subCell = worksheet.getCell(`A${currentRow}`)
    subCell.value = `Rekening: ${data.locationTitle} | Periode: ${data.period.label} | Diekspor: ${new Date().toLocaleDateString('id-ID')}`
    subCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF374151' } }
    subCell.alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getRow(currentRow).height = 22
    currentRow += 2

    // 3. Summary Stat Cards (4 Columns)
    // Box 1: Saldo Awal
    worksheet.mergeCells(`A${currentRow}:B${currentRow}`)
    worksheet.getCell(`A${currentRow}`).value = 'SALDO AWAL'
    worksheet.getCell(`A${currentRow}`).font = { size: 9, bold: true, color: { argb: 'FF4B5563' } }
    worksheet.getCell(`A${currentRow}`).alignment = { horizontal: 'center' }

    // Box 2: Total Kredit (Masuk)
    worksheet.mergeCells(`C${currentRow}:D${currentRow}`)
    worksheet.getCell(`C${currentRow}`).value = 'TOTAL MASUK (KREDIT)'
    worksheet.getCell(`C${currentRow}`).font = { size: 9, bold: true, color: { argb: 'FF065F46' } }
    worksheet.getCell(`C${currentRow}`).alignment = { horizontal: 'center' }

    // Box 3: Total Debit (Keluar)
    worksheet.mergeCells(`E${currentRow}:F${currentRow}`)
    worksheet.getCell(`E${currentRow}`).value = 'TOTAL KELUAR (DEBIT)'
    worksheet.getCell(`E${currentRow}`).font = { size: 9, bold: true, color: { argb: 'FF991B1B' } }
    worksheet.getCell(`E${currentRow}`).alignment = { horizontal: 'center' }

    // Box 4: Saldo Akhir
    worksheet.mergeCells(`G${currentRow}:H${currentRow}`)
    worksheet.getCell(`G${currentRow}`).value = 'SALDO AKHIR'
    worksheet.getCell(`G${currentRow}`).font = { size: 9, bold: true, color: { argb: 'FF1E40AF' } }
    worksheet.getCell(`G${currentRow}`).alignment = { horizontal: 'center' }
    currentRow++

    // Values for Summary Cards
    worksheet.mergeCells(`A${currentRow}:B${currentRow}`)
    worksheet.getCell(`A${currentRow}`).value = formatCurrency(data.startBalance)
    worksheet.getCell(`A${currentRow}`).font = { size: 12, bold: true }
    worksheet.getCell(`A${currentRow}`).alignment = { horizontal: 'center' }

    worksheet.mergeCells(`C${currentRow}:D${currentRow}`)
    worksheet.getCell(`C${currentRow}`).value = `+${formatCurrency(data.totalCredit)}`
    worksheet.getCell(`C${currentRow}`).font = { size: 12, bold: true, color: { argb: 'FF059669' } }
    worksheet.getCell(`C${currentRow}`).alignment = { horizontal: 'center' }

    worksheet.mergeCells(`E${currentRow}:F${currentRow}`)
    worksheet.getCell(`E${currentRow}`).value = `-${formatCurrency(data.totalDebit)}`
    worksheet.getCell(`E${currentRow}`).font = { size: 12, bold: true, color: { argb: 'FFDC2626' } }
    worksheet.getCell(`E${currentRow}`).alignment = { horizontal: 'center' }

    worksheet.mergeCells(`G${currentRow}:H${currentRow}`)
    worksheet.getCell(`G${currentRow}`).value = formatCurrency(data.endBalance)
    worksheet.getCell(`G${currentRow}`).font = { size: 12, bold: true, color: { argb: 'FF2563EB' } }
    worksheet.getCell(`G${currentRow}`).alignment = { horizontal: 'center' }
    currentRow += 2

    // 4. Table Headers
    const headerRow = worksheet.getRow(currentRow)
    headerRow.values = [
      'No',
      'Tanggal',
      'Kategori',
      'Keterangan',
      'Rekening / Akun',
      'Debit (Keluar)',
      'Kredit (Masuk)',
      'Saldo Berjalan',
    ]
    headerRow.height = 26
    headerRow.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } }
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' }
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF374151' }, // Dark slate
      }
      cell.border = {
        top: { style: 'medium' },
        bottom: { style: 'medium' },
        left: { style: 'thin' },
        right: { style: 'thin' },
      }
    })
    currentRow++

    // 5. Data Rows
    if (data.transactions.length === 0) {
      worksheet.mergeCells(`A${currentRow}:H${currentRow}`)
      const emptyCell = worksheet.getCell(`A${currentRow}`)
      emptyCell.value = 'Tidak ada transaksi pada periode ini'
      emptyCell.font = { italic: true, color: { argb: 'FF6B7280' } }
      emptyCell.alignment = { horizontal: 'center', vertical: 'middle' }
      worksheet.getRow(currentRow).height = 28
      currentRow++
    } else {
      data.transactions.forEach((t, i) => {
        const row = worksheet.getRow(currentRow)
        row.values = [
          i + 1,
          formatDate(t.date),
          `${t.category.icon || ''} ${t.category.name}`,
          t.description,
          t.savingsLocation,
          t.debit > 0 ? t.debit : '-',
          t.credit > 0 ? t.credit : '-',
          t.runningBalance,
        ]
        row.height = 22
        row.alignment = { vertical: 'middle' }

        // Alignments & Formats
        row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' }
        row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' }
        row.getCell(5).alignment = { horizontal: 'center', vertical: 'middle' }

        // Debit column (number format or red text)
        const debitCell = row.getCell(6)
        if (t.debit > 0) {
          debitCell.numFmt = '#,##0'
          debitCell.font = { color: { argb: 'FFDC2626' }, bold: true }
          debitCell.alignment = { horizontal: 'right', vertical: 'middle' }
        } else {
          debitCell.alignment = { horizontal: 'center', vertical: 'middle' }
        }

        // Credit column (number format or green text)
        const creditCell = row.getCell(7)
        if (t.credit > 0) {
          creditCell.numFmt = '#,##0'
          creditCell.font = { color: { argb: 'FF059669' }, bold: true }
          creditCell.alignment = { horizontal: 'right', vertical: 'middle' }
        } else {
          creditCell.alignment = { horizontal: 'center', vertical: 'middle' }
        }

        // Balance column
        const balCell = row.getCell(8)
        balCell.numFmt = '#,##0'
        balCell.font = { bold: true }
        balCell.alignment = { horizontal: 'right', vertical: 'middle' }

        // Zebra striping
        const bgColor = i % 2 === 0 ? 'FFFFFFFF' : 'FFF9FAFB'
        row.eachCell({ includeEmpty: true }, (cell) => {
          if (!cell.fill || cell.fill.type !== 'pattern') {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: bgColor },
            }
          }
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          }
        })

        currentRow++
      })
    }

    // 6. Final Summary Row
    const totalRow = worksheet.getRow(currentRow)
    totalRow.values = [
      '',
      '',
      '',
      'TOTAL & SALDO AKHIR:',
      '',
      data.totalDebit > 0 ? data.totalDebit : 0,
      data.totalCredit > 0 ? data.totalCredit : 0,
      data.endBalance,
    ]
    totalRow.height = 26
    totalRow.font = { bold: true }
    totalRow.getCell(4).alignment = { horizontal: 'right', vertical: 'middle' }
    totalRow.getCell(6).numFmt = '#,##0'
    totalRow.getCell(6).font = { bold: true, color: { argb: 'FFDC2626' } }
    totalRow.getCell(7).numFmt = '#,##0'
    totalRow.getCell(7).font = { bold: true, color: { argb: 'FF059669' } }
    totalRow.getCell(8).numFmt = '#,##0'
    totalRow.getCell(8).font = { bold: true, color: { argb: 'FF1E40AF' } }

    totalRow.eachCell({ includeEmpty: true }, (cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF3F4F6' },
      }
      cell.border = {
        top: { style: 'medium' },
        bottom: { style: 'double' },
        left: { style: 'thin' },
        right: { style: 'thin' },
      }
    })

    const buffer = await workbook.xlsx.writeBuffer()
    const safeLoc = (data.locationTitle || 'semua').replace(/[^a-zA-Z0-9]/g, '_')
    const filename = `Buku_Tabungan_${safeLoc}_${data.period.month}_${data.period.year}.xlsx`

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Passbook excel export error:', error)
    return NextResponse.json(
      { error: 'Failed to export passbook excel' },
      { status: 500 }
    )
  }
}
