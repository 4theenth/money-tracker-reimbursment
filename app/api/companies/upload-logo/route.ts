import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import * as path from 'path'
import * as fs from 'fs'
import sharp from 'sharp'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('logo') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      )
    }

    // Create upload directory if not exists
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'company-logos')
    if (!fs.existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const ext = path.extname(file.name)
    const filename = `company-logo-${timestamp}.png`
    const filepath = path.join(uploadDir, filename)

    // Read file buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Optimize image with sharp (max 500px width, PNG format for PDFKit compatibility)
    await sharp(buffer)
      .resize(500, null, { 
        fit: 'inside',
        withoutEnlargement: true
      })
      .png({ quality: 85, compressionLevel: 9 })
      .toFile(filepath)

    // Return relative path for database storage
    const relativePath = `/uploads/company-logos/${filename}`

    return NextResponse.json({
      success: true,
      path: relativePath
    })

  } catch (error) {
    console.error('Logo upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload logo' },
      { status: 500 }
    )
  }
}
