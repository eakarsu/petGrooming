import { randomBytes } from 'node:crypto'
import type { Prisma } from '@prisma/client'
import { z } from 'zod'
import { audit, cents, money, OperationError } from './core'
export const issueSchema = z.object({ amount: money.refine(n => n > 0), clientId: z.string().max(100).nullish(), expiresAt: z.string().datetime().nullish(), reason: z.string().trim().min(5).max(1000), recipientName: z.string().max(150).optional(), recipientEmail: z.string().email().or(z.literal('')).optional() }).strict()
export const redeemSchema = z.object({ code: z.string().trim().min(5).max(100), amount: money.refine(n => n > 0), reason: z.string().trim().min(5).max(1000) }).strict()
export const loyaltySchema = z.object({ clientId: z.string().min(1).max(100), points: z.number().int().positive().max(1000000), description: z.string().trim().min(5).max(1000) }).strict()
export async function issueCard(tx: Prisma.TransactionClient, actorId: string, input: z.infer<typeof issueSchema>) {
  const amount = cents(input.amount)
  if (input.expiresAt && new Date(input.expiresAt) <= new Date()) throw new OperationError('Expiration must be in the future')
  if (input.clientId && !await tx.client.findFirst({ where: { id: input.clientId, isActive: true } })) throw new OperationError('Active client not found',404)
  const card = await tx.giftCard.create({ data: { code: `PGRO-${randomBytes(16).toString('hex').toUpperCase()}`, initialBalance: amount/100, currentBalance: amount/100, balanceCents: amount, initialCents: amount, clientId: input.clientId || null, expiresAt: input.expiresAt ? new Date(input.expiresAt) : null } })
  await tx.petBalanceEntry.create({ data: { accountType: 'GIFT_CARD', accountId: card.id, delta: amount, balanceAfter: amount, actorId, reason: input.reason } })
  await audit(tx, actorId, 'gift.issue', card.id, { amountCents: amount, reason: input.reason, evidence: 'MANUAL_ISSUANCE_NO_PAYMENT_CAPTURE' })
  return { giftCard: card }
}
export async function spendCard(tx: Prisma.TransactionClient, actorId: string, code: string, amount: number, reason: string, reference?: string) {
  const card = await tx.giftCard.findUnique({ where: { code } })
  if (!card?.isActive || card.expiresAt && card.expiresAt <= new Date()) throw new OperationError('Gift card is missing, inactive or expired',409)
  if (!Number.isSafeInteger(amount) || amount <= 0) throw new OperationError('A positive amount in cents is required')
  const changed = await tx.giftCard.updateMany({ where: { id: card.id, isActive: true, balanceCents: { gte: amount }, updatedAt: card.updatedAt }, data: { balanceCents: { decrement: amount }, currentBalance: (card.balanceCents-amount)/100 } })
  if (!changed.count) throw new OperationError('Insufficient balance or card changed; refresh and retry',409)
  await tx.petBalanceEntry.create({ data: { accountType: 'GIFT_CARD', accountId: card.id, delta: -amount, balanceAfter: card.balanceCents-amount, actorId, reason, reference } })
  await audit(tx, actorId, 'gift.redeem', card.id, { amountCents: amount, reason, reference })
  return { success: true, amountRedeemed: amount/100, remainingBalance: (card.balanceCents-amount)/100, giftCard: { ...card, balanceCents: card.balanceCents-amount, currentBalance: (card.balanceCents-amount)/100 } }
}
export async function changePoints(tx: Prisma.TransactionClient, actorId: string, clientId: string, delta: number, reason: string, reference?: string) {
  if (!Number.isSafeInteger(delta) || Math.abs(delta)>10000000) throw new OperationError('Invalid points amount')
  const changed = await tx.client.updateMany({ where: { id: clientId, isActive: true, ...(delta < 0 ? { loyaltyPoints: { gte: -delta } } : {}) }, data: { loyaltyPoints: { increment: delta } } })
  if (!changed.count) throw new OperationError('Active client with sufficient points not found',409)
  const client = await tx.client.findUniqueOrThrow({ where: { id: clientId }, select: { loyaltyPoints: true } })
  await tx.petBalanceEntry.create({ data: { accountType: 'LOYALTY', accountId: clientId, delta, balanceAfter: client.loyaltyPoints, actorId, reason, reference } })
  return client.loyaltyPoints
}
