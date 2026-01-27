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
  PawPrint,
  Calendar,
  DollarSign,
  Phone,
  Mail,
  MapPin,
  Plus,
} from 'lucide-react'
import { PageLoading } from '@/components/ui/loading'
import { formatDate, formatCurrency } from '@/lib/utils'

interface ClientDetail {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  alternatePhone?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  notes?: string
  loyaltyPoints: number
  pets: Array<{
    id: string
    name: string
    species: string
    breed: { name: string }
    gender: string
  }>
  appointments: Array<{
    id: string
    scheduledDate: string
    scheduledTime: string
    status: string
    pet: { name: string }
    services: Array<{ service: { name: string } }>
  }>
  transactions: Array<{
    id: string
    createdAt: string
    total: number
    paymentStatus: string
  }>
}

export default function ClientDetailPage() {
  const params = useParams()
  const [client, setClient] = useState<ClientDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchClient()
  }, [params.id])

  const fetchClient = async () => {
    try {
      const res = await fetch(`/api/clients/${params.id}`)
      if (res.ok) {
        const data = await res.json()
        setClient(data)
      }
    } catch (error) {
      console.error('Failed to fetch client:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <PageLoading />
  }

  if (!client) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p>Client not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/clients">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {client.firstName} {client.lastName}
            </h1>
            <p className="text-gray-500">Client Profile</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Link href={`/pets/new?clientId=${client.id}`}>
            <Button variant="outline">
              <PawPrint className="mr-2 h-4 w-4" />
              Add Pet
            </Button>
          </Link>
          <Link href={`/appointments/new?clientId=${client.id}`}>
            <Button variant="outline">
              <Calendar className="mr-2 h-4 w-4" />
              Book Appointment
            </Button>
          </Link>
          <Link href={`/clients/${client.id}/edit`}>
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      {/* Client Info Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Phone className="h-4 w-4" />
              Contact Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-400" />
              <span>{client.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-gray-400" />
              <span>{client.phone}</span>
            </div>
            {client.alternatePhone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <span>{client.alternatePhone}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="h-4 w-4" />
              Address
            </CardTitle>
          </CardHeader>
          <CardContent>
            {client.address ? (
              <div className="text-sm">
                <p>{client.address}</p>
                <p>
                  {client.city}, {client.state} {client.zipCode}
                </p>
              </div>
            ) : (
              <p className="text-gray-400">No address on file</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="h-4 w-4" />
              Loyalty Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary-600">
              {client.loyaltyPoints}
            </p>
            <p className="text-sm text-gray-500">points available</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pets" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pets">
            <PawPrint className="mr-2 h-4 w-4" />
            Pets ({client.pets.length})
          </TabsTrigger>
          <TabsTrigger value="appointments">
            <Calendar className="mr-2 h-4 w-4" />
            Appointments ({client.appointments.length})
          </TabsTrigger>
          <TabsTrigger value="transactions">
            <DollarSign className="mr-2 h-4 w-4" />
            Transactions ({client.transactions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pets">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Pets</CardTitle>
              <Link href={`/pets/new?clientId=${client.id}`}>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Pet
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {client.pets.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No pets registered</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {client.pets.map((pet) => (
                    <Link key={pet.id} href={`/pets/${pet.id}`}>
                      <Card className="cursor-pointer transition-shadow hover:shadow-md">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
                              <PawPrint className="h-6 w-6 text-primary-600" />
                            </div>
                            <div>
                              <p className="font-medium">{pet.name}</p>
                              <p className="text-sm text-gray-500">
                                {pet.breed.name} - {pet.gender}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appointments">
          <Card>
            <CardHeader>
              <CardTitle>Recent Appointments</CardTitle>
            </CardHeader>
            <CardContent>
              {client.appointments.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No appointments</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Pet</TableHead>
                      <TableHead>Services</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {client.appointments.map((apt) => (
                      <TableRow key={apt.id}>
                        <TableCell>
                          {formatDate(apt.scheduledDate)} at {apt.scheduledTime}
                        </TableCell>
                        <TableCell>{apt.pet.name}</TableCell>
                        <TableCell>
                          {apt.services.map((s) => s.service.name).join(', ')}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{apt.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              {client.transactions.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No transactions</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {client.transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell>{formatDate(tx.createdAt)}</TableCell>
                        <TableCell>{formatCurrency(tx.total)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              tx.paymentStatus === 'COMPLETED' ? 'success' : 'secondary'
                            }
                          >
                            {tx.paymentStatus}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Notes */}
      {client.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{client.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
