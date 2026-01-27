import { NextRequest, NextResponse } from 'next/server'
import { generateClientMessage } from '@/lib/openrouter'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messageType, clientName, petName, context } = body

    if (!messageType || !clientName || !petName) {
      return NextResponse.json(
        { error: 'Message type, client name, and pet name are required' },
        { status: 400 }
      )
    }

    const result = await generateClientMessage(messageType, clientName, petName, context)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Client message generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate message' },
      { status: 500 }
    )
  }
}
