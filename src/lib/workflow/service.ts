import type { Prisma, PrismaClient, ProviderKind, WorkflowJobStatus } from '@prisma/client'
import { legacyConflicts } from '@/lib/operations/booking'
import { appendWorkflowAudit, verifyWorkflowAudit } from './audit'
import { OFFICE_ROLES, requireWorkflowActor, SUPERVISOR_ROLES } from './authz'
import { WorkflowError } from './errors'

type ActorInput = { actorId: string }
type ConnectorSelection = Partial<Record<ProviderKind, string>>

const ACTIVE_BOOKINGS = ['BOOKED', 'DISPATCHED', 'CONFIRMED'] as const

function text(value: unknown, field: string, max = 500) {
  const result = String(value || '').trim()
  if (!result || result.length > max) throw new WorkflowError('VALIDATION_ERROR', `${field} is required and must be at most ${max} characters`)
  return result
}

function instant(value: unknown, field: string) {
  const result = new Date(String(value))
  if (Number.isNaN(result.getTime())) throw new WorkflowError('VALIDATION_ERROR', `${field} must be a valid timestamp`)
  return result
}

function positiveCents(value: unknown, field: string, allowZero = false) {
  const result = Number(value)
  if (!Number.isInteger(result) || result < (allowZero ? 0 : 1)) throw new WorkflowError('VALIDATION_ERROR', `${field} must be an integer number of cents`)
  return result
}

async function connector(tx: Prisma.TransactionClient, kind: ProviderKind, requestedId?: string) {
  if (requestedId) {
    const selected = await tx.providerConnector.findFirst({ where: { id: requestedId, kind, enabled: true } })
    if (!selected) throw new WorkflowError('CONNECTOR_NOT_FOUND', `Active ${kind} connector was not found`, 409)
    return selected
  }
  const active = await tx.providerConnector.findMany({ where: { kind, enabled: true }, take: 2 })
  if (active.length === 0) throw new WorkflowError('CONNECTOR_REQUIRED', `An active ${kind} connector is required`, 409)
  if (active.length > 1) throw new WorkflowError('CONNECTOR_SELECTION_REQUIRED', `Select an explicit ${kind} connector`, 409)
  return active[0]
}

export async function queueIntegrationOperation(
  tx: Prisma.TransactionClient,
  input: { kind: ProviderKind; connectorId?: string; operationType: string; aggregateType: string; aggregateId: string; idempotencyKey: string; payload: Prisma.InputJsonValue },
) {
  const selected = await connector(tx, input.kind, input.connectorId)
  return tx.integrationOperation.upsert({
    where: { idempotencyKey: input.idempotencyKey },
    create: { connectorId: selected.id, operationType: input.operationType, aggregateType: input.aggregateType, aggregateId: input.aggregateId, idempotencyKey: input.idempotencyKey, payload: input.payload },
    update: {},
  })
}

async function eligibleTechnician(
  tx: Prisma.TransactionClient,
  input: { technicianId: string; serviceIds: string[]; start: Date; end: Date; postalCode: string; excludeOrderId?: string },
) {
  if (input.end <= input.start) throw new WorkflowError('INVALID_TIME_RANGE', 'The service end must follow its start')
  const profile = await tx.technicianProfile.findUnique({
    where: { userId: input.technicianId },
    include: { user: { select: { isActive: true, role: true } }, skills: { where: { serviceId: { in: input.serviceIds } } }, serviceAreas: true },
  })
  if (!profile?.active || !profile.user.isActive || profile.user.role !== 'GROOMER') throw new WorkflowError('TECHNICIAN_UNAVAILABLE', 'The selected technician is not active', 409)
  if (new Set(profile.skills.map((skill) => skill.serviceId)).size !== new Set(input.serviceIds).size) throw new WorkflowError('TECHNICIAN_SKILL_MISMATCH', 'The selected technician lacks a required service skill', 409)
  if (!profile.serviceAreas.some((area) => input.postalCode.toUpperCase().startsWith(area.postalPrefix.toUpperCase()))) throw new WorkflowError('OUTSIDE_SERVICE_AREA', 'The address is outside the technician service area', 409)
  const covering = await tx.technicianAvailability.findFirst({
    where: { technicianId: input.technicianId, available: true, startsAt: { lte: input.start }, endsAt: { gte: input.end } },
  })
  const blocked = await tx.technicianAvailability.findFirst({
    where: { technicianId: input.technicianId, available: false, startsAt: { lt: input.end }, endsAt: { gt: input.start } },
  })
  if (!covering || blocked) throw new WorkflowError('TECHNICIAN_UNAVAILABLE', 'The selected technician is unavailable during that window', 409)
  const collision = await tx.groomingOrder.findFirst({
    where: {
      technicianId: input.technicianId, id: input.excludeOrderId ? { not: input.excludeOrderId } : undefined,
      bookingStatus: { in: [...ACTIVE_BOOKINGS] }, scheduledStart: { lt: input.end }, scheduledEnd: { gt: input.start },
    }, select: { id: true },
  })
  if (await legacyConflicts(tx,input.technicianId,input.start,input.end)) throw new WorkflowError('OVERBOOKED', 'The technician has an overlapping counter appointment', 409)
  if (collision) throw new WorkflowError('OVERBOOKED', 'The technician already has an overlapping order', 409)
  return profile
}

