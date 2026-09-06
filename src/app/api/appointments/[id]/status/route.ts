import { OFFICE } from '@/lib/operations/access'
import { endpoint,readJson,mutate } from '@/lib/operations/core'
import { changeBookingSchema,changeBooking } from '@/lib/operations/booking'
type Context={params:Promise<{id:string}>}
const roles=[...OFFICE,'GROOMER']
export const PATCH=endpoint<Context>(roles,async(request,actor,context)=>{const id=(await context.params).id,input=changeBookingSchema.parse(await readJson(request));return mutate(actor.id,request.headers.get('Idempotency-Key'),'booking.update',{id,...input},tx=>changeBooking(tx,actor,id,input),roles)})
