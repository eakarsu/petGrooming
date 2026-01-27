import { NextRequest, NextResponse } from 'next/server'
import { analyzePhotoForEnhancement } from '@/lib/openrouter'

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

    const result = await analyzePhotoForEnhancement(image)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Photo enhancement error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze photo' },
      { status: 500 }
    )
  }
}
