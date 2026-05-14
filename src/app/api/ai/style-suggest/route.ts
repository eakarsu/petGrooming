import { suggestGroomingStyles } from '@/lib/openrouter'
import { withAI } from '@/lib/ai-route-wrapper'

export const POST = withAI<{ breed: string; coatType?: string; preferences?: string }>(
  'style-suggest',
  async (_req, _ctx, body) => {
    if (!body.breed) throw new Error('Breed is required')
    return await suggestGroomingStyles(body.breed, body.coatType, body.preferences)
  },
)
