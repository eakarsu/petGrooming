import { db } from '@/lib/db'
import { endpoint } from '@/lib/operations/core'
import { dayBounds,zonedMidnight } from '@/lib/operations/time'
export const GET=endpoint(undefined,async (_request,actor)=>{
 const settings=await db.businessSettings.findUnique({where:{id:'default'}})
 const timezone=settings?.timezone??'America/New_York',currency=settings?.currency??'USD'
 const {date,start,end}=dayBounds(new Date(),timezone)
 const sunday=new Date(`${date}T12:00:00Z`);sunday.setUTCDate(sunday.getUTCDate()-sunday.getUTCDay())
 const weekStart=zonedMidnight(sunday.toISOString().slice(0,10),timezone)
 const vaccinationEnd=new Date(end.getTime()+7*86400000)
 const financial=['ADMIN','MANAGER'].includes(actor.role)
 const [todayAppointments,totalClients,totalPets,pendingCheckIns,completedToday,vaccinations,sales,refunds,unverified]=await Promise.all([
  db.appointment.count({where:{scheduledDate:{gte:start,lt:end},status:{notIn:['CANCELLED','NO_SHOW']}}}),
  db.client.count({where:{isActive:true}}),db.pet.count({where:{isActive:true}}),
  db.appointment.count({where:{scheduledDate:{gte:start,lt:end},status:{in:['SCHEDULED','CONFIRMED']}}}),
  db.appointment.count({where:{scheduledDate:{gte:start,lt:end},status:'COMPLETED'}}),
  db.vaccinationRecord.findMany({where:{expirationDate:{gte:start,lt:vaccinationEnd},pet:{isActive:true}},select:{petId:true},distinct:['petId']}),
  financial?db.transaction.aggregate({where:{verifiedAt:{gte:weekStart,lte:new Date()},currency},_sum:{totalCents:true}}):null,
  financial?db.petAudit.findMany({where:{action:'pos.refund',createdAt:{gte:weekStart,lte:new Date()}},select:{details:true}}):[],
  financial?db.transaction.count({where:{verifiedAt:null,paymentStatus:'COMPLETED'}}):0,
 ])
 const refundCents=refunds.reduce((sum,row)=>{const d=row.details as {currency?:string;amountCents?:number};return sum+(d.currency===currency?Number(d.amountCents??0):0)},0)
 return {todayAppointments,totalClients,totalPets,pendingCheckIns,completedToday,vaccinationExpiring:vaccinations.length,weekRevenue:financial?((sales?._sum.totalCents??0)-refundCents)/100:null,currency,timezone,date,unverifiedLegacyPayments:unverified,revenueDefinition:'Verified counter receipts including tax and tips, less refunds recorded this week. Governed mobile payments are shown in Operations.'}
})
