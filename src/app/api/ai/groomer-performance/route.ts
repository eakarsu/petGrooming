import { callOpenRouter, parseAIResponse } from '@/lib/openrouter'
import { withAI } from '@/lib/ai-route-wrapper'

// Groomer Performance Dashboard — narrate avg appt time, satisfaction, upsells per groomer.
interface Body {
  groomers?: Array<{
    id: string
    name: string
    avgApptMinutes?: number
    satisfactionScore?: number
    retailUpsellsPerService?: number
    completedThisPeriod?: number
  }>
  periodLabel?: string
}

interface DashboardOut {
  ranked: Array<{ groomerId: string; rank: number; insights: string; coachingTip?: string }>
  topPerformer?: string
  attentionList?: string[]
  summary?: string
}

export const POST = withAI<Body, DashboardOut>('groomer-performance', async (_req, _ctx, body) => {
  if (!body.groomers || body.groomers.length === 0) {
    throw new Error('groomers[] required')
  }
  const sys = 'You are a salon ops coach. Rank groomers from the metrics provided. For each, give 1-line insight + a coaching tip. Identify top performer and an attention list. Output JSON: { ranked: [{ groomerId, rank, insights, coachingTip }], topPerformer, attentionList: [], summary }.'
  const user = `Period: ${body.periodLabel || 'current'}\nGroomers: ${JSON.stringify(body.groomers)}`
  const raw = await callOpenRouter(
    [
      { role: 'system', content: sys },
      { role: 'user', content: user },
    ],
    { maxTokens: 1500, temperature: 0.4 },
  )
  return parseAIResponse<DashboardOut>(raw, { ranked: [], summary: raw })
})