async function orderServiceIds(tx: Prisma.TransactionClient, orderId: string) {
  const order = await tx.groomingOrder.findUnique({
    where: { id: orderId },
    include: { quote: { include: { lines: true } }, changeOrders: { where: { status: 'APPROVED' }, include: { lines: true } } },
  })
  if (!order) throw new WorkflowError('ORDER_NOT_FOUND', 'Grooming order was not found', 404)
  return { order, serviceIds: Array.from(new Set([...order.quote.lines, ...order.changeOrders.flatMap((change) => change.lines)].map((line) => line.serviceId))) }
}

async function reserveInventory(tx: Prisma.TransactionClient, orderId: string, serviceIds: string[], movementPrefix: string) {
  const requirements = await tx.serviceInventoryRequirement.findMany({ where: { serviceId: { in: serviceIds } } })
  const totals = new Map<string, number>()
  for (const requirement of requirements) totals.set(requirement.productId, (totals.get(requirement.productId) || 0) + requirement.quantity)
  for (const [productId, quantity] of Array.from(totals.entries())) {
    const changed = await tx.$executeRaw`UPDATE "Product" SET "reservedQuantity" = "reservedQuantity" + ${quantity}, "updatedAt" = NOW() WHERE "id" = ${productId} AND "isActive" = true AND "quantity" - "reservedQuantity" >= ${quantity}`
    if (changed !== 1) throw new WorkflowError('INVENTORY_UNAVAILABLE', 'Required grooming inventory is unavailable', 409)
    await tx.inventoryReservation.upsert({
      where: { orderId_productId: { orderId, productId } },
      create: { orderId, productId, quantity },
      update: { quantity: { increment: quantity } },
    })
    await tx.inventoryMovement.create({ data: { productId, orderId, movementType: 'RESERVED', quantity, idempotencyKey: `${movementPrefix}:${productId}` } })
  }
}

async function releaseInventory(tx: Prisma.TransactionClient, orderId: string, movementPrefix: string, consume: boolean) {
  const reservations = await tx.inventoryReservation.findMany({ where: { orderId } })
  for (const reservation of reservations) {
    const remaining = reservation.quantity - reservation.consumed - reservation.released
    if (remaining <= 0) continue
    if (consume) {
      await tx.product.update({ where: { id: reservation.productId }, data: { quantity: { decrement: remaining }, reservedQuantity: { decrement: remaining } } })
      await tx.inventoryReservation.update({ where: { id: reservation.id }, data: { consumed: { increment: remaining } } })
      await tx.inventoryMovement.create({ data: { productId: reservation.productId, orderId, movementType: 'CONSUMED', quantity: -remaining, idempotencyKey: `${movementPrefix}:consume:${reservation.productId}` } })
    } else {
      await tx.product.update({ where: { id: reservation.productId }, data: { reservedQuantity: { decrement: remaining } } })
      await tx.inventoryReservation.update({ where: { id: reservation.id }, data: { released: { increment: remaining } } })
      await tx.inventoryMovement.create({ data: { productId: reservation.productId, orderId, movementType: 'RELEASED', quantity: -remaining, idempotencyKey: `${movementPrefix}:release:${reservation.productId}` } })
    }
  }
}

export async function requestQuote(prisma: PrismaClient, input: ActorInput & {
  idempotencyKey: string; clientId: string; petId: string; technicianId: string; serviceIds: string[];
  requestedStart: string | Date; requestedEnd: string | Date; addressLine: string; postalCode: string;
  latitude: number; longitude: number; expiresInMinutes?: number; connectors?: ConnectorSelection;
}) {
  return prisma.$transaction(async (tx) => {
    await requireWorkflowActor(tx, input.actorId, OFFICE_ROLES)
    const key = text(input.idempotencyKey, 'idempotencyKey', 200)
    const existing = await tx.groomingQuote.findUnique({ where: { idempotencyKey: key }, include: { lines: true } })
    if (existing) return existing
    const start = instant(input.requestedStart, 'requestedStart')
    const end = instant(input.requestedEnd, 'requestedEnd')
    if (start <= new Date()) throw new WorkflowError('BOOKING_WINDOW_PAST', 'Requested service time must be in the future')
    const pet = await tx.pet.findFirst({ where: { id: input.petId, clientId: input.clientId, isActive: true } })
    if (!pet) throw new WorkflowError('PET_CLIENT_MISMATCH', 'The active pet does not belong to the selected client', 409)
    const serviceIds = Array.from(new Set(input.serviceIds || []))
    const services = await tx.service.findMany({ where: { id: { in: serviceIds }, isActive: true } })
    if (!serviceIds.length || services.length !== serviceIds.length) throw new WorkflowError('SERVICE_NOT_AVAILABLE', 'Every quote service must be active', 409)
    await eligibleTechnician(tx, { technicianId: input.technicianId, serviceIds, start, end, postalCode: text(input.postalCode, 'postalCode', 20) })
    const subtotalCents = services.reduce((sum, service) => sum + Math.round(service.basePrice * 100), 0)
    const quote = await tx.groomingQuote.create({
      data: {
        idempotencyKey: key, createdById: input.actorId, clientId: input.clientId, petId: input.petId,
        proposedTechnicianId: input.technicianId, requestedStart: start, requestedEnd: end,
        addressLine: text(input.addressLine, 'addressLine', 500), postalCode: text(input.postalCode, 'postalCode', 20),
        latitude: Number(input.latitude), longitude: Number(input.longitude), subtotalCents,
        expiresAt: new Date(Date.now() + Math.min(Math.max(input.expiresInMinutes || 30, 5), 1440) * 60_000),
        lines: { create: services.map((service) => ({ serviceId: service.id, serviceName: service.name, unitPriceCents: Math.round(service.basePrice * 100), durationMinutes: service.baseDuration })) },
      }, include: { lines: true },
    })
    await queueIntegrationOperation(tx, { kind: 'MAPS', connectorId: input.connectors?.MAPS, operationType: 'ROUTE_QUOTE', aggregateType: 'QUOTE', aggregateId: quote.id, idempotencyKey: `quote:${quote.id}:maps`, payload: { originTechnicianId: input.technicianId, destination: { latitude: input.latitude, longitude: input.longitude, postalCode: quote.postalCode }, startsAt: start.toISOString() } })
    await queueIntegrationOperation(tx, { kind: 'TAX', connectorId: input.connectors?.TAX, operationType: 'TAX_QUOTE', aggregateType: 'QUOTE', aggregateId: quote.id, idempotencyKey: `quote:${quote.id}:tax`, payload: { amountCents: subtotalCents, currency: quote.currency, postalCode: quote.postalCode } })
    await appendWorkflowAudit(tx, { quoteId: quote.id, actorId: input.actorId, action: 'QUOTE_REQUESTED', payload: { serviceIds, subtotalCents, requestedStart: start.toISOString(), requestedEnd: end.toISOString(), technicianId: input.technicianId } })
    return quote
  }, { isolationLevel: 'Serializable' })
}

