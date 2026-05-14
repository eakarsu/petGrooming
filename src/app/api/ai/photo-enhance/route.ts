import { analyzePhotoForEnhancement } from '@/lib/openrouter'
import { withAI } from '@/lib/ai-route-wrapper'

export const POST = withAI<{ image: string }>('photo-enhance', async (_req, _ctx, body) => {
  if (!body.image) throw new Error('Image is required')
  return await analyzePhotoForEnhancement(body.image)
})
