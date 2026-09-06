import { z } from 'zod'
import { endpoint,readJson,mutate,audit,OperationError } from '@/lib/operations/core'
import { MANAGEMENT,safeStaff } from '@/lib/operations/access'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireApiActor, workflowResponse } from '@/lib/workflow/api'
import { WorkflowError } from '@/lib/workflow/errors'
import { validateProviderEndpoint } from '@/lib/workflow/provider'

function envName(value: unknown, field: string) {
  const result = String(value || '')
  if (!/^[A-Z][A-Z0-9_]{2,100}$/.test(result)) throw new WorkflowError('VALIDATION_ERROR', `${field} must be an environment-variable name`)
  return result
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requireApiActor(['ADMIN'])
    const body = await readJson(request) as Record<string, any>
    if (body.action === 'UPSERT_TECHNICIAN') {
      const startsAt = new Date(body.startsAt); const endsAt = new Date(body.endsAt)
      if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt || !Array.isArray(body.serviceIds) || !body.serviceIds.length || !Array.isArray(body.postalPrefixes) || !body.postalPrefixes.length) throw new WorkflowError('VALIDATION_ERROR', 'Technician skills, service areas, and a valid availability interval are required')
      const result = await db.$transaction(async (tx) => {
        const user = await tx.user.findFirst({ where: { id: body.userId, role: 'GROOMER', isActive: true } })
        if (!user) throw new WorkflowError('GROOMER_NOT_FOUND', 'An active groomer account is required', 404)
        const services = await tx.service.count({ where: { id: { in: body.serviceIds }, isActive: true } })
        if (services !== new Set(body.serviceIds).size) throw new WorkflowError('SERVICE_NOT_AVAILABLE', 'All technician skills must reference active services', 409)
        const profile = await tx.technicianProfile.upsert({
          where: { userId: user.id }, create: { userId: user.id, baseLatitude: Number(body.baseLatitude), baseLongitude: Number(body.baseLongitude), maxTravelKm: Number(body.maxTravelKm) },
          update: { baseLatitude: Number(body.baseLatitude), baseLongitude: Number(body.baseLongitude), maxTravelKm: Number(body.maxTravelKm), active: true, version: { increment: 1 } },
        })
        await tx.technicianSkill.deleteMany({ where: { technicianId: user.id } })
        await tx.technicianServiceArea.deleteMany({ where: { technicianId: user.id } })
        await tx.technicianSkill.createMany({ data: Array.from(new Set<string>(body.serviceIds)).map((serviceId) => ({ technicianId: user.id, serviceId })) })
        await tx.technicianServiceArea.createMany({ data: Array.from(new Set<string>(body.postalPrefixes)).map((postalPrefix) => ({ technicianId: user.id, postalPrefix: postalPrefix.toUpperCase() })) })
        await tx.technicianAvailability.create({ data: { technicianId: user.id, startsAt, endsAt, available: true, source: 'ADMIN_CONFIGURATION' } })
        return profile
      })
      return NextResponse.json(result)
    }
    if (body.action === 'UPSERT_CONNECTOR') {
      const allowedKinds = ['MAPS', 'CALENDAR', 'MESSAGING', 'PAYMENT', 'TAX', 'ACCOUNTING']
      if (!allowedKinds.includes(body.kind)) throw new WorkflowError('VALIDATION_ERROR', 'Provider kind is invalid')
      await validateProviderEndpoint({ endpoint: body.endpoint, allowedHost: body.allowedHost })
      const serviceUser = await db.user.findFirst({ where: { id: body.serviceUserId, isActive: true } })
      if (!serviceUser) throw new WorkflowError('SERVICE_USER_NOT_FOUND', 'An active provider service account is required', 404)
      const connector = await db.providerConnector.upsert({
        where: { kind_provider: { kind: body.kind, provider: String(body.provider).trim() } },
        create: { kind: body.kind, provider: String(body.provider).trim(), endpoint: body.endpoint, allowedHost: body.allowedHost, credentialEnv: envName(body.credentialEnv, 'credentialEnv'), webhookSecretEnv: body.webhookSecretEnv ? envName(body.webhookSecretEnv, 'webhookSecretEnv') : null, serviceUserId: serviceUser.id },
        update: { endpoint: body.endpoint, allowedHost: body.allowedHost, credentialEnv: envName(body.credentialEnv, 'credentialEnv'), webhookSecretEnv: body.webhookSecretEnv ? envName(body.webhookSecretEnv, 'webhookSecretEnv') : null, serviceUserId: serviceUser.id, enabled: true },
      })
      return NextResponse.json(connector)
    }
    if (body.action === 'SET_SERVICE_INVENTORY') {
      const quantity = Number(body.quantity)
      if (!Number.isInteger(quantity) || quantity <= 0) throw new WorkflowError('VALIDATION_ERROR', 'Inventory quantity must be a positive integer')
      const requirement = await db.serviceInventoryRequirement.upsert({
        where: { serviceId_productId: { serviceId: body.serviceId, productId: body.productId } },
        create: { serviceId: body.serviceId, productId: body.productId, quantity }, update: { quantity },
      })
      return NextResponse.json(requirement)
    }
    throw new WorkflowError('ACTION_UNSUPPORTED', 'Admin configuration action is unsupported')
  } catch (error) { return workflowResponse(error) }
}

