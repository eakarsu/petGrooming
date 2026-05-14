import { recommendDiet } from '@/lib/openrouter'
import { withAI } from '@/lib/ai-route-wrapper'

export const POST = withAI<{
  petType: string
  breed: string
  age: string
  weight: number
  activityLevel: string
  healthConditions?: string
  currentDiet?: string
}>('diet-recommend', async (_req, _ctx, body) => {
  if (!body.petType || !body.breed || !body.age || !body.weight || !body.activityLevel) {
    throw new Error('Pet type, breed, age, weight, and activity level are required')
  }
  return await recommendDiet(
    body.petType,
    body.breed,
    body.age,
    body.weight,
    body.activityLevel,
    body.healthConditions,
    body.currentDiet,
  )
})
