'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Calendar,
  Users,
  PawPrint,
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Plus,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatCurrency, formatTime } from '@/lib/utils'

interface DashboardStats {
  todayAppointments: number
  weekRevenue: number
  totalClients: number
  totalPets: number
  pendingCheckIns: number
  completedToday: number
}

interface TodayAppointment {
  id: string
  time: string
  petName: string
  breed: string
  clientName: string
  services: string[]
  status: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [appointments, setAppointments] = useState<TodayAppointment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [statsRes, appointmentsRes] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/dashboard/today-appointments'),
      ])

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }

      if (appointmentsRes.ok) {
        const appointmentsData = await appointmentsRes.json()
        setAppointments(appointmentsData)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const statsCards = [
    {
      title: "Today's Appointments",
      value: stats?.todayAppointments || 0,
      icon: Calendar,
      color: 'bg-blue-500',
      href: '/appointments',
    },
    {
      title: 'Week Revenue',
      value: formatCurrency(stats?.weekRevenue || 0),
      icon: DollarSign,
      color: 'bg-green-500',
      href: '/pos',
    },
    {
      title: 'Total Clients',
      value: stats?.totalClients || 0,
      icon: Users,
      color: 'bg-purple-500',
      href: '/clients',
    },
    {
      title: 'Total Pets',
      value: stats?.totalPets || 0,
      icon: PawPrint,
      color: 'bg-orange-500',
      href: '/pets',
    },
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return <Badge variant="secondary">Scheduled</Badge>
      case 'CONFIRMED':
        return <Badge variant="default">Confirmed</Badge>
      case 'CHECKED_IN':
        return <Badge variant="warning">Checked In</Badge>
      case 'IN_PROGRESS':
        return <Badge className="bg-blue-500">In Progress</Badge>
      case 'COMPLETED':
        return <Badge variant="success">Completed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Welcome back! Here's what's happening today.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/appointments/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Appointment
            </Button>
          </Link>
          <Link href="/clients/new">
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              New Client
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="cursor-pointer transition-shadow hover:shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <div className={`rounded-full p-3 ${stat.color}`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Actions & Today's Schedule */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/appointments/new" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="mr-2 h-4 w-4" />
                Book Appointment
              </Button>
            </Link>
            <Link href="/clients/new" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                Add New Client
              </Button>
            </Link>
            <Link href="/pets/new" className="block">
              <Button variant="outline" className="w-full justify-start">
                <PawPrint className="mr-2 h-4 w-4" />
                Register Pet
              </Button>
            </Link>
            <Link href="/pos" className="block">
              <Button variant="outline" className="w-full justify-start">
                <DollarSign className="mr-2 h-4 w-4" />
                New Transaction
              </Button>
            </Link>
            <Link href="/grooming" className="block">
              <Button variant="outline" className="w-full justify-start">
                <CheckCircle className="mr-2 h-4 w-4" />
                Check-In Pet
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Today's Appointments */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Today's Schedule</CardTitle>
            <Link href="/appointments">
              <Button variant="ghost" size="sm">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex h-40 items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : appointments.length === 0 ? (
              <div className="flex h-40 flex-col items-center justify-center text-gray-500">
                <Calendar className="h-12 w-12 mb-2" />
                <p>No appointments scheduled for today</p>
                <Link href="/appointments/new">
                  <Button variant="link">Book an appointment</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.slice(0, 5).map((apt) => (
                  <div
                    key={apt.id}
                    className="flex items-center justify-between rounded-lg border p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => router.push(`/appointments/${apt.id}`)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
                        <PawPrint className="h-6 w-6 text-primary-600" />
                      </div>
                      <div>
                        <p className="font-medium">{apt.petName}</p>
                        <p className="text-sm text-gray-500">
                          {apt.breed} - {apt.clientName}
                        </p>
                        <p className="text-sm text-gray-500">{apt.services.join(', ')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 text-gray-500">
                        <Clock className="h-4 w-4" />
                        {formatTime(apt.time)}
                      </div>
                      <div className="mt-1">{getStatusBadge(apt.status)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alerts & Reminders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Alerts & Reminders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div
              className="flex items-center justify-between rounded-lg bg-yellow-50 p-4 cursor-pointer hover:bg-yellow-100 transition-colors"
              onClick={() => router.push('/health')}
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-800">Vaccination Expiring</p>
                  <p className="text-sm text-yellow-600">3 pets have vaccinations expiring within 7 days</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
                <Link href="/health">View</Link>
              </Button>
            </div>
            <div
              className="flex items-center justify-between rounded-lg bg-blue-50 p-4 cursor-pointer hover:bg-blue-100 transition-colors"
              onClick={() => router.push('/grooming')}
            >
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-800">Pending Check-ins</p>
                  <p className="text-sm text-blue-600">{stats?.pendingCheckIns || 0} appointments waiting for check-in</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
                <Link href="/grooming">Manage</Link>
              </Button>
            </div>
            <div
              className="flex items-center justify-between rounded-lg bg-green-50 p-4 cursor-pointer hover:bg-green-100 transition-colors"
              onClick={() => router.push('/grooming')}
            >
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">Completed Today</p>
                  <p className="text-sm text-green-600">{stats?.completedToday || 0} grooming sessions completed</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
                <Link href="/grooming">View</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
