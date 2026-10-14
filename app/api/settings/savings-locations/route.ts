import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/settings/savings-locations
export async function GET() {
  try {
    const setting = await prisma.appSettings.findUnique({
      where: { key: 'savings_locations' }
    })

    if (!setting) {
      return NextResponse.json({ locations: [] })
    }

    const locations = JSON.parse(setting.value)
    return NextResponse.json({ locations })
  } catch (error) {
    console.error('Error fetching savings locations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch savings locations' },
      { status: 500 }
    )
  }
}
