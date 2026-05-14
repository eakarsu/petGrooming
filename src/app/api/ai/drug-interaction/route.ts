import { drugInteractionChecker } from '@/lib/openrouter'
import { withAI } from '@/lib/ai-route-wrapper'

export const POST = withAI<{ species: string; medications: string; weight?: string }>(
  'drug-interaction',
  async (_req, _ctx, body) => {
    if (!body.species || !body.medications) throw new Error('Species and medications are required')
    return await drugInteractionChecker(body.species, body.medications, body.weight)
  },
)
