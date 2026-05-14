import { veterinaryTreatment } from '@/lib/openrouter'
import { withAI } from '@/lib/ai-route-wrapper'

export const POST = withAI<{
  species: string
  breed?: string
  age?: string
  weight?: string
  diagnosis: string
  currentMedications?: string
}>('treatment', async (_req, _ctx, body) => {
  if (!body.species || !body.diagnosis) throw new Error('Species and diagnosis are required')
  return await veterinaryTreatment(
    body.species,
    body.breed || '',
    body.age || '',
    body.weight || '',
    body.diagnosis,
    body.currentMedications,
  )
})
