import { symptomChecker } from '@/lib/openrouter'
import { withAI } from '@/lib/ai-route-wrapper'

export const POST = withAI<{ species: string; symptoms: string; duration?: string; severity?: string }>(
  'symptom-checker',
  async (_req, _ctx, body) => {
    if (!body.species || !body.symptoms) throw new Error('Species and symptoms are required')
    return await symptomChecker(body.species, body.symptoms, body.duration, body.severity)
  },
)
