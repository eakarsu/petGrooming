import { db } from '@/lib/db'
import { MANAGEMENT } from '@/lib/operations/access'
import { audit, endpoint, mutate, OperationError, readJson } from '@/lib/operations/core'
import { defaultSettings, settingsSchema } from '@/lib/operations/settings'
export const GET = endpoint(undefined, async () => await db.businessSettings.findUnique({where:{id:'default'}}) ?? defaultSettings)
export const PUT = endpoint(MANAGEMENT, async (request,actor) => {
  const input=settingsSchema.parse(await readJson(request))
  return mutate(actor.id,request.headers.get('Idempotency-Key'),'settings.update',input,async tx=>{
    const previous=await tx.businessSettings.findUnique({where:{id:'default'}})
    if ((previous?.updatedAt.toISOString()??null)!==input.expectedUpdatedAt) throw new OperationError('Settings changed; reload before saving',409)
    if(previous && previous.currency!==input.currency && (await tx.transaction.count({where:{verifiedAt:{not:null}}}) || await tx.giftCard.count())) throw new OperationError('Currency cannot change while financial records or gift cards exist',409)
    const {expectedUpdatedAt,...data}=input
    const updated=await tx.businessSettings.upsert({where:{id:'default'},create:{id:'default',...data},update:data})
    await audit(tx,actor.id,'settings.update','default',{before:previous,after:updated})
    return updated
  },MANAGEMENT)
})
