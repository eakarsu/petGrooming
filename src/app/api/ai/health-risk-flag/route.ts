import { callOpenRouter, parseAIResponse } from '@/lib/openrouter'
import { withAI } from '@/lib/ai-route-wrapper'

// Health Risk Flagging — analyze groom notes + medical history; alert to skin/behavior concerns.
interface Body {
  groomNotes?: string
  medicalHistory?: Array<{ date: string; diagnosis?: string; treatment?: string }>
  pet?: { breed?: string; ageYears?: number }
}

export const POST = withAI<Body>('health-risk-flag', async (_req, _ctx, body) => {
  if (!body.groomNotes && !(body.medicalHistory || []).length) {
    throw new Error('groomNotes or medicalHistory required')
  }
  const sys = 'You are a veterinary screener. Surface health risk flags from groomer notes + history. Output JSON: { flags: [{ category: "skin|behavior|coat|systemic", severity: "info|watch|alert", finding, recommendation }], summary, suggestVetVisit: boolean }.'
  const user = `Pet: ${JSON.stringify(body.pet || {})}\nGroom notes: ${(body.groomNotes || '').slice(0, 3000)}\nMedical history: ${JSON.stringify(body.medicalHistory || []).slice(0, 3000)}`
  const raw = await callOpenRouter(
    [
      { role: 'system', content: sys },
      { role: 'user', content: user },
    ],
    { maxTokens: 1500, temperature: 0.3 },
  )
  return parseAIResponse(raw, { flags: [], summary: raw, suggestVetVisit: false })
})
