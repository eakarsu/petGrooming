import type { Prisma, PrismaClient } from '@prisma/client'
import { appendWorkflowAudit } from './audit'
import { WorkflowError } from './errors'
import { sha256 } from './hash'
import { invokeProvider, type ProviderInvoker } from './provider'
import { queueIntegrationOperation } from './service'

function numericOutput(output: Prisma.JsonValue | null, field: string) {
  const value = output && typeof output === 'object' && !Array.isArray(output) ? Number((output as Record<string, unknown>)[field]) : Number.NaN
  if (!Number.isFinite(value)) throw new WorkflowError('PROVIDER_RESPONSE_INVALID', `${field} is missing from provider output`, 502)
  return value
}

function stringOutput(output: Record<string, unknown>, field: string) {
  const value = String(output[field] || '').trim()
  if (!value) throw new WorkflowError('PROVIDER_RESPONSE_INVALID', `${field} is missing from provider output`, 502)
  return value
}

async function finalizeQuote(tx: Prisma.TransactionClient, quoteId: string, actorId: string) {
  const quote = await tx.groomingQuote.findUnique({ where: { id: quoteId } })
  if (!quote || quote.status !== 'DRAFT') return
  const operations = await tx.integrationOperation.findMany({ where: { aggregateType: 'QUOTE', aggregateId: quoteId } })
  const maps = operations.find((operation) => operation.operationType === 'ROUTE_QUOTE')
  const tax = operations.find((operation) => operation.operationType === 'TAX_QUOTE')
  if (maps?.status === 'DEAD_LETTER' || tax?.status === 'DEAD_LETTER') {
    await tx.groomingQuote.update({ where: { id: quoteId }, data: { status: 'FAILED', providerFailure: 'A required quote provider exhausted retries', version: { increment: 1 } } })
    await appendWorkflowAudit(tx, { quoteId, actorId, action: 'QUOTE_PROVIDER_FAILED', payload: { reason: 'A required quote provider exhausted retries' } })
    return
  }
  if (maps?.status !== 'COMPLETED' || tax?.status !== 'COMPLETED') return
  const distanceKm = numericOutput(maps.output, 'distanceKm')
  const taxCents = numericOutput(tax.output, 'taxCents')
  if (distanceKm < 0 || !Number.isInteger(taxCents) || taxCents < 0) throw new WorkflowError('PROVIDER_RESPONSE_INVALID', 'Quote provider returned invalid distance or tax', 502)
  const profile = await tx.technicianProfile.findUniqueOrThrow({ where: { userId: quote.proposedTechnicianId } })
  if (distanceKm > profile.maxTravelKm) {
    await tx.groomingQuote.update({ where: { id: quote.id }, data: { status: 'FAILED', travelKm: distanceKm, providerFailure: 'Route exceeds technician travel limit', version: { increment: 1 } } })
    await appendWorkflowAudit(tx, { quoteId, actorId, action: 'QUOTE_TRAVEL_REJECTED', payload: { distanceKm, maximumKm: profile.maxTravelKm } })
    return
  }
  await tx.groomingQuote.update({ where: { id: quote.id }, data: { status: 'OFFERED', travelKm: distanceKm, taxCents, totalCents: quote.subtotalCents + taxCents, version: { increment: 1 } } })
  await appendWorkflowAudit(tx, { quoteId, actorId, action: 'QUOTE_OFFERED', payload: { distanceKm, taxCents, totalCents: quote.subtotalCents + taxCents } })
}

