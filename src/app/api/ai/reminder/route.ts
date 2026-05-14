import { generateAppointmentReminder } from '@/lib/openrouter'
import { withAI } from '@/lib/ai-route-wrapper'

export const POST = withAI<{
  clientName: string
  petName: string
  lastVisitDate?: string
  recommendedServices?: string[]
}>('reminder', async (_req, _ctx, body) => {
  if (!body.clientName || !body.petName) {
    throw new Error('Client name and pet name are required')
  }
  return await generateAppointmentReminder(
    body.clientName,
    body.petName,
    body.lastVisitDate || 'a while ago',
    body.recommendedServices,
  )
})
