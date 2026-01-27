import { NextRequest, NextResponse } from 'next/server'
import { generateAppointmentReminder } from '@/lib/openrouter'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clientName, petName, lastVisitDate, recommendedServices } = body

    if (!clientName || !petName) {
      return NextResponse.json(
        { error: 'Client name and pet name are required' },
        { status: 400 }
      )
    }

    const result = await generateAppointmentReminder(
      clientName,
      petName,
      lastVisitDate || 'a while ago',
      recommendedServices
    )
    return NextResponse.json(result)
  } catch (error) {
    console.error('Reminder generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate reminder' },
      { status: 500 }
    )
  }
}