async function applyOperationSuccess(tx: Prisma.TransactionClient, operation: { id: string; operationType: string; aggregateType: string; aggregateId: string }, output: Record<string, unknown>, actorId: string) {
  if (operation.aggregateType === 'QUOTE') await finalizeQuote(tx, operation.aggregateId, actorId)
  if (operation.aggregateType === 'INVOICE' && operation.operationType === 'TAX_INVOICE') {
    const taxCents = Number(output.taxCents)
    if (!Number.isInteger(taxCents) || taxCents < 0) throw new WorkflowError('PROVIDER_RESPONSE_INVALID', 'Invoice tax must be a nonnegative integer', 502)
    const invoice = await tx.workflowInvoice.findUniqueOrThrow({ where: { id: operation.aggregateId } })
    await tx.workflowInvoice.update({ where: { id: invoice.id }, data: { taxCents, totalCents: invoice.subtotalCents + taxCents, status: 'ISSUED', issuedAt: new Date() } })
    await appendWorkflowAudit(tx, { orderId: invoice.orderId, actorId, action: 'INVOICE_ISSUED', payload: { invoiceId: invoice.id, taxCents, totalCents: invoice.subtotalCents + taxCents } })
  }
  if (operation.aggregateType === 'PAYMENT' && operation.operationType === 'PAYMENT_CHARGE') {
    await tx.workflowPayment.update({ where: { id: operation.aggregateId }, data: { providerExternalId: stringOutput(output, 'externalId') } })
  }
  if (operation.aggregateType === 'REFUND' && operation.operationType === 'PAYMENT_REFUND') {
    await tx.workflowRefund.update({ where: { id: operation.aggregateId }, data: { providerExternalId: stringOutput(output, 'externalId') } })
  }
  if (operation.aggregateType === 'ORDER' && operation.operationType.includes('MESSAGE')) {
    await tx.customerCommunication.updateMany({ where: { orderId: operation.aggregateId, status: 'QUEUED' }, data: { status: 'SENT' } })
  }
}

