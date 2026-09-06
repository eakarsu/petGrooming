import type { Prisma } from '@prisma/client'
import { AppointmentStatus } from '@prisma/client'
import { z } from 'zod'
import { audit,cents,OperationError } from './core'
import { dateInZone,localInstant,zonedMidnight } from './time'
import { safeStaff } from './access'
export const bookingInclude={client:true,pet:{include:{breed:true}},groomer:{select:safeStaff},services:{include:{service:true}},session:true} as const
export const bookingSchema=z.object({clientId:z.string().min(1).max(100),petId:z.string().min(1).max(100),groomerId:z.string().min(1).max(100),scheduledDate:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),scheduledTime:z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),duration:z.number().int().min(5).max(720).optional(),services:z.array(z.string().min(1).max(100)).min(1).max(30),notes:z.string().max(5000).optional(),specialRequests:z.string().max(5000).optional(),isRecurring:z.boolean().default(false),recurrenceRule:z.string().max(100).optional()}).strict()
export const changeBookingSchema=z.object({expectedUpdatedAt:z.string().datetime(),status:z.nativeEnum(AppointmentStatus).optional(),scheduledDate:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),scheduledTime:z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),groomerId:z.string().min(1).max(100).optional(),notes:z.string().max(5000).optional(),specialRequests:z.string().max(5000).optional(),reason:z.string().max(1000).optional()}).strict()
const active:AppointmentStatus[]=['SCHEDULED','CONFIRMED','CHECKED_IN','IN_PROGRESS']
export async function legacyConflicts(tx:Prisma.TransactionClient,groomerId:string,start:Date,end:Date,excludeId?:string){
 const settings=await tx.businessSettings.findUnique({where:{id:'default'}}),zone=settings?.timezone??'America/New_York'
 const rows=await tx.appointment.findMany({where:{groomerId,status:{in:active},...(excludeId?{id:{not:excludeId}}:{}),scheduledDate:{gte:new Date(start.getTime()-2*86400000),lte:new Date(end.getTime()+86400000)}},select:{id:true,scheduledDate:true,scheduledTime:true,duration:true}})
 for(const row of rows){const at=localInstant(dateInZone(row.scheduledDate,zone),row.scheduledTime,zone);if(at<end&&new Date(at.getTime()+row.duration*60000)>start)return true}return false
}
async function checkSlot(tx:Prisma.TransactionClient,input:{groomerId:string;petId:string;day:string;time:string;duration:number;serviceIds:string[];excludeId?:string}){
 const settings=await tx.businessSettings.findUnique({where:{id:'default'}})
 if(!settings?.operatingHours)throw new OperationError('A manager must configure operating hours before booking',409)
 const zone=settings.timezone;let start:Date
 try{start=localInstant(input.day,input.time,zone)}catch(e){throw new OperationError(e instanceof Error?e.message:'Invalid local date')}
 const end=new Date(start.getTime()+input.duration*60000)
 if(start.getTime()<Date.now()+settings.bookingLeadTime*3600000||start.getTime()>Date.now()+settings.maxAdvanceBooking*86400000)throw new OperationError('Requested time is outside the configured booking notice or horizon',409)
 const day=['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][new Date(input.day+'T12:00:00Z').getUTCDay()]
 let hours:{open:string;close:string;closed:boolean}|undefined
 try{hours=JSON.parse(settings.operatingHours)[day]}catch{}
 if(!hours||hours.closed||start<localInstant(input.day,hours.open,zone)||end>localInstant(input.day,hours.close,zone))throw new OperationError('Requested service does not fit within opening hours',409)
 await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`technician:${input.groomerId}`}))`
 const technician=await tx.user.findFirst({where:{id:input.groomerId,isActive:true,role:'GROOMER'}})
 if(!technician)throw new OperationError('An active groomer is required',409)
 const profile=await tx.technicianProfile.findUnique({where:{userId:input.groomerId},include:{skills:true}})
 if(!profile?.active||!input.serviceIds.every(id=>profile.skills.some(s=>s.serviceId===id)))throw new OperationError('Configure this groomer’s active profile and service skills in Operations',409)
 const available=await tx.technicianAvailability.findFirst({where:{technicianId:input.groomerId,available:true,startsAt:{lte:start},endsAt:{gte:end}}})
 const blocked=await tx.technicianAvailability.findFirst({where:{technicianId:input.groomerId,available:false,startsAt:{lt:end},endsAt:{gt:start}}})
 if(!available||blocked)throw new OperationError('The groomer is unavailable during this window',409)
 if(await legacyConflicts(tx,input.groomerId,start,end,input.excludeId)||await tx.groomingOrder.findFirst({where:{technicianId:input.groomerId,bookingStatus:{in:['BOOKED','DISPATCHED','CONFIRMED']},scheduledStart:{lt:end},scheduledEnd:{gt:start}}}))throw new OperationError('The groomer already has an overlapping appointment or mobile order',409)
 const petRows=await tx.appointment.findMany({where:{petId:input.petId,status:{in:active},...(input.excludeId?{id:{not:input.excludeId}}:{}),scheduledDate:{gte:zonedMidnight(input.day,zone),lt:new Date(zonedMidnight(input.day,zone).getTime()+26*3600000)}}})
 if(petRows.some(row=>{const at=localInstant(dateInZone(row.scheduledDate,zone),row.scheduledTime,zone);return at<end&&at.getTime()+row.duration*60000>start.getTime()}))throw new OperationError('The pet already has an overlapping appointment',409)
 return {scheduledDate:zonedMidnight(input.day,zone),start,end,zone}
}
export async function createBooking(tx:Prisma.TransactionClient,actorId:string,input:z.infer<typeof bookingSchema>){
 const pet=await tx.pet.findFirst({where:{id:input.petId,clientId:input.clientId,isActive:true,client:{isActive:true}}})
 if(!pet)throw new OperationError('The active pet must belong to the selected active client',409)
 if(new Set(input.services).size!==input.services.length)throw new OperationError('Duplicate services are not allowed')
 const services=await tx.service.findMany({where:{id:{in:input.services},isActive:true},include:{breedServices:{where:{breedId:pet.breedId}}}})
 if(services.length!==input.services.length)throw new OperationError('Every selected service must be active',409)
 const lines=services.map(s=>({serviceId:s.id,price:(cents(s.basePrice)+cents(s.breedServices[0]?.priceModifier??0))/100,duration:s.baseDuration+(s.breedServices[0]?.durationModifier??0)}))
 const duration=lines.reduce((sum,s)=>sum+s.duration,0);if(duration<5||duration>720||lines.some(l=>l.price<0||l.duration<1))throw new OperationError('Service duration or price configuration is invalid',409)
 let count=1,interval=0
 if(input.isRecurring){const match=/^FREQ=WEEKLY;INTERVAL=(\d+);COUNT=(\d+)$/.exec(input.recurrenceRule??'');if(!match)throw new OperationError('Recurrence must use FREQ=WEEKLY;INTERVAL=1;COUNT=4 format');interval=Number(match[1]);count=Number(match[2]);if(interval<1||interval>12||count<2||count>24)throw new OperationError('Recurring bookings support intervals of 1–12 weeks and 2–24 occurrences')}
 const bookings:Prisma.AppointmentGetPayload<{include:typeof bookingInclude}>[]=[]
 for(let i=0;i<count;i++){
  const date=new Date(input.scheduledDate+'T12:00:00Z');date.setUTCDate(date.getUTCDate()+i*interval*7);const day=date.toISOString().slice(0,10)
  const slot=await checkSlot(tx,{groomerId:input.groomerId,petId:input.petId,day,time:input.scheduledTime,duration,serviceIds:input.services})
  const row=await tx.appointment.create({data:{clientId:input.clientId,petId:input.petId,groomerId:input.groomerId,scheduledDate:slot.scheduledDate,scheduledTime:input.scheduledTime,duration,notes:input.notes,specialRequests:input.specialRequests,isRecurring:input.isRecurring,recurrenceRule:input.recurrenceRule,parentId:bookings[0]?.id,services:{create:lines}},include:bookingInclude});bookings.push(row)
  await audit(tx,actorId,'booking.create',row.id,{startsAt:slot.start,endsAt:slot.end,parentId:row.parentId,serviceIds:input.services})
 }
 return {...bookings[0],occurrenceIds:bookings.map(b=>b.id)}
}
const transitions:Record<AppointmentStatus,AppointmentStatus[]>={SCHEDULED:['CONFIRMED','CHECKED_IN','CANCELLED','NO_SHOW'],CONFIRMED:['CHECKED_IN','CANCELLED','NO_SHOW'],CHECKED_IN:['IN_PROGRESS','CANCELLED'],IN_PROGRESS:['COMPLETED'],COMPLETED:[],CANCELLED:[],NO_SHOW:[]}
export async function changeBooking(tx:Prisma.TransactionClient,actor:{id:string;role:string},id:string,input:z.infer<typeof changeBookingSchema>){
 const old=await tx.appointment.findUnique({where:{id},include:{services:true}})
 if(!old)throw new OperationError('Appointment not found',404)
 if(old.updatedAt.toISOString()!==input.expectedUpdatedAt)throw new OperationError('Appointment changed; reload before acting',409)
 if(actor.role==='GROOMER'&&old.groomerId!==actor.id)throw new OperationError('Only the assigned groomer can operate this appointment',403)
 if(!active.includes(old.status))throw new OperationError('Completed, cancelled and no-show appointments are immutable',409)
 const status=input.status??old.status
 if(status!==old.status&&!transitions[old.status].includes(status))throw new OperationError(`Cannot transition from ${old.status} to ${status}`,409)
 if(['CANCELLED','NO_SHOW'].includes(status)&&(input.reason?.trim().length??0)<5)throw new OperationError('Cancellation and no-show require a reason')
 const settings=await tx.businessSettings.findUnique({where:{id:'default'}}),zone=settings?.timezone??'America/New_York'
 const start=localInstant(dateInZone(old.scheduledDate,zone),old.scheduledTime,zone)
 if(['CHECKED_IN','IN_PROGRESS','COMPLETED','NO_SHOW'].includes(status)&&start>new Date())throw new OperationError('This appointment has not started yet',409)
 const data:{[key:string]:any}={status}
 if(input.notes!==undefined)data.notes=input.notes
 if(input.specialRequests!==undefined)data.specialRequests=input.specialRequests
 if(input.scheduledDate||input.scheduledTime||input.groomerId){
  if(!['SCHEDULED','CONFIRMED'].includes(old.status)||actor.role==='GROOMER')throw new OperationError('Only office staff can reschedule an unstarted appointment',403)
  const groomerId=input.groomerId??old.groomerId;if(!groomerId)throw new OperationError('Assign a groomer')
  const slot=await checkSlot(tx,{groomerId,petId:old.petId,day:input.scheduledDate??dateInZone(old.scheduledDate,zone),time:input.scheduledTime??old.scheduledTime,duration:old.duration,serviceIds:old.services.map(s=>s.serviceId),excludeId:id})
  Object.assign(data,{groomerId,scheduledDate:slot.scheduledDate,scheduledTime:input.scheduledTime??old.scheduledTime})
 }
 if(['CHECKED_IN','IN_PROGRESS','COMPLETED'].includes(status)&&!old.groomerId)throw new OperationError('Assign a groomer before check-in',409)
 const changed=await tx.appointment.updateMany({where:{id,updatedAt:old.updatedAt},data});if(!changed.count)throw new OperationError('Appointment changed; reload',409)
 if(['CHECKED_IN','IN_PROGRESS','COMPLETED'].includes(status))await tx.groomingSession.upsert({where:{appointmentId:id},create:{appointmentId:id,petId:old.petId,groomerId:old.groomerId!,status:status as 'CHECKED_IN'|'IN_PROGRESS'|'COMPLETED',checkInTime:new Date(),checkOutTime:status==='COMPLETED'?new Date():null},update:{status:status as 'CHECKED_IN'|'IN_PROGRESS'|'COMPLETED',...(status==='COMPLETED'?{checkOutTime:new Date()}: {})}})
 if(status==='CANCELLED')await tx.groomingSession.updateMany({where:{appointmentId:id},data:{status:'CANCELLED'}})
 await audit(tx,actor.id,'booking.update',id,{before:{status:old.status,scheduledDate:old.scheduledDate,scheduledTime:old.scheduledTime,groomerId:old.groomerId},after:data,reason:input.reason})
 return tx.appointment.findUniqueOrThrow({where:{id},include:bookingInclude})
}
