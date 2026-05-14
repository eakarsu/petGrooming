import { callOpenRouter, parseAIResponse } from '@/lib/openrouter'
import { withAI } from '@/lib/ai-route-wrapper'

// Retail Upsell Recommendations (SKU-aware) — pet type + coat + seasonal → SKU suggestions.
interface Body {
  petBreed?: string
  coatCondition?: string
  season?: string
  inventorySkus?: Array<{ sku: string; name: string; category?: string; price?: number; inStock?: boolean }>
}

interface UpsellOut {
  recommendations: Array<{ sku: string; reason: string; expectedMarginUSD?: number }>
  bundleSuggestions?: string[]
  rationale?: string
}

export const POST = withAI<Body, UpsellOut>('retail-upsell-sku', async (_req, _ctx, body) => {
  if (!body.petBreed) throw new Error('petBreed required')
  const sys = 'You are a retail merchandiser for a grooming salon. From available SKUs and pet attributes, recommend up to 5 specific SKUs and a bundle. Only choose in-stock items. Output JSON: { recommendations: [{ sku, reason, expectedMarginUSD }], bundleSuggestions: [string], rationale }.'
  const inv = (body.inventorySkus || []).filter((s) => s.inStock !== false).slice(0, 50)
  const user = `Breed: ${body.petBreed}\nCoat: ${body.coatCondition || 'unspecified'}\nSeason: ${body.season || 'unspecified'}\nInventory: ${JSON.stringify(inv)}`
  const raw = await callOpenRouter(
    [
      { role: 'system', content: sys },
      { role: 'user', content: user },
    ],
    { maxTokens: 1200, temperature: 0.6 },
  )
  return parseAIResponse<UpsellOut>(raw, { recommendations: [], rationale: raw })
})
