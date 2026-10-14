import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { existsSync, mkdirSync } from 'fs'
import * as path from 'path'
import sharp from 'sharp'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'receipts')

// Ensure upload directory exists
if (!existsSync(UPLOAD_DIR)) {
  mkdirSync(UPLOAD_DIR, { recursive: true })
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

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

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 8)
    const filename = `receipt-${timestamp}-${randomString}.webp`
    const filepath = path.join(UPLOAD_DIR, filename)

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Process image with sharp
    // - Resize to max 1200px width (maintain aspect ratio)
    // - Convert to WebP format
    // - Compress quality 85%
    await sharp(buffer)
      .resize(1200, null, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ quality: 85 })
      .toFile(filepath)

    // Return public URL path
    const publicUrl = `/uploads/receipts/${filename}`

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename
    })

  } catch (error: any) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Failed to upload file', details: error.message },
      { status: 500 }
    )
  }
}
