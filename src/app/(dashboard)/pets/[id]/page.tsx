'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ArrowLeft,
  Edit,
  Calendar,
  Scissors,
  Syringe,
  AlertTriangle,
  Heart,
  FileText,
  Plus,
  Clock,
  Search,
  X,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { PageLoading } from '@/components/ui/loading'
import { formatDate, calculateAge } from '@/lib/utils'
import { MedicalTimeline } from '@/components/health/medical-timeline'
import { MedicalCard } from '@/components/health/medical-card'

interface PetDetail {
  id: string
  name: string
  species: string
  gender: string
  dateOfBirth: string | null
  weight: number | null
  color: string | null
  microchipNumber: string | null
  isNeutered: boolean
  temperament: string | null
  specialNeeds: string | null
  allergies: string | null
  breed: { name: string; size: string }
  client: { id: string; firstName: string; lastName: string; phone: string }
  vaccinationRecords: Array<{
    id: string
    vaccineName: string
    dateAdministered: string
    expirationDate: string | null
    isVerified: boolean
  }>
  behavioralNotes: Array<{
    id: string
    category: string
    severity: string
    description: string
  }>
  groomingHistory: Array<{
    id: string
    createdAt: string
    status: string
    conditionNotes: string | null
    groomer: { name: string }
  }>
  healthAlerts: Array<{
    id: string
    alertType: string
    severity: string
    title: string
    description: string
    isResolved: boolean
    createdAt: string
  }>
  groomingPreferences: {
    preferredStyle: string | null
    sensitiveAreas: string | null
    additionalNotes: string | null
  } | null
}

