import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import PDFDocument from 'pdfkit'
import { formatCurrency } from '@/lib/utils'
import * as fs from 'fs'
import * as path from 'path'
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
        // Same month: "1 - 31 Oktober 2026"
        periodLabel = `${startDay} - ${endDay} ${startMonth} ${startYear}`
      } else if (startYear === endYear) {
        // Same year: "1 Oktober - 15 November 2026"
        periodLabel = `${startDay} ${startMonth} - ${endDay} ${endMonth} ${startYear}`
      } else {
        // Different years: "1 Oktober 2026 - 15 Januari 2027"
        periodLabel = `${startDay} ${startMonth} ${startYear} - ${endDay} ${endMonth} ${endYear}`
      }
    }
    // LEGACY: Support old selectedMonth format (backward compatibility)
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

    // Create PDF document
    const doc = new PDFDocument({ 
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    })

    // Collect PDF chunks
    const chunks: Buffer[] = []
    doc.on('data', (chunk) => chunks.push(chunk))
    
    const pdfPromise = new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)
    })

    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
                        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

    // Add logo if provided
    if (companyLogo) {
      console.log('Company logo received:', companyLogo)
      try {
        let imageBuffer: Buffer
        
        // Check if it's a base64 string
        if (companyLogo.startsWith('data:image')) {
          console.log('Processing as base64 image')
          const base64Data = companyLogo.replace(/^data:image\/\w+;base64,/, '')
          imageBuffer = Buffer.from(base64Data, 'base64')
        } 
        // Otherwise it's a file path
        else {
          const imagePath = path.join(process.cwd(), 'public', companyLogo)
          console.log('Processing as file path:', imagePath)
          console.log('File exists?', fs.existsSync(imagePath))
          
          if (fs.existsSync(imagePath)) {
            imageBuffer = fs.readFileSync(imagePath)
            console.log('Image buffer size:', imageBuffer.length)
          } else {
            console.error('Logo file not found:', imagePath)
            throw new Error('Logo file not found')
          }
        }
        
        doc.image(imageBuffer, 50, 50, { width: 80, height: 50 })
        console.log('Logo added successfully')
      } catch (error) {
        console.error('Failed to add logo:', error)
      }
    } else {
      console.log('No company logo provided')
    }

    // Header: Company Name
    doc.fontSize(18)
       .font('Helvetica-Bold')
       .text(companyName, 0, 60, { align: 'center' })

    // Header: Report Title
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('LAPORAN REIMBURSEMENT', 0, 85, { align: 'center' })

    // Header: Period
    doc.fontSize(11)
       .font('Helvetica')
       .text(`Periode: ${periodLabel}`, 0, 105, { align: 'center' })

    // Header: Generated Date
    doc.fontSize(9)
       .text(`Dibuat: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}`, 0, 120, { align: 'center' })

    let yPosition = 150

    // Summary Section
    const grandTotal = reimbursements.reduce((sum, r) => sum + r.transaction.expense, 0)
    const totalItems = reimbursements.length

    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text('RINGKASAN', 50, yPosition)
    
    yPosition += 20

    // Summary box
    doc.rect(50, yPosition, 495, 60)
       .fillAndStroke('#f0f0f0', '#cccccc')
    
    doc.fillColor('#000000')
       .fontSize(10)
       .font('Helvetica-Bold')
       .text(`Grand Total: ${formatCurrency(grandTotal)}`, 60, yPosition + 10)
       .text(`Jumlah Item: ${totalItems} transaksi`, 300, yPosition + 10)

    yPosition += 35

    // Category breakdown
    const byCategory = reimbursements.reduce((acc, r) => {
      const catName = r.officeCategory.name
      if (!acc[catName]) acc[catName] = 0
      acc[catName] += r.transaction.expense
      return acc
    }, {} as Record<string, number>)

    doc.fontSize(9)
       .font('Helvetica')
    
    let xPosition = 60
    Object.entries(byCategory).forEach(([category, total], index) => {
      doc.text(`${category}: ${formatCurrency(total)}`, xPosition, yPosition)
      xPosition += 180
      if ((index + 1) % 3 === 0) {
        xPosition = 60
        yPosition += 15
      }
    })

    yPosition += 40

    // Detail Section Title
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text('DETAIL TRANSAKSI', 50, yPosition)
    
    yPosition += 25

    // Draw each reimbursement with inline photo
    for (let i = 0; i < reimbursements.length; i++) {
      const reimb = reimbursements[i]
      
      // Check if we need a new page
      if (yPosition > 700) {
        doc.addPage()
        yPosition = 50
      }

      // Transaction box
      const boxHeight = reimb.receiptPhoto ? 140 : 70
      
      doc.rect(50, yPosition, 495, boxHeight)
         .stroke('#cccccc')

      // Transaction details (left side)
      const detailX = 60
      const detailY = yPosition + 10

      doc.fontSize(9)
         .font('Helvetica-Bold')
         .fillColor('#000000')
         .text(`${i + 1}. ${reimb.transaction.description}`, detailX, detailY)

      doc.fontSize(8)
         .font('Helvetica')
         .text(`Tanggal: ${new Date(reimb.transaction.date).toLocaleDateString('id-ID')}`, detailX, detailY + 15)
         .text(`Kategori: ${reimb.officeCategory.name}`, detailX, detailY + 28)
         .text(`Jumlah: ${formatCurrency(reimb.transaction.expense)}`, detailX, detailY + 41)
      
      if (reimb.notes) {
        doc.text(`Catatan: ${reimb.notes}`, detailX, detailY + 54, { width: 200 })
      }

      // Photo (right side, inline)
      if (reimb.receiptPhoto) {
        try {
          const imagePath = path.join(process.cwd(), 'public', reimb.receiptPhoto)
          
          if (fs.existsSync(imagePath)) {
            doc.image(imagePath, 350, yPosition + 10, { 
              width: 180,
              height: 120,
              fit: [180, 120]
            })
          } else {
            doc.fontSize(8)
               .text('[Foto tidak ditemukan]', 350, yPosition + 50)
          }
        } catch (error) {
          console.error(`Failed to add image for item ${i}:`, error)
          doc.fontSize(8)
             .text('[Error loading foto]', 350, yPosition + 50)
        }
      }

      yPosition += boxHeight + 10
    }

    // Requestor Section (ALWAYS show)
    // Check if we need a new page
    if (yPosition > 650) {
      doc.addPage()
      yPosition = 50
    }

    yPosition += 20

    // Get current date in Indonesian format
    const now = new Date()
    const day = now.getDate()
    const monthName = monthNames[now.getMonth()]
    const yearNow = now.getFullYear()
    const formattedDate = `${day} ${monthName} ${yearNow}`

    // Title
    const sectionTitle = includeApproval ? 'PENGAJUAN & PERSETUJUAN' : 'PENGAJUAN'
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text(sectionTitle, 50, yPosition)
    
    yPosition += 30

    // Requestor info (left) - ALWAYS SHOWN
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .text('Diajukan oleh:', 80, yPosition)

    doc.fontSize(9)
       .font('Helvetica')
       .text(requestorName, 80, yPosition + 20)
       .text(`Tanggal: ${formattedDate}`, 80, yPosition + 35)

    // Approval Section (only if enabled)
    if (includeApproval) {
      // Approver info (right)
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .text('Disetujui oleh:', 350, yPosition)

      doc.fontSize(9)
         .font('Helvetica')
         .text('Manager / Atasan', 350, yPosition + 20)
         .text(`Tanggal: ${formattedDate}`, 350, yPosition + 35)
    }

    // Finalize PDF
    doc.end()

    // Wait for PDF generation to complete
    const pdfBuffer = await pdfPromise

    // Return as downloadable file
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Reimbursement_${monthNames[month - 1]}_${year}.pdf"`
      }
    })

  } catch (error) {
    console.error('PDF export error:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF report' },
      { status: 500 }
    )
  }
}
