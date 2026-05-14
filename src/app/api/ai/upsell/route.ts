import { suggestUpsells } from '@/lib/openrouter'
import { withAI } from '@/lib/ai-route-wrapper'

export const POST = withAI<{ currentServices: string[]; petBreed: string; petCondition?: string }>(
  'upsell',
  async (_req, _ctx, body) => {
    if (!body.currentServices || !body.petBreed) {
      throw new Error('Current services and pet breed are required')
    }
    return await suggestUpsells(body.currentServices, body.petBreed, body.petCondition)
  },
)
