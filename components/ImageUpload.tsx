'use client'

import { useState, useRef, DragEvent, ChangeEvent } from 'react'

interface ImageUploadProps {
  onUploadSuccess: (url: string) => void
  onUploadError: (error: string) => void
  currentImage?: string | null
}

export default function ImageUpload({ onUploadSuccess, onUploadError, currentImage }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentImage || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleFile = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      onUploadError('File harus berupa gambar')
      return
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      onUploadError('Ukuran file maksimal 10MB')
      return
    }

    // Show preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Upload file
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload/receipt', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload gagal')
      }

      const data = await response.json()
      onUploadSuccess(data.url)
    } catch (error: any) {
      console.error('Upload error:', error)
      onUploadError(error.message || 'Gagal mengupload gambar')
      setPreview(null)
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = () => {
    setPreview(null)
    onUploadSuccess('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-3">
      {!preview ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragging 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
              : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
            }
            ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />
          
          {uploading ? (
            <div className="space-y-2">
              <div className="text-4xl">⏳</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Mengupload & mengoptimasi...</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-4xl">📸</div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Drag & drop foto nota di sini
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                atau klik untuk browse file
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                Format: JPG, PNG, WebP • Max 10MB
              </p>
              <p className="text-xs text-green-600 dark:text-green-400">
                ✨ Otomatis dioptimasi menjadi WebP (~300-500KB)
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="relative border-2 border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
          <img
            src={preview}
            alt="Preview nota"
            className="w-full h-48 object-contain bg-gray-50 dark:bg-gray-900"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg transition-colors"
          >
            ✕
          </button>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
            <p className="text-xs text-white text-center">
              ✓ Foto siap diupload
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
