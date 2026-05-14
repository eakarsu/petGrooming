import { estimateAppointment } from '@/lib/openrouter'
import { withAI } from '@/lib/ai-route-wrapper'

export const POST = withAI<{ breed: string; petSize: string; serviceType: string; coatCondition?: string }>(
  'appointment-estimate',
  async (_req, _ctx, body) => {
    if (!body.breed || !body.petSize || !body.serviceType) {
      throw new Error('Breed, pet size, and service type are required')
    }
    return await estimateAppointment(body.breed, body.petSize, body.serviceType, body.coatCondition)
  },
)
