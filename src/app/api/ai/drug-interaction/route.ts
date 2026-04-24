import { NextRequest, NextResponse } from 'next/server'
import { drugInteractionChecker } from '@/lib/openrouter'

export async function POST(request: NextRequest) {
  try {
    const { species, medications, weight } = await request.json()
    if (!species || !medications) {
      return NextResponse.json({ error: 'Species and medications are required' }, { status: 400 })
    }
    const result = await drugInteractionChecker(species, medications, weight)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to check drug interactions' }, { status: 500 })
  }
}