export default function PetDetailPage() {
  const params = useParams()
  const [pet, setPet] = useState<PetDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchVaccinations, setSearchVaccinations] = useState('')
  const [searchBehavior, setSearchBehavior] = useState('')
  const [searchGrooming, setSearchGrooming] = useState('')
  const [searchTimeline, setSearchTimeline] = useState('')

  useEffect(() => {
    fetchPet()
  }, [params.id])

  const fetchPet = async () => {
    try {
      const res = await fetch(`/api/pets/${params.id}`)
      if (res.ok) {
        const data = await res.json()
        setPet(data)
      }
    } catch (error) {
      console.error('Failed to fetch pet:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <PageLoading />
  if (!pet) return <div className="flex h-[50vh] items-center justify-center">Pet not found</div>

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'LOW':
        return <Badge variant="secondary">Low</Badge>
      case 'MEDIUM':
        return <Badge variant="warning">Medium</Badge>
      case 'HIGH':
        return <Badge variant="destructive">High</Badge>
      case 'CRITICAL':
        return <Badge variant="destructive">Critical</Badge>
      default:
        return <Badge>{severity}</Badge>
    }
  }

  // Search input component
  const SearchInput = ({ value, onChange, placeholder }: {
    value: string
    onChange: (value: string) => void
    placeholder: string
  }) => (
    <div className="relative mb-4">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9 pr-9"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )

  // Filtered data
  const filteredVaccinations = pet.vaccinationRecords.filter(record =>
    searchVaccinations === '' ||
    record.vaccineName.toLowerCase().includes(searchVaccinations.toLowerCase())
  )

  const filteredBehavior = pet.behavioralNotes.filter(note =>
    searchBehavior === '' ||
    note.category.toLowerCase().includes(searchBehavior.toLowerCase()) ||
    note.description.toLowerCase().includes(searchBehavior.toLowerCase())
  )

  const filteredGrooming = pet.groomingHistory.filter(session =>
    searchGrooming === '' ||
    session.groomer.name.toLowerCase().includes(searchGrooming.toLowerCase()) ||
    session.status.toLowerCase().includes(searchGrooming.toLowerCase()) ||
    (session.conditionNotes && session.conditionNotes.toLowerCase().includes(searchGrooming.toLowerCase()))
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/pets">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <span className="text-4xl">
                {pet.species === 'DOG' ? '🐕' : pet.species === 'CAT' ? '🐈' : '🐾'}
              </span>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{pet.name}</h1>
                <p className="text-gray-500">
                  {pet.breed.name} - {pet.gender}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <Link href={`/appointments/new?petId=${pet.id}&clientId=${pet.client.id}`}>
            <Button variant="outline">
              <Calendar className="mr-2 h-4 w-4" />
              Book Appointment
            </Button>
          </Link>
          <Link href={`/pets/${pet.id}/edit`}>
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      {/* Alerts */}
      {pet.healthAlerts.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="font-medium text-red-800">Health Alerts</p>
                {pet.healthAlerts.map((alert) => (
                  <p key={alert.id} className="text-sm text-red-600">
                    {alert.title}: {alert.description}
                  </p>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Age</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {pet.dateOfBirth ? calculateAge(pet.dateOfBirth) : 'Unknown'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Weight</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{pet.weight ? `${pet.weight} lbs` : 'Unknown'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Size</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{pet.breed.size.replace('_', ' ')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Spayed/Neutered</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{pet.isNeutered ? 'Yes' : 'No'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Owner Info */}
      <Card>
        <CardHeader>
          <CardTitle>Owner Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">
                {pet.client.firstName} {pet.client.lastName}
              </p>
              <p className="text-gray-500">{pet.client.phone}</p>
            </div>
            <Link href={`/clients/${pet.client.id}`}>
              <Button variant="outline">View Client</Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="health" className="space-y-4">
        <TabsList>
          <TabsTrigger value="health">
            <Heart className="mr-2 h-4 w-4" />
            Health
          </TabsTrigger>
          <TabsTrigger value="vaccinations">
            <Syringe className="mr-2 h-4 w-4" />
            Vaccinations
          </TabsTrigger>
          <TabsTrigger value="behavior">
            <AlertTriangle className="mr-2 h-4 w-4" />
            Behavior
          </TabsTrigger>
          <TabsTrigger value="grooming">
            <Scissors className="mr-2 h-4 w-4" />
            Grooming
          </TabsTrigger>
          <TabsTrigger value="notes">
            <FileText className="mr-2 h-4 w-4" />
            Notes
          </TabsTrigger>
          <TabsTrigger value="timeline">
            <Clock className="mr-2 h-4 w-4" />
            Timeline
          </TabsTrigger>
        </TabsList>

        <TabsContent value="health">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Medical Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Microchip Number</p>
                  <p className="font-medium">{pet.microchipNumber || 'Not recorded'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Allergies</p>
                  <p className="font-medium">{pet.allergies || 'None recorded'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Special Needs</p>
                  <p className="font-medium">{pet.specialNeeds || 'None recorded'}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Physical Characteristics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Color</p>
                  <p className="font-medium">{pet.color || 'Not recorded'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Temperament</p>
                  <p className="font-medium">{pet.temperament || 'Not recorded'}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="vaccinations">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Vaccination Records ({pet.vaccinationRecords.length})</CardTitle>
              <Link href={`/pets/${pet.id}/vaccinations/new`}>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Record
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {pet.vaccinationRecords.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No vaccination records</p>
              ) : (
                <>
                  <SearchInput
                    value={searchVaccinations}
                    onChange={setSearchVaccinations}
                    placeholder="Search vaccinations..."
                  />
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vaccine</TableHead>
                        <TableHead>Date Administered</TableHead>
                        <TableHead>Expiration</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredVaccinations.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">{record.vaccineName}</TableCell>
                          <TableCell>{formatDate(record.dateAdministered)}</TableCell>
                          <TableCell>
                            {record.expirationDate ? formatDate(record.expirationDate) : 'N/A'}
                          </TableCell>
                          <TableCell>
                            {record.isVerified ? (
                              <Badge variant="success">Verified</Badge>
                            ) : (
                              <Badge variant="secondary">Pending</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {filteredVaccinations.length === 0 && searchVaccinations && (
                    <p className="text-center text-gray-500 py-4">No results found</p>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="behavior">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Behavioral Notes ({pet.behavioralNotes.length})</CardTitle>
              <Link href={`/pets/${pet.id}/behavior/new`}>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Note
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {pet.behavioralNotes.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No behavioral notes</p>
              ) : (
                <>
                  <SearchInput
                    value={searchBehavior}
                    onChange={setSearchBehavior}
                    placeholder="Search by category or description..."
                  />
                  <div className="space-y-4">
                    {filteredBehavior.map((note) => (
                      <div key={note.id} className="rounded-lg border p-4">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline">{note.category}</Badge>
                          {getSeverityBadge(note.severity)}
                        </div>
                        <p>{note.description}</p>
                      </div>
                    ))}
                  </div>
                  {filteredBehavior.length === 0 && searchBehavior && (
                    <p className="text-center text-gray-500 py-4">No results found</p>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="grooming">
          <Card>
            <CardHeader>
              <CardTitle>Grooming History ({pet.groomingHistory.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {pet.groomingHistory.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No grooming history</p>
              ) : (
                <>
                  <SearchInput
                    value={searchGrooming}
                    onChange={setSearchGrooming}
                    placeholder="Search by groomer, status, or notes..."
                  />
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Groomer</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredGrooming.map((session) => (
                        <TableRow key={session.id}>
                          <TableCell>{formatDate(session.createdAt)}</TableCell>
                          <TableCell>{session.groomer.name}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{session.status}</Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {session.conditionNotes || 'No notes'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {filteredGrooming.length === 0 && searchGrooming && (
                    <p className="text-center text-gray-500 py-4">No results found</p>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <CardTitle>Grooming Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Preferred Style</p>
                <p className="font-medium">
                  {pet.groomingPreferences?.preferredStyle || 'Not specified'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Sensitive Areas</p>
                <p className="font-medium">
                  {pet.groomingPreferences?.sensitiveAreas || 'None noted'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Additional Notes</p>
                <p className="font-medium">
                  {pet.groomingPreferences?.additionalNotes || 'No additional notes'}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Medical Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <SearchInput
                    value={searchTimeline}
                    onChange={setSearchTimeline}
                    placeholder="Search timeline events..."
                  />
                  <MedicalTimeline
                    events={[
                      ...pet.vaccinationRecords.map(v => ({
                        id: v.id,
                        type: 'vaccination' as const,
                        title: v.vaccineName,
                        description: `Administered${v.expirationDate ? `, expires ${formatDate(v.expirationDate)}` : ''}`,
                        date: new Date(v.dateAdministered),
                      })),
                      ...pet.healthAlerts.map(a => ({
                        id: a.id,
                        type: 'alert' as const,
                        title: a.title,
                        description: a.description,
                        date: new Date(a.createdAt),
                        severity: a.severity,
                        isResolved: a.isResolved,
                      })),
                      ...pet.behavioralNotes.map(n => ({
                        id: n.id,
                        type: 'note' as const,
                        title: `Behavioral Note: ${n.category}`,
                        description: n.description,
                        date: new Date(),
                        severity: n.severity,
                        category: n.category,
                      })),
                    ].filter(event =>
                      searchTimeline === '' ||
                      event.title.toLowerCase().includes(searchTimeline.toLowerCase()) ||
                      event.description.toLowerCase().includes(searchTimeline.toLowerCase())
                    )}
                  />
                </CardContent>
              </Card>
            </div>
            <div>
              <MedicalCard
                allergies={pet.allergies}
                specialNeeds={pet.specialNeeds}
                activeAlerts={pet.healthAlerts.filter(a => !a.isResolved).length}
                expiredVaccinations={pet.vaccinationRecords.filter(v =>
                  v.expirationDate && new Date(v.expirationDate) < new Date()
                ).length}
                upToDateVaccinations={pet.vaccinationRecords.filter(v =>
                  !v.expirationDate || new Date(v.expirationDate) >= new Date()
                ).length}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
