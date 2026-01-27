'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Edit,
  Calendar,
  Clock,
  User,
  PawPrint,
  Phone,
  Mail,
  Scissors,
  CheckCircle,
  Play,
  X,
  AlertTriangle,
} from 'lucide-react'
import { PageLoading } from '@/components/ui/loading'
import { formatDate, formatTime, formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'

interface AppointmentDetail {
  id: string
  scheduledDate: string
  scheduledTime: string
  duration: number
  status: string
  notes: string | null
  specialRequests: string | null
  client: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string
  }
  pet: {
    id: string
    name: string
    species: string
    gender: string
    breed: { name: string; size: string }
    vaccinationRecords: Array<{
      id: string
      vaccineName: string
      vaccinationDate: string
      expirationDate: string | null
    }>
    behavioralNotes: Array<{
      id: string
      note: string
      severity: string
    }>
    groomingPreferences: {
      preferredStyle: string | null
      clipperSize: string | null
      specialInstructions: string | null
    } | null
  }
  groomer: { id: string; name: string } | null
  services: Array<{
    service: {
      id: string
      name: string
      basePrice: number
      baseDuration: number
    }
    price: number
  }>
  session: {
    id: string
    startTime: string | null
    endTime: string | null
    notes: string | null
    photos: Array<{ id: string; url: string }>
  } | null
}

