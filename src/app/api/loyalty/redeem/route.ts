import { OFFICE } from '@/lib/operations/access'
import { endpoint, readJson, mutate, audit, OperationError, cents } from '@/lib/operations/core'
import { loyaltySchema, changePoints } from '@/lib/operations/balances'
export const POST = endpoint(OFFICE, async (request, actor) => {
  const input = loyaltySchema.parse(await readJson(request))
  return mutate(actor.id, request.headers.get('Idempotency-Key'), 'loyalty.redeem', input, async tx => {
    const settings = await tx.businessSettings.findUnique({ where: { id: 'default' } })
    if (!settings) throw new OperationError('Configure loyalty settings first',409)
    const value = cents(settings.loyaltyPointsValue)*input.points
    const remainingPoints = await changePoints(tx,actor.id,input.clientId,-input.points,input.description)
    await audit(tx,actor.id,'loyalty.redeem',input.clientId,{points:input.points,valueCents:value,reason:input.description})
    return { success:true, pointsRedeemed:input.points, remainingPoints, dollarValue:value/100, message:'Points redemption recorded' }
  }, OFFICE)
})
