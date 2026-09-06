import { db } from '@/lib/db'
import { OFFICE } from '@/lib/operations/access'
import { endpoint,readJson,mutate,OperationError } from '@/lib/operations/core'
import { changeBookingSchema,changeBooking,bookingInclude } from '@/lib/operations/booking'
type Context={params:Promise<{id:string}>}
export const GET=endpoint<Context>(undefined,async(_request,_actor,context)=>{const row=await db.appointment.findUnique({where:{id:(await context.params).id},include:{...bookingInclude,pet:{include:{breed:true,vaccinationRecords:true,behavioralNotes:true,groomingPreferences:true}},session:{include:{photos:true}}}});if(!row)throw new OperationError('Appointment not found',404);return row})
export const PUT=endpoint<Context>(OFFICE,async(request,actor,context)=>{const id=(await context.params).id,input=changeBookingSchema.parse(await readJson(request));return mutate(actor.id,request.headers.get('Idempotency-Key'),'booking.update',{id,...input},tx=>changeBooking(tx,actor,id,input),OFFICE)})
export const DELETE=endpoint<Context>(OFFICE,async(request,actor,context)=>{const id=(await context.params).id,input=changeBookingSchema.parse({...await readJson(request) as object,status:'CANCELLED'});return mutate(actor.id,request.headers.get('Idempotency-Key'),'booking.update',{id,...input},tx=>changeBooking(tx,actor,id,input),OFFICE)})
