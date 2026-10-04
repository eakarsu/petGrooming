'use client'

import { FormEvent, useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import toast from 'react-hot-toast'

type Quote = { id: string; status: string; version: number; totalCents: number; taxCents: number; travelKm?: number | null; client: { firstName: string; lastName: string }; pet: { name: string }; order?: { id: string } | null }
type MoneyOperation = { id: string; aggregateId: string; operationType: string; status: string; attempts: number; lastError?: string | null; output?: { checkoutUrl?: string; externalId?: string } | null }
type Payment = { id: string; status: string; amountCents: number; providerExternalId?: string | null; refunds: { id: string; status: string; amountCents: number }[] }
type Order = { id: string; version: number; bookingStatus: string; jobStatus: string; scheduledStart: string; scheduledEnd: string; quotedTotalCents: number; invoice?: { id: string; status: string; totalCents: number; taxCents: number; paidCents: number; refundedCents: number; payments: Payment[] } | null; moneyOperations: MoneyOperation[] }
type Suggestions = { duration: { serviceIds: string[]; breedSize: string; sampleCount: number; observedP80Minutes: number; suggestedDurationMinutes: number; sourceOrderIds: string[] }[]; route: { sampleCount: number; observedP80GapMinutes: number; suggestedIntervisitBufferMinutes: number; limitation: string; sourcePairs: {fromId:string;toId:string;minutes:number;distanceKm:number}[] } | null; policy: string; sampledOrders: number }

const initial = { clientId: '', petId: '', technicianId: '', serviceIds: '', requestedStart: '', requestedEnd: '', addressLine: '', postalCode: '', latitude: '', longitude: '' }
function safeCheckoutUrl(value: unknown) {
  try { const url = new URL(String(value)); return url.protocol === 'https:' && url.hostname === 'checkout.stripe.com' ? url.href : null } catch { return null }
}
function centsFromDollars(value: string) {
  if (!/^\d+(?:\.\d{1,2})?$/.test(value.trim())) return null
  const [whole, fraction = ''] = value.trim().split('.')
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'))
  return Number.isSafeInteger(cents) && cents > 0 ? cents : null
}

export default function OperationsPage() {
  const [form, setForm] = useState(initial)
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [orderId, setOrderId] = useState('')
  const [order, setOrder] = useState<Order | null>(null)
  const [busy, setBusy] = useState(false)
  const [captureLocation, setCaptureLocation] = useState(false)
  const [suggestions, setSuggestions] = useState<Suggestions | null>(null)
  const [refundAmounts, setRefundAmounts] = useState<Record<string, string>>({})
  const [refundReason, setRefundReason] = useState('')
  const [retryReasons, setRetryReasons] = useState<Record<string, string>>({})

  async function loadSuggestions() {
    const response = await fetch('/api/workflow/suggestions')
    if (response.ok) setSuggestions(await response.json())
  }

  async function loadQuotes() {
    const response = await fetch('/api/workflow/quotes')
    if (response.ok) setQuotes(await response.json())
  }
  useEffect(() => { void loadQuotes(); void loadSuggestions() }, [])

  async function createQuote(event: FormEvent) {
    event.preventDefault(); setBusy(true)
    try {
      const response = await fetch('/api/workflow/quotes', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...form, serviceIds: form.serviceIds.split(',').map((id) => id.trim()).filter(Boolean), latitude: Number(form.latitude), longitude: Number(form.longitude), idempotencyKey: crypto.randomUUID() }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || result.error)
      toast.success('Quote queued for route and tax validation'); setForm(initial); await loadQuotes()
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Quote failed') } finally { setBusy(false) }
  }

  async function accept(quote: Quote) {
    const response = await fetch(`/api/workflow/quotes/${quote.id}/accept`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ expectedVersion: quote.version }) })
    const result = await response.json()
    if (!response.ok) return toast.error(result.message || result.error)
    setOrderId(result.id); toast.success('Quote accepted and inventory reserved'); await loadQuotes(); await loadOrder(result.id)
  }

  async function loadOrder(id = orderId) {
    if (!id) return
    const response = await fetch(`/api/workflow/orders/${id}`); const result = await response.json()
    if (!response.ok) return toast.error(result.message || result.error)
    setOrder(result)
  }

  async function action(actionName: string, details: Record<string, unknown> = {}) {
    if (!order) return
    if (captureLocation && actionName === 'JOB_STATUS' && ['CHECKED_IN', 'COMPLETED'].includes(String(details.status))) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }))
        if (position.coords.accuracy <= 200) details.location = { latitude: position.coords.latitude, longitude: position.coords.longitude, accuracyMeters: position.coords.accuracy }
        else toast('Location was too imprecise; status will be recorded without position evidence')
      } catch { toast('Location was unavailable; status will be recorded without position evidence') }
    }
    const response = await fetch(`/api/workflow/orders/${order.id}/actions`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: actionName, expectedVersion: order.version, ...details }) })
    const result = await response.json()
    if (!response.ok) return toast.error(result.message || result.error)
    toast.success(`${actionName.replaceAll('_', ' ')} recorded`); await loadOrder(order.id); if (details.status === 'COMPLETED') await loadSuggestions()
  }

  async function moneyAction(actionName: 'PAYMENT' | 'REFUND', details: Record<string, unknown>) {
    if (!order) return
    setBusy(true)
    try {
      const response = await fetch(`/api/workflow/orders/${order.id}/actions`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: actionName, idempotencyKey: crypto.randomUUID(), ...details }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || result.error)
      toast.success(actionName === 'PAYMENT' ? 'Payment checkout queued. Await the worker and signed webhook.' : 'Refund queued. Await provider and signed webhook confirmation.')
      await loadOrder(order.id)
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Payment action failed') }
    finally { setBusy(false) }
  }

  function refund(payment: Payment) {
    const amountCents = centsFromDollars(refundAmounts[payment.id] || '')
    if (!amountCents || !refundReason.trim()) return toast.error('Enter a valid refund amount and reason')
    void moneyAction('REFUND', { paymentId: payment.id, amountCents, reason: refundReason.trim() })
  }

  async function retryMoneyOperation(operation: MoneyOperation) {
    if (!order) return
    const reason = (retryReasons[operation.id] || '').trim()
    if (reason.length < 10) return toast.error('Describe how you checked the provider record before retrying')
    setBusy(true)
    try {
      const response = await fetch(`/api/workflow/operations/${operation.id}/retry`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ reason }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || result.error)
      toast.success('Retry queued with reconciliation reason')
      await loadOrder(order.id)
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Retry failed') }
    finally { setBusy(false) }
  }

  const invoice = order?.invoice
  const pendingCents = invoice?.payments.filter(payment => payment.status === 'PENDING' || (payment.status === 'FAILED' && order?.moneyOperations?.some(operation => operation.aggregateId === payment.id && operation.operationType === 'PAYMENT_CHARGE' && operation.status !== 'COMPLETED'))).reduce((sum, payment) => sum + payment.amountCents, 0) || 0
  const dueCents = invoice ? Math.max(0, invoice.totalCents - invoice.paidCents - pendingCents) : 0

  return <div className="space-y-6">
    <div><h1 className="text-3xl font-bold">Mobile Grooming Operations</h1><p className="text-gray-500">Governed quote-to-payment workflow. Provider work is processed by the integration worker.</p></div>
    <Card><CardHeader><CardTitle>Request route- and tax-validated quote</CardTitle></CardHeader><CardContent>
      <form onSubmit={createQuote} className="grid gap-3 md:grid-cols-2">
        {Object.keys(form).map((field) => <div key={field}><Label htmlFor={field}>{field}</Label><Input id={field} type={field.includes('Start') || field.includes('End') ? 'datetime-local' : 'text'} required value={form[field as keyof typeof form]} onChange={(event) => setForm({ ...form, [field]: event.target.value })} /></div>)}
        <Button className="md:col-span-2" loading={busy}>Request quote</Button>
      </form>
    </CardContent></Card>
    <Card><CardHeader><CardTitle>Recent quotes</CardTitle></CardHeader><CardContent className="space-y-2">
      {quotes.map((quote) => <div key={quote.id} className="flex flex-wrap items-center justify-between gap-2 rounded border p-3"><span>{quote.pet.name} · {quote.client.firstName} {quote.client.lastName} · {quote.status} · ${(quote.totalCents / 100).toFixed(2)}{quote.status === 'OFFERED' && ` · route ${quote.travelKm ?? '—'} km · tax $${(quote.taxCents / 100).toFixed(2)}`}</span>{quote.status === 'OFFERED' && <Button size="sm" onClick={() => accept(quote)}>Accept & reserve</Button>}{quote.order && <Button size="sm" variant="outline" onClick={() => { setOrderId(quote.order!.id); loadOrder(quote.order!.id) }}>Open order</Button>}</div>)}
    </CardContent></Card>
    <Card><CardHeader><CardTitle>Operate order</CardTitle></CardHeader><CardContent className="space-y-4">
      <div className="flex gap-2"><Input value={orderId} onChange={(event) => setOrderId(event.target.value)} placeholder="Order ID" /><Button onClick={() => loadOrder()}>Load</Button></div>
      {order && <><p className="font-medium">{order.id} · booking {order.bookingStatus} · job {order.jobStatus} · version {order.version}</p><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={captureLocation} onChange={event => setCaptureLocation(event.target.checked)} /> Capture optional device position at check-in and completion for route-buffer evidence</label><div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => action('DISPATCH')}>Dispatch</Button><Button size="sm" onClick={() => action('CONFIRM')}>Confirm</Button>
        <Button size="sm" onClick={() => action('JOB_STATUS', { status: 'CHECKED_IN' })}>Check in</Button><Button size="sm" onClick={() => action('JOB_STATUS', { status: 'IN_PROGRESS' })}>Start</Button><Button size="sm" onClick={() => action('JOB_STATUS', { status: 'COMPLETED' })}>Complete</Button>
        <Button size="sm" variant="outline" onClick={() => action('INVOICE')}>Issue invoice</Button><Button size="sm" variant="outline" onClick={() => action('VERIFY_AUDIT')}>Verify audit</Button>
      </div>{invoice && <div className="space-y-3 rounded border p-3"><p>Invoice {invoice.status}: ${(invoice.totalCents / 100).toFixed(2)} including ${(invoice.taxCents / 100).toFixed(2)} tax. Paid ${(invoice.paidCents / 100).toFixed(2)}; refunded ${(invoice.refundedCents / 100).toFixed(2)}.</p>
        {['ISSUED', 'PARTIALLY_PAID'].includes(invoice.status) && dueCents > 0 && <Button size="sm" disabled={busy} onClick={() => moneyAction('PAYMENT', { invoiceId: invoice.id, amountCents: dueCents })}>Request checkout for ${(dueCents / 100).toFixed(2)}</Button>}
        <p className="text-sm text-gray-600">Opening a Checkout link does not mark this invoice paid. Only a verified payment webhook does. Share the test link through an approved channel. Failed operations with uncertain provider state still reserve their amount until reconciliation.</p>
        {invoice.payments.map(payment => {
          const operation = order.moneyOperations?.find(item => item.aggregateId === payment.id && item.operationType === 'PAYMENT_CHARGE')
          const checkoutUrl = safeCheckoutUrl(operation?.output?.checkoutUrl)
          return <div key={payment.id} className="rounded border p-2 text-sm"><p>Payment {payment.id} · {payment.status} · ${(payment.amountCents / 100).toFixed(2)} · provider operation {operation?.status || 'queued'}{operation?.lastError ? ` · ${operation.lastError}` : ''}</p>
            {checkoutUrl && payment.status === 'PENDING' && <a href={checkoutUrl} target="_blank" rel="noopener noreferrer" className="underline">Open Stripe test Checkout</a>}
            {payment.refunds.map(item => { const refundOperation = order.moneyOperations?.find(op => op.aggregateId === item.id && op.operationType === 'PAYMENT_REFUND'); return <p key={item.id}>Refund {item.id} · {item.status} · ${(item.amountCents / 100).toFixed(2)} · provider operation {refundOperation?.status || 'queued'}{refundOperation?.lastError ? ` · ${refundOperation.lastError}` : ''}</p> })}
            {['SUCCEEDED', 'PARTIALLY_REFUNDED'].includes(payment.status) && <div className="mt-2 flex flex-wrap gap-2"><Input aria-label={`Refund amount for ${payment.id}`} placeholder="Refund dollars" value={refundAmounts[payment.id] || ''} onChange={event => setRefundAmounts({ ...refundAmounts, [payment.id]: event.target.value })} /><Button size="sm" disabled={busy} onClick={() => refund(payment)}>Request refund</Button></div>}
          </div>
        })}
        {invoice.payments.some(payment => ['SUCCEEDED', 'PARTIALLY_REFUNDED'].includes(payment.status)) && <Label>Refund reason<Input value={refundReason} onChange={event => setRefundReason(event.target.value)} placeholder="Reason reviewed by supervisor" /></Label>}
        {order.moneyOperations?.filter(item => item.status === 'DEAD_LETTER').map(operation => <div key={operation.id} className="rounded border border-amber-400 p-2 text-sm"><p>{operation.operationType} needs provider reconciliation before retry. {operation.lastError}</p><Input aria-label={`Reconciliation reason for ${operation.id}`} value={retryReasons[operation.id] || ''} onChange={event => setRetryReasons({ ...retryReasons, [operation.id]: event.target.value })} placeholder="Describe provider lookup and why replay is safe" /><Button size="sm" variant="outline" disabled={busy} onClick={() => retryMoneyOperation(operation)}>Queue reviewed retry</Button></div>)}
        <Button size="sm" variant="outline" onClick={() => loadOrder(order.id)}>Refresh provider status</Button>
      </div>}</>}
    </CardContent></Card>
    <Card><CardHeader><CardTitle>Visit duration and route-buffer suggestions</CardTitle></CardHeader><CardContent className="space-y-3">
      <p className="text-sm text-gray-600">{suggestions?.policy ?? 'Loading completed-visit evidence…'}</p>
      {suggestions && <p className="text-sm">Reviewed {suggestions.sampledOrders} recent completed orders. Suggestions are for dispatcher review only.</p>}
      {suggestions?.duration.map(row => <div key={`${row.serviceIds.join(',')}:${row.breedSize}`} className="rounded border p-3"><strong>Services {row.serviceIds.join(', ')} · size {row.breedSize}</strong><p>{row.sampleCount} completed visits · observed 80th percentile {row.observedP80Minutes} min · suggested service duration {row.suggestedDurationMinutes} min</p><details><summary>Source order IDs</summary><p className="break-all text-xs">{row.sourceOrderIds.join(', ')}</p></details></div>)}
      {suggestions && !suggestions.duration.length && <p>At least five completed, audit-verified visits with the same services are needed for a duration suggestion.</p>}
      {suggestions?.route ? <div className="rounded border p-3"><strong>Intervisit buffer</strong><p>{suggestions.route.sampleCount} position-supported pairs · observed 80th percentile gap {suggestions.route.observedP80GapMinutes} min · suggested review buffer {suggestions.route.suggestedIntervisitBufferMinutes} min</p><p className="text-sm text-gray-600">{suggestions.route.limitation}</p><details><summary>Source visit pairs</summary><ul className="text-xs">{suggestions.route.sourcePairs.map(pair => <li key={`${pair.fromId}:${pair.toId}`}>{pair.fromId} → {pair.toId}: {pair.minutes} min, {pair.distanceKm} km between reported positions</li>)}</ul></details></div> : <p>Route buffer awaits five completed visit pairs with device positions at completion and the next check-in.</p>}
    </CardContent></Card>
  </div>
}
