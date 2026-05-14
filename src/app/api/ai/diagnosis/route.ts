import { veterinaryDiagnosis } from '@/lib/openrouter'
import { withAI } from '@/lib/ai-route-wrapper'

export const POST = withAI<{ species: string; breed?: string; age?: string; symptoms: string; history?: string }>(
  'diagnosis',
  async (_req, _ctx, body) => {
    if (!body.species || !body.symptoms) throw new Error('Species and symptoms are required')
    return await veterinaryDiagnosis(body.species, body.breed || '', body.age || '', body.symptoms, body.history)
  },
)
