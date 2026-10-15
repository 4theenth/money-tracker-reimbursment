import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as fs from 'fs'
import * as path from 'path'

// GET /api/companies/[id] - Get single company
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const company = await prisma.companyProfile.findUnique({
      where: { id: parseInt(params.id) }
    })

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(company)
  } catch (error) {
    console.error('Error fetching company:', error)
    return NextResponse.json(
      { error: 'Failed to fetch company' },
      { status: 500 }
    )
  }
}

// PATCH /api/companies/[id] - Update company
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const body = await request.json()
    const { name, logoPath, isDefault } = body

    // If setting as default, unset all other defaults first
    if (isDefault) {
      await prisma.companyProfile.updateMany({
        where: { 
          isDefault: true,
          id: { not: parseInt(params.id) }
        },
        data: { isDefault: false }
      })
    }

    const company = await prisma.companyProfile.update({
      where: { id: parseInt(params.id) },
      data: {
        ...(name && { name }),
        ...(logoPath !== undefined && { logoPath }),
        ...(isDefault !== undefined && { isDefault })
      }
    })

    return NextResponse.json(company)
  } catch (error) {
    console.error('Error updating company:', error)
    return NextResponse.json(
      { error: 'Failed to update company' },
      { status: 500 }
    )
  }
}

// DELETE /api/companies/[id] - Delete company
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    console.log('[DELETE] Company ID:', params.id)
    
    const company = await prisma.companyProfile.findUnique({
      where: { id: parseInt(params.id) }
    })

    console.log('[DELETE] Found company:', company)

    if (!company) {
      console.error('[DELETE] Company not found')
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      )
    }

    // Delete logo file if exists
    if (company.logoPath) {
      try {
        const logoFullPath = path.join(process.cwd(), 'public', company.logoPath)
        console.log('[DELETE] Logo path:', logoFullPath)
        console.log('[DELETE] Logo exists?', fs.existsSync(logoFullPath))
        
        if (fs.existsSync(logoFullPath)) {
          fs.unlinkSync(logoFullPath)
          console.log('[DELETE] Logo file deleted')
        }
      } catch (error) {
        console.error('[DELETE] Error deleting logo file:', error)
      }
    }

    console.log('[DELETE] Attempting to delete company from database...')
    await prisma.companyProfile.delete({
      where: { id: parseInt(params.id) }
    })
    console.log('[DELETE] Company deleted successfully')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE] Error deleting company:', error)
    return NextResponse.json(
      { error: 'Failed to delete company', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
