import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import test from 'node:test'
import { PrismaClient, type ProviderKind } from '@prisma/client'
import { WorkflowError } from '../src/lib/workflow/errors'
import {
  acceptQuote, applyOfflineCommand, cancelOrder, confirmOrder, decideChangeOrder, dispatchOrder,
  initiatePayment, issueInvoice, reassignTechnician, requestChangeOrder, requestQuote, requestRefund,
  rescheduleOrder, transitionJob, verifyOrderAudit,
} from '../src/lib/workflow/service'
import { applyIntegrationWebhook, processOneIntegrationOperation, retryIntegrationOperation } from '../src/lib/workflow/worker'
import type { ProviderInvoker } from '../src/lib/workflow/provider'

const databaseUrl = new URL(process.env.DATABASE_URL || 'postgresql://invalid/invalid')
if (!databaseUrl.pathname.toLowerCase().includes('test')) throw new Error('Workflow tests require a database name containing "test"')
const prisma = new PrismaClient()

async function fixture() {
  const suffix = randomUUID().slice(0, 8)
  const user = (role: 'ADMIN' | 'MANAGER' | 'GROOMER', name: string) => prisma.user.create({ data: { email: `${name}-${suffix}@example.test`, password: 'not-used-in-workflow-test', name, role } })
  const [admin, manager, groomerA, groomerB, serviceUser] = await Promise.all([user('ADMIN', 'admin'), user('MANAGER', 'manager'), user('GROOMER', 'groomer-a'), user('GROOMER', 'groomer-b'), user('MANAGER', 'provider-service')])
  const client = await prisma.client.create({ data: { firstName: 'Mobile', lastName: 'Client', email: `client-${suffix}@example.test`, phone: '+12125550100' } })
  const breed = await prisma.breed.create({ data: { name: `Workflow breed ${suffix}`, size: 'MEDIUM' } })
  const pet = await prisma.pet.create({ data: { name: 'Pepper', breedId: breed.id, gender: 'FEMALE', clientId: client.id } })
  const baseService = await prisma.service.create({ data: { name: `Mobile groom ${suffix}`, category: 'HAIRCUT', basePrice: 60, baseDuration: 60 } })
  const extraService = await prisma.service.create({ data: { name: `Coat repair ${suffix}`, category: 'SPECIALTY', basePrice: 25, baseDuration: 30 } })
  const product = await prisma.product.create({ data: { name: `Workflow shampoo ${suffix}`, sku: `WF-${suffix}`, category: 'SHAMPOO', price: 12, quantity: 20 } })
  await prisma.serviceInventoryRequirement.createMany({ data: [{ serviceId: baseService.id, productId: product.id, quantity: 1 }, { serviceId: extraService.id, productId: product.id, quantity: 1 }] })
  for (const groomer of [groomerA, groomerB]) {
    await prisma.technicianProfile.create({ data: { userId: groomer.id, baseLatitude: 42.65, baseLongitude: -73.75, maxTravelKm: 50 } })
    await prisma.technicianSkill.createMany({ data: [{ technicianId: groomer.id, serviceId: baseService.id }, { technicianId: groomer.id, serviceId: extraService.id }] })
    await prisma.technicianServiceArea.create({ data: { technicianId: groomer.id, postalPrefix: '122' } })
    await prisma.technicianAvailability.create({ data: { technicianId: groomer.id, startsAt: new Date('2029-01-01T00:00:00Z'), endsAt: new Date('2031-01-01T00:00:00Z'), available: true, source: 'TEST_CALENDAR' } })
  }
  const connectors = {} as Record<ProviderKind, { id: string }>
  for (const kind of ['MAPS', 'CALENDAR', 'MESSAGING', 'PAYMENT', 'TAX', 'ACCOUNTING'] as ProviderKind[]) {
    connectors[kind] = await prisma.providerConnector.create({ data: { kind, provider: `${kind.toLowerCase()}-${suffix}`, endpoint: `https://${kind.toLowerCase()}.example.test/workflow`, allowedHost: `${kind.toLowerCase()}.example.test`, credentialEnv: `${kind}_TEST_TOKEN`, webhookSecretEnv: kind === 'PAYMENT' ? 'PAYMENT_TEST_WEBHOOK' : null, serviceUserId: serviceUser.id } })
  }
  return { suffix, admin, manager, groomerA, groomerB, serviceUser, client, pet, baseService, extraService, product, connectors }
}

