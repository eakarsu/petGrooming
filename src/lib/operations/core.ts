import { createHash } from 'node:crypto'
import { Prisma } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireApiActor } from '@/lib/workflow/api'
import { WorkflowError } from '@/lib/workflow/errors'
import { requireWorkflowActor } from '@/lib/workflow/authz'

export class OperationError extends Error {
  constructor(message: string, public status = 422) { super(message) }
}
export async function readJson(request: Request) {
  const reader = request.body?.getReader()
  if (!reader) throw new OperationError('JSON body is required', 400)
  const chunks: Uint8Array[] = []; let length = 0
  try {
    while (true) {
      const { done, value } = await reader.read(); if (done) break
      length += value.length
      if (length > 1_000_000) { await reader.cancel(); throw new OperationError('Request exceeds 1 MB', 413) }
      chunks.push(value)
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown
  } catch (error) {
    if (error instanceof OperationError) throw error
    throw new OperationError('Valid JSON is required', 400)
  } finally { reader.releaseLock() }
}
export function endpoint<C = unknown>(roles: string[] | undefined, handler: (request: NextRequest, actor: { id: string; role: string }, context: C) => Promise<unknown>) {
  return async (request: NextRequest, context: C) => {
    try {
      const actor = await requireApiActor(roles)
      const result = await handler(request, actor, context)
      return result instanceof Response ? result : NextResponse.json(result)
    } catch (error) {
      if (error instanceof OperationError || error instanceof WorkflowError) return NextResponse.json({ error: error.message }, { status: error.status })
      if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ') }, { status: 422 })
      if (error instanceof Prisma.PrismaClientKnownRequestError && ['P2002','P2003','P2025','P2034'].includes(error.code)) return NextResponse.json({ error: 'Record changed or conflicts with another record; refresh and retry' }, { status: 409 })
      console.error('Operation failed', error instanceof Error ? error.name : 'unknown')
      return NextResponse.json({ error: 'Operation could not be completed' }, { status: 500 })
    }
  }
}
export const jsonValue = (value: unknown): Prisma.InputJsonValue => JSON.parse(JSON.stringify(value))
export const digest = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex')
export async function mutate(actorId: string, key: string | null, action: string, input: unknown, work: (tx: Prisma.TransactionClient) => Promise<unknown>, roles?: string[]) {
  if (!key || !/^[a-zA-Z0-9:_-]{8,128}$/.test(key)) throw new OperationError('An Idempotency-Key of 8–128 letters, digits, colons, underscores or hyphens is required', 400)
  const id = digest([actorId, key]); const inputHash = digest([action,input])
  for (let attempt=0;;attempt++) {
   try { return await db.$transaction(async tx => {
    await requireWorkflowActor(tx, actorId, roles)
    // One lock orders legacy mutations; workflow stock writers are additionally protected by conditional row updates.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('petgroom-operations'))`
    const previous = await tx.petOperation.findUnique({ where: { id } })
    if (previous) {
      if (previous.inputHash !== inputHash) throw new OperationError('This retry key was used for different input', 409)
      return previous.response
    }
    const response = jsonValue(await work(tx))
    await tx.petOperation.create({ data: { id, actorId, action, inputHash, response } })
    return response
  }, { timeout: 15000, isolationLevel: 'Serializable' })
   } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code==='P2034' && attempt<3) continue
    throw error
   }
  }
}
export const audit = (tx: Prisma.TransactionClient, actorId: string, action: string, entityId: string, details: unknown) => tx.petAudit.create({ data: { actorId, action, entityId, details: jsonValue(details) } })
export function cents(amount: number) {
  if (!Number.isFinite(amount) || Math.abs(amount) > 10_000_000 || Math.abs(amount * 100 - Math.round(amount * 100)) > 0.000001) throw new OperationError('Amount must have at most two decimal places and be within the supported limit')
  return Math.round(amount * 100)
}
export const money = z.number().finite().min(0).max(10_000_000).refine(n => Math.abs(n*100-Math.round(n*100)) < 0.000001, 'Use at most two decimal places')
