import { NextRequest, NextResponse } from 'next/server'
import { withAI } from '@/lib/ai-route-wrapper'
import { db } from '@/lib/db'
import { callOpenRouter, callOpenRouterVision } from '@/lib/openrouter'
import { parseAIJson, aiErrorResponse } from '@/lib/ai-helpers'

interface IntakeBody {
  clientPhone: string
  petId?: string
  appointmentId?: string
  symptoms?: string
  photoBase64s?: string[]
}

interface TriageResult {
  triageSummary: string
  urgencyLevel: 'ROUTINE' | 'SOON' | 'URGENT' | 'EMERGENCY'
  flagForVet: boolean
  recommendedActions: string[]
  vetNotes: string
  visualFindings: string[]
}

/**
 * AI Pre-visit triage:
 * 1) For each photo: vision LLM extracts visible findings (skin, eye, ear).
 * 2) Combine with symptoms and run a final triage prompt → urgency + vet notes.
 * 3) Persist into PreVisitIntake. If urgency >= URGENT, auto-flag for vet.
 */
export const POST = withAI<IntakeBody, TriageResult & { intakeId: string }>(
  'pre-visit-intake',
  async (_req, _ctx, body) => {
    if (!body.clientPhone) throw new Error('clientPhone is required')

    const visualFindings: string[] = []
    if (body.photoBase64s && body.photoBase64s.length > 0) {
      for (const b64 of body.photoBase64s.slice(0, 4)) {
        try {
          const findings = await callOpenRouterVision(
            b64,
            'You are a veterinary triage assistant. Look at the pet photo and list 1-3 short visible findings (skin lesions, eye discharge, lameness cues, etc). Reply with one finding per line, no preamble.',
          )
          findings
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean)
            .slice(0, 3)
            .forEach((f) => visualFindings.push(f))
        } catch (e) {
          visualFindings.push('[photo could not be analyzed]')
        }
      }
    }

    const triagePrompt = `You are a senior triage veterinary nurse. The pet owner submitted the following before their visit.

Symptoms reported: ${body.symptoms || '(none)'}

Visual findings from photos:
${visualFindings.map((f, i) => `${i + 1}. ${f}`).join('\n') || '(no photos)'}

Decide urgency for the upcoming groom/vet visit. Respond ONLY with JSON in this exact shape:
{
  "triageSummary": "1-2 sentences for the vet to read first",
  "urgencyLevel": "ROUTINE | SOON | URGENT | EMERGENCY",
  "flagForVet": true,
  "recommendedActions": ["..."],
  "vetNotes": "Detailed notes the vet should review (4-6 sentences)"
}`

    const aiText = await callOpenRouter(
      [
        { role: 'system', content: 'You are a veterinary triage expert. Always respond with valid JSON.' },
        { role: 'user', content: triagePrompt },
      ],
      { temperature: 0.3, maxTokens: 1500 },
    )

    const parsed = parseAIJson<TriageResult>(aiText) || {
      triageSummary: 'Unable to parse triage output. Manual review needed.',
      urgencyLevel: 'SOON' as const,
      flagForVet: true,
      recommendedActions: ['Manual review of intake required'],
      vetNotes: aiText.slice(0, 1000),
      visualFindings,
    }

    parsed.visualFindings = visualFindings

    const intake = await db.preVisitIntake.create({
      data: {
        appointmentId: body.appointmentId,
        petId: body.petId,
        clientPhone: body.clientPhone,
        rawSymptoms: body.symptoms || null,
        rawPhotos: (body.photoBase64s || []).map((_, i) => `photo_${i}`),
        aiTriageResult: parsed as unknown as object,
        urgencyLevel: parsed.urgencyLevel,
        flaggedForVet: parsed.flagForVet || ['URGENT', 'EMERGENCY'].includes(parsed.urgencyLevel),
      },
    })

    return { ...parsed, intakeId: intake.id }
  },
)

/** GET /api/ai/pre-visit-intake?urgency=URGENT&page=1 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const urgency = searchParams.get('urgency') || undefined
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10)
    const where = urgency ? { urgencyLevel: urgency } : {}
    const [items, total] = await Promise.all([
      db.preVisitIntake.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      db.preVisitIntake.count({ where }),
    ])
    return NextResponse.json({ data: items, page, pageSize, total, totalPages: Math.ceil(total / pageSize) })
  } catch (error) {
    return NextResponse.json(aiErrorResponse(error, 'Failed to load intakes'), { status: 500 })
  }
}
