import { db } from '@/lib/db'
import { OFFICE, MANAGEMENT } from '@/lib/operations/access'
import { endpoint, readJson, mutate } from '@/lib/operations/core'
import { issueCard, issueSchema } from '@/lib/operations/balances'
export const GET = endpoint(OFFICE, async request => {
  const code = request.nextUrl.searchParams.get('code')
  const clientId = request.nextUrl.searchParams.get('clientId')
  if (code) return { giftCard: await db.giftCard.findUnique({ where: { code: code.slice(0,100) } }) }
  return { giftCards: await db.giftCard.findMany({ where: clientId ? { clientId } : {}, include: { client: { select: { id:true, firstName:true, lastName:true, email:true } } }, orderBy: { createdAt: 'desc' }, take: 500 }) }
})
export const POST = endpoint(MANAGEMENT, async (request, actor) => {
  const input = issueSchema.parse(await readJson(request))
  return mutate(actor.id, request.headers.get('Idempotency-Key'), 'gift.issue', input, tx => issueCard(tx,actor.id,input), MANAGEMENT)
})
