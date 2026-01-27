'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ChevronLeft, ChevronRight, Clock, User, Calendar, PawPrint, ArrowRight } from 'lucide-react'
import { format, addWeeks, subWeeks, startOfWeek, addDays } from 'date-fns'

interface WorkloadData {
  weekStart: string
  weekEnd: string
  workload: {
    groomer: { id: string; name: string; avatar: string | null }
    dailyWorkload: Record<string, {
      appointments: any[]
      totalMinutes: number
    }>
    totalWeekMinutes: number
    maxDailyMinutes: number
    maxWeekMinutes: number
  }[]
}

export default function WorkloadPage() {
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [data, setData] = useState<WorkloadData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedGroomer, setSelectedGroomer] = useState<string | null>(null)
  const [selectedDayAppointments, setSelectedDayAppointments] = useState<{ groomer: string; date: string; appointments: any[] } | null>(null)
  const [selectedGroomerDetail, setSelectedGroomerDetail] = useState<typeof data.workload[0] | null>(null)

  useEffect(() => {
    fetchWorkload()
  }, [currentDate])

  const fetchWorkload = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/grooming/workload?date=${currentDate.toISOString()}`)
      const json = await res.json()
      setData(json)
    } catch (error) {
      console.error('Failed to fetch workload:', error)
    }
    setLoading(false)
  }

  const getCapacityColor = (used: number, max: number) => {
    const percent = (used / max) * 100
    if (percent >= 90) return 'bg-red-500'
    if (percent >= 70) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  const weekDays = data ? Array.from({ length: 7 }, (_, i) => {
    const date = addDays(new Date(data.weekStart), i)
    return {
      date,
      key: format(date, 'yyyy-MM-dd'),
      dayName: format(date, 'EEE'),
      dayNum: format(date, 'd'),
      isToday: format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd'),
    }
  }) : []

  const filteredWorkload = data?.workload.filter(w => 
    !selectedGroomer || w.groomer.id === selectedGroomer
  ) || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Groomer Workload</h1>
          <p className="text-gray-500">Weekly capacity and appointment overview</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(subWeeks(currentDate, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[200px] text-center font-medium">
            {data ? `${format(new Date(data.weekStart), 'MMM d')} - ${format(new Date(data.weekEnd), 'MMM d, yyyy')}` : 'Loading...'}
          </span>
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(addWeeks(currentDate, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => setCurrentDate(new Date())}>Today</Button>
        </div>
      </div>

      {/* Groomer Filter */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={selectedGroomer === null ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedGroomer(null)}
        >
          All Groomers
        </Button>
        {data?.workload.map(w => (
          <Button
            key={w.groomer.id}
            variant={selectedGroomer === w.groomer.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedGroomer(w.groomer.id)}
          >
            {w.groomer.name}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Weekly Overview Cards - Clickable */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWorkload.map(w => (
              <Card
                key={w.groomer.id}
                className={`cursor-pointer transition-all hover:shadow-md ${selectedGroomer === w.groomer.id ? 'ring-2 ring-primary-500' : ''}`}
                onClick={() => setSelectedGroomerDetail(w)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary-600" />
                      </div>
                      <CardTitle className="text-lg">{w.groomer.name}</CardTitle>
                    </div>
                    <Badge variant={w.totalWeekMinutes > w.maxWeekMinutes * 0.8 ? 'destructive' : 'secondary'}>
                      {Math.round((w.totalWeekMinutes / w.maxWeekMinutes) * 100)}%
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-500">Weekly Capacity</span>
                        <span className="font-medium">{formatMinutes(w.totalWeekMinutes)} / {formatMinutes(w.maxWeekMinutes)}</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getCapacityColor(w.totalWeekMinutes, w.maxWeekMinutes)} transition-all`}
                          style={{ width: `${Math.min((w.totalWeekMinutes / w.maxWeekMinutes) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-xs">
                      {weekDays.map(day => {
                        const dayData = w.dailyWorkload[day.key]
                        const apptCount = dayData?.appointments.length || 0
                        return (
                          <div
                            key={day.key}
                            className={`p-1 rounded cursor-pointer hover:bg-gray-100 ${day.isToday ? 'bg-primary-50 ring-1 ring-primary-200' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation()
                              if (apptCount > 0) {
                                setSelectedDayAppointments({
                                  groomer: w.groomer.name,
                                  date: day.key,
                                  appointments: dayData?.appointments || []
                                })
                              }
                            }}
                          >
                            <div className="text-gray-500">{day.dayName}</div>
                            <div className={`font-medium ${apptCount > 0 ? 'text-primary-600' : 'text-gray-400'}`}>
                              {apptCount}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Calendar Grid */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Weekly Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-left p-2 border-b font-medium text-gray-500 w-32">Groomer</th>
                      {weekDays.map(day => (
                        <th
                          key={day.key}
                          className={`text-center p-2 border-b font-medium ${day.isToday ? 'bg-primary-50' : ''}`}
                        >
                          <div className="text-gray-500">{day.dayName}</div>
                          <div className={day.isToday ? 'text-primary-600' : 'text-gray-900'}>{day.dayNum}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredWorkload.map(w => (
                      <tr key={w.groomer.id} className="border-b">
                        <td className="p-2 font-medium">{w.groomer.name}</td>
                        {weekDays.map(day => {
                          const dayData = w.dailyWorkload[day.key]
                          const appointments = dayData?.appointments || []
                          return (
                            <td key={day.key} className={`p-2 ${day.isToday ? 'bg-primary-50' : ''}`}>
                              <div className="space-y-1">
                                {appointments.length === 0 ? (
                                  <span className="text-gray-400 text-sm">-</span>
                                ) : (
                                  appointments.slice(0, 3).map((appt: any) => (
                                    <div
                                      key={appt.id}
                                      className="text-xs p-1 rounded bg-gray-100 truncate cursor-pointer hover:bg-primary-100 transition-colors"
                                      title={`${appt.scheduledTime} - ${appt.pet.name}`}
                                      onClick={() => router.push(`/appointments/${appt.id}`)}
                                    >
                                      <span className="font-medium">{appt.scheduledTime}</span>
                                      <span className="text-gray-500"> {appt.pet.name}</span>
                                    </div>
                                  ))
                                )}
                                {appointments.length > 3 && (
                                  <div
                                    className="text-xs text-primary-600 text-center cursor-pointer hover:underline"
                                    onClick={() => setSelectedDayAppointments({
                                      groomer: w.groomer.name,
                                      date: day.key,
                                      appointments
                                    })}
                                  >
                                    +{appointments.length - 3} more
                                  </div>
                                )}
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Day Appointments Dialog */}
      <Dialog open={!!selectedDayAppointments} onOpenChange={() => setSelectedDayAppointments(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedDayAppointments?.groomer} - {selectedDayAppointments?.date && format(new Date(selectedDayAppointments.date), 'EEEE, MMM d')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {selectedDayAppointments?.appointments.map((appt: any) => (
              <div
                key={appt.id}
                className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => {
                  router.push(`/appointments/${appt.id}`)
                  setSelectedDayAppointments(null)
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                    <PawPrint className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium">{appt.pet?.name || 'Pet'}</p>
                    <p className="text-sm text-gray-500">{appt.client?.firstName} {appt.client?.lastName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="font-medium text-primary-600">{appt.scheduledTime}</p>
                    <p className="text-xs text-gray-500">{appt.duration} min</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Groomer Detail Dialog */}
      <Dialog open={!!selectedGroomerDetail} onOpenChange={() => setSelectedGroomerDetail(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                <User className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <div className="text-xl">{selectedGroomerDetail?.groomer.name}</div>
                <div className="text-sm font-normal text-gray-500">Weekly Schedule Details</div>
              </div>
            </DialogTitle>
          </DialogHeader>

          {selectedGroomerDetail && (
            <div className="space-y-6">
              {/* Stats Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-primary-600">
                    {Object.values(selectedGroomerDetail.dailyWorkload).reduce((acc, day) => acc + day.appointments.length, 0)}
                  </p>
                  <p className="text-sm text-gray-500">Total Appointments</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {formatMinutes(selectedGroomerDetail.totalWeekMinutes)}
                  </p>
                  <p className="text-sm text-gray-500">Hours Scheduled</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <p className="text-2xl font-bold">
                    {Math.round((selectedGroomerDetail.totalWeekMinutes / selectedGroomerDetail.maxWeekMinutes) * 100)}%
                  </p>
                  <p className="text-sm text-gray-500">Capacity Used</p>
                </div>
              </div>

              {/* Capacity Bar */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">Weekly Capacity</span>
                  <span className="font-medium">
                    {formatMinutes(selectedGroomerDetail.totalWeekMinutes)} / {formatMinutes(selectedGroomerDetail.maxWeekMinutes)}
                  </span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getCapacityColor(selectedGroomerDetail.totalWeekMinutes, selectedGroomerDetail.maxWeekMinutes)} transition-all`}
                    style={{ width: `${Math.min((selectedGroomerDetail.totalWeekMinutes / selectedGroomerDetail.maxWeekMinutes) * 100, 100)}%` }}
                  />
                </div>
              </div>

              {/* Daily Breakdown */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Daily Breakdown</h3>
                {weekDays.map(day => {
                  const dayData = selectedGroomerDetail.dailyWorkload[day.key]
                  const appointments = dayData?.appointments || []
                  return (
                    <div key={day.key} className={`border rounded-lg overflow-hidden ${day.isToday ? 'ring-2 ring-primary-200' : ''}`}>
                      <div className={`px-4 py-2 flex justify-between items-center ${day.isToday ? 'bg-primary-50' : 'bg-gray-50'}`}>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">{format(day.date, 'EEEE, MMM d')}</span>
                          {day.isToday && <Badge className="bg-primary-600">Today</Badge>}
                        </div>
                        <Badge variant="outline">
                          {appointments.length} appointment{appointments.length !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                      {appointments.length > 0 ? (
                        <div className="divide-y">
                          {appointments.map((appt: any) => (
                            <div
                              key={appt.id}
                              className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                              onClick={() => {
                                router.push(`/appointments/${appt.id}`)
                                setSelectedGroomerDetail(null)
                              }}
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                                  <PawPrint className="h-4 w-4 text-primary-600" />
                                </div>
                                <div>
                                  <p className="font-medium">{appt.pet?.name || 'Pet'}</p>
                                  <p className="text-sm text-gray-500">{appt.client?.firstName} {appt.client?.lastName}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <p className="font-medium text-primary-600">{appt.scheduledTime}</p>
                                  <p className="text-xs text-gray-500">{appt.duration} min</p>
                                </div>
                                <ArrowRight className="h-4 w-4 text-gray-400" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="px-4 py-3 text-center text-gray-400 text-sm">
                          No appointments scheduled
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Filter Button */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedGroomer(selectedGroomerDetail.groomer.id)
                    setSelectedGroomerDetail(null)
                  }}
                >
                  Filter to {selectedGroomerDetail.groomer.name}
                </Button>
                <Button variant="outline" onClick={() => setSelectedGroomerDetail(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
