import { NextRequest, NextResponse } from 'next/server'
import { withAI } from '@/lib/ai-route-wrapper'
import { db } from '@/lib/db'
import { callOpenRouter } from '@/lib/openrouter'
import { aiErrorResponse, parseAIJson } from '@/lib/ai-helpers'

interface BundleBody {
  familyGroupId: string
}

interface BundleSuggestion {
  recommendedServices: Array<{
    petId: string
    petName: string
    services: string[]
    price: number
  }>
  totalPrice: number
  discountPct: number
  reasoning: string
}

/**
 * AI bundle pricing engine for multi-pet families.
 * 1) Loads family members, their pets, and breed-specific service pricing.
 * 2) Asks the LLM to design an optimal bundle with breed-aware upsells.
 * 3) Applies a tiered family discount: 2 pets = 10%, 3+ = 15%, 5+ = 20%.
 * 4) Persists into BundleSuggestion.
 */
export const POST = withAI<BundleBody>('family-bundle', async (_req, _ctx, body) => {
  if (!body.familyGroupId) throw new Error('familyGroupId is required')

  const family = await db.familyGroup.findUnique({
    where: { id: body.familyGroupId },
    include: { members: true },
  })
  if (!family) throw new Error('Family group not found')

  const petIds = family.members.map((m) => m.petId).filter((x): x is string => Boolean(x))
  const pets = await db.pet.findMany({
    where: { id: { in: petIds } },
    include: { breed: { include: { breedServices: { include: { service: true } } } } },
  })
  const services = await db.service.findMany({ where: { isActive: true, isAddOn: false } })

  const summary = pets.map((p) => ({
    id: p.id,
    name: p.name,
    breed: p.breed?.name,
    size: p.breed?.size,
    weight: p.weight,
    age: p.dateOfBirth ? Math.floor((Date.now() - +new Date(p.dateOfBirth)) / (365 * 24 * 60 * 60 * 1000)) : null,
    allergies: p.allergies,
  }))

  const prompt = `You are a pet-grooming sales assistant. Design the best multi-pet bundle for this family.

Pets: ${JSON.stringify(summary)}
Available services: ${JSON.stringify(services.map((s) => ({ id: s.id, name: s.name, price: s.basePrice })))}

For each pet, choose 2-4 services that match its breed/size/age. Total the prices.
Respond ONLY with JSON:
{
  "recommendedServices": [
    { "petId": "id", "petName": "name", "services": ["serviceName1", "serviceName2"], "price": 120.00 }
  ],
  "totalPrice": 350.00,
  "reasoning": "1-3 sentences explaining the bundle"
}`

  const text = await callOpenRouter(
    [
      { role: 'system', content: 'You are a pet grooming bundle designer. Always reply with valid JSON.' },
      { role: 'user', content: prompt },
    ],
    { temperature: 0.5, maxTokens: 1200 },
  )

  const parsed = parseAIJson<Omit<BundleSuggestion, 'discountPct'>>(text) || {
    recommendedServices: pets.map((p) => ({
      petId: p.id,
      petName: p.name,
      services: ['Bath', 'Brushing'],
      price: 60,
    })),
    totalPrice: pets.length * 60,
    reasoning: 'Default bundle (LLM output unparseable)',
  }

  const petCount = pets.length
  const discountPct = petCount >= 5 ? 20 : petCount >= 3 ? 15 : petCount >= 2 ? 10 : 0
  const discountedTotal = Math.round(parsed.totalPrice * (1 - discountPct / 100) * 100) / 100

  const saved = await db.bundleSuggestion.create({
    data: {
      familyGroupId: family.id,
      recommendedServices: parsed.recommendedServices as unknown as object,
      totalPrice: discountedTotal,
      discountPct,
      reasoning: parsed.reasoning,
    },
  })

  return {
    bundleId: saved.id,
    discountPct,
    originalTotal: parsed.totalPrice,
    discountedTotal,
    recommendedServices: parsed.recommendedServices,
    reasoning: parsed.reasoning,
  }
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const familyGroupId = searchParams.get('familyGroupId') || undefined
    const items = await db.bundleSuggestion.findMany({
      where: familyGroupId ? { familyGroupId } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    return NextResponse.json({ data: items })
  } catch (error) {
    return NextResponse.json(aiErrorResponse(error, 'Failed to list bundles'), { status: 500 })
  }
}
