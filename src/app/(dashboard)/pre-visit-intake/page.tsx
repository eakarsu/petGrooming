'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import toast from 'react-hot-toast'

interface Intake {
  id: string
  clientPhone: string
  rawSymptoms?: string
  urgencyLevel?: string
  flaggedForVet: boolean
  aiTriageResult?: {
    triageSummary?: string
    recommendedActions?: string[]
    vetNotes?: string
    visualFindings?: string[]
  }
  createdAt: string
}

const URGENCY_COLORS: Record<string, string> = {
  ROUTINE: 'bg-green-100 text-green-700',
  SOON: 'bg-yellow-100 text-yellow-700',
  URGENT: 'bg-orange-100 text-orange-700',
  EMERGENCY: 'bg-red-100 text-red-700',
}

export default function PreVisitIntakePage() {
  const [intakes, setIntakes] = useState<Intake[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [phone, setPhone] = useState('')
  const [symptoms, setSymptoms] = useState('')
  const [urgencyFilter, setUrgencyFilter] = useState('')

  async function load() {
    setLoading(true)
    const url = `/api/ai/pre-visit-intake${urgencyFilter ? `?urgency=${urgencyFilter}` : ''}`
    const res = await fetch(url)
    const data = await res.json()
    setIntakes(data.data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [urgencyFilter])

  async function submit() {
    if (!phone) return toast.error('Phone is required')
    setSubmitting(true)
    try {
      const res = await fetch('/api/ai/pre-visit-intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientPhone: phone, symptoms }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'failed')
      toast.success(`Triaged: ${data.urgencyLevel}`)
      setPhone('')
      setSymptoms('')
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Pre-visit AI Intake</h1>

      <Card>
        <CardHeader>
          <CardTitle>New intake</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Input placeholder="Client phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Textarea
            placeholder="Owner's reported symptoms / concerns"
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
          />
          <Button onClick={submit} disabled={submitting}>
            {submitting ? 'Triaging…' : 'Submit & triage'}
          </Button>
        </CardContent>
      </Card>

      <div className="flex gap-2 items-center">
        <span>Filter:</span>
        {['', 'ROUTINE', 'SOON', 'URGENT', 'EMERGENCY'].map((u) => (
          <Button
            key={u || 'all'}
            variant={urgencyFilter === u ? 'default' : 'outline'}
            size="sm"
            onClick={() => setUrgencyFilter(u)}
          >
            {u || 'All'}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading && <div>Loading…</div>}
        {intakes.map((i) => (
          <Card key={i.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{i.clientPhone}</span>
                <Badge className={URGENCY_COLORS[i.urgencyLevel || ''] || 'bg-gray-100'}>
                  {i.urgencyLevel || 'UNKNOWN'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="text-gray-500">{new Date(i.createdAt).toLocaleString()}</div>
              {i.aiTriageResult?.triageSummary && (
                <div className="font-medium">{i.aiTriageResult.triageSummary}</div>
              )}
              {i.rawSymptoms && (
                <div>
                  <span className="text-gray-500">Symptoms:</span> {i.rawSymptoms}
                </div>
              )}
              {i.aiTriageResult?.recommendedActions && (
                <ul className="list-disc pl-5">
                  {i.aiTriageResult.recommendedActions.map((a, idx) => (
                    <li key={idx}>{a}</li>
                  ))}
                </ul>
              )}
              {i.flaggedForVet && <Badge className="bg-red-100 text-red-700">Flagged for vet</Badge>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
