import { AppointmentStatus } from '@prisma/client'
import { z } from 'zod'
import { db } from '@/lib/db'
import { OFFICE } from '@/lib/operations/access'
import { endpoint,readJson,mutate,OperationError } from '@/lib/operations/core'
import { bookingSchema,createBooking,bookingInclude } from '@/lib/operations/booking'
import { zonedMidnight } from '@/lib/operations/time'
export const GET=endpoint(undefined,async request=>{
 const q=request.nextUrl.searchParams,day=q.get('date'),status=q.get('status')
 const where:any={};for(const key of ['groomerId','clientId','petId'])if(q.get(key))where[key]=q.get(key)!.slice(0,100)
 if(status)where.status=z.nativeEnum(AppointmentStatus).parse(status)
 if(day){try{const settings=await db.businessSettings.findUnique({where:{id:'default'}}),zone=settings?.timezone??'America/New_York',start=zonedMidnight(day,zone),tomorrow=new Date(day+'T12:00:00Z');tomorrow.setUTCDate(tomorrow.getUTCDate()+1);where.scheduledDate={gte:start,lt:zonedMidnight(tomorrow.toISOString().slice(0,10),zone)}}catch{throw new OperationError('Invalid calendar date',400)}}
 return db.appointment.findMany({where,include:bookingInclude,orderBy:[{scheduledDate:'asc'},{scheduledTime:'asc'}],take:1000})
})
export const POST=endpoint(OFFICE,async(request,actor)=>{const input=bookingSchema.parse(await readJson(request));return mutate(actor.id,request.headers.get('Idempotency-Key'),'booking.create',input,tx=>createBooking(tx,actor.id,input),OFFICE)})
