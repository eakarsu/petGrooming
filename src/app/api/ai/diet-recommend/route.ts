import { NextRequest, NextResponse } from 'next/server'
import { recommendDiet } from '@/lib/openrouter'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { petType, breed, age, weight, activityLevel, healthConditions, currentDiet } = body

    if (!petType || !breed || !age || !weight || !activityLevel) {
      return NextResponse.json(
        { error: 'Pet type, breed, age, weight, and activity level are required' },
        { status: 400 }
      )
    }

    const result = await recommendDiet(
      petType,
      breed,
      age,
      weight,
      activityLevel,
      healthConditions,
      currentDiet
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('Diet recommendation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate diet recommendations' },
      { status: 500 }
    )
  }
}