export const GET=endpoint(MANAGEMENT,async()=>{
 const [groomers,services,products,profiles,connectors,availability,requirements,users]=await Promise.all([
 db.user.findMany({where:{role:'GROOMER',isActive:true},select:safeStaff}),
 db.service.findMany({where:{isActive:true},select:{id:true,name:true}}),
 db.product.findMany({where:{isActive:true},select:{id:true,name:true,quantity:true,reservedQuantity:true}}),
 db.technicianProfile.findMany({include:{skills:true,serviceAreas:true}}),
 db.providerConnector.findMany({select:{id:true,kind:true,provider:true,endpoint:true,allowedHost:true,credentialEnv:true,webhookSecretEnv:true,serviceUserId:true,enabled:true}}),
 db.technicianAvailability.findMany({where:{endsAt:{gte:new Date()}},orderBy:{startsAt:'asc'},take:500}),
 db.serviceInventoryRequirement.findMany({take:500}),db.user.findMany({where:{isActive:true},select:safeStaff}),
 ])
 return {groomers,services,products,profiles,availability,requirements,users,connectors:connectors.map(c=>({...c,credentialConfigured:Boolean(process.env[c.credentialEnv]),webhookConfigured:Boolean(c.webhookSecretEnv&&process.env[c.webhookSecretEnv])}))}
})
const availabilitySchema=z.object({technicianId:z.string().min(1).max(100),startsAt:z.string().datetime(),endsAt:z.string().datetime(),available:z.boolean(),reason:z.string().trim().min(5).max(1000)}).strict()
export const PATCH=endpoint(MANAGEMENT,async(request,actor)=>{
 const input=availabilitySchema.parse(await readJson(request))
 return mutate(actor.id,request.headers.get('Idempotency-Key'),'technician.availability',input,async tx=>{
  const start=new Date(input.startsAt),end=new Date(input.endsAt)
  if(end<=start||end.getTime()-start.getTime()>366*86400000)throw new OperationError('Availability requires an interval up to one year')
  if(!await tx.technicianProfile.findUnique({where:{userId:input.technicianId}}))throw new OperationError('Configure the technician profile first',409)
  if(!input.available&&(await tx.groomingOrder.findFirst({where:{technicianId:input.technicianId,bookingStatus:{in:['BOOKED','DISPATCHED','CONFIRMED']},scheduledStart:{lt:end},scheduledEnd:{gt:start}}})||await import('@/lib/operations/booking').then(m=>m.legacyConflicts(tx,input.technicianId,start,end))))throw new OperationError('Reassign or reschedule overlapping bookings before blocking time',409)
  const result=await tx.technicianAvailability.create({data:{technicianId:input.technicianId,startsAt:start,endsAt:end,available:input.available,source:input.reason}})
  await audit(tx,actor.id,'technician.availability',result.id,input);return result
 },MANAGEMENT)
})
