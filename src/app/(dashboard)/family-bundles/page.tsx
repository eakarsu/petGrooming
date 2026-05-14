'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import toast from 'react-hot-toast'

interface FamilyGroup {
  id: string
  name: string
  notes?: string
  members: { id: string; clientId: string; petId?: string }[]
  bundles: Array<{ id: string; totalPrice: number; discountPct: number; reasoning?: string; createdAt: string }>
}

export default function FamilyBundlesPage() {
  const [families, setFamilies] = useState<FamilyGroup[]>([])
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [primaryClientId, setPrimaryClientId] = useState('')
  const [generatingFor, setGeneratingFor] = useState<string | null>(null)

  async function loadFamilies() {
    setLoading(true)
    const res = await fetch('/api/family-groups')
    const data = await res.json()
    setFamilies(data.data || [])
    setLoading(false)
  }

  useEffect(() => {
    loadFamilies()
  }, [])

  async function createFamily() {
    if (!name || !primaryClientId) return toast.error('Name and primary client required')
    const res = await fetch('/api/family-groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, primaryClientId }),
    })
    if (res.ok) {
      toast.success('Family group created')
      setName('')
      setPrimaryClientId('')
      loadFamilies()
    } else {
      const err = await res.json()
      toast.error(err.error || 'Failed')
    }
  }

  async function generateBundle(id: string) {
    setGeneratingFor(id)
    const res = await fetch('/api/ai/family-bundle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ familyGroupId: id }),
    })
    setGeneratingFor(null)
    if (res.ok) {
      toast.success('Bundle generated')
      loadFamilies()
    } else {
      const err = await res.json()
      toast.error(err.error || 'Generation failed')
    }
  }

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Family Bundle Pricing</h1>

      <Card>
        <CardHeader>
          <CardTitle>Create new family group</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Input placeholder="Family name (e.g. The Smiths)" value={name} onChange={(e) => setName(e.target.value)} />
          <Input
            placeholder="Primary client ID"
            value={primaryClientId}
            onChange={(e) => setPrimaryClientId(e.target.value)}
          />
          <Button onClick={createFamily}>Create</Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading && <div>Loading…</div>}
        {families.map((f) => (
          <Card key={f.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{f.name}</span>
                <Button onClick={() => generateBundle(f.id)} disabled={generatingFor === f.id}>
                  {generatingFor === f.id ? 'Generating…' : 'Generate AI bundle'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm text-gray-500">{f.members.length} members</div>
              {f.bundles.length > 0 && (
                <div className="space-y-1">
                  <div className="text-sm font-semibold">Latest bundle</div>
                  <div>Total: ${f.bundles[0].totalPrice.toFixed(2)} ({f.bundles[0].discountPct}% off)</div>
                  {f.bundles[0].reasoning && (
                    <div className="text-sm text-gray-600">{f.bundles[0].reasoning}</div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
