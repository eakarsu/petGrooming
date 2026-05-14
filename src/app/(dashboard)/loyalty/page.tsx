'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Gift, Trophy, Star, Search, Package, CreditCard, TrendingUp, User, PawPrint, Calendar, X, Clock, DollarSign, CheckCircle, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

interface TierInfo {
  name: string
  minPoints: number
  maxPoints: number
  discount: number
  color: string
}

interface ClientWithTier {
  id: string
  firstName: string
  lastName: string
  loyaltyPoints: number
  tier: TierInfo
}

interface PackageInfo {
  id: string
  name: string
  description: string | null
  price: number
  regularPrice: number
  savings: number
  savingsPercent: number
  totalDuration: number
  services: { service: { id: string; name: string; basePrice: number; category: string } }[]
}

export default function LoyaltyPage() {
  const router = useRouter()
  const [clients, setClients] = useState<ClientWithTier[]>([])
  const [packages, setPackages] = useState<PackageInfo[]>([])
  const [tiers, setTiers] = useState<TierInfo[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTierFilter, setSelectedTierFilter] = useState<string | null>(null)
  const [selectedClient, setSelectedClient] = useState<ClientWithTier | null>(null)
  const [selectedPackage, setSelectedPackage] = useState<PackageInfo | null>(null)

  // Redeem points state
  const [showRedeemDialog, setShowRedeemDialog] = useState(false)
  const [redeemClient, setRedeemClient] = useState<ClientWithTier | null>(null)
  const [redeemPoints, setRedeemPoints] = useState('')
  const [redeemLoading, setRedeemLoading] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [tiersRes, packagesRes] = await Promise.all([
        fetch('/api/loyalty/tiers'),
        fetch('/api/packages'),
      ])
      const tiersData = await tiersRes.json()
      const packagesData = await packagesRes.json()
      
      setClients(tiersData.clients)
      setTiers(tiersData.tiers)
      setStats(tiersData.stats)
      setPackages(packagesData)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    }
    setLoading(false)
  }

  const handleRedeemPoints = async () => {
    if (!redeemClient) return
    const pts = parseInt(redeemPoints, 10)
    if (!pts || pts <= 0) {
      toast.error('Enter a valid number of points to redeem')
      return
    }
    if (pts > redeemClient.loyaltyPoints) {
      toast.error('Not enough points')
      return
    }
    setRedeemLoading(true)
    try {
      const res = await fetch('/api/loyalty/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: redeemClient.id, points: pts }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Redemption failed')
      } else {
        toast.success(data.message)
        setShowRedeemDialog(false)
        setRedeemPoints('')
        setRedeemClient(null)
        setSelectedClient(null)
        fetchData()
      }
    } catch {
      toast.error('Network error — please try again')
    }
    setRedeemLoading(false)
  }

  const filteredClients = clients.filter(client => {
    // Filter by tier if selected
    if (selectedTierFilter && client.tier.name !== selectedTierFilter) return false
    // Filter by search term
    if (!searchTerm) return true
    const searchLower = searchTerm.toLowerCase()
    return (
      client.firstName.toLowerCase().includes(searchLower) ||
      client.lastName.toLowerCase().includes(searchLower)
    )
  })

  const getTierIcon = (tierName: string) => {
    switch (tierName) {
      case 'Gold': return <Trophy className="h-5 w-5" style={{ color: '#FFD700' }} />
      case 'Silver': return <Star className="h-5 w-5" style={{ color: '#C0C0C0' }} />
      default: return <Star className="h-5 w-5" style={{ color: '#CD7F32' }} />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Loyalty Program</h1>
          <p className="text-gray-500">Manage customer loyalty and service packages</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <Tabs defaultValue="tiers" className="space-y-6">
          <TabsList>
            <TabsTrigger value="tiers" className="gap-2">
              <Trophy className="h-4 w-4" />
              Loyalty Tiers
            </TabsTrigger>
            <TabsTrigger value="packages" className="gap-2">
              <Package className="h-4 w-4" />
              Service Packages
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tiers" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card
                className={`cursor-pointer transition-all hover:shadow-md ${selectedTierFilter === null ? 'ring-2 ring-primary-500' : ''}`}
                onClick={() => setSelectedTierFilter(null)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-primary-100 flex items-center justify-center">
                      <Gift className="h-6 w-6 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Members</p>
                      <p className="text-2xl font-bold">{stats?.totalClients || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              {stats?.tierCounts?.map((tc: any) => (
                <Card
                  key={tc.tier}
                  className={`cursor-pointer transition-all hover:shadow-md ${selectedTierFilter === tc.tier ? 'ring-2 ring-primary-500' : ''}`}
                  onClick={() => setSelectedTierFilter(selectedTierFilter === tc.tier ? null : tc.tier)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: tc.color + '20' }}>
                        {getTierIcon(tc.tier)}
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">{tc.tier} Members</p>
                        <p className="text-2xl font-bold">{tc.count}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Tier Explanation */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Tier Benefits</CardTitle>
                  {selectedTierFilter && (
                    <Button variant="ghost" size="sm" onClick={() => setSelectedTierFilter(null)}>
                      <X className="h-4 w-4 mr-1" />
                      Clear Filter
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {tiers.map(tier => (
                    <div
                      key={tier.name}
                      className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${selectedTierFilter === tier.name ? 'ring-2 ring-primary-500' : ''}`}
                      style={{ borderColor: tier.color }}
                      onClick={() => setSelectedTierFilter(selectedTierFilter === tier.name ? null : tier.name)}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {getTierIcon(tier.name)}
                        <h3 className="font-semibold">{tier.name}</h3>
                      </div>
                      <p className="text-sm text-gray-500 mb-2">
                        {tier.minPoints} - {tier.maxPoints === Infinity ? '+ ' : tier.maxPoints} points
                      </p>
                      <p className="text-sm">
                        {tier.discount > 0 ? (
                          <span className="text-green-600 font-medium">{tier.discount}% discount on all services</span>
                        ) : (
                          <span className="text-gray-400">No discount yet</span>
                        )}
                      </p>
                      <p className="text-xs text-primary-600 mt-2">Click to filter members</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Client List */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    Members
                    {selectedTierFilter && (
                      <Badge className="ml-2" variant="secondary">{selectedTierFilter} Only</Badge>
                    )}
                  </CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search clients..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {filteredClients.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No members found</p>
                    </div>
                  ) : (
                    filteredClients.slice(0, 20).map(client => {
                      const nextTier = tiers.find(t => t.minPoints > client.loyaltyPoints)
                      const pointsToNext = nextTier ? nextTier.minPoints - client.loyaltyPoints : 0

                      return (
                        <div
                          key={client.id}
                          className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => setSelectedClient(client)}
                        >
                          <div className="flex items-center gap-3">
                            {getTierIcon(client.tier.name)}
                            <div>
                              <p className="font-medium">{client.firstName} {client.lastName}</p>
                              <p className="text-sm text-gray-500">{client.loyaltyPoints} points</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge style={{ backgroundColor: client.tier.color + '20', color: client.tier.color === '#FFD700' ? '#B8860B' : client.tier.color }}>
                              {client.tier.name}
                            </Badge>
                            {nextTier && (
                              <p className="text-xs text-gray-500 mt-1">
                                {pointsToNext} pts to {nextTier.name}
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
                {filteredClients.length > 20 && (
                  <p className="text-center text-sm text-gray-500 mt-4">
                    Showing 20 of {filteredClients.length} members
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="packages" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {packages.map(pkg => (
                <Card
                  key={pkg.id}
                  className="overflow-hidden cursor-pointer transition-all hover:shadow-lg"
                  onClick={() => setSelectedPackage(pkg)}
                >
                  <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-4 text-white">
                    <h3 className="text-lg font-semibold">{pkg.name}</h3>
                    <p className="text-primary-100 text-sm">{pkg.description}</p>
                  </div>
                  <CardContent className="p-4 space-y-4">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-3xl font-bold">${pkg.price}</span>
                        <span className="text-gray-400 line-through ml-2">${pkg.regularPrice.toFixed(2)}</span>
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        Save {pkg.savingsPercent}%
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">Includes:</p>
                      <ul className="space-y-1">
                        {pkg.services.slice(0, 3).map((s, i) => (
                          <li key={i} className="text-sm text-gray-600 flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />
                            {s.service.name}
                          </li>
                        ))}
                        {pkg.services.length > 3 && (
                          <li className="text-sm text-primary-600">
                            +{pkg.services.length - 3} more services
                          </li>
                        )}
                      </ul>
                    </div>
                    <div className="pt-2 border-t flex items-center justify-between text-sm text-gray-500">
                      <span>Duration: ~{pkg.totalDuration} mins</span>
                      <span className="text-green-600 font-medium">Save ${pkg.savings.toFixed(2)}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {packages.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No packages available</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Client Detail Dialog */}
      <Dialog open={!!selectedClient} onOpenChange={() => setSelectedClient(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedClient && getTierIcon(selectedClient.tier.name)}
              {selectedClient?.firstName} {selectedClient?.lastName}
            </DialogTitle>
          </DialogHeader>
          {selectedClient && (
            <div className="space-y-4">
              {/* Points Summary */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-500">Current Points</span>
                  <span className="text-2xl font-bold">{selectedClient.loyaltyPoints}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Current Tier</span>
                  <Badge style={{ backgroundColor: selectedClient.tier.color + '20', color: selectedClient.tier.color === '#FFD700' ? '#B8860B' : selectedClient.tier.color }}>
                    {selectedClient.tier.name}
                  </Badge>
                </div>
              </div>

              {/* Tier Benefits */}
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Tier Benefits</h4>
                <p className="text-sm text-gray-600">
                  {selectedClient.tier.discount > 0 ? (
                    <span className="text-green-600 font-medium">{selectedClient.tier.discount}% discount on all services</span>
                  ) : (
                    <span className="text-gray-400">No discount at this tier</span>
                  )}
                </p>
              </div>

              {/* Progress to Next Tier */}
              {(() => {
                const nextTier = tiers.find(t => t.minPoints > selectedClient.loyaltyPoints)
                if (nextTier) {
                  const pointsToNext = nextTier.minPoints - selectedClient.loyaltyPoints
                  const prevTierPoints = selectedClient.tier.minPoints
                  const progress = ((selectedClient.loyaltyPoints - prevTierPoints) / (nextTier.minPoints - prevTierPoints)) * 100
                  return (
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Progress to {nextTier.name}</h4>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                        <div
                          className="bg-primary-600 h-2.5 rounded-full transition-all"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                      <p className="text-sm text-gray-500">
                        {pointsToNext} more points needed
                      </p>
                    </div>
                  )
                }
                return (
                  <div className="p-4 border rounded-lg bg-yellow-50">
                    <h4 className="font-medium mb-1 text-yellow-800">Top Tier Achieved!</h4>
                    <p className="text-sm text-yellow-700">This member has reached the highest loyalty tier.</p>
                  </div>
                )
              })()}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedClient(null)}>
              Close
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                if (selectedClient) {
                  setRedeemClient(selectedClient)
                  setShowRedeemDialog(true)
                }
              }}
              disabled={!selectedClient || selectedClient.loyaltyPoints <= 0}
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Redeem Points
            </Button>
            <Button onClick={() => {
              if (selectedClient) {
                router.push(`/clients/${selectedClient.id}`)
              }
            }}>
              <User className="h-4 w-4 mr-2" />
              View Full Profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Redeem Points Dialog */}
      <Dialog open={showRedeemDialog} onOpenChange={(open) => { if (!open) { setShowRedeemDialog(false); setRedeemPoints('') } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary-600" />
              Redeem Points
            </DialogTitle>
          </DialogHeader>
          {redeemClient && (
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Client</p>
                <p className="font-semibold">{redeemClient.firstName} {redeemClient.lastName}</p>
                <p className="text-sm text-gray-500 mt-1">Available Points</p>
                <p className="text-2xl font-bold text-primary-700">{redeemClient.loyaltyPoints}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Points to Redeem
                </label>
                <Input
                  type="number"
                  min="1"
                  max={redeemClient.loyaltyPoints}
                  placeholder={`1 – ${redeemClient.loyaltyPoints}`}
                  value={redeemPoints}
                  onChange={(e) => setRedeemPoints(e.target.value)}
                />
                {redeemPoints && parseInt(redeemPoints) > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Value: ${(parseInt(redeemPoints) * 0.01).toFixed(2)} (at $0.01/pt)
                  </p>
                )}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => { setShowRedeemDialog(false); setRedeemPoints('') }}
                  disabled={redeemLoading}
                >
                  Cancel
                </Button>
                <Button onClick={handleRedeemPoints} disabled={redeemLoading || !redeemPoints}>
                  {redeemLoading ? 'Processing...' : 'Confirm Redeem'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Package Detail Dialog */}
      <Dialog open={!!selectedPackage} onOpenChange={() => setSelectedPackage(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedPackage?.name}</DialogTitle>
          </DialogHeader>
          {selectedPackage && (
            <div className="space-y-4">
              {/* Description */}
              {selectedPackage.description && (
                <p className="text-gray-600">{selectedPackage.description}</p>
              )}

              {/* Pricing */}
              <div className="p-4 bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-3xl font-bold text-primary-700">${selectedPackage.price}</span>
                    <span className="text-gray-400 line-through ml-2">${selectedPackage.regularPrice.toFixed(2)}</span>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-green-500 text-white">
                      Save {selectedPackage.savingsPercent}%
                    </Badge>
                    <p className="text-sm text-green-600 font-medium mt-1">
                      You save ${selectedPackage.savings.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Services Included */}
              <div>
                <h4 className="font-medium mb-3">Services Included ({selectedPackage.services.length})</h4>
                <div className="space-y-2">
                  {selectedPackage.services.map((s, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-primary-500" />
                        <span className="text-sm">{s.service.name}</span>
                      </div>
                      <span className="text-sm text-gray-500">${s.service.basePrice.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="h-4 w-4" />
                <span>Total Duration: approximately {selectedPackage.totalDuration} minutes</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedPackage(null)}>
              Close
            </Button>
            <Button onClick={() => {
              router.push('/appointments/new')
              setSelectedPackage(null)
            }}>
              <Calendar className="h-4 w-4 mr-2" />
              Book This Package
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