export default function AppointmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [appointment, setAppointment] = useState<AppointmentDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAppointment()
  }, [params.id])

  const fetchAppointment = async () => {
    try {
      const res = await fetch(`/api/appointments/${params.id}`)
      if (res.ok) {
        const data = await res.json()
        setAppointment(data)
      }
    } catch (error) {
      console.error('Failed to fetch appointment:', error)
      toast.error('Failed to fetch appointment')
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (status: string) => {
    try {
      const res = await fetch(`/api/appointments/${params.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      if (res.ok) {
        toast.success('Status updated')
        fetchAppointment()
      } else {
        toast.error('Failed to update status')
      }
    } catch (error) {
      toast.error('Failed to update status')
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      SCHEDULED: { variant: 'secondary', label: 'Scheduled' },
      CONFIRMED: { variant: 'default', label: 'Confirmed' },
      CHECKED_IN: { variant: 'warning', label: 'Checked In' },
      IN_PROGRESS: { variant: 'default', label: 'In Progress' },
      COMPLETED: { variant: 'success', label: 'Completed' },
      CANCELLED: { variant: 'destructive', label: 'Cancelled' },
      NO_SHOW: { variant: 'destructive', label: 'No Show' },
    }
    const config = variants[status] || { variant: 'secondary', label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getTotalPrice = () => {
    if (!appointment) return 0
    return appointment.services.reduce((sum, s) => sum + s.price, 0)
  }

  if (loading) {
    return <PageLoading />
  }

  if (!appointment) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p>Appointment not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Appointment Details
            </h1>
            <p className="text-gray-500">
              {formatDate(appointment.scheduledDate)} at {formatTime(appointment.scheduledTime)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {getStatusBadge(appointment.status)}
          <Link href={`/appointments/${appointment.id}/edit`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      {/* Status Actions */}
      {!['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(appointment.status) && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <p className="font-medium">Update Status</p>
              <div className="flex gap-2">
                {appointment.status === 'SCHEDULED' && (
                  <Button size="sm" onClick={() => updateStatus('CONFIRMED')}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Confirm
                  </Button>
                )}
                {appointment.status === 'CONFIRMED' && (
                  <Button size="sm" onClick={() => updateStatus('CHECKED_IN')}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Check In
                  </Button>
                )}
                {appointment.status === 'CHECKED_IN' && (
                  <Button size="sm" onClick={() => updateStatus('IN_PROGRESS')}>
                    <Play className="mr-2 h-4 w-4" />
                    Start Grooming
                  </Button>
                )}
                {appointment.status === 'IN_PROGRESS' && (
                  <Button size="sm" variant="success" onClick={() => updateStatus('COMPLETED')}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Complete
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => updateStatus('CANCELLED')}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Client Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Client Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-lg font-medium">
                {appointment.client.firstName} {appointment.client.lastName}
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gray-600">
                <Mail className="h-4 w-4" />
                <span>{appointment.client.email}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="h-4 w-4" />
                <span>{appointment.client.phone}</span>
              </div>
            </div>
            <Link href={`/clients/${appointment.client.id}`}>
              <Button variant="outline" size="sm" className="mt-2">
                View Client Profile
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Pet Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PawPrint className="h-5 w-5" />
              Pet Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-lg font-medium">{appointment.pet.name}</p>
              <p className="text-gray-500">
                {appointment.pet.breed.name} ({appointment.pet.breed.size.replace('_', ' ')})
              </p>
              <p className="text-gray-500">{appointment.pet.gender}</p>
            </div>

            {/* Behavioral Notes */}
            {appointment.pet.behavioralNotes.length > 0 && (
              <div className="mt-4">
                <p className="font-medium text-orange-600 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  Behavioral Notes
                </p>
                <div className="mt-2 space-y-2">
                  {appointment.pet.behavioralNotes.map((note) => (
                    <div
                      key={note.id}
                      className={`p-2 rounded text-sm ${
                        note.severity === 'HIGH'
                          ? 'bg-red-50 text-red-700'
                          : note.severity === 'MEDIUM'
                          ? 'bg-orange-50 text-orange-700'
                          : 'bg-yellow-50 text-yellow-700'
                      }`}
                    >
                      {note.note}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Grooming Preferences */}
            {appointment.pet.groomingPreferences && (
              <div className="mt-4">
                <p className="font-medium">Grooming Preferences</p>
                <div className="mt-2 text-sm text-gray-600 space-y-1">
                  {appointment.pet.groomingPreferences.preferredStyle && (
                    <p>Style: {appointment.pet.groomingPreferences.preferredStyle}</p>
                  )}
                  {appointment.pet.groomingPreferences.clipperSize && (
                    <p>Clipper Size: {appointment.pet.groomingPreferences.clipperSize}</p>
                  )}
                  {appointment.pet.groomingPreferences.specialInstructions && (
                    <p>Instructions: {appointment.pet.groomingPreferences.specialInstructions}</p>
                  )}
                </div>
              </div>
            )}

            <Link href={`/pets/${appointment.pet.id}`}>
              <Button variant="outline" size="sm" className="mt-2">
                View Pet Profile
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Appointment Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Appointment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p className="font-medium">{formatDate(appointment.scheduledDate)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Time</p>
                <p className="font-medium">{formatTime(appointment.scheduledTime)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Duration</p>
                <p className="font-medium">{appointment.duration} minutes</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Groomer</p>
                <p className="font-medium">
                  {appointment.groomer?.name || 'Unassigned'}
                </p>
              </div>
            </div>

            {appointment.notes && (
              <div className="mt-4">
                <p className="text-sm text-gray-500">Notes</p>
                <p className="text-gray-700">{appointment.notes}</p>
              </div>
            )}

            {appointment.specialRequests && (
              <div className="mt-4">
                <p className="text-sm text-gray-500">Special Requests</p>
                <p className="text-gray-700">{appointment.specialRequests}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Services */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scissors className="h-5 w-5" />
              Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {appointment.services.map((s, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{s.service.name}</p>
                    <p className="text-sm text-gray-500">
                      {s.service.baseDuration} min
                    </p>
                  </div>
                  <p className="font-medium">{formatCurrency(s.price)}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t flex justify-between items-center">
              <p className="font-medium">Total</p>
              <p className="text-xl font-bold">{formatCurrency(getTotalPrice())}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vaccination Records */}
      {appointment.pet.vaccinationRecords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Vaccination Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {appointment.pet.vaccinationRecords.map((record) => {
                const isExpired = record.expirationDate && new Date(record.expirationDate) < new Date()
                return (
                  <div
                    key={record.id}
                    className={`p-3 rounded-lg border ${
                      isExpired ? 'border-red-200 bg-red-50' : 'border-gray-200'
                    }`}
                  >
                    <p className="font-medium">{record.vaccineName}</p>
                    <p className="text-sm text-gray-500">
                      Given: {formatDate(record.vaccinationDate)}
                    </p>
                    {record.expirationDate && (
                      <p className={`text-sm ${isExpired ? 'text-red-600' : 'text-gray-500'}`}>
                        Expires: {formatDate(record.expirationDate)}
                        {isExpired && ' (Expired)'}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Session Info (if started) */}
      {appointment.session && (
        <Card>
          <CardHeader>
            <CardTitle>Grooming Session</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {appointment.session.startTime && (
                <div>
                  <p className="text-sm text-gray-500">Started</p>
                  <p className="font-medium">
                    {formatTime(appointment.session.startTime)}
                  </p>
                </div>
              )}
              {appointment.session.endTime && (
                <div>
                  <p className="text-sm text-gray-500">Ended</p>
                  <p className="font-medium">
                    {formatTime(appointment.session.endTime)}
                  </p>
                </div>
              )}
            </div>
            {appointment.session.notes && (
              <div>
                <p className="text-sm text-gray-500">Session Notes</p>
                <p className="text-gray-700">{appointment.session.notes}</p>
              </div>
            )}
            {appointment.session.photos.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 mb-2">Photos</p>
                <div className="grid grid-cols-4 gap-2">
                  {appointment.session.photos.map((photo) => (
                    <img
                      key={photo.id}
                      src={photo.url}
                      alt="Grooming photo"
                      className="rounded-lg object-cover w-full h-24"
                    />
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