export async function processOneIntegrationOperation(prisma: PrismaClient, workerId: string, provider: ProviderInvoker = invokeProvider) {
  const claimed = await prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM workflow_integration_operations
      WHERE status IN ('PENDING', 'RETRY')
        AND "nextAttemptAt" <= NOW()
        AND ("leasedUntil" IS NULL OR "leasedUntil" < NOW())
      ORDER BY "createdAt" ASC
      FOR UPDATE SKIP LOCKED LIMIT 1`
    if (!rows[0]) return null
    return tx.integrationOperation.update({
      where: { id: rows[0].id },
      data: { status: 'LEASED', leasedBy: workerId, leasedUntil: new Date(Date.now() + 30_000), attempts: { increment: 1 } },
      include: { connector: true },
    })
  })
  if (!claimed) return 'idle'
  try {
    const result = await provider(claimed.connector, claimed.operationType, claimed.payload, claimed.idempotencyKey)
    await prisma.$transaction(async (tx) => {
      const current = await tx.integrationOperation.findUniqueOrThrow({ where: { id: claimed.id } })
      if (current.status !== 'LEASED' || current.leasedBy !== workerId) throw new WorkflowError('LEASE_LOST', 'Integration operation lease was lost', 409, true)
      await tx.integrationOperation.update({ where: { id: claimed.id }, data: { status: 'COMPLETED', output: result.output as Prisma.InputJsonValue, receipt: result.receipt, leasedBy: null, leasedUntil: null, lastError: null } })
      await applyOperationSuccess(tx, claimed, result.output, claimed.connector.serviceUserId)
    })
    return 'completed'
  } catch (error) {
    const workflowError = error instanceof WorkflowError ? error : new WorkflowError('PROVIDER_FAILURE', error instanceof Error ? error.message : 'Provider failure', 502, true)
    return prisma.$transaction(async (tx) => {
      const current = await tx.integrationOperation.findUniqueOrThrow({ where: { id: claimed.id } })
      const dead = !workflowError.retryable || current.attempts >= current.maxAttempts
      await tx.integrationOperation.update({
        where: { id: claimed.id },
        data: { status: dead ? 'DEAD_LETTER' : 'RETRY', nextAttemptAt: new Date(Date.now() + Math.min(60_000, 1000 * 2 ** current.attempts)), leasedBy: null, leasedUntil: null, lastError: `${workflowError.code}: ${workflowError.message}`.slice(0, 2000) },
      })
      if (dead && claimed.aggregateType === 'QUOTE') await finalizeQuote(tx, claimed.aggregateId, claimed.connector.serviceUserId)
      if (dead && claimed.aggregateType === 'PAYMENT') await tx.workflowPayment.update({ where: { id: claimed.aggregateId }, data: { status: 'FAILED', failureCode: workflowError.code } })
      if (dead && claimed.aggregateType === 'REFUND') await tx.workflowRefund.update({ where: { id: claimed.aggregateId }, data: { status: 'FAILED' } })
      return dead ? 'dead-letter' : 'retry'
    })
  }
}

async function queueOptional(tx: Prisma.TransactionClient, input: Parameters<typeof queueIntegrationOperation>[1]) {
  const count = await tx.providerConnector.count({ where: { kind: input.kind, enabled: true } })
  if (count === 1) await queueIntegrationOperation(tx, input)
}

export async function applyIntegrationWebhook(prisma: PrismaClient, input: { connectorId: string; externalEventId: string; payload: Record<string, unknown> }) {
  return prisma.$transaction(async (tx) => {
    const connector = await tx.providerConnector.findFirst({ where: { id: input.connectorId, enabled: true }, include: { serviceUser: true } })
    if (!connector || connector.kind !== 'PAYMENT' || !connector.serviceUser.isActive) throw new WorkflowError('CONNECTOR_NOT_FOUND', 'Active payment connector was not found', 404)
    const previous = await tx.integrationWebhookReceipt.findUnique({ where: { connectorId_externalEventId: { connectorId: connector.id, externalEventId: input.externalEventId } } })
    if (previous) return { duplicate: true }
    await tx.integrationWebhookReceipt.create({ data: { connectorId: connector.id, externalEventId: input.externalEventId, payloadHash: sha256(input.payload) } })
    const type = String(input.payload.type || '')
    const externalId = String(input.payload.externalId || '')
    if (type.startsWith('PAYMENT_')) {
      const payment = await tx.workflowPayment.findUnique({ where: { providerExternalId: externalId }, include: { invoice: true } })
      if (!payment) throw new WorkflowError('PAYMENT_NOT_FOUND', 'Webhook payment was not found', 404)
      if (type === 'PAYMENT_SUCCEEDED' && payment.status === 'PENDING') {
        const paidCents = payment.invoice.paidCents + payment.amountCents
        await tx.workflowPayment.update({ where: { id: payment.id }, data: { status: 'SUCCEEDED' } })
        await tx.workflowInvoice.update({ where: { id: payment.invoiceId }, data: { paidCents, status: paidCents >= payment.invoice.totalCents ? 'PAID' : 'PARTIALLY_PAID' } })
        await queueOptional(tx, { kind: 'ACCOUNTING', operationType: 'POST_PAYMENT', aggregateType: 'ORDER', aggregateId: payment.invoice.orderId, idempotencyKey: `accounting:payment:${payment.id}`, payload: { invoiceId: payment.invoiceId, paymentId: payment.id, amountCents: payment.amountCents } })
        await queueOptional(tx, { kind: 'MESSAGING', operationType: 'PAYMENT_RECEIPT_MESSAGE', aggregateType: 'ORDER', aggregateId: payment.invoice.orderId, idempotencyKey: `message:payment:${payment.id}`, payload: { invoiceId: payment.invoiceId, amountCents: payment.amountCents } })
        await appendWorkflowAudit(tx, { orderId: payment.invoice.orderId, actorId: connector.serviceUserId, action: 'PAYMENT_SUCCEEDED', payload: { paymentId: payment.id, amountCents: payment.amountCents, externalEventId: input.externalEventId } })
      } else if (type === 'PAYMENT_FAILED' && payment.status === 'PENDING') {
        await tx.workflowPayment.update({ where: { id: payment.id }, data: { status: 'FAILED', failureCode: String(input.payload.failureCode || 'PROVIDER_DECLINED') } })
        await appendWorkflowAudit(tx, { orderId: payment.invoice.orderId, actorId: connector.serviceUserId, action: 'PAYMENT_FAILED', payload: { paymentId: payment.id, failureCode: input.payload.failureCode || null } })
      }
      return { duplicate: false, paymentId: payment.id }
    }
    if (type.startsWith('REFUND_')) {
      const refund = await tx.workflowRefund.findUnique({ where: { providerExternalId: externalId }, include: { payment: { include: { invoice: true, refunds: true } } } })
      if (!refund) throw new WorkflowError('REFUND_NOT_FOUND', 'Webhook refund was not found', 404)
      if (type === 'REFUND_SUCCEEDED' && refund.status === 'PENDING') {
        await tx.workflowRefund.update({ where: { id: refund.id }, data: { status: 'SUCCEEDED' } })
        const invoice = refund.payment.invoice
        const refundedCents = invoice.refundedCents + refund.amountCents
        const paymentRefunded = refund.payment.refunds.filter((item) => item.status === 'SUCCEEDED').reduce((sum, item) => sum + item.amountCents, 0) + refund.amountCents
        await tx.workflowPayment.update({ where: { id: refund.paymentId }, data: { status: paymentRefunded >= refund.payment.amountCents ? 'REFUNDED' : 'PARTIALLY_REFUNDED' } })
        await tx.workflowInvoice.update({ where: { id: invoice.id }, data: { refundedCents, status: refundedCents >= invoice.paidCents ? 'REFUNDED' : 'PARTIALLY_REFUNDED' } })
        await queueOptional(tx, { kind: 'ACCOUNTING', operationType: 'POST_REFUND', aggregateType: 'ORDER', aggregateId: invoice.orderId, idempotencyKey: `accounting:refund:${refund.id}`, payload: { invoiceId: invoice.id, refundId: refund.id, amountCents: refund.amountCents } })
        await appendWorkflowAudit(tx, { orderId: invoice.orderId, actorId: connector.serviceUserId, action: 'REFUND_SUCCEEDED', payload: { refundId: refund.id, amountCents: refund.amountCents, externalEventId: input.externalEventId } })
      } else if (type === 'REFUND_FAILED' && refund.status === 'PENDING') {
        await tx.workflowRefund.update({ where: { id: refund.id }, data: { status: 'FAILED' } })
        await appendWorkflowAudit(tx, { orderId: refund.payment.invoice.orderId, actorId: connector.serviceUserId, action: 'REFUND_FAILED', payload: { refundId: refund.id } })
      }
      return { duplicate: false, refundId: refund.id }
    }
    throw new WorkflowError('WEBHOOK_EVENT_UNSUPPORTED', 'Webhook event type is unsupported')
  }, { isolationLevel: 'Serializable' })
}

export async function retryIntegrationOperation(prisma: PrismaClient, input: { actorId: string; operationId: string; reason: string }) {
  return prisma.$transaction(async (tx) => {
    const actor = await tx.user.findUnique({ where: { id: input.actorId } })
    if (!actor?.isActive || !['ADMIN', 'MANAGER'].includes(actor.role)) throw new WorkflowError('ROLE_FORBIDDEN', 'A supervisor is required', 403)
    const operation = await tx.integrationOperation.findUnique({ where: { id: input.operationId } })
    if (!operation || operation.status !== 'DEAD_LETTER') throw new WorkflowError('DEAD_LETTER_NOT_FOUND', 'A dead-letter operation was not found', 404)
    return tx.integrationOperation.update({ where: { id: operation.id }, data: { status: 'RETRY', attempts: 0, nextAttemptAt: new Date(), lastError: `Manual repair: ${String(input.reason).slice(0, 1000)}` } })
  })
}
