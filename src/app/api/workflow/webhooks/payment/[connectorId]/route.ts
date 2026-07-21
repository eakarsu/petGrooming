import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { workflowResponse } from '@/lib/workflow/api'
import { WorkflowError } from '@/lib/workflow/errors'
import { verifyWebhookSignature } from '@/lib/workflow/provider'
import { applyIntegrationWebhook } from '@/lib/workflow/worker'

export async function POST(request: NextRequest, { params }: { params: Promise<{ connectorId: string }> }) {
  try {
    const connector = await db.providerConnector.findUnique({ where: { id: (await params).connectorId } })
    if (!connector?.enabled || connector.kind !== 'PAYMENT' || !connector.webhookSecretEnv) throw new WorkflowError('CONNECTOR_NOT_FOUND', 'Payment connector was not found', 404)
    const secret = process.env[connector.webhookSecretEnv]
    if (!secret) throw new WorkflowError('WEBHOOK_SECRET_MISSING', 'Payment webhook secret is not configured', 503)
    const raw = await request.text()
    const timestamp = Number(request.headers.get('x-provider-timestamp'))
    const signature = request.headers.get('x-provider-signature') || ''
    if (!verifyWebhookSignature(secret, timestamp, raw, signature)) throw new WorkflowError('WEBHOOK_SIGNATURE_INVALID', 'Payment webhook signature is invalid', 401)
    let payload: Record<string, unknown>
    try { payload = JSON.parse(raw) } catch { throw new WorkflowError('WEBHOOK_PAYLOAD_INVALID', 'Payment webhook payload is invalid') }
    const externalEventId = String(request.headers.get('x-provider-event-id') || '')
    if (!externalEventId) throw new WorkflowError('WEBHOOK_EVENT_ID_REQUIRED', 'Payment webhook event ID is required')
    return NextResponse.json(await applyIntegrationWebhook(db, { connectorId: connector.id, externalEventId, payload }))
  } catch (error) { return workflowResponse(error) }
}
