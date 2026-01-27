import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const settings = await db.businessSettings.findFirst({
      where: { id: 'default' },
    })

    if (!settings) {
      // Return default settings if none exist
      return NextResponse.json({
        id: 'default',
        businessName: 'PetGroom Pro',
        taxRate: 8.0,
        currency: 'USD',
        timezone: 'America/New_York',
        loyaltyPointsPerDollar: 1,
        loyaltyPointsValue: 0.01,
      })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Failed to fetch settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()

    const settings = await db.businessSettings.upsert({
      where: { id: 'default' },
      update: {
        businessName: body.businessName,
        address: body.address,
        phone: body.phone,
        email: body.email,
        website: body.website,
        timezone: body.timezone,
        currency: body.currency,
        taxRate: body.taxRate,
        operatingHours: body.operatingHours,
        bookingLeadTime: body.bookingLeadTime,
        maxAdvanceBooking: body.maxAdvanceBooking,
        slotDuration: body.slotDuration,
        loyaltyPointsPerDollar: body.loyaltyPointsPerDollar,
        loyaltyPointsValue: body.loyaltyPointsValue,
      },
      create: {
        id: 'default',
        businessName: body.businessName || 'PetGroom Pro',
        address: body.address,
        phone: body.phone,
        email: body.email,
        website: body.website,
        timezone: body.timezone || 'America/New_York',
        currency: body.currency || 'USD',
        taxRate: body.taxRate || 8.0,
        operatingHours: body.operatingHours,
        bookingLeadTime: body.bookingLeadTime || 24,
        maxAdvanceBooking: body.maxAdvanceBooking || 30,
        slotDuration: body.slotDuration || 15,
        loyaltyPointsPerDollar: body.loyaltyPointsPerDollar || 1,
        loyaltyPointsValue: body.loyaltyPointsValue || 0.01,
      },
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Failed to update settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
