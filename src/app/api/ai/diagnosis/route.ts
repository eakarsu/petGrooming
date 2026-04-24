import { NextRequest, NextResponse } from 'next/server'
import { veterinaryDiagnosis } from '@/lib/openrouter'

export async function POST(request: NextRequest) {
  try {
    const { species, breed, age, symptoms, history } = await request.json()
    if (!species || !symptoms) {
      return NextResponse.json({ error: 'Species and symptoms are required' }, { status: 400 })
    }
    const result = await veterinaryDiagnosis(species, breed || '', age || '', symptoms, history)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate diagnosis' }, { status: 500 })
  }
}
