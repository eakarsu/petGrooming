import { NextRequest, NextResponse } from 'next/server'
import { estimateAppointment } from '@/lib/openrouter'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { breed, petSize, serviceType, coatCondition } = body

    if (!breed || !petSize || !serviceType) {
      return NextResponse.json(
        { error: 'Breed, pet size, and service type are required' },
        { status: 400 }
      )
    }

    const result = await estimateAppointment(breed, petSize, serviceType, coatCondition)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Appointment estimate error:', error)
    return NextResponse.json(
      { error: 'Failed to estimate appointment' },
      { status: 500 }
    )
  }
}
