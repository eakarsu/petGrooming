import { analyzeBehavior } from '@/lib/openrouter'
import { withAI } from '@/lib/ai-route-wrapper'

export const POST = withAI<{
  petType: string
  breed: string
  age: string
  behaviorDescription: string
  context?: string
  frequency?: string
}>('behavior-analyze', async (_req, _ctx, body) => {
  if (!body.petType || !body.breed || !body.age || !body.behaviorDescription) {
    throw new Error('Pet type, breed, age, and behavior description are required')
  }
  return await analyzeBehavior(body.petType, body.breed, body.age, body.behaviorDescription, body.context, body.frequency)
})
