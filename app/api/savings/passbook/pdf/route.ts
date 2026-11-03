import { NextRequest, NextResponse } from 'next/server'
import PDFDocument from 'pdfkit'
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

    // Create PDF in Landscape A4 for wide table columns
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape', // 841.89 x 595.28 pt
      margins: { top: 35, bottom: 35, left: 35, right: 35 },
    })

    const chunks: Buffer[] = []
    doc.on('data', (chunk) => chunks.push(chunk))

    const pdfPromise = new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)
    })

    const pageWidth = 841.89
    const margin = 35
    const contentWidth = pageWidth - margin * 2 // ~771.89 pt

    // 1. Header Banner
    doc.rect(margin, 35, contentWidth, 55)
       .fill('#1e3a8a') // Deep Blue

    doc.fillColor('#ffffff')
       .fontSize(16)
       .font('Helvetica-Bold')
       .text('BUKU TABUNGAN & REKENING KORAN', margin, 46, {
         width: contentWidth,
         align: 'center',
       })

    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#bfdbfe')
       .text(`Rekening: ${data.locationTitle.toUpperCase()}  •  Periode: ${data.period.label}`, margin, 68, {
         width: contentWidth,
         align: 'center',
       })

    let y = 100

    // 2. Summary Boxes (4 columns)
    const boxGap = 10
    const boxWidth = (contentWidth - boxGap * 3) / 4
    const boxHeight = 44

    const summaryCards = [
      { label: 'SALDO AWAL', value: formatCurrency(data.startBalance), color: '#374151' },
      { label: 'TOTAL MASUK (KREDIT)', value: `+${formatCurrency(data.totalCredit)}`, color: '#059669' },
      { label: 'TOTAL KELUAR (DEBIT)', value: `-${formatCurrency(data.totalDebit)}`, color: '#dc2626' },
      { label: 'SALDO AKHIR', value: formatCurrency(data.endBalance), color: '#1d4ed8' },
    ]

    summaryCards.forEach((card, idx) => {
      const bx = margin + idx * (boxWidth + boxGap)
      doc.rect(bx, y, boxWidth, boxHeight)
         .fillAndStroke('#f8fafc', '#e2e8f0')

      doc.fontSize(8)
         .font('Helvetica-Bold')
         .fillColor('#64748b')
         .text(card.label, bx, y + 8, { width: boxWidth, align: 'center' })

      doc.fontSize(11)
         .font('Helvetica-Bold')
         .fillColor(card.color)
         .text(card.value, bx, y + 22, { width: boxWidth, align: 'center' })
    })

    y += boxHeight + 15

    // 3. Table Layout Setup
    // Columns: No (25), Tanggal (75), Kategori (110), Keterangan (210), Rekening (100), Debit (80), Kredit (80), Saldo (90)
    const colX = {
      no: margin,
      date: margin + 30,
      cat: margin + 105,
      desc: margin + 215,
      acc: margin + 425,
      debit: margin + 525,
      credit: margin + 605,
      bal: margin + 685,
    }

    const colW = {
      no: 30,
      date: 75,
      cat: 110,
      desc: 210,
      acc: 100,
      debit: 80,
      credit: 80,
      bal: 86,
    }

    const drawTableHeader = (curY: number) => {
      doc.rect(margin, curY, contentWidth, 22)
         .fill('#1e293b') // Dark slate

      doc.font('Helvetica-Bold')
         .fontSize(9)
         .fillColor('#ffffff')

      doc.text('No', colX.no, curY + 6, { width: colW.no, align: 'center' })
      doc.text('Tanggal', colX.date, curY + 6, { width: colW.date, align: 'left' })
      doc.text('Kategori', colX.cat, curY + 6, { width: colW.cat, align: 'left' })
      doc.text('Keterangan', colX.desc, curY + 6, { width: colW.desc, align: 'left' })
      doc.text('Rekening', colX.acc, curY + 6, { width: colW.acc, align: 'left' })
      doc.text('Debit (Keluar)', colX.debit, curY + 6, { width: colW.debit, align: 'right' })
      doc.text('Kredit (Masuk)', colX.credit, curY + 6, { width: colW.credit, align: 'right' })
      doc.text('Saldo', colX.bal, curY + 6, { width: colW.bal, align: 'right' })

      return curY + 22
    }

    y = drawTableHeader(y)

    // 4. Table Body
    if (data.transactions.length === 0) {
      doc.rect(margin, y, contentWidth, 36)
         .fillAndStroke('#ffffff', '#e2e8f0')

      doc.font('Helvetica-Oblique')
         .fontSize(10)
         .fillColor('#64748b')
         .text('Tidak ada transaksi pada periode ini', margin, y + 12, {
           width: contentWidth,
           align: 'center',
         })
      y += 36
    } else {
      data.transactions.forEach((t, i) => {
        // Page break check
        if (y > 520) {
          doc.addPage()
          y = drawTableHeader(35)
        }

        const rowHeight = 22
        const bg = i % 2 === 0 ? '#ffffff' : '#f8fafc'

        doc.rect(margin, y, contentWidth, rowHeight)
           .fillAndStroke(bg, '#f1f5f9')

        doc.fontSize(8.5)
           .font('Helvetica')
           .fillColor('#334155')

        // No
        doc.text(String(i + 1), colX.no, y + 6, { width: colW.no, align: 'center' })

        // Tanggal
        doc.text(formatDate(t.date), colX.date, y + 6, { width: colW.date, align: 'left' })

        // Kategori (sanitized text without complex emojis that PDFKit can't render)
        const catName = t.category.name || '-'
        doc.text(catName, colX.cat, y + 6, { width: colW.cat, align: 'left', lineBreak: false })

        // Keterangan
        doc.text(t.description || '-', colX.desc, y + 6, { width: colW.desc, align: 'left', lineBreak: false })

        // Rekening
        doc.text(t.savingsLocation || '-', colX.acc, y + 6, { width: colW.acc, align: 'left', lineBreak: false })

        // Debit
        if (t.debit > 0) {
          doc.font('Helvetica-Bold')
             .fillColor('#dc2626')
             .text(`-${formatCurrency(t.debit)}`, colX.debit, y + 6, { width: colW.debit, align: 'right' })
        } else {
          doc.fillColor('#94a3b8')
             .text('-', colX.debit, y + 6, { width: colW.debit, align: 'right' })
        }

        // Kredit
        if (t.credit > 0) {
          doc.font('Helvetica-Bold')
             .fillColor('#059669')
             .text(`+${formatCurrency(t.credit)}`, colX.credit, y + 6, { width: colW.credit, align: 'right' })
        } else {
          doc.fillColor('#94a3b8')
             .text('-', colX.credit, y + 6, { width: colW.credit, align: 'right' })
        }

        // Saldo
        doc.font('Helvetica-Bold')
           .fillColor('#0f172a')
           .text(formatCurrency(t.runningBalance), colX.bal, y + 6, { width: colW.bal, align: 'right' })

        y += rowHeight
      })
    }

    // 5. Total Footer Row
    if (y > 520) {
      doc.addPage()
      y = 35
    }

    doc.rect(margin, y, contentWidth, 26)
       .fillAndStroke('#e2e8f0', '#cbd5e1')

    doc.font('Helvetica-Bold')
       .fontSize(9.5)
       .fillColor('#1e293b')
       .text('TOTAL MUTASI & SALDO AKHIR:', colX.no, y + 8, {
         width: colX.debit - colX.no - 10,
         align: 'right',
       })

    doc.fillColor('#dc2626')
       .text(data.totalDebit > 0 ? `-${formatCurrency(data.totalDebit)}` : '-', colX.debit, y + 8, {
         width: colW.debit,
         align: 'right',
       })

    doc.fillColor('#059669')
       .text(data.totalCredit > 0 ? `+${formatCurrency(data.totalCredit)}` : '-', colX.credit, y + 8, {
         width: colW.credit,
         align: 'right',
       })

    doc.fillColor('#1d4ed8')
       .text(formatCurrency(data.endBalance), colX.bal, y + 8, {
         width: colW.bal,
         align: 'right',
       })

    // Sub-footer info
    doc.fontSize(7.5)
       .font('Helvetica-Oblique')
       .fillColor('#94a3b8')
       .text(`Dicetak pada: ${new Date().toLocaleString('id-ID')} | Money Tracker Application`, margin, 560, {
         width: contentWidth,
         align: 'center',
       })

    doc.end()

    const pdfBuffer = await pdfPromise
    const safeLoc = (data.locationTitle || 'semua').replace(/[^a-zA-Z0-9]/g, '_')
    const filename = `Buku_Tabungan_${safeLoc}_${data.period.month}_${data.period.year}.pdf`

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Passbook PDF export error:', error)
    return NextResponse.json(
      { error: 'Failed to export passbook pdf' },
      { status: 500 }
    )
  }
}
