import { NextRequest, NextResponse } from 'next/server'
import { suggestGroomingStyles } from '@/lib/openrouter'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { breed, coatType, preferences } = body

    if (!breed) {
      return NextResponse.json(
        { error: 'Breed is required' },
        { status: 400 }
      )
    }

    const result = await suggestGroomingStyles(breed, coatType, preferences)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Style suggestion error:', error)
    return NextResponse.json(
      { error: 'Failed to suggest styles' },
      { status: 500 }
    )
  }
}
