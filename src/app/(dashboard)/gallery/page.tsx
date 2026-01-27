'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Camera, Search, ArrowRight, Calendar, User, X, PawPrint, ExternalLink, ImageIcon, Grid, Columns, Loader2 } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { format } from 'date-fns'

// Image component with loading state and fallback
function PetImage({ src, alt, className, petId }: { src: string; alt: string; className?: string; petId?: string }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [imgSrc, setImgSrc] = useState(src)

  // Generate a consistent fallback based on petId
  const fallbackSrc = `https://picsum.photos/seed/${petId || 'default'}/400/400`

  return (
    <div className={`relative ${className || ''}`}>
      {loading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      )}
      <img
        src={imgSrc}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity ${loading ? 'opacity-0' : 'opacity-100'}`}
        onLoad={() => setLoading(false)}
        onError={() => {
          if (imgSrc !== fallbackSrc) {
            setImgSrc(fallbackSrc)
            setLoading(true)
          } else {
            setError(true)
            setLoading(false)
          }
        }}
      />
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400">
          <Camera className="h-8 w-8" />
        </div>
      )}
    </div>
  )
}

interface Photo {
  id: string
  url: string
  caption: string | null
  isBefore: boolean
  isAfter: boolean
  createdAt: string
  pet: {
    id: string
    name: string
    client: { firstName: string; lastName: string }
  }
  session: {
    id: string
    groomer: { id: string; name: string }
    checkInTime: string | null
    checkOutTime: string | null
  } | null
}

interface PhotoGroup {
  sessionId: string | null
  before: Photo | null
  after: Photo | null
  photos: Photo[]
}

export default function GalleryPage() {
  const router = useRouter()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [groupedPhotos, setGroupedPhotos] = useState<PhotoGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedComparison, setSelectedComparison] = useState<PhotoGroup | null>(null)
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)

  useEffect(() => {
    fetchPhotos()
  }, [])

  const fetchPhotos = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/photos')
      const data = await res.json()
      setPhotos(data.photos)
      setGroupedPhotos(data.groupedBySession)
    } catch (error) {
      console.error('Failed to fetch photos:', error)
    }
    setLoading(false)
  }

  const filteredGroups = groupedPhotos.filter(group => {
    if (!searchTerm) return true
    const searchLower = searchTerm.toLowerCase()
    return (
      group.photos.some(p => 
        p.pet.name.toLowerCase().includes(searchLower) ||
        `${p.pet.client.firstName} ${p.pet.client.lastName}`.toLowerCase().includes(searchLower) ||
        p.session?.groomer.name.toLowerCase().includes(searchLower)
      )
    )
  })

  const pairsWithBothPhotos = filteredGroups.filter(g => g.before && g.after)

  const filteredPhotos = photos.filter(photo => {
    if (!searchTerm) return true
    const searchLower = searchTerm.toLowerCase()
    return (
      photo.pet.name.toLowerCase().includes(searchLower) ||
      `${photo.pet.client.firstName} ${photo.pet.client.lastName}`.toLowerCase().includes(searchLower) ||
      photo.session?.groomer.name.toLowerCase().includes(searchLower)
    )
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Photo Gallery</h1>
          <p className="text-gray-500">Before and after grooming transformations</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search by pet name, client, or groomer..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary-100 flex items-center justify-center">
                <Camera className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Photos</p>
                <p className="text-2xl font-bold">{photos.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                <ArrowRight className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Before/After Pairs</p>
                <p className="text-2xl font-bold">{pairsWithBothPhotos.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Sessions Captured</p>
                <p className="text-2xl font-bold">{groupedPhotos.filter(g => g.sessionId).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <Tabs defaultValue="pairs" className="space-y-6">
          <TabsList>
            <TabsTrigger value="pairs" className="gap-2">
              <Columns className="h-4 w-4" />
              Before & After ({pairsWithBothPhotos.length})
            </TabsTrigger>
            <TabsTrigger value="all" className="gap-2">
              <Grid className="h-4 w-4" />
              All Photos ({filteredPhotos.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pairs">
            {/* Before & After Pairs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pairsWithBothPhotos.map((group, index) => (
                <Card key={group.sessionId || index} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedComparison(group)}>
                  <div className="grid grid-cols-2 gap-0.5 bg-gray-200">
                    <div className="relative aspect-square bg-gray-100">
                      {group.before?.url ? (
                        <PetImage
                          src={group.before.url}
                          alt={`${group.before.pet.name} before grooming`}
                          className="absolute inset-0"
                          petId={`${group.before.pet.id}-before`}
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                          <Camera className="h-8 w-8" />
                        </div>
                      )}
                      <Badge className="absolute top-2 left-2 bg-gray-800/80 z-10">Before</Badge>
                    </div>
                    <div className="relative aspect-square bg-gray-100">
                      {group.after?.url ? (
                        <PetImage
                          src={group.after.url}
                          alt={`${group.after.pet.name} after grooming`}
                          className="absolute inset-0"
                          petId={`${group.after.pet.id}-after`}
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                          <Camera className="h-8 w-8" />
                        </div>
                      )}
                      <Badge className="absolute top-2 left-2 bg-primary-600 z-10">After</Badge>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{group.before?.pet.name || group.after?.pet.name}</h3>
                        <Badge variant="outline">
                          {group.before?.pet.client.firstName || group.after?.pet.client.firstName} {group.before?.pet.client.lastName || group.after?.pet.client.lastName}
                        </Badge>
                      </div>
                      {(group.before?.session || group.after?.session) && (
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {group.before?.session?.groomer.name || group.after?.session?.groomer.name}
                          </span>
                          {(group.before?.session?.checkInTime || group.after?.session?.checkInTime) && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(group.before?.session?.checkInTime || group.after?.session?.checkInTime || ''), 'MMM d, yyyy')}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {pairsWithBothPhotos.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No photo pairs found</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="all">
            {/* All Photos Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredPhotos.map((photo) => (
                <Card
                  key={photo.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setSelectedPhoto(photo)}
                >
                  <div className="relative aspect-square bg-gray-100">
                    {photo.url ? (
                      <PetImage
                        src={photo.url}
                        alt={`${photo.pet.name} grooming photo`}
                        className="absolute inset-0"
                        petId={photo.id}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                        <Camera className="h-8 w-8" />
                      </div>
                    )}
                    {photo.isBefore && <Badge className="absolute top-2 left-2 bg-gray-800/80 z-10">Before</Badge>}
                    {photo.isAfter && <Badge className="absolute top-2 left-2 bg-primary-600 z-10">After</Badge>}
                  </div>
                  <CardContent className="p-3">
                    <p className="font-medium text-sm truncate">{photo.pet.name}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {photo.pet.client.firstName} {photo.pet.client.lastName}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredPhotos.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No photos found</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Comparison Dialog */}
      <Dialog open={!!selectedComparison} onOpenChange={() => setSelectedComparison(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedComparison?.before?.pet.name || selectedComparison?.after?.pet.name} - Transformation</span>
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Badge className="bg-gray-800">Before</Badge>
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative">
                {selectedComparison?.before?.url ? (
                  <PetImage
                    src={selectedComparison.before.url}
                    alt={`${selectedComparison.before.pet.name} before grooming`}
                    className="absolute inset-0"
                    petId={`${selectedComparison.before.pet.id}-before-dialog`}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Camera className="h-16 w-16 text-gray-300" />
                  </div>
                )}
              </div>
              {selectedComparison?.before?.caption && (
                <p className="text-sm text-gray-500">{selectedComparison.before.caption}</p>
              )}
            </div>
            <div className="space-y-2">
              <Badge className="bg-primary-600">After</Badge>
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative">
                {selectedComparison?.after?.url ? (
                  <PetImage
                    src={selectedComparison.after.url}
                    alt={`${selectedComparison.after.pet.name} after grooming`}
                    className="absolute inset-0"
                    petId={`${selectedComparison.after.pet.id}-after-dialog`}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Camera className="h-16 w-16 text-gray-300" />
                  </div>
                )}
              </div>
              {selectedComparison?.after?.caption && (
                <p className="text-sm text-gray-500">{selectedComparison.after.caption}</p>
              )}
            </div>
          </div>
          {selectedComparison?.before?.session && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Session Details</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Groomer:</span>{' '}
                  <span className="font-medium">{selectedComparison.before.session.groomer.name}</span>
                </div>
                <div>
                  <span className="text-gray-500">Client:</span>{' '}
                  <span className="font-medium">
                    {selectedComparison.before.pet.client.firstName} {selectedComparison.before.pet.client.lastName}
                  </span>
                </div>
                {selectedComparison.before.session.checkInTime && (
                  <div>
                    <span className="text-gray-500">Date:</span>{' '}
                    <span className="font-medium">
                      {format(new Date(selectedComparison.before.session.checkInTime), 'MMMM d, yyyy')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => {
                const petId = selectedComparison?.before?.pet.id || selectedComparison?.after?.pet.id
                if (petId) {
                  router.push(`/pets/${petId}`)
                  setSelectedComparison(null)
                }
              }}
            >
              <PawPrint className="h-4 w-4 mr-2" />
              View Pet Profile
            </Button>
            <Button variant="outline" onClick={() => setSelectedComparison(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Single Photo Dialog */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedPhoto?.pet.name}
              {selectedPhoto?.isBefore && <Badge className="bg-gray-800">Before</Badge>}
              {selectedPhoto?.isAfter && <Badge className="bg-primary-600">After</Badge>}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative max-h-[60vh]">
              {selectedPhoto?.url ? (
                <PetImage
                  src={selectedPhoto.url}
                  alt={`${selectedPhoto.pet.name} grooming photo`}
                  className="absolute inset-0"
                  petId={`${selectedPhoto.id}-single`}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Camera className="h-16 w-16 text-gray-300" />
                </div>
              )}
            </div>
            {selectedPhoto?.caption && (
              <p className="text-gray-600 italic">"{selectedPhoto.caption}"</p>
            )}
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg text-sm">
              <div>
                <span className="text-gray-500">Pet:</span>{' '}
                <span className="font-medium">{selectedPhoto?.pet.name}</span>
              </div>
              <div>
                <span className="text-gray-500">Owner:</span>{' '}
                <span className="font-medium">
                  {selectedPhoto?.pet.client.firstName} {selectedPhoto?.pet.client.lastName}
                </span>
              </div>
              {selectedPhoto?.session?.groomer && (
                <div>
                  <span className="text-gray-500">Groomer:</span>{' '}
                  <span className="font-medium">{selectedPhoto.session.groomer.name}</span>
                </div>
              )}
              <div>
                <span className="text-gray-500">Date:</span>{' '}
                <span className="font-medium">
                  {selectedPhoto?.createdAt && format(new Date(selectedPhoto.createdAt), 'MMM d, yyyy')}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                if (selectedPhoto?.pet.id) {
                  router.push(`/pets/${selectedPhoto.pet.id}`)
                  setSelectedPhoto(null)
                }
              }}
            >
              <PawPrint className="h-4 w-4 mr-2" />
              View Pet Profile
            </Button>
            <Button variant="outline" onClick={() => setSelectedPhoto(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
