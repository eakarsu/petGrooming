import { NextRequest, NextResponse } from 'next/server'
import { analyzeBehavior } from '@/lib/openrouter'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { petType, breed, age, behaviorDescription, context, frequency } = body

    if (!petType || !breed || !age || !behaviorDescription) {
      return NextResponse.json(
        { error: 'Pet type, breed, age, and behavior description are required' },
        { status: 400 }
      )
    }

    const result = await analyzeBehavior(
      petType,
      breed,
      age,
      behaviorDescription,
      context,
      frequency
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('Behavior analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze behavior' },
      { status: 500 }
    )
  }
}
