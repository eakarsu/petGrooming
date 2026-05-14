import { NextRequest, NextResponse } from 'next/server'
import { withAI } from '@/lib/ai-route-wrapper'
import { db } from '@/lib/db'
import { callOpenRouter } from '@/lib/openrouter'
import { aiErrorResponse, parseAIJson } from '@/lib/ai-helpers'

interface PreviewBody {
  petId: string
  styleName: string
  beforeImageUrl: string
}

/**
 * Style Preview generator.
 *
 * Note: OpenRouter does not currently expose Stability/SDXL image-gen via the
 * `chat/completions` endpoint. We use the LLM to produce a vivid textual
 * "before/after" style description that can be rendered by a downstream
 * worker (or a future image-gen integration). The StylePreview record is
 * persisted in PENDING state with the description in errorMsg until the
 * image worker fills `afterImageUrl`.
 */
export const POST = withAI<PreviewBody>('style-preview', async (_req, _ctx, body) => {
  if (!body.petId || !body.styleName || !body.beforeImageUrl) {
    throw new Error('petId, styleName, and beforeImageUrl are required')
  }

  const pet = await db.pet.findUnique({
    where: { id: body.petId },
    include: { breed: true },
  })
  if (!pet) throw new Error('Pet not found')

  const prompt = `You are an art-director for pet grooming previews. Pet: ${pet.name}, breed: ${pet.breed?.name || 'unknown'}, color: ${pet.color || 'unknown'}.
Style requested: ${body.styleName}

Produce JSON describing the after look so an image generator can render it:
{
  "afterDescription": "Detailed visual description of the pet AFTER the cut/style (4-6 sentences, specific to this breed)",
  "imagenPrompt": "Concise text-to-image prompt (under 200 chars) usable for SDXL/DALL-E",
  "negativePrompt": "Comma-separated things to avoid in the render"
}`

  const text = await callOpenRouter(
    [
      { role: 'system', content: 'You are an expert pet grooming visual director. Always reply with valid JSON.' },
      { role: 'user', content: prompt },
    ],
    { temperature: 0.7, maxTokens: 800 },
  )

  const parsed = parseAIJson<{
    afterDescription: string
    imagenPrompt: string
    negativePrompt: string
  }>(text) || {
    afterDescription: text,
    imagenPrompt: `${pet.breed?.name || 'pet'} groomed in ${body.styleName} style`,
    negativePrompt: 'blurry, low quality',
  }

  const preview = await db.stylePreview.create({
    data: {
      petId: body.petId,
      styleName: body.styleName,
      beforeImageUrl: body.beforeImageUrl,
      status: 'PENDING',
      errorMsg: JSON.stringify(parsed),
    },
  })

  return {
    previewId: preview.id,
    status: 'PENDING',
    note: 'Description generated. Image render is queued for the next worker pass.',
    ...parsed,
  }
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const petId = searchParams.get('petId') || undefined
    const items = await db.stylePreview.findMany({
      where: petId ? { petId } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    return NextResponse.json({ data: items })
  } catch (error) {
    return NextResponse.json(aiErrorResponse(error, 'Failed to list previews'), { status: 500 })
  }
}
