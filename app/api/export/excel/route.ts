import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import * as ExcelJS from 'exceljs'
import { formatCurrency } from '@/lib/utils'
import * as fs from 'fs'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { companyName, companyLogo, requestorName, includeApproval, selectedMonth, startDate: reqStartDate, endDate: reqEndDate } = body

    // Validate required fields
    if (!companyName || !requestorName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    let startDate: Date
    let endDate: Date
    let periodLabel: string

    // NEW: Support date range
    if (reqStartDate && reqEndDate) {
      startDate = new Date(reqStartDate)
      startDate.setHours(0, 0, 0, 0)
      
      endDate = new Date(reqEndDate)
      endDate.setHours(23, 59, 59, 999)

      // Format period label: "1 Oktober 2026 - 31 Oktober 2026"
      const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
      const startDay = startDate.getDate()
      const startMonth = months[startDate.getMonth()]
      const startYear = startDate.getFullYear()
      const endDay = endDate.getDate()
      const endMonth = months[endDate.getMonth()]
      const endYear = endDate.getFullYear()

      if (startYear === endYear && startMonth === endMonth) {
        periodLabel = `${startDay} - ${endDay} ${startMonth} ${startYear}`
      } else if (startYear === endYear) {
        periodLabel = `${startDay} ${startMonth} - ${endDay} ${endMonth} ${startYear}`
      } else {
        periodLabel = `${startDay} ${startMonth} ${startYear} - ${endDay} ${endMonth} ${endYear}`
      }
    }
    // LEGACY: Support old selectedMonth format
    else if (selectedMonth) {
      const [year, month] = selectedMonth.split('-').map(Number)
      startDate = new Date(year, month - 1, 1)
      endDate = new Date(year, month, 0, 23, 59, 59)

      const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
      periodLabel = `${months[month - 1]} ${year}`
    }
    else {
      return NextResponse.json(
        { error: 'Missing date range (startDate & endDate) or selectedMonth' },
        { status: 400 }
      )
    }

    // Fetch reimbursements for the date range
    const reimbursements = await prisma.reimbursement.findMany({
      where: {
        transaction: {
          date: {
            gte: startDate,
            lte: endDate
          }
        }
      },
      include: {
        transaction: {
          include: {
            category: true
          }
        },
        officeCategory: true
      },
      orderBy: {
        transaction: {
          date: 'asc'
        }
      }
    })

    if (reimbursements.length === 0) {
      return NextResponse.json(
        { error: 'Tidak ada data reimbursement untuk bulan ini' },
        { status: 404 }
      )
    }

    // Create workbook
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Reimbursement')

    // Set column widths
    worksheet.columns = [
      { key: 'no', width: 5 },
      { key: 'date', width: 12 },
      { key: 'category', width: 15 },
      { key: 'description', width: 30 },
      { key: 'amount', width: 15 },
      { key: 'photo', width: 25 },
      { key: 'notes', width: 25 },
      { key: 'requestor', width: 20 }
    ]

    let currentRow = 1

    // Add logo if provided (base64)
    if (companyLogo) {
      try {
        // Extract base64 data
        const base64Data = companyLogo.replace(/^data:image\/\w+;base64,/, '')
        const imageBuffer = Buffer.from(base64Data, 'base64')
        
        const imageId = workbook.addImage({
          buffer: imageBuffer,
          extension: 'png',
        })

        worksheet.addImage(imageId, {
          tl: { col: 0, row: 0 },
          ext: { width: 100, height: 60 }
        })
      } catch (error) {
        console.error('Failed to add logo:', error)
      }
    }

    // Header: Company Name
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`)
    const headerCell = worksheet.getCell(`A${currentRow}`)
    headerCell.value = companyName
    headerCell.font = { size: 16, bold: true }
    headerCell.alignment = { horizontal: 'center', vertical: 'middle' }
    currentRow++

    // Header: Report Title
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`)
    const titleCell = worksheet.getCell(`A${currentRow}`)
    titleCell.value = 'LAPORAN REIMBURSEMENT'
    titleCell.font = { size: 14, bold: true }
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
    currentRow++

    // Header: Period
    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
                        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`)
    const periodCell = worksheet.getCell(`A${currentRow}`)
    periodCell.value = `Periode: ${periodLabel}`
    periodCell.font = { size: 11 }
    periodCell.alignment = { horizontal: 'center' }
    currentRow++

    // Header: Generated Date
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`)
    const dateCell = worksheet.getCell(`A${currentRow}`)
    dateCell.value = `Dibuat: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}`
    dateCell.font = { size: 10 }
    dateCell.alignment = { horizontal: 'center' }
    currentRow += 2

    // Summary Section
    const grandTotal = reimbursements.reduce((sum, r) => sum + r.transaction.expense, 0)
    const totalItems = reimbursements.length
    
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`)
    const summaryTitleCell = worksheet.getCell(`A${currentRow}`)
    summaryTitleCell.value = 'RINGKASAN'
    summaryTitleCell.font = { size: 12, bold: true }
    summaryTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } }
    currentRow++

    worksheet.mergeCells(`A${currentRow}:D${currentRow}`)
    worksheet.getCell(`A${currentRow}`).value = `Grand Total: ${formatCurrency(grandTotal)}`
    worksheet.getCell(`A${currentRow}`).font = { bold: true }
    
    worksheet.mergeCells(`E${currentRow}:H${currentRow}`)
    worksheet.getCell(`E${currentRow}`).value = `Jumlah Item: ${totalItems} transaksi`
    worksheet.getCell(`E${currentRow}`).font = { bold: true }
    currentRow++

    // Category breakdown
    const byCategory = reimbursements.reduce((acc, r) => {
      const catName = r.officeCategory.name
      if (!acc[catName]) acc[catName] = 0
      acc[catName] += r.transaction.expense
      return acc
    }, {} as Record<string, number>)

    Object.entries(byCategory).forEach(([category, total]) => {
      worksheet.mergeCells(`A${currentRow}:H${currentRow}`)
      worksheet.getCell(`A${currentRow}`).value = `  ${category}: ${formatCurrency(total)}`
      currentRow++
    })
    currentRow++

    // Detail Table Header
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`)
    const detailTitleCell = worksheet.getCell(`A${currentRow}`)
    detailTitleCell.value = 'DETAIL TRANSAKSI'
    detailTitleCell.font = { size: 12, bold: true }
    detailTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } }
    currentRow++

    // Table headers
    const headerRow = worksheet.getRow(currentRow)
    headerRow.values = ['No', 'Tanggal', 'Kategori', 'Deskripsi', 'Jumlah', 'Foto Nota', 'Keterangan', 'Pengaju']
    headerRow.font = { bold: true }
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } }
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' }
    headerRow.height = 20
    currentRow++

    // Data rows with embedded images
    for (let i = 0; i < reimbursements.length; i++) {
      const reimb = reimbursements[i]
      const rowNumber = currentRow
      
      const dataRow = worksheet.getRow(rowNumber)
      dataRow.values = [
        i + 1,
        new Date(reimb.transaction.date).toLocaleDateString('id-ID'),
        reimb.officeCategory.name,
        reimb.transaction.description,
        formatCurrency(reimb.transaction.expense),
        reimb.receiptPhoto ? 'Lihat gambar →' : '-',
        reimb.notes || '-',
        requestorName
      ]
      
      dataRow.alignment = { vertical: 'middle', wrapText: true }
      dataRow.height = reimb.receiptPhoto ? 80 : 20

      // Add embedded image if exists
      if (reimb.receiptPhoto) {
        try {
          const imagePath = path.join(process.cwd(), 'public', reimb.receiptPhoto)
          
          if (fs.existsSync(imagePath)) {
            const imageBuffer = fs.readFileSync(imagePath)
            const imageId = workbook.addImage({
              buffer: imageBuffer,
              extension: 'webp',
            })

            worksheet.addImage(imageId, {
              tl: { col: 5, row: rowNumber - 1 },
              ext: { width: 120, height: 80 }
            })
          }
        } catch (error) {
          console.error(`Failed to add image for row ${i}:`, error)
        }
      }

      // Add border to all cells
      dataRow.eachCell({ includeEmpty: true }, (cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        }
      })

      currentRow++
    }

    currentRow += 2

    // Approval Section (if enabled)
    if (includeApproval) {
      worksheet.mergeCells(`A${currentRow}:H${currentRow}`)
      const approvalTitleCell = worksheet.getCell(`A${currentRow}`)
      approvalTitleCell.value = 'PERSETUJUAN'
      approvalTitleCell.font = { size: 12, bold: true }
      approvalTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } }
      currentRow += 2

      // Requestor signature
      worksheet.mergeCells(`A${currentRow}:D${currentRow}`)
      worksheet.getCell(`A${currentRow}`).value = 'Diajukan oleh:'
      worksheet.getCell(`A${currentRow}`).font = { bold: true }
      currentRow += 4

      worksheet.mergeCells(`A${currentRow}:D${currentRow}`)
      worksheet.getCell(`A${currentRow}`).value = '___________________________'
      currentRow++
      worksheet.mergeCells(`A${currentRow}:D${currentRow}`)
      worksheet.getCell(`A${currentRow}`).value = requestorName
      currentRow++
      worksheet.mergeCells(`A${currentRow}:D${currentRow}`)
      worksheet.getCell(`A${currentRow}`).value = `Tanggal: ___/___/______`

      // Approver signature
      currentRow -= 7
      worksheet.mergeCells(`E${currentRow}:H${currentRow}`)
      worksheet.getCell(`E${currentRow}`).value = 'Disetujui oleh:'
      worksheet.getCell(`E${currentRow}`).font = { bold: true }
      currentRow += 4

      worksheet.mergeCells(`E${currentRow}:H${currentRow}`)
      worksheet.getCell(`E${currentRow}`).value = '___________________________'
      currentRow++
      worksheet.mergeCells(`E${currentRow}:H${currentRow}`)
      worksheet.getCell(`E${currentRow}`).value = 'Manager / Atasan'
      currentRow++
      worksheet.mergeCells(`E${currentRow}:H${currentRow}`)
      worksheet.getCell(`E${currentRow}`).value = `Tanggal: ___/___/______`
    }

    // Generate Excel file
    const buffer = await workbook.xlsx.writeBuffer()
    
    // Return as downloadable file
    const filename = `Reimbursement_${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}_to_${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}.xlsx`
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })

  } catch (error) {
    console.error('Excel export error:', error)
    return NextResponse.json(
      { error: 'Failed to generate Excel report' },
      { status: 500 }
    )
  }
}
