import { generateSocialPost } from '@/lib/openrouter'
import { withAI } from '@/lib/ai-route-wrapper'

export const POST = withAI<{ petName: string; breed: string; serviceType: string; additionalContext?: string }>(
  'social-post',
  async (_req, _ctx, body) => {
    if (!body.petName || !body.breed || !body.serviceType) {
      throw new Error('Pet name, breed, and service type are required')
    }
    return await generateSocialPost(body.petName, body.breed, body.serviceType, body.additionalContext)
  },
)
