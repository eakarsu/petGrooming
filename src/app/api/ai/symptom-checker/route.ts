import { NextRequest, NextResponse } from 'next/server'
import { symptomChecker } from '@/lib/openrouter'

export async function POST(request: NextRequest) {
  try {
    const { species, symptoms, duration, severity } = await request.json()
    if (!species || !symptoms) {
      return NextResponse.json({ error: 'Species and symptoms are required' }, { status: 400 })
    }
    const result = await symptomChecker(species, symptoms, duration, severity)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to check symptoms' }, { status: 500 })
  }
}
