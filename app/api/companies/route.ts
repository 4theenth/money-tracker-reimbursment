import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

console.log('[companies/route.ts] prisma imported:', typeof prisma, !!prisma)

// GET /api/companies - List all company profiles
export async function GET() {
  try {
    const companies = await prisma.companyProfile.findMany({
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json(companies)
  } catch (error) {
    console.error('Error fetching companies:', error)
    return NextResponse.json(
      { error: 'Failed to fetch companies' },
      { status: 500 }
    )
  }
}

// POST /api/companies - Create new company profile
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, logoPath, isDefault } = body

    console.log('POST /api/companies - Request body:', body)

    if (!name) {
      console.error('Validation error: name is required')
      return NextResponse.json(
        { error: 'Company name is required' },
        { status: 400 }
      )
    }

    // If setting as default, unset all other defaults first
    if (isDefault) {
      console.log('Unsetting other default companies...')
      await prisma.companyProfile.updateMany({
        where: { isDefault: true },
        data: { isDefault: false }
      })
    }

    console.log('Creating company with data:', { name, logoPath, isDefault })
    const company = await prisma.companyProfile.create({
      data: {
        name,
        logoPath: logoPath || null,
        isDefault: isDefault || false
      }
    })

    console.log('Company created successfully:', company)
    return NextResponse.json(company, { status: 201 })
  } catch (error: any) {
    console.error('Error creating company:', error)
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    })
    return NextResponse.json(
      { error: 'Failed to create company', details: error.message },
      { status: 500 }
    )
  }
}
