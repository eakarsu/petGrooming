import { NextRequest, NextResponse } from 'next/server'
import { identifyBreed } from '@/lib/openrouter'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { image } = body

    if (!image) {
      return NextResponse.json(
        { error: 'Image is required' },
        { status: 400 }
      )
    }

    const result = await identifyBreed(image)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Breed identification error:', error)
    return NextResponse.json(
      { error: 'Failed to identify breed' },
      { status: 500 }
    )
  }
}