export async function acceptQuote(prisma: PrismaClient, input: ActorInput & { quoteId: string; expectedVersion: number; connectors?: ConnectorSelection }) {
  return prisma.$transaction(async (tx) => {
    await requireWorkflowActor(tx, input.actorId, OFFICE_ROLES)
    const quote = await tx.groomingQuote.findUnique({ where: { id: input.quoteId }, include: { lines: true, order: true } })
    if (!quote) throw new WorkflowError('QUOTE_NOT_FOUND', 'Quote was not found', 404)
    if (quote.order) return quote.order
    if (quote.status !== 'OFFERED' || quote.expiresAt <= new Date()) throw new WorkflowError('QUOTE_NOT_ACCEPTABLE', 'Only a current offered quote can be accepted', 409)
    if (quote.version !== input.expectedVersion) throw new WorkflowError('VERSION_CONFLICT', 'Quote changed; reload before accepting', 409)
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`technician:${quote.proposedTechnicianId}`}))`
    await eligibleTechnician(tx, { technicianId: quote.proposedTechnicianId, serviceIds: quote.lines.map((line) => line.serviceId), start: quote.requestedStart, end: quote.requestedEnd, postalCode: quote.postalCode })
    const order = await tx.groomingOrder.create({
      data: {
        quoteId: quote.id, clientId: quote.clientId, petId: quote.petId, technicianId: quote.proposedTechnicianId,
        scheduledStart: quote.requestedStart, scheduledEnd: quote.requestedEnd, addressLine: quote.addressLine,
        postalCode: quote.postalCode, latitude: quote.latitude, longitude: quote.longitude, quotedTotalCents: quote.totalCents,
        dispatches: { create: { technicianId: quote.proposedTechnicianId, assignedById: input.actorId, reason: 'Initial accepted quote assignment' } },
      },
    })
    await reserveInventory(tx, order.id, quote.lines.map((line) => line.serviceId), `accept:${order.id}`)
    await tx.groomingQuote.update({ where: { id: quote.id }, data: { status: 'ACCEPTED', version: { increment: 1 } } })
    await queueIntegrationOperation(tx, { kind: 'CALENDAR', connectorId: input.connectors?.CALENDAR, operationType: 'UPSERT_BOOKING', aggregateType: 'ORDER', aggregateId: order.id, idempotencyKey: `order:${order.id}:calendar:v1`, payload: { orderId: order.id, technicianId: order.technicianId, startsAt: order.scheduledStart.toISOString(), endsAt: order.scheduledEnd.toISOString() } })
    await queueIntegrationOperation(tx, { kind: 'MESSAGING', connectorId: input.connectors?.MESSAGING, operationType: 'BOOKING_CONFIRMATION', aggregateType: 'ORDER', aggregateId: order.id, idempotencyKey: `order:${order.id}:message:booked`, payload: { orderId: order.id, clientId: order.clientId } })
    await tx.customerCommunication.create({ data: { orderId: order.id, clientId: order.clientId, channel: 'CUSTOMER_PREFERENCE', template: 'BOOKING_CONFIRMATION' } })
    await appendWorkflowAudit(tx, { orderId: order.id, actorId: input.actorId, action: 'QUOTE_ACCEPTED_AND_BOOKED', payload: { quoteId: quote.id, totalCents: quote.totalCents, technicianId: order.technicianId } })
    return order
  }, { isolationLevel: 'Serializable' })
}

async function requireOrderOperator(tx: Prisma.TransactionClient, orderId: string, actorId: string, supervisorOnly = false) {
  const actor = await requireWorkflowActor(tx, actorId)
  const order = await tx.groomingOrder.findUnique({ where: { id: orderId } })
  if (!order) throw new WorkflowError('ORDER_NOT_FOUND', 'Grooming order was not found', 404)
  if (supervisorOnly && !SUPERVISOR_ROLES.includes(actor.role)) throw new WorkflowError('ROLE_FORBIDDEN', 'A supervisor is required', 403)
  if (!supervisorOnly && !OFFICE_ROLES.includes(actor.role) && !(actor.role === 'GROOMER' && order.technicianId === actor.id)) throw new WorkflowError('ORDER_ACCESS_DENIED', 'This staff member cannot operate the order', 403)
  return { actor, order }
}

export async function dispatchOrder(prisma: PrismaClient, input: ActorInput & { orderId: string; expectedVersion: number; connectors?: ConnectorSelection }) {
  return prisma.$transaction(async (tx) => {
    const { order } = await requireOrderOperator(tx, input.orderId, input.actorId, true)
    if (order.version !== input.expectedVersion) throw new WorkflowError('VERSION_CONFLICT', 'Order changed; reload before dispatching', 409)
    if (order.bookingStatus !== 'BOOKED') throw new WorkflowError('INVALID_BOOKING_STATE', 'Only booked orders can be dispatched', 409)
    const updated = await tx.groomingOrder.update({ where: { id: order.id }, data: { bookingStatus: 'DISPATCHED', version: { increment: 1 } } })
    await queueIntegrationOperation(tx, { kind: 'MESSAGING', connectorId: input.connectors?.MESSAGING, operationType: 'TECHNICIAN_DISPATCH', aggregateType: 'ORDER', aggregateId: order.id, idempotencyKey: `order:${order.id}:message:dispatch:v${updated.version}`, payload: { orderId: order.id, technicianId: order.technicianId } })
    await appendWorkflowAudit(tx, { orderId: order.id, actorId: input.actorId, action: 'ORDER_DISPATCHED', payload: { technicianId: order.technicianId, version: updated.version } })
    return updated
  })
}

export async function rescheduleOrder(prisma: PrismaClient, input: ActorInput & { orderId: string; expectedVersion: number; startsAt: string | Date; endsAt: string | Date; connectors?: ConnectorSelection }) {
  return prisma.$transaction(async (tx) => {
    const { order, serviceIds } = await orderServiceIds(tx, input.orderId)
    await requireOrderOperator(tx, order.id, input.actorId, true)
    if (order.version !== input.expectedVersion || !ACTIVE_BOOKINGS.includes(order.bookingStatus as typeof ACTIVE_BOOKINGS[number])) throw new WorkflowError('VERSION_CONFLICT', 'Only a current active booking can be rescheduled', 409)
    const start = instant(input.startsAt, 'startsAt'); const end = instant(input.endsAt, 'endsAt')
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`technician:${order.technicianId}`}))`
    await eligibleTechnician(tx, { technicianId: order.technicianId, serviceIds, start, end, postalCode: order.postalCode, excludeOrderId: order.id })
    const updated = await tx.groomingOrder.update({ where: { id: order.id }, data: { scheduledStart: start, scheduledEnd: end, bookingStatus: 'BOOKED', version: { increment: 1 } } })
    await queueIntegrationOperation(tx, { kind: 'CALENDAR', connectorId: input.connectors?.CALENDAR, operationType: 'RESCHEDULE_BOOKING', aggregateType: 'ORDER', aggregateId: order.id, idempotencyKey: `order:${order.id}:calendar:v${updated.version}`, payload: { startsAt: start.toISOString(), endsAt: end.toISOString(), technicianId: order.technicianId } })
    await queueIntegrationOperation(tx, { kind: 'MESSAGING', connectorId: input.connectors?.MESSAGING, operationType: 'RESCHEDULE_NOTICE', aggregateType: 'ORDER', aggregateId: order.id, idempotencyKey: `order:${order.id}:message:rescheduled:v${updated.version}`, payload: { orderId: order.id, clientId: order.clientId } })
    await appendWorkflowAudit(tx, { orderId: order.id, actorId: input.actorId, action: 'ORDER_RESCHEDULED', payload: { startsAt: start.toISOString(), endsAt: end.toISOString(), version: updated.version } })
    return updated
  }, { isolationLevel: 'Serializable' })
}

