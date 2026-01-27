import { NextRequest, NextResponse } from 'next/server'
import { generateSocialPost } from '@/lib/openrouter'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { petName, breed, serviceType, additionalContext } = body

    if (!petName || !breed || !serviceType) {
      return NextResponse.json(
        { error: 'Pet name, breed, and service type are required' },
        { status: 400 }
      )
    }

    const result = await generateSocialPost(petName, breed, serviceType, additionalContext)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Social post generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate social post' },
      { status: 500 }
    )
  }
}
