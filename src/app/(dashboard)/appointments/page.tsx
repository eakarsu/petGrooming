'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Plus,
  Calendar,
  MoreHorizontal,
  Eye,
  Edit,
  CheckCircle,
  X,
  Clock,
  Search,
} from 'lucide-react'
import { TableLoading } from '@/components/ui/loading'
import { formatDate, formatTime } from '@/lib/utils'
import toast from 'react-hot-toast'

interface Appointment {
  id: string
  scheduledDate: string
  scheduledTime: string
  duration: number
  status: string
  client: { firstName: string; lastName: string }
  pet: { name: string; breed: { name: string } }
  groomer: { name: string } | null
  services: Array<{ service: { name: string } }>
}

export default function AppointmentsPage() {
  const router = useRouter()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [search, setSearch] = useState('')

  const filteredAppointments = appointments.filter((apt) =>
    search === '' ||
    apt.pet.name.toLowerCase().includes(search.toLowerCase()) ||
    apt.client.firstName.toLowerCase().includes(search.toLowerCase()) ||
    apt.client.lastName.toLowerCase().includes(search.toLowerCase()) ||
    apt.services.some((s) => s.service.name.toLowerCase().includes(search.toLowerCase())) ||
    (apt.groomer?.name.toLowerCase().includes(search.toLowerCase()) ?? false)
  )

  useEffect(() => {
    fetchAppointments()
  }, [selectedDate, statusFilter])

  const fetchAppointments = async () => {
    try {
      let url = `/api/appointments?date=${selectedDate}`
      if (statusFilter !== 'all') {
        url += `&status=${statusFilter}`
      }
      const res = await fetch(url)
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
        fetchAppointments()
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-500">Manage grooming appointments</p>
        </div>
        <Link href="/appointments/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Appointment
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-auto"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                <SelectItem value="CHECKED_IN">Checked In</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                <SelectItem value="NO_SHOW">No Show</SelectItem>
              </SelectContent>
            </Select>
            {appointments.length > 5 && (
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search by pet, client, service, or groomer..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Appointments Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {formatDate(selectedDate)} - {appointments.length} Appointment(s)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableLoading />
          ) : appointments.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center text-gray-500">
              <Calendar className="h-12 w-12 mb-2" />
              <p>No appointments for this date</p>
              <Link href="/appointments/new">
                <Button variant="link">Schedule an appointment</Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Pet</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Services</TableHead>
                  <TableHead>Groomer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[70px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAppointments.map((apt) => (
                  <TableRow
                    key={apt.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => router.push(`/appointments/${apt.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="font-medium">{formatTime(apt.scheduledTime)}</p>
                          <p className="text-sm text-gray-500">{apt.duration} min</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{apt.pet.name}</p>
                        <p className="text-sm text-gray-500">{apt.pet.breed.name}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {apt.client.firstName} {apt.client.lastName}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {apt.services.map((s, i) => (
                          <Badge key={i} variant="outline">
                            {s.service.name}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{apt.groomer?.name || 'Unassigned'}</TableCell>
                    <TableCell>{getStatusBadge(apt.status)}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => router.push(`/appointments/${apt.id}`)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => router.push(`/appointments/${apt.id}/edit`)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          {apt.status === 'SCHEDULED' && (
                            <DropdownMenuItem
                              onClick={() => updateStatus(apt.id, 'CONFIRMED')}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Confirm
                            </DropdownMenuItem>
                          )}
                          {apt.status === 'CONFIRMED' && (
                            <DropdownMenuItem
                              onClick={() => updateStatus(apt.id, 'CHECKED_IN')}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Check In
                            </DropdownMenuItem>
                          )}
                          {apt.status === 'CHECKED_IN' && (
                            <DropdownMenuItem
                              onClick={() => updateStatus(apt.id, 'IN_PROGRESS')}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Start Grooming
                            </DropdownMenuItem>
                          )}
                          {apt.status === 'IN_PROGRESS' && (
                            <DropdownMenuItem
                              onClick={() => updateStatus(apt.id, 'COMPLETED')}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Complete
                            </DropdownMenuItem>
                          )}
                          {!['COMPLETED', 'CANCELLED'].includes(apt.status) && (
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => updateStatus(apt.id, 'CANCELLED')}
                            >
                              <X className="mr-2 h-4 w-4" />
                              Cancel
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
