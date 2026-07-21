import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireApiActor, workflowResponse } from '@/lib/workflow/api'
import {
  applyOfflineCommand, cancelOrder, confirmOrder, decideChangeOrder, dispatchOrder, initiatePayment,
  issueInvoice, reassignTechnician, requestChangeOrder, requestRefund, rescheduleOrder, transitionJob,
  verifyOrderAudit,
} from '@/lib/workflow/service'
import { WorkflowError } from '@/lib/workflow/errors'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireApiActor()
    const body = await request.json()
    const base = { actorId: actor.id, orderId: (await params).id }
    let result: unknown
    switch (body.action) {
      case 'DISPATCH': result = await dispatchOrder(db, { ...base, expectedVersion: body.expectedVersion, connectors: body.connectors }); break
      case 'CONFIRM': result = await confirmOrder(db, { ...base, expectedVersion: body.expectedVersion, connectors: body.connectors }); break
      case 'RESCHEDULE': result = await rescheduleOrder(db, { ...base, expectedVersion: body.expectedVersion, startsAt: body.startsAt, endsAt: body.endsAt, connectors: body.connectors }); break
      case 'REASSIGN': result = await reassignTechnician(db, { ...base, expectedVersion: body.expectedVersion, technicianId: body.technicianId, reason: body.reason, connectors: body.connectors }); break
      case 'CHANGE_REQUEST': result = await requestChangeOrder(db, { ...base, serviceIds: body.serviceIds, reason: body.reason }); break
      case 'CHANGE_DECIDE': result = await decideChangeOrder(db, { actorId: actor.id, changeOrderId: body.changeOrderId, approve: Boolean(body.approve) }); break
      case 'JOB_STATUS': result = await transitionJob(db, { ...base, expectedVersion: body.expectedVersion, status: body.status, deliveredCents: body.deliveredCents, connectors: body.connectors }); break
      case 'INVOICE': result = await issueInvoice(db, { ...base, noShowFeeCents: body.noShowFeeCents, taxConnectorId: body.taxConnectorId }); break
      case 'PAYMENT': result = await initiatePayment(db, { actorId: actor.id, invoiceId: body.invoiceId, amountCents: body.amountCents, idempotencyKey: body.idempotencyKey, paymentConnectorId: body.paymentConnectorId }); break
      case 'REFUND': result = await requestRefund(db, { actorId: actor.id, paymentId: body.paymentId, amountCents: body.amountCents, idempotencyKey: body.idempotencyKey, reason: body.reason, paymentConnectorId: body.paymentConnectorId }); break
      case 'CANCEL': result = await cancelOrder(db, { ...base, expectedVersion: body.expectedVersion, reason: body.reason, connectors: body.connectors }); break
      case 'OFFLINE': result = await applyOfflineCommand(db, { ...base, deviceId: body.deviceId, clientCommandId: body.clientCommandId, expectedVersion: body.expectedVersion, command: body.command, deliveredCents: body.deliveredCents, connectors: body.connectors }); break
      case 'VERIFY_AUDIT': result = { valid: await verifyOrderAudit(db, base) }; break
      default: throw new WorkflowError('ACTION_UNSUPPORTED', 'Workflow action is unsupported')
    }
    return NextResponse.json(result)
  } catch (error) { return workflowResponse(error) }
}
