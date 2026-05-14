import { identifyBreed } from '@/lib/openrouter'
import { withAI } from '@/lib/ai-route-wrapper'

export const POST = withAI<{ image: string }>('breed-identify', async (_req, _ctx, body) => {
  if (!body.image) throw new Error('Image is required')
  return await identifyBreed(body.image)
})
