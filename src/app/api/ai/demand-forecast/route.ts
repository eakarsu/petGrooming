import { callOpenRouter, parseAIResponse } from '@/lib/openrouter'
import { withAI } from '@/lib/ai-route-wrapper'

// Demand Forecasting — predict busy days; suggest optimal staffing.
interface Body {
  historicalAppointments?: Array<{ date: string; count: number; services?: string[] }>
  horizonDays?: number
  staffPool?: number
}

interface Forecast {
  forecast: Array<{ date: string; expectedAppts: number; recommendedStaff: number; confidence: number }>
  summary?: string
  hotspots?: string[]
}

export const POST = withAI<Body, Forecast>('demand-forecast', async (_req, _ctx, body) => {
  if (!body.historicalAppointments || body.historicalAppointments.length === 0) {
    throw new Error('historicalAppointments required')
  }
  const horizon = body.horizonDays || 14
  const sys = 'You are a demand-forecasting analyst for a pet grooming salon. Use historical daily counts to forecast appointments and recommend staffing for each upcoming day. Output JSON: { forecast: [{ date, expectedAppts, recommendedStaff, confidence }], summary, hotspots: [string] }.'
  const user = `Horizon: ${horizon} days\nStaffPool: ${body.staffPool || 'unspecified'}\nHistory (${body.historicalAppointments.length} rows): ${JSON.stringify(body.historicalAppointments.slice(-180))}`
  const raw = await callOpenRouter(
    [
      { role: 'system', content: sys },
      { role: 'user', content: user },
    ],
    { maxTokens: 2000, temperature: 0.4 },
  )
  return parseAIResponse<Forecast>(raw, { forecast: [], summary: raw })
})
