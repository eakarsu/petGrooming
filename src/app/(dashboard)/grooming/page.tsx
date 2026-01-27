'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Clock,
  CheckCircle,
  Play,
  PawPrint,
  User,
  Calendar,
  Search,
  X,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { formatTime } from '@/lib/utils'
import toast from 'react-hot-toast'

interface GroomingAppointment {
  id: string
  scheduledTime: string
  status: string
  pet: { name: string; breed: { name: string } }
  client: { firstName: string; lastName: string }
  groomer: { name: string } | null
  services: Array<{ service: { name: string } }>
}

export default function GroomingPage() {
  const router = useRouter()
  const [appointments, setAppointments] = useState<GroomingAppointment[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('waiting')

  const filterAppointments = (apts: GroomingAppointment[]) =>
    apts.filter((apt) =>
      search === '' ||
      apt.pet.name.toLowerCase().includes(search.toLowerCase()) ||
      apt.pet.breed.name.toLowerCase().includes(search.toLowerCase()) ||
      apt.client.firstName.toLowerCase().includes(search.toLowerCase()) ||
      apt.client.lastName.toLowerCase().includes(search.toLowerCase()) ||
      apt.services.some((s) => s.service.name.toLowerCase().includes(search.toLowerCase())) ||
      (apt.groomer?.name.toLowerCase().includes(search.toLowerCase()) ?? false)
    )

  useEffect(() => {
    fetchTodayAppointments()
  }, [])

  const fetchTodayAppointments = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const res = await fetch(`/api/appointments?date=${today}`)
      if (res.ok) {
        const data = await res.json()
        setAppointments(data)
      }
    } catch (error) {
      console.error('Failed to fetch appointments:', error)
      toast.error('Failed to fetch appointments')
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/appointments/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      if (res.ok) {
        toast.success('Status updated')
        fetchTodayAppointments()
      } else {
        toast.error('Failed to update status')
      }
    } catch (error) {
      toast.error('Failed to update status')
    }
  }

  const filteredApts = filterAppointments(appointments)
  const waitingAppointments = filteredApts.filter(
    (a) => ['SCHEDULED', 'CONFIRMED'].includes(a.status)
  )
  const checkedInAppointments = filteredApts.filter((a) => a.status === 'CHECKED_IN')
  const inProgressAppointments = filteredApts.filter((a) => a.status === 'IN_PROGRESS')
  const completedAppointments = filteredApts.filter((a) => a.status === 'COMPLETED')

  const SearchInput = ({ show }: { show: boolean }) => {
    if (!show) return null
    return (
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search by pet, client, groomer, or service..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 pr-10"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    )
  }

  const AppointmentCard = ({ apt }: { apt: GroomingAppointment }) => (
    <Card
      className="mb-4 cursor-pointer hover:bg-gray-50 transition-colors"
      onClick={() => router.push(`/appointments/${apt.id}`)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
              <PawPrint className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <p className="font-medium">{apt.pet.name}</p>
              <p className="text-sm text-gray-500">{apt.pet.breed.name}</p>
              <p className="text-sm text-gray-500">
                {apt.client.firstName} {apt.client.lastName}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-gray-500">
              <Clock className="h-4 w-4" />
              <span>{formatTime(apt.scheduledTime)}</span>
            </div>
            {apt.groomer && (
              <div className="flex items-center gap-1 text-gray-500 mt-1">
                <User className="h-4 w-4" />
                <span>{apt.groomer.name}</span>
              </div>
            )}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1">
          {apt.services.map((s, i) => (
            <Badge key={i} variant="outline">
              {s.service.name}
            </Badge>
          ))}
        </div>
        <div className="mt-4 flex gap-2" onClick={(e) => e.stopPropagation()}>
          {apt.status === 'SCHEDULED' && (
            <Button size="sm" onClick={() => updateStatus(apt.id, 'CONFIRMED')}>
              Confirm
            </Button>
          )}
          {apt.status === 'CONFIRMED' && (
            <Button size="sm" onClick={() => updateStatus(apt.id, 'CHECKED_IN')}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Check In
            </Button>
          )}
          {apt.status === 'CHECKED_IN' && (
            <Button size="sm" onClick={() => updateStatus(apt.id, 'IN_PROGRESS')}>
              <Play className="mr-2 h-4 w-4" />
              Start Grooming
            </Button>
          )}
          {apt.status === 'IN_PROGRESS' && (
            <Button size="sm" variant="success" onClick={() => updateStatus(apt.id, 'COMPLETED')}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Complete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Grooming Station</h1>
          <p className="text-gray-500">Manage today's grooming sessions</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-gray-400" />
          <span className="font-medium">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
        </div>
      </div>

      {/* Stats - Clickable Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card
          className={`cursor-pointer transition-all hover:shadow-md ${activeTab === 'waiting' ? 'ring-2 ring-yellow-500' : ''}`}
          onClick={() => setActiveTab('waiting')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-yellow-100 p-2">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{waitingAppointments.length}</p>
                <p className="text-sm text-gray-500">Waiting</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-all hover:shadow-md ${activeTab === 'checked-in' ? 'ring-2 ring-blue-500' : ''}`}
          onClick={() => setActiveTab('checked-in')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-100 p-2">
                <CheckCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{checkedInAppointments.length}</p>
                <p className="text-sm text-gray-500">Checked In</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-all hover:shadow-md ${activeTab === 'in-progress' ? 'ring-2 ring-purple-500' : ''}`}
          onClick={() => setActiveTab('in-progress')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-purple-100 p-2">
                <Play className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{inProgressAppointments.length}</p>
                <p className="text-sm text-gray-500">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-all hover:shadow-md ${activeTab === 'completed' ? 'ring-2 ring-green-500' : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-green-100 p-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedAppointments.length}</p>
                <p className="text-sm text-gray-500">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="waiting">
            Waiting ({waitingAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="checked-in">
            Checked In ({checkedInAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="in-progress">
            In Progress ({inProgressAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedAppointments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="waiting" className="mt-4">
          <SearchInput show={waitingAppointments.length > 5} />
          {waitingAppointments.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                No appointments waiting
              </CardContent>
            </Card>
          ) : (
            waitingAppointments.map((apt) => <AppointmentCard key={apt.id} apt={apt} />)
          )}
        </TabsContent>

        <TabsContent value="checked-in" className="mt-4">
          <SearchInput show={checkedInAppointments.length > 5} />
          {checkedInAppointments.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                No pets checked in
              </CardContent>
            </Card>
          ) : (
            checkedInAppointments.map((apt) => <AppointmentCard key={apt.id} apt={apt} />)
          )}
        </TabsContent>

        <TabsContent value="in-progress" className="mt-4">
          <SearchInput show={inProgressAppointments.length > 5} />
          {inProgressAppointments.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                No grooming in progress
              </CardContent>
            </Card>
          ) : (
            inProgressAppointments.map((apt) => <AppointmentCard key={apt.id} apt={apt} />)
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-4">
          <SearchInput show={completedAppointments.length > 5} />
          {completedAppointments.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                No completed sessions today
              </CardContent>
            </Card>
          ) : (
            completedAppointments.map((apt) => <AppointmentCard key={apt.id} apt={apt} />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