export async function reassignTechnician(prisma: PrismaClient, input: ActorInput & { orderId: string; expectedVersion: number; technicianId: string; reason: string; connectors?: ConnectorSelection }) {
  return prisma.$transaction(async (tx) => {
    const { order, serviceIds } = await orderServiceIds(tx, input.orderId)
    await requireOrderOperator(tx, order.id, input.actorId, true)
    if (order.version !== input.expectedVersion || !ACTIVE_BOOKINGS.includes(order.bookingStatus as typeof ACTIVE_BOOKINGS[number])) throw new WorkflowError('VERSION_CONFLICT', 'Only a current active booking can be reassigned', 409)
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`technician:${input.technicianId}`}))`
    await eligibleTechnician(tx, { technicianId: input.technicianId, serviceIds, start: order.scheduledStart, end: order.scheduledEnd, postalCode: order.postalCode, excludeOrderId: order.id })
    const reason = text(input.reason, 'reason', 1000)
    await tx.dispatchAssignment.updateMany({ where: { orderId: order.id, active: true }, data: { active: false, releasedAt: new Date() } })
    const updated = await tx.groomingOrder.update({ where: { id: order.id }, data: { technicianId: input.technicianId, bookingStatus: 'BOOKED', version: { increment: 1 }, dispatches: { create: { technicianId: input.technicianId, assignedById: input.actorId, reason } } } })
    await queueIntegrationOperation(tx, { kind: 'CALENDAR', connectorId: input.connectors?.CALENDAR, operationType: 'REASSIGN_BOOKING', aggregateType: 'ORDER', aggregateId: order.id, idempotencyKey: `order:${order.id}:calendar:v${updated.version}`, payload: { previousTechnicianId: order.technicianId, technicianId: input.technicianId } })
    await queueIntegrationOperation(tx, { kind: 'MESSAGING', connectorId: input.connectors?.MESSAGING, operationType: 'REASSIGN_NOTICE', aggregateType: 'ORDER', aggregateId: order.id, idempotencyKey: `order:${order.id}:message:reassigned:v${updated.version}`, payload: { orderId: order.id, clientId: order.clientId, technicianId: input.technicianId } })
    await appendWorkflowAudit(tx, { orderId: order.id, actorId: input.actorId, action: 'TECHNICIAN_REASSIGNED', payload: { from: order.technicianId, to: input.technicianId, reason, version: updated.version } })
    return updated
  }, { isolationLevel: 'Serializable' })
}

export async function confirmOrder(prisma: PrismaClient, input: ActorInput & { orderId: string; expectedVersion: number; connectors?: ConnectorSelection }) {
  return prisma.$transaction(async (tx) => {
    const { order } = await requireOrderOperator(tx, input.orderId, input.actorId)
    if (order.version !== input.expectedVersion || !['BOOKED', 'DISPATCHED'].includes(order.bookingStatus)) throw new WorkflowError('VERSION_CONFLICT', 'Only a current booked or dispatched order can be confirmed', 409)
    const updated = await tx.groomingOrder.update({ where: { id: order.id }, data: { bookingStatus: 'CONFIRMED', version: { increment: 1 } } })
    await queueIntegrationOperation(tx, { kind: 'MESSAGING', connectorId: input.connectors?.MESSAGING, operationType: 'CUSTOMER_CONFIRMED', aggregateType: 'ORDER', aggregateId: order.id, idempotencyKey: `order:${order.id}:message:confirmed:v${updated.version}`, payload: { orderId: order.id, clientId: order.clientId } })
    await appendWorkflowAudit(tx, { orderId: order.id, actorId: input.actorId, action: 'ORDER_CONFIRMED', payload: { version: updated.version } })
    return updated
  })
}

export async function requestChangeOrder(prisma: PrismaClient, input: ActorInput & { orderId: string; serviceIds: string[]; reason: string }) {
  return prisma.$transaction(async (tx) => {
    const { order } = await requireOrderOperator(tx, input.orderId, input.actorId)
    if (order.jobStatus !== 'IN_PROGRESS') throw new WorkflowError('CHANGE_ORDER_STATE_INVALID', 'Change orders require work in progress', 409)
    const serviceIds = Array.from(new Set(input.serviceIds || []))
    const services = await tx.service.findMany({ where: { id: { in: serviceIds }, isActive: true } })
    if (!serviceIds.length || services.length !== serviceIds.length) throw new WorkflowError('SERVICE_NOT_AVAILABLE', 'Every change-order service must be active', 409)
    const deltaCents = services.reduce((sum, service) => sum + Math.round(service.basePrice * 100), 0)
    const created = await tx.changeOrder.create({
      data: {
        orderId: order.id, requestedById: input.actorId, reason: text(input.reason, 'reason', 1000), deltaCents,
        lines: { create: services.map((service) => ({ serviceId: service.id, serviceName: service.name, unitPriceCents: Math.round(service.basePrice * 100), durationMinutes: service.baseDuration })) },
      }, include: { lines: true },
    })
    await appendWorkflowAudit(tx, { orderId: order.id, actorId: input.actorId, action: 'CHANGE_ORDER_REQUESTED', payload: { changeOrderId: created.id, serviceIds, deltaCents } })
    return created
  })
}

export async function decideChangeOrder(prisma: PrismaClient, input: ActorInput & { changeOrderId: string; approve: boolean }) {
  return prisma.$transaction(async (tx) => {
    await requireWorkflowActor(tx, input.actorId, SUPERVISOR_ROLES)
    const change = await tx.changeOrder.findUnique({ where: { id: input.changeOrderId }, include: { lines: true, order: true } })
    if (!change) throw new WorkflowError('CHANGE_ORDER_NOT_FOUND', 'Change order was not found', 404)
    if (change.status !== 'REQUESTED') throw new WorkflowError('CHANGE_ORDER_ALREADY_DECIDED', 'Change order has already been decided', 409)
    if (change.requestedById === input.actorId) throw new WorkflowError('SEPARATE_APPROVER_REQUIRED', 'The requester cannot approve their own change order', 409)
    if (input.approve) await reserveInventory(tx, change.orderId, change.lines.map((line) => line.serviceId), `change:${change.id}`)
    const updated = await tx.changeOrder.update({ where: { id: change.id }, data: { status: input.approve ? 'APPROVED' : 'REJECTED', approvedById: input.actorId, decidedAt: new Date() } })
    if (input.approve) await tx.groomingOrder.update({ where: { id: change.orderId }, data: { version: { increment: 1 } } })
    await appendWorkflowAudit(tx, { orderId: change.orderId, actorId: input.actorId, action: input.approve ? 'CHANGE_ORDER_APPROVED' : 'CHANGE_ORDER_REJECTED', payload: { changeOrderId: change.id, deltaCents: change.deltaCents } })
    return updated
  }, { isolationLevel: 'Serializable' })
}

const JOB_TRANSITIONS: Record<WorkflowJobStatus, WorkflowJobStatus[]> = {
  NOT_STARTED: ['CHECKED_IN', 'NO_SHOW', 'CANCELLED'],
  CHECKED_IN: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['PARTIAL', 'COMPLETED'],
  PARTIAL: [], COMPLETED: [], NO_SHOW: [], CANCELLED: [],
}

async function transitionJobTx(tx: Prisma.TransactionClient, input: ActorInput & { orderId: string; expectedVersion: number; status: WorkflowJobStatus; deliveredCents?: number; connectors?: ConnectorSelection; offline?: boolean }) {
  const { order } = await requireOrderOperator(tx, input.orderId, input.actorId)
  if (order.version !== input.expectedVersion) throw new WorkflowError('VERSION_CONFLICT', 'Order changed; reconcile the latest version before applying this status', 409)
  if (!JOB_TRANSITIONS[order.jobStatus].includes(input.status)) throw new WorkflowError('INVALID_JOB_TRANSITION', `${order.jobStatus} cannot transition to ${input.status}`, 409)
  let bookingStatus = order.bookingStatus
  let deliveredCents = order.deliveredCents
  if (input.status === 'NO_SHOW') {
    bookingStatus = 'NO_SHOW'
    await releaseInventory(tx, order.id, `job:${order.id}:no-show`, false)
  } else if (input.status === 'CANCELLED') {
    bookingStatus = 'CANCELLED'
    await releaseInventory(tx, order.id, `job:${order.id}:cancel`, false)
  } else if (input.status === 'PARTIAL' || input.status === 'COMPLETED') {
    const approved = await tx.changeOrder.aggregate({ where: { orderId: order.id, status: 'APPROVED' }, _sum: { deltaCents: true } })
    const maximum = order.quotedTotalCents + (approved._sum.deltaCents || 0)
    deliveredCents = input.status === 'COMPLETED' ? maximum : positiveCents(input.deliveredCents, 'deliveredCents')
    if (deliveredCents > maximum || (input.status === 'PARTIAL' && deliveredCents >= maximum)) throw new WorkflowError('PARTIAL_AMOUNT_INVALID', 'Partial work must be positive and less than the authorized order total', 409)
    bookingStatus = 'COMPLETED'
    await releaseInventory(tx, order.id, `job:${order.id}:${input.status.toLowerCase()}`, true)
  }
  const updated = await tx.groomingOrder.update({ where: { id: order.id }, data: { jobStatus: input.status, bookingStatus, deliveredCents, version: { increment: 1 } } })
  if (['NO_SHOW', 'PARTIAL', 'COMPLETED'].includes(input.status)) {
    await queueIntegrationOperation(tx, { kind: 'MESSAGING', connectorId: input.connectors?.MESSAGING, operationType: `JOB_${input.status}`, aggregateType: 'ORDER', aggregateId: order.id, idempotencyKey: `order:${order.id}:message:${input.status.toLowerCase()}`, payload: { orderId: order.id, clientId: order.clientId, deliveredCents } })
  }
  await appendWorkflowAudit(tx, { orderId: order.id, actorId: input.actorId, action: `JOB_${input.status}`, payload: { previous: order.jobStatus, deliveredCents, offline: Boolean(input.offline), version: updated.version } })
  return updated
}

export async function transitionJob(prisma: PrismaClient, input: ActorInput & { orderId: string; expectedVersion: number; status: WorkflowJobStatus; deliveredCents?: number; connectors?: ConnectorSelection }) {
  return prisma.$transaction((tx) => transitionJobTx(tx, input), { isolationLevel: 'Serializable' })
}

export async function issueInvoice(prisma: PrismaClient, input: ActorInput & { orderId: string; noShowFeeCents?: number; taxConnectorId?: string }) {
  return prisma.$transaction(async (tx) => {
    const { order } = await requireOrderOperator(tx, input.orderId, input.actorId, true)
    const existing = await tx.workflowInvoice.findUnique({ where: { orderId: order.id } })
    if (existing) return existing
    if (!['COMPLETED', 'PARTIAL', 'NO_SHOW'].includes(order.jobStatus)) throw new WorkflowError('INVOICE_STATE_INVALID', 'Only completed, partial, or no-show work can be invoiced', 409)
    let subtotalCents = order.deliveredCents
    if (order.jobStatus === 'NO_SHOW') {
      subtotalCents = positiveCents(input.noShowFeeCents, 'noShowFeeCents', true)
      if (subtotalCents > order.quotedTotalCents) throw new WorkflowError('NO_SHOW_FEE_INVALID', 'No-show fee cannot exceed the accepted quote', 409)
    }
    const invoice = await tx.workflowInvoice.create({ data: { orderId: order.id, clientId: order.clientId, subtotalCents, taxCents: 0, totalCents: subtotalCents } })
    await queueIntegrationOperation(tx, { kind: 'TAX', connectorId: input.taxConnectorId, operationType: 'TAX_INVOICE', aggregateType: 'INVOICE', aggregateId: invoice.id, idempotencyKey: `invoice:${invoice.id}:tax`, payload: { amountCents: subtotalCents, currency: invoice.currency, postalCode: order.postalCode } })
    await appendWorkflowAudit(tx, { orderId: order.id, actorId: input.actorId, action: 'INVOICE_REQUESTED', payload: { invoiceId: invoice.id, subtotalCents } })
    return invoice
  })
}

export async function initiatePayment(prisma: PrismaClient, input: ActorInput & { invoiceId: string; amountCents: number; idempotencyKey: string; paymentConnectorId?: string }) {
  return prisma.$transaction(async (tx) => {
    await requireWorkflowActor(tx, input.actorId, OFFICE_ROLES)
    const existing = await tx.workflowPayment.findUnique({ where: { idempotencyKey: input.idempotencyKey } })
    if (existing) return existing
    const invoice = await tx.workflowInvoice.findUnique({ where: { id: input.invoiceId }, include: { order: true } })
    if (!invoice || !['ISSUED', 'PARTIALLY_PAID'].includes(invoice.status)) throw new WorkflowError('INVOICE_NOT_PAYABLE', 'Invoice is not payable', 409)
    const amountCents = positiveCents(input.amountCents, 'amountCents')
    const due = invoice.totalCents - invoice.paidCents
    if (amountCents > due) throw new WorkflowError('PAYMENT_AMOUNT_INVALID', 'Payment exceeds the invoice balance', 409)
    const payment = await tx.workflowPayment.create({ data: { invoiceId: invoice.id, amountCents, idempotencyKey: text(input.idempotencyKey, 'idempotencyKey', 200) } })
    await queueIntegrationOperation(tx, { kind: 'PAYMENT', connectorId: input.paymentConnectorId, operationType: 'PAYMENT_CHARGE', aggregateType: 'PAYMENT', aggregateId: payment.id, idempotencyKey: `provider:${payment.idempotencyKey}`, payload: { paymentId: payment.id, invoiceId: invoice.id, amountCents, currency: invoice.currency } })
    await appendWorkflowAudit(tx, { orderId: invoice.orderId, actorId: input.actorId, action: 'PAYMENT_REQUESTED', payload: { paymentId: payment.id, amountCents } })
    return payment
  })
}

export async function requestRefund(prisma: PrismaClient, input: ActorInput & { paymentId: string; amountCents: number; idempotencyKey: string; reason: string; paymentConnectorId?: string }) {
  return prisma.$transaction(async (tx) => {
    await requireWorkflowActor(tx, input.actorId, SUPERVISOR_ROLES)
    const existing = await tx.workflowRefund.findUnique({ where: { idempotencyKey: input.idempotencyKey } })
    if (existing) return existing
    const payment = await tx.workflowPayment.findUnique({ where: { id: input.paymentId }, include: { refunds: true, invoice: true } })
    if (!payment || !['SUCCEEDED', 'PARTIALLY_REFUNDED'].includes(payment.status)) throw new WorkflowError('PAYMENT_NOT_REFUNDABLE', 'Only successful payments can be refunded', 409)
    const amountCents = positiveCents(input.amountCents, 'amountCents')
    const refunded = payment.refunds.filter((refund) => ['PENDING', 'SUCCEEDED'].includes(refund.status)).reduce((sum, refund) => sum + refund.amountCents, 0)
    if (amountCents > payment.amountCents - refunded) throw new WorkflowError('REFUND_AMOUNT_INVALID', 'Refund exceeds the unrefunded payment amount', 409)
    const refund = await tx.workflowRefund.create({ data: { paymentId: payment.id, amountCents, idempotencyKey: text(input.idempotencyKey, 'idempotencyKey', 200), reason: text(input.reason, 'reason', 1000) } })
    await queueIntegrationOperation(tx, { kind: 'PAYMENT', connectorId: input.paymentConnectorId, operationType: 'PAYMENT_REFUND', aggregateType: 'REFUND', aggregateId: refund.id, idempotencyKey: `provider:${refund.idempotencyKey}`, payload: { refundId: refund.id, paymentExternalId: payment.providerExternalId, amountCents, currency: payment.invoice.currency } })
    await appendWorkflowAudit(tx, { orderId: payment.invoice.orderId, actorId: input.actorId, action: 'REFUND_REQUESTED', payload: { refundId: refund.id, paymentId: payment.id, amountCents, reason: refund.reason } })
    return refund
  })
}

export async function cancelOrder(prisma: PrismaClient, input: ActorInput & { orderId: string; expectedVersion: number; reason: string; connectors?: ConnectorSelection }) {
  return prisma.$transaction(async (tx) => {
    const { order } = await requireOrderOperator(tx, input.orderId, input.actorId, true)
    if (order.version !== input.expectedVersion || !['NOT_STARTED'].includes(order.jobStatus) || !ACTIVE_BOOKINGS.includes(order.bookingStatus as typeof ACTIVE_BOOKINGS[number])) throw new WorkflowError('CANCELLATION_STATE_INVALID', 'Only a current, not-started booking can be cancelled', 409)
    const paid = await tx.workflowInvoice.findUnique({ where: { orderId: order.id }, select: { paidCents: true, refundedCents: true } })
    if (paid && paid.paidCents > paid.refundedCents) throw new WorkflowError('REFUND_REQUIRED', 'Refund paid funds before cancelling the order', 409)
    const reason = text(input.reason, 'reason', 1000)
    await releaseInventory(tx, order.id, `cancel:${order.id}`, false)
    const updated = await tx.groomingOrder.update({ where: { id: order.id }, data: { bookingStatus: 'CANCELLED', jobStatus: 'CANCELLED', cancellationReason: reason, cancelledAt: new Date(), version: { increment: 1 } } })
    await queueIntegrationOperation(tx, { kind: 'CALENDAR', connectorId: input.connectors?.CALENDAR, operationType: 'CANCEL_BOOKING', aggregateType: 'ORDER', aggregateId: order.id, idempotencyKey: `order:${order.id}:calendar:cancel`, payload: { orderId: order.id, technicianId: order.technicianId } })
    await queueIntegrationOperation(tx, { kind: 'MESSAGING', connectorId: input.connectors?.MESSAGING, operationType: 'CANCELLATION_NOTICE', aggregateType: 'ORDER', aggregateId: order.id, idempotencyKey: `order:${order.id}:message:cancel`, payload: { orderId: order.id, clientId: order.clientId, reason } })
    await appendWorkflowAudit(tx, { orderId: order.id, actorId: input.actorId, action: 'ORDER_CANCELLED', payload: { reason, version: updated.version } })
    return updated
  }, { isolationLevel: 'Serializable' })
}

export async function applyOfflineCommand(prisma: PrismaClient, input: ActorInput & { orderId: string; deviceId: string; clientCommandId: string; expectedVersion: number; command: 'CHECK_IN' | 'START' | 'PARTIAL' | 'COMPLETE'; deliveredCents?: number; connectors?: ConnectorSelection }) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.offlineCommand.findUnique({ where: { deviceId_clientCommandId: { deviceId: input.deviceId, clientCommandId: input.clientCommandId } } })
    if (existing) return { duplicate: true, command: existing }
    const order = await tx.groomingOrder.findUnique({ where: { id: input.orderId } })
    if (!order) throw new WorkflowError('ORDER_NOT_FOUND', 'Grooming order was not found', 404)
    if (order.version !== input.expectedVersion) {
      const conflict = await tx.offlineCommand.create({ data: { orderId: order.id, actorId: input.actorId, deviceId: text(input.deviceId, 'deviceId', 200), clientCommandId: text(input.clientCommandId, 'clientCommandId', 200), expectedVersion: input.expectedVersion, command: input.command, payload: { deliveredCents: input.deliveredCents || null }, status: 'CONFLICT', result: { currentVersion: order.version, currentStatus: order.jobStatus } } })
      return { duplicate: false, conflict: true, command: conflict }
    }
    const status: Record<typeof input.command, WorkflowJobStatus> = { CHECK_IN: 'CHECKED_IN', START: 'IN_PROGRESS', PARTIAL: 'PARTIAL', COMPLETE: 'COMPLETED' }
    const updated = await transitionJobTx(tx, { ...input, status: status[input.command], offline: true })
    const command = await tx.offlineCommand.create({ data: { orderId: order.id, actorId: input.actorId, deviceId: text(input.deviceId, 'deviceId', 200), clientCommandId: text(input.clientCommandId, 'clientCommandId', 200), expectedVersion: input.expectedVersion, command: input.command, payload: { deliveredCents: input.deliveredCents || null }, status: 'APPLIED', result: { orderVersion: updated.version, jobStatus: updated.jobStatus } } })
    return { duplicate: false, conflict: false, command, order: updated }
  }, { isolationLevel: 'Serializable' })
}

export async function getOrderWorkflow(prisma: PrismaClient, input: ActorInput & { orderId: string }) {
  return prisma.$transaction(async (tx) => {
    await requireOrderOperator(tx, input.orderId, input.actorId)
    return tx.groomingOrder.findUniqueOrThrow({
      where: { id: input.orderId },
      include: { quote: { include: { lines: true } }, dispatches: { orderBy: { assignedAt: 'desc' } }, changeOrders: { include: { lines: true } }, inventoryReservations: { include: { product: true } }, invoice: { include: { payments: { include: { refunds: true } } } }, communications: true },
    })
  })
}

export async function verifyOrderAudit(prisma: PrismaClient, input: ActorInput & { orderId: string }) {
  return prisma.$transaction(async (tx) => {
    await requireOrderOperator(tx, input.orderId, input.actorId, true)
    return verifyWorkflowAudit(tx, { orderId: input.orderId })
  })
}
