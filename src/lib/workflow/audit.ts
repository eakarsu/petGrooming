import type { Prisma } from '@prisma/client'
import { sha256 } from './hash'

type AuditInput = {
  actorId: string
  action: string
  payload: Prisma.InputJsonValue
  orderId?: string
  quoteId?: string
}

export async function appendWorkflowAudit(tx: Prisma.TransactionClient, input: AuditInput) {
  const stream = input.orderId ? `order:${input.orderId}` : `quote:${input.quoteId}`
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${stream}))`
  const previous = await tx.workflowAuditEvent.findFirst({
    where: input.orderId ? { orderId: input.orderId } : { quoteId: input.quoteId },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
  })
  const createdAt = new Date()
  const previousHash = previous?.eventHash || null
  const eventHash = sha256({
    stream, actorId: input.actorId, action: input.action, payload: input.payload,
    previousHash, createdAt: createdAt.toISOString(),
  })
  return tx.workflowAuditEvent.create({
    data: { ...input, previousHash, eventHash, createdAt },
  })
}

export async function verifyWorkflowAudit(tx: Prisma.TransactionClient, input: { orderId?: string; quoteId?: string }) {
  const stream = input.orderId ? `order:${input.orderId}` : `quote:${input.quoteId}`
  const events = await tx.workflowAuditEvent.findMany({
    where: input.orderId ? { orderId: input.orderId } : { quoteId: input.quoteId },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  })
  let previousHash: string | null = null
  for (const event of events) {
    const expected = sha256({
      stream, actorId: event.actorId, action: event.action, payload: event.payload,
      previousHash, createdAt: event.createdAt.toISOString(),
    })
    if (event.previousHash !== previousHash || event.eventHash !== expected) return false
    previousHash = event.eventHash
  }
  return true
}
