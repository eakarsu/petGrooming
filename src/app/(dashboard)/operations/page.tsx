'use client'

import { FormEvent, useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import toast from 'react-hot-toast'

type Quote = { id: string; status: string; version: number; totalCents: number; client: { firstName: string; lastName: string }; pet: { name: string }; order?: { id: string } | null }
type Order = { id: string; version: number; bookingStatus: string; jobStatus: string; scheduledStart: string; scheduledEnd: string; quotedTotalCents: number; invoice?: { id: string; status: string; totalCents: number } | null }

const initial = { clientId: '', petId: '', technicianId: '', serviceIds: '', requestedStart: '', requestedEnd: '', addressLine: '', postalCode: '', latitude: '', longitude: '' }

export default function OperationsPage() {
  const [form, setForm] = useState(initial)
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [orderId, setOrderId] = useState('')
  const [order, setOrder] = useState<Order | null>(null)
  const [busy, setBusy] = useState(false)

  async function loadQuotes() {
    const response = await fetch('/api/workflow/quotes')
    if (response.ok) setQuotes(await response.json())
  }
  useEffect(() => { loadQuotes() }, [])

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
    const response = await fetch(`/api/workflow/orders/${order.id}/actions`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: actionName, expectedVersion: order.version, ...details }) })
    const result = await response.json()
    if (!response.ok) return toast.error(result.message || result.error)
    toast.success(`${actionName.replaceAll('_', ' ')} recorded`); await loadOrder(order.id)
  }

  return <div className="space-y-6">
    <div><h1 className="text-3xl font-bold">Mobile Grooming Operations</h1><p className="text-gray-500">Governed quote-to-payment workflow. Provider work is processed by the integration worker.</p></div>
    <Card><CardHeader><CardTitle>Request route- and tax-validated quote</CardTitle></CardHeader><CardContent>
      <form onSubmit={createQuote} className="grid gap-3 md:grid-cols-2">
        {Object.keys(form).map((field) => <div key={field}><Label htmlFor={field}>{field}</Label><Input id={field} type={field.includes('Start') || field.includes('End') ? 'datetime-local' : 'text'} required value={form[field as keyof typeof form]} onChange={(event) => setForm({ ...form, [field]: event.target.value })} /></div>)}
        <Button className="md:col-span-2" loading={busy}>Request quote</Button>
      </form>
    </CardContent></Card>
    <Card><CardHeader><CardTitle>Recent quotes</CardTitle></CardHeader><CardContent className="space-y-2">
      {quotes.map((quote) => <div key={quote.id} className="flex flex-wrap items-center justify-between gap-2 rounded border p-3"><span>{quote.pet.name} · {quote.client.firstName} {quote.client.lastName} · {quote.status} · ${(quote.totalCents / 100).toFixed(2)}</span>{quote.status === 'OFFERED' && <Button size="sm" onClick={() => accept(quote)}>Accept & reserve</Button>}{quote.order && <Button size="sm" variant="outline" onClick={() => { setOrderId(quote.order!.id); loadOrder(quote.order!.id) }}>Open order</Button>}</div>)}
    </CardContent></Card>
    <Card><CardHeader><CardTitle>Operate order</CardTitle></CardHeader><CardContent className="space-y-4">
      <div className="flex gap-2"><Input value={orderId} onChange={(event) => setOrderId(event.target.value)} placeholder="Order ID" /><Button onClick={() => loadOrder()}>Load</Button></div>
      {order && <><p className="font-medium">{order.id} · booking {order.bookingStatus} · job {order.jobStatus} · version {order.version}</p><div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => action('DISPATCH')}>Dispatch</Button><Button size="sm" onClick={() => action('CONFIRM')}>Confirm</Button>
        <Button size="sm" onClick={() => action('JOB_STATUS', { status: 'CHECKED_IN' })}>Check in</Button><Button size="sm" onClick={() => action('JOB_STATUS', { status: 'IN_PROGRESS' })}>Start</Button><Button size="sm" onClick={() => action('JOB_STATUS', { status: 'COMPLETED' })}>Complete</Button>
        <Button size="sm" variant="outline" onClick={() => action('INVOICE')}>Issue invoice</Button><Button size="sm" variant="outline" onClick={() => action('VERIFY_AUDIT')}>Verify audit</Button>
      </div>{order.invoice && <p>Invoice {order.invoice.status}: ${(order.invoice.totalCents / 100).toFixed(2)}</p>}</>}
    </CardContent></Card>
  </div>
}
