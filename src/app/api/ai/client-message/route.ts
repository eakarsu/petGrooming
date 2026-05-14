import { generateClientMessage } from '@/lib/openrouter'
import { withAI } from '@/lib/ai-route-wrapper'

export const POST = withAI<{ messageType: string; clientName: string; petName: string; context?: string }>(
  'client-message',
  async (_req, _ctx, body) => {
    if (!body.messageType || !body.clientName || !body.petName) {
      throw new Error('Message type, client name, and pet name are required')
    }
    return await generateClientMessage(body.messageType, body.clientName, body.petName, body.context)
  },
)
