'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface UsageRow {
  id: string
  feature: string
  model: string | null
  durationMs: number | null
  costUsd: number | null
  error: string | null
  createdAt: string
}

interface ByFeature {
  feature: string
  _count: { _all: number }
  _sum: { costUsd: number | null; tokensIn: number | null; tokensOut: number | null }
}

export default function AIUsagePage() {
  const [data, setData] = useState<UsageRow[]>([])
  const [byFeature, setByFeature] = useState<ByFeature[]>([])
  const [totalCost, setTotalCost] = useState(0)
  const [days, setDays] = useState(30)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/ai-usage?days=${days}&page=${page}&pageSize=50`)
      .then((r) => r.json())
      .then((res) => {
        setData(res.data || [])
        setByFeature(res.byFeature || [])
        setTotalCost(res.totalCostUsd || 0)
        setTotalPages(res.totalPages || 1)
      })
      .finally(() => setLoading(false))
  }, [days, page])

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">AI Usage Analytics</h1>
        <div className="flex gap-2">
          {[7, 30, 90].map((d) => (
            <Button key={d} variant={days === d ? 'default' : 'outline'} onClick={() => setDays(d)}>
              {d}d
            </Button>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Total spend (last {days} days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">${totalCost.toFixed(4)}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>By feature</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead className="text-left text-gray-500">
              <tr>
                <th>Feature</th>
                <th>Calls</th>
                <th>Tokens in</th>
                <th>Tokens out</th>
                <th>Cost</th>
              </tr>
            </thead>
            <tbody>
              {byFeature.map((r) => (
                <tr key={r.feature} className="border-t">
                  <td className="py-2">{r.feature}</td>
                  <td>{r._count._all}</td>
                  <td>{r._sum.tokensIn ?? 0}</td>
                  <td>{r._sum.tokensOut ?? 0}</td>
                  <td>${(r._sum.costUsd ?? 0).toFixed(4)}</td>
                </tr>
              ))}
              {byFeature.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-gray-500">
                    No usage in this window.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent calls</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead className="text-left text-gray-500">
              <tr>
                <th>When</th>
                <th>Feature</th>
                <th>Model</th>
                <th>Duration</th>
                <th>Cost</th>
                <th>Error</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="py-2">{new Date(row.createdAt).toLocaleString()}</td>
                  <td>{row.feature}</td>
                  <td>{row.model || '-'}</td>
                  <td>{row.durationMs ? `${row.durationMs}ms` : '-'}</td>
                  <td>{row.costUsd != null ? `$${row.costUsd.toFixed(4)}` : '-'}</td>
                  <td className="text-red-600">{row.error || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex items-center gap-2 pt-3">
            <Button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} variant="outline">
              Prev
            </Button>
            <div>
              Page {page} / {totalPages}
            </div>
            <Button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} variant="outline">
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