test('mobile grooming journey handles contention, field recovery, partial work, providers, refunds, no-shows, cancellation, and reassignment', async () => {
  const data = await fixture()
  const deviceId = `field-device-${data.suffix}`
  const quoteConnectors = { MAPS: data.connectors.MAPS.id, TAX: data.connectors.TAX.id }
  const bookingConnectors = { CALENDAR: data.connectors.CALENDAR.id, MESSAGING: data.connectors.MESSAGING.id }
  const calls = new Map<string, number>()
  const provider: ProviderInvoker = async (_connector, operationType, payload, idempotencyKey) => {
    calls.set(idempotencyKey, (calls.get(idempotencyKey) || 0) + 1)
    if (operationType === 'ROUTE_QUOTE') return { receipt: `route:${idempotencyKey}`, output: { distanceKm: (payload as any).destination.latitude === 0 ? 80 : 8.25 } }
    if (operationType === 'TAX_QUOTE') return { receipt: `tax:${idempotencyKey}`, output: { taxCents: 480 } }
    if (operationType === 'TAX_INVOICE') return { receipt: `invoice-tax:${idempotencyKey}`, output: { taxCents: 560 } }
    if (operationType === 'PAYMENT_CHARGE') return { receipt: `charge:${idempotencyKey}`, output: { externalId: `pay-${data.suffix}` } }
    if (operationType === 'PAYMENT_REFUND') return { receipt: `refund:${idempotencyKey}`, output: { externalId: `refund-${data.suffix}` } }
    return { receipt: `receipt:${idempotencyKey}`, output: { accepted: true } }
  }
  async function drain() {
    for (let index = 0; index < 100; index += 1) if (await processOneIntegrationOperation(prisma, `worker-${index % 2}`, provider) === 'idle') return
    throw new Error('Integration queue did not drain')
  }
  const quoteInput = {
    actorId: data.manager.id, clientId: data.client.id, petId: data.pet.id, technicianId: data.groomerA.id,
    serviceIds: [data.baseService.id], requestedStart: '2030-01-15T14:00:00Z', requestedEnd: '2030-01-15T15:00:00Z',
    addressLine: '1 Grooming Way', postalCode: '12207', latitude: 42.66, longitude: -73.76,
    connectors: quoteConnectors,
  }
  const quote = await requestQuote(prisma, { ...quoteInput, idempotencyKey: `quote-primary-${data.suffix}` })
  const competingQuote = await requestQuote(prisma, { ...quoteInput, idempotencyKey: `quote-overlap-${data.suffix}` })
  await assert.rejects(requestQuote(prisma, { ...quoteInput, idempotencyKey: `quote-outside-area-${data.suffix}`, postalCode: '99999' }), (error: unknown) => error instanceof WorkflowError && error.code === 'OUTSIDE_SERVICE_AREA')
  assert.equal((await requestQuote(prisma, { ...quoteInput, idempotencyKey: `quote-primary-${data.suffix}` })).id, quote.id)
  await drain()
  const offered = await prisma.groomingQuote.findUniqueOrThrow({ where: { id: quote.id } })
  const offeredCompeting = await prisma.groomingQuote.findUniqueOrThrow({ where: { id: competingQuote.id } })
  assert.equal(offered.status, 'OFFERED'); assert.equal(offered.totalCents, 6480)
  const order = await acceptQuote(prisma, { actorId: data.manager.id, quoteId: quote.id, expectedVersion: offered.version, connectors: bookingConnectors })
  await assert.rejects(acceptQuote(prisma, { actorId: data.manager.id, quoteId: competingQuote.id, expectedVersion: offeredCompeting.version, connectors: bookingConnectors }), (error: unknown) => error instanceof WorkflowError && error.code === 'OVERBOOKED')
  await assert.rejects(prisma.groomingOrder.create({ data: { quoteId: competingQuote.id, clientId: data.client.id, petId: data.pet.id, technicianId: data.groomerA.id, scheduledStart: new Date('2030-01-15T14:00:00Z'), scheduledEnd: new Date('2030-01-15T15:00:00Z'), addressLine: '1 Grooming Way', postalCode: '12207', latitude: 42.66, longitude: -73.76, quotedTotalCents: offeredCompeting.totalCents } }))
  assert.equal((await prisma.product.findUniqueOrThrow({ where: { id: data.product.id } })).reservedQuantity, 1)

  let current = await reassignTechnician(prisma, { actorId: data.admin.id, orderId: order.id, expectedVersion: order.version, technicianId: data.groomerB.id, reason: 'Primary vehicle unavailable', connectors: bookingConnectors })
  current = await rescheduleOrder(prisma, { actorId: data.manager.id, orderId: order.id, expectedVersion: current.version, startsAt: '2030-01-16T14:00:00Z', endsAt: '2030-01-16T15:00:00Z', connectors: bookingConnectors })
  current = await dispatchOrder(prisma, { actorId: data.admin.id, orderId: order.id, expectedVersion: current.version, connectors: bookingConnectors })
  current = await confirmOrder(prisma, { actorId: data.manager.id, orderId: order.id, expectedVersion: current.version, connectors: bookingConnectors })
  const checkedIn = await applyOfflineCommand(prisma, { actorId: data.groomerB.id, orderId: order.id, deviceId, clientCommandId: 'check-in-1', expectedVersion: current.version, command: 'CHECK_IN' })
  assert.equal(checkedIn.order?.jobStatus, 'CHECKED_IN')
  assert.equal((await applyOfflineCommand(prisma, { actorId: data.groomerB.id, orderId: order.id, deviceId, clientCommandId: 'check-in-1', expectedVersion: current.version, command: 'CHECK_IN' })).duplicate, true)
  const conflict = await applyOfflineCommand(prisma, { actorId: data.groomerB.id, orderId: order.id, deviceId, clientCommandId: 'stale-start', expectedVersion: current.version, command: 'START' })
  assert.equal(conflict.conflict, true)
  const started = await applyOfflineCommand(prisma, { actorId: data.groomerB.id, orderId: order.id, deviceId, clientCommandId: 'start-1', expectedVersion: checkedIn.order!.version, command: 'START' })
  const change = await requestChangeOrder(prisma, { actorId: data.manager.id, orderId: order.id, serviceIds: [data.extraService.id], reason: 'Severe matting discovered after check-in' })
  await assert.rejects(decideChangeOrder(prisma, { actorId: data.manager.id, changeOrderId: change.id, approve: true }), (error: unknown) => error instanceof WorkflowError && error.code === 'SEPARATE_APPROVER_REQUIRED')
  await decideChangeOrder(prisma, { actorId: data.admin.id, changeOrderId: change.id, approve: true })
  const afterChange = await prisma.groomingOrder.findUniqueOrThrow({ where: { id: order.id } })
  current = await transitionJob(prisma, { actorId: data.groomerB.id, orderId: order.id, expectedVersion: afterChange.version, status: 'PARTIAL', deliveredCents: 7000, connectors: bookingConnectors })
  assert.equal(current.jobStatus, 'PARTIAL')
  const stock = await prisma.product.findUniqueOrThrow({ where: { id: data.product.id } })
  assert.equal(stock.reservedQuantity, 0); assert.equal(stock.quantity, 18)

  let invoice = await issueInvoice(prisma, { actorId: data.admin.id, orderId: order.id, taxConnectorId: data.connectors.TAX.id })
  await drain(); invoice = await prisma.workflowInvoice.findUniqueOrThrow({ where: { id: invoice.id } })
  assert.equal(invoice.status, 'ISSUED'); assert.equal(invoice.totalCents, 7560)
  let payment = await initiatePayment(prisma, { actorId: data.manager.id, invoiceId: invoice.id, amountCents: invoice.totalCents, idempotencyKey: `payment-${data.suffix}`, paymentConnectorId: data.connectors.PAYMENT.id })
  await drain(); payment = await prisma.workflowPayment.findUniqueOrThrow({ where: { id: payment.id } })
  assert.equal(payment.providerExternalId, `pay-${data.suffix}`)
  const paymentEvent = { connectorId: data.connectors.PAYMENT.id, externalEventId: `payment-event-${data.suffix}`, payload: { type: 'PAYMENT_SUCCEEDED', externalId: payment.providerExternalId } }
  assert.equal((await applyIntegrationWebhook(prisma, paymentEvent)).duplicate, false)
  assert.equal((await applyIntegrationWebhook(prisma, paymentEvent)).duplicate, true)
  let refund = await requestRefund(prisma, { actorId: data.admin.id, paymentId: payment.id, amountCents: 2000, idempotencyKey: `refund-${data.suffix}`, reason: 'Customer adjustment for unfinished coat work', paymentConnectorId: data.connectors.PAYMENT.id })
  await drain(); refund = await prisma.workflowRefund.findUniqueOrThrow({ where: { id: refund.id } })
  await applyIntegrationWebhook(prisma, { connectorId: data.connectors.PAYMENT.id, externalEventId: `refund-event-${data.suffix}`, payload: { type: 'REFUND_SUCCEEDED', externalId: refund.providerExternalId } })
  assert.equal((await prisma.workflowInvoice.findUniqueOrThrow({ where: { id: invoice.id } })).status, 'PARTIALLY_REFUNDED')
  assert.equal(await verifyOrderAudit(prisma, { actorId: data.admin.id, orderId: order.id }), true)
  const audit = await prisma.workflowAuditEvent.findFirstOrThrow({ where: { orderId: order.id } })
  await assert.rejects(prisma.workflowAuditEvent.update({ where: { id: audit.id }, data: { action: 'TAMPERED' } }))

  const noShowQuote = await requestQuote(prisma, { ...quoteInput, idempotencyKey: `quote-no-show-${data.suffix}`, requestedStart: '2030-02-15T14:00:00Z', requestedEnd: '2030-02-15T15:00:00Z' })
  const cancelQuote = await requestQuote(prisma, { ...quoteInput, idempotencyKey: `quote-cancel-${data.suffix}`, requestedStart: '2030-03-15T14:00:00Z', requestedEnd: '2030-03-15T15:00:00Z' })
  await drain()
  const noShowOffered = await prisma.groomingQuote.findUniqueOrThrow({ where: { id: noShowQuote.id } }); const cancelOffered = await prisma.groomingQuote.findUniqueOrThrow({ where: { id: cancelQuote.id } })
  let noShowOrder = await acceptQuote(prisma, { actorId: data.manager.id, quoteId: noShowQuote.id, expectedVersion: noShowOffered.version, connectors: bookingConnectors })
  noShowOrder = await transitionJob(prisma, { actorId: data.groomerA.id, orderId: noShowOrder.id, expectedVersion: noShowOrder.version, status: 'NO_SHOW', connectors: bookingConnectors })
  const noShowInvoice = await issueInvoice(prisma, { actorId: data.admin.id, orderId: noShowOrder.id, noShowFeeCents: 1500, taxConnectorId: data.connectors.TAX.id })
  assert.equal(noShowInvoice.subtotalCents, 1500)
  const cancelOrderRecord = await acceptQuote(prisma, { actorId: data.manager.id, quoteId: cancelQuote.id, expectedVersion: cancelOffered.version, connectors: bookingConnectors })
  await assert.rejects(prisma.groomingOrder.update({ where: { id: cancelOrderRecord.id }, data: { jobStatus: 'COMPLETED' } }))
  assert.equal((await cancelOrder(prisma, { actorId: data.admin.id, orderId: cancelOrderRecord.id, expectedVersion: cancelOrderRecord.version, reason: 'Customer cancelled outside fee window', connectors: bookingConnectors })).bookingStatus, 'CANCELLED')

  const farQuote = await requestQuote(prisma, { ...quoteInput, idempotencyKey: `quote-far-${data.suffix}`, requestedStart: '2030-04-15T14:00:00Z', requestedEnd: '2030-04-15T15:00:00Z', latitude: 0 })
  await drain()
  const rejectedForTravel = await prisma.groomingQuote.findUniqueOrThrow({ where: { id: farQuote.id } })
  assert.equal(rejectedForTravel.status, 'FAILED'); assert.match(rejectedForTravel.providerFailure || '', /travel limit/)

  const messaging = data.connectors.MESSAGING.id
  const repairOperation = await prisma.integrationOperation.create({ data: { connectorId: messaging, operationType: 'TEST_RETRY', aggregateType: 'ORDER', aggregateId: order.id, idempotencyKey: `retry-${data.suffix}`, payload: {}, maxAttempts: 2 } })
  const transient: ProviderInvoker = async () => { throw new WorkflowError('TEMPORARY_PROVIDER_FAILURE', 'Temporary outage', 502, true) }
  assert.equal(await processOneIntegrationOperation(prisma, 'failure-worker-1', transient), 'retry')
  await prisma.integrationOperation.update({ where: { id: repairOperation.id }, data: { nextAttemptAt: new Date() } })
  assert.equal(await processOneIntegrationOperation(prisma, 'failure-worker-2', transient), 'dead-letter')
  await retryIntegrationOperation(prisma, { actorId: data.admin.id, operationId: repairOperation.id, reason: 'Provider health check recovered' })
  assert.equal(await processOneIntegrationOperation(prisma, 'repair-worker', provider), 'completed')
  for (const count of calls.values()) assert.equal(count, 1, 'every provider idempotency key is delivered once')
})

test.after(async () => prisma.$disconnect())
