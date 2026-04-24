import { NextRequest, NextResponse } from 'next/server'
import { veterinaryTreatment } from '@/lib/openrouter'

export async function POST(request: NextRequest) {
  try {
    const { species, breed, age, weight, diagnosis, currentMedications } = await request.json()
    if (!species || !diagnosis) {
      return NextResponse.json({ error: 'Species and diagnosis are required' }, { status: 400 })
    }
    const result = await veterinaryTreatment(species, breed || '', age || '', weight || '', diagnosis, currentMedications)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate treatment plan' }, { status: 500 })
  }
}
