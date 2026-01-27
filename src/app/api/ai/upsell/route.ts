import { NextRequest, NextResponse } from 'next/server'
import { suggestUpsells } from '@/lib/openrouter'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { currentServices, petBreed, petCondition } = body

    if (!currentServices || !petBreed) {
      return NextResponse.json(
        { error: 'Current services and pet breed are required' },
        { status: 400 }
      )
    }

    const result = await suggestUpsells(currentServices, petBreed, petCondition)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Upsell suggestion error:', error)
    return NextResponse.json(
      { error: 'Failed to suggest upsells' },
      { status: 500 }
    )
  }
}
