'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Gift, Plus, CreditCard, Search, DollarSign, CheckCircle, XCircle } from 'lucide-react'
import { format } from 'date-fns'

interface GiftCard {
  id: string
  code: string
  initialBalance: number
  currentBalance: number
  isActive: boolean
  expiresAt: string | null
  createdAt: string
  client: {
    id: string
    firstName: string
    lastName: string
    email: string
  } | null
}

export default function GiftCardsPage() {
  const [giftCards, setGiftCards] = useState<GiftCard[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Create dialog state
  const [showCreate, setShowCreate] = useState(false)
  const [createAmount, setCreateAmount] = useState('')
  const [createExpiry, setCreateExpiry] = useState('')
  const [createRecipientName, setCreateRecipientName] = useState('')
  const [createRecipientEmail, setCreateRecipientEmail] = useState('')
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState('')
  const [createdCard, setCreatedCard] = useState<GiftCard | null>(null)

  // Redeem dialog state
  const [showRedeem, setShowRedeem] = useState(false)
  const [redeemCode, setRedeemCode] = useState('')
  const [redeemAmount, setRedeemAmount] = useState('')
  const [redeemLoading, setRedeemLoading] = useState(false)
  const [redeemResult, setRedeemResult] = useState<{
    success: boolean
    amountRedeemed?: number
    remainingBalance?: number
    error?: string
  } | null>(null)

  const fetchGiftCards = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/gift-cards')
      const data = await res.json()
      setGiftCards(data.giftCards ?? [])
    } catch (err) {
      console.error('Failed to fetch gift cards:', err)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchGiftCards()
  }, [fetchGiftCards])

  const filteredCards = giftCards.filter((c) => {
    if (!searchTerm) return true
    const lower = searchTerm.toLowerCase()
    return (
      c.code.toLowerCase().includes(lower) ||
      c.client?.firstName.toLowerCase().includes(lower) ||
      c.client?.lastName.toLowerCase().includes(lower) ||
      c.client?.email.toLowerCase().includes(lower)
    )
  })

  const totalIssued = giftCards.reduce((s, c) => s + c.initialBalance, 0)
  const totalOutstanding = giftCards
    .filter((c) => c.isActive)
    .reduce((s, c) => s + c.currentBalance, 0)
  const activeCount = giftCards.filter((c) => c.isActive).length

  // ---- Create handlers ----
  const handleCreate = async () => {
    setCreateError('')
    const amount = parseFloat(createAmount)
    if (!amount || amount <= 0) {
      setCreateError('Enter a valid positive amount')
      return
    }
    setCreateLoading(true)
    try {
      const res = await fetch('/api/gift-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          expiresAt: createExpiry || undefined,
          recipientName: createRecipientName || undefined,
          recipientEmail: createRecipientEmail || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setCreateError(data.error ?? 'Failed to create gift card')
      } else {
        setCreatedCard(data.giftCard)
        fetchGiftCards()
      }
    } catch {
      setCreateError('Network error — please try again')
    }
    setCreateLoading(false)
  }

  const closeCreate = () => {
    setShowCreate(false)
    setCreateAmount('')
    setCreateExpiry('')
    setCreateRecipientName('')
    setCreateRecipientEmail('')
    setCreateError('')
    setCreatedCard(null)
  }

  // ---- Redeem handlers ----
  const handleRedeem = async () => {
    setRedeemResult(null)
    if (!redeemCode.trim()) return
    setRedeemLoading(true)
    try {
      const res = await fetch('/api/gift-cards/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: redeemCode.trim().toUpperCase(),
          amount: redeemAmount ? parseFloat(redeemAmount) : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setRedeemResult({ success: false, error: data.error ?? 'Redemption failed' })
      } else {
        setRedeemResult({
          success: true,
          amountRedeemed: data.amountRedeemed,
          remainingBalance: data.remainingBalance,
        })
        fetchGiftCards()
      }
    } catch {
      setRedeemResult({ success: false, error: 'Network error — please try again' })
    }
    setRedeemLoading(false)
  }

  const closeRedeem = () => {
    setShowRedeem(false)
    setRedeemCode('')
    setRedeemAmount('')
    setRedeemResult(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gift Cards</h1>
          <p className="text-gray-500">Issue and redeem gift cards for your clients</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowRedeem(true)}>
            <CreditCard className="h-4 w-4 mr-2" />
            Redeem Card
          </Button>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Issue Gift Card
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary-100 flex items-center justify-center">
                <Gift className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Issued</p>
                <p className="text-2xl font-bold">{giftCards.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Outstanding Balance</p>
                <p className="text-2xl font-bold">${totalOutstanding.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Active Cards</p>
                <p className="text-2xl font-bold">{activeCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Gift Cards</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by code or client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            </div>
          ) : filteredCards.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No gift cards found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Recipient / Client</TableHead>
                  <TableHead>Initial</TableHead>
                  <TableHead>Remaining</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Issued</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCards.map((card) => {
                  const used = card.initialBalance - card.currentBalance
                  const pctUsed = card.initialBalance > 0 ? (used / card.initialBalance) * 100 : 0
                  const isExpired =
                    card.expiresAt && new Date(card.expiresAt) < new Date()

                  return (
                    <TableRow key={card.id}>
                      <TableCell className="font-mono font-semibold text-primary-700">
                        {card.code}
                      </TableCell>
                      <TableCell>
                        {card.client ? (
                          <div>
                            <p className="font-medium">
                              {card.client.firstName} {card.client.lastName}
                            </p>
                            <p className="text-xs text-gray-500">{card.client.email}</p>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">No client linked</span>
                        )}
                      </TableCell>
                      <TableCell>${card.initialBalance.toFixed(2)}</TableCell>
                      <TableCell>
                        <div>
                          <span className="font-medium">${card.currentBalance.toFixed(2)}</span>
                          {pctUsed > 0 && (
                            <div className="w-24 bg-gray-200 rounded-full h-1.5 mt-1">
                              <div
                                className="bg-primary-500 h-1.5 rounded-full"
                                style={{ width: `${Math.min(pctUsed, 100)}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {card.expiresAt ? (
                          <span className={isExpired ? 'text-red-600' : 'text-gray-700'}>
                            {format(new Date(card.expiresAt), 'MMM d, yyyy')}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">No expiry</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {card.isActive && !isExpired ? (
                          <Badge className="bg-green-100 text-green-700">Active</Badge>
                        ) : isExpired ? (
                          <Badge className="bg-orange-100 text-orange-700">Expired</Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-600">Redeemed</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {format(new Date(card.createdAt), 'MMM d, yyyy')}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Gift Card Dialog */}
      <Dialog open={showCreate} onOpenChange={(open) => { if (!open) closeCreate() }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary-600" />
              Issue New Gift Card
            </DialogTitle>
          </DialogHeader>

          {createdCard ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center space-y-2">
                <CheckCircle className="h-10 w-10 text-green-600 mx-auto" />
                <p className="font-semibold text-green-800">Gift Card Issued!</p>
                <p className="text-3xl font-mono font-bold text-primary-700 tracking-wider">
                  {createdCard.code}
                </p>
                <p className="text-gray-600">Balance: ${createdCard.currentBalance.toFixed(2)}</p>
                {createdCard.expiresAt && (
                  <p className="text-sm text-gray-500">
                    Expires: {format(new Date(createdCard.expiresAt), 'MMMM d, yyyy')}
                  </p>
                )}
              </div>
              <DialogFooter>
                <Button onClick={closeCreate}>Done</Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount ($) <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="e.g. 50.00"
                  value={createAmount}
                  onChange={(e) => setCreateAmount(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recipient Name
                </label>
                <Input
                  placeholder="Jane Smith"
                  value={createRecipientName}
                  onChange={(e) => setCreateRecipientName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recipient Email
                </label>
                <Input
                  type="email"
                  placeholder="jane@example.com"
                  value={createRecipientEmail}
                  onChange={(e) => setCreateRecipientEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Date (optional)
                </label>
                <Input
                  type="date"
                  value={createExpiry}
                  onChange={(e) => setCreateExpiry(e.target.value)}
                />
              </div>

              {createError && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <XCircle className="h-4 w-4" /> {createError}
                </p>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={closeCreate} disabled={createLoading}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={createLoading}>
                  {createLoading ? 'Issuing...' : 'Issue Gift Card'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Redeem Gift Card Dialog */}
      <Dialog open={showRedeem} onOpenChange={(open) => { if (!open) closeRedeem() }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary-600" />
              Redeem Gift Card
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gift Card Code <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="PGRO-XXXX-XXXX"
                value={redeemCode}
                onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                className="font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount to Redeem ($) — leave blank to redeem full balance
              </label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="e.g. 25.00"
                value={redeemAmount}
                onChange={(e) => setRedeemAmount(e.target.value)}
              />
            </div>

            {redeemResult && (
              <div
                className={`p-4 rounded-lg border ${
                  redeemResult.success
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                {redeemResult.success ? (
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-green-800">Redemption Successful</p>
                      <p className="text-sm text-green-700">
                        Redeemed: ${redeemResult.amountRedeemed?.toFixed(2)}
                      </p>
                      <p className="text-sm text-green-700">
                        Remaining balance: ${redeemResult.remainingBalance?.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-red-800">Redemption Failed</p>
                      <p className="text-sm text-red-700">{redeemResult.error}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={closeRedeem} disabled={redeemLoading}>
                {redeemResult?.success ? 'Close' : 'Cancel'}
              </Button>
              {!redeemResult?.success && (
                <Button onClick={handleRedeem} disabled={redeemLoading || !redeemCode.trim()}>
                  {redeemLoading ? 'Processing...' : 'Redeem'}
                </Button>
              )}
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
