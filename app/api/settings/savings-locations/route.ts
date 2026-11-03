import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const DEFAULT_LOCATIONS = ['Tunai / Dompet', 'Bank BCA', 'Bank BRI']

// GET /api/settings/savings-locations
export async function GET() {
  try {
    let setting = await prisma.appSettings.findUnique({
      where: { key: 'savings_locations' }
    })

    if (!setting) {
      setting = await prisma.appSettings.create({
        data: {
          key: 'savings_locations',
          value: JSON.stringify(DEFAULT_LOCATIONS)
        }
      })
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

// POST /api/settings/savings-locations - Add new location or update all locations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { location, locations } = body

    let currentLocations = DEFAULT_LOCATIONS

    const setting = await prisma.appSettings.findUnique({
      where: { key: 'savings_locations' }
    })

    if (setting) {
      try {
        currentLocations = JSON.parse(setting.value)
      } catch (e) {
        currentLocations = DEFAULT_LOCATIONS
      }
    }

    let updatedLocations: string[]

    if (Array.isArray(locations)) {
      // Direct replace with provided array
      updatedLocations = Array.from(new Set(locations.map((l: string) => (typeof l === 'string' ? l.trim() : '')).filter(Boolean)))
    } else if (typeof location === 'string' && location.trim()) {
      // Append new location if not already present
      const trimmed = location.trim()
      if (!currentLocations.includes(trimmed)) {
        updatedLocations = [...currentLocations, trimmed]
      } else {
        updatedLocations = currentLocations
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid location data' },
        { status: 400 }
      )
    }

    const updatedSetting = await prisma.appSettings.upsert({
      where: { key: 'savings_locations' },
      update: { value: JSON.stringify(updatedLocations) },
      create: {
        key: 'savings_locations',
        value: JSON.stringify(updatedLocations)
      }
    })

    return NextResponse.json({
      success: true,
      locations: JSON.parse(updatedSetting.value)
    })
  } catch (error) {
    console.error('Error updating savings locations:', error)
    return NextResponse.json(
      { error: 'Failed to update savings locations' },
      { status: 500 }
    )
  }
}
