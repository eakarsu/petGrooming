import { NextRequest, NextResponse } from 'next/server'
import { analyzeHealthConcerns } from '@/lib/openrouter'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { symptoms, petType, breed } = body

    if (!symptoms || !petType || !breed) {
      return NextResponse.json(
        { error: 'Symptoms, pet type, and breed are required' },
        { status: 400 }
      )
    }

    const result = await analyzeHealthConcerns(symptoms, petType, breed)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Health analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze health concerns' },
      { status: 500 }
    )
  }
}
