import { callOpenRouter, parseAIResponse } from '@/lib/openrouter'
import { withAI } from '@/lib/ai-route-wrapper'

// Automated Reminders — generate SMS/email sequence for appointment + post-service follow-up.
// TODO: configure credentials — TWILIO_AUTH_TOKEN + SENDGRID_API_KEY to dispatch.
interface Body {
  appointmentDate?: string
  clientName?: string
  petName?: string
  channel?: 'sms' | 'email' | 'both'
  postServiceFollowUp?: boolean
}

interface SequenceItem {
  offsetHours: number
  channel: 'sms' | 'email'
  subject?: string
  body: string
}

export const POST = withAI<Body, { sequence: SequenceItem[]; dispatchReady: boolean }>(
  'auto-reminder-sequence',
  async (_req, _ctx, body) => {
    if (!body.appointmentDate) throw new Error('appointmentDate required')
    const channel = body.channel || 'both'
    const sys = 'You are a customer-comms designer for a pet grooming salon. Produce a tasteful reminder sequence (24h before, 1h before, post-service follow-up). Channel-aware (SMS short, email warmer). Output JSON: { sequence: [{ offsetHours, channel, subject?, body }] }.'
    const user = `Appt: ${body.appointmentDate}\nClient: ${body.clientName || 'guest'}\nPet: ${body.petName || 'their pet'}\nChannel: ${channel}\nIncludePostService: ${body.postServiceFollowUp !== false}`
    const raw = await callOpenRouter(
      [
        { role: 'system', content: sys },
        { role: 'user', content: user },
      ],
      { maxTokens: 1200, temperature: 0.6 },
    )
    const fallback: { sequence: SequenceItem[] } = { sequence: [] }
    const parsed = parseAIResponse<{ sequence: SequenceItem[] }>(raw, fallback)
    const dispatchReady = !!(process.env.TWILIO_AUTH_TOKEN && process.env.SENDGRID_API_KEY)
    return { sequence: parsed.sequence, dispatchReady }
  },
)
