import { analyzeHealthConcerns } from '@/lib/openrouter'
import { withAI } from '@/lib/ai-route-wrapper'

export const POST = withAI<{ symptoms: string; petType: string; breed: string }>(
  'health-analyze',
  async (_req, _ctx, body) => {
    if (!body.symptoms || !body.petType || !body.breed) {
      throw new Error('Symptoms, pet type, and breed are required')
    }
    return await analyzeHealthConcerns(body.symptoms, body.petType, body.breed)
  },
)
