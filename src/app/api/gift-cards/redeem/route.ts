import { OFFICE } from '@/lib/operations/access'
import { endpoint, readJson, mutate, cents } from '@/lib/operations/core'
import { redeemSchema, spendCard } from '@/lib/operations/balances'
export const POST = endpoint(OFFICE, async (request, actor) => {
  const input = redeemSchema.parse(await readJson(request))
  return mutate(actor.id, request.headers.get('Idempotency-Key'), 'gift.redeem', input, tx => spendCard(tx, actor.id, input.code, cents(input.amount), input.reason), OFFICE)
})
