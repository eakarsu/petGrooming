'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { generateTimeSlots, formatCurrency } from '@/lib/utils'

const appointmentSchema = z.object({
  clientId: z.string().min(1, 'Client is required'),
  petId: z.string().min(1, 'Pet is required'),
  groomerId: z.string().optional(),
  scheduledDate: z.string().min(1, 'Date is required'),
  scheduledTime: z.string().min(1, 'Time is required'),
  duration: z.number().min(15),
  services: z.array(z.string()).min(1, 'At least one service is required'),
  notes: z.string().optional(),
  specialRequests: z.string().optional(),
})

type AppointmentFormData = z.infer<typeof appointmentSchema>

interface Client {
  id: string
  firstName: string
  lastName: string
  pets: Array<{ id: string; name: string }>
}

interface Service {
  id: string
  name: string
  basePrice: number
  baseDuration: number
  category: string
}

interface Groomer {
  id: string
  name: string
}

export default function NewAppointmentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedClientId = searchParams.get('clientId')
  const preselectedPetId = searchParams.get('petId')

  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [groomers, setGroomers] = useState<Groomer[]>([])
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [availablePets, setAvailablePets] = useState<Array<{ id: string; name: string }>>([])

  const timeSlots = generateTimeSlots(8, 18, 30)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      clientId: preselectedClientId || '',
      petId: preselectedPetId || '',
      scheduledDate: new Date().toISOString().split('T')[0],
      duration: 60,
      services: [],
    },
  })

  const watchClientId = watch('clientId')

  useEffect(() => {
    fetchClients()
    fetchServices()
    fetchGroomers()
  }, [])

  useEffect(() => {
    if (watchClientId) {
      const client = clients.find((c) => c.id === watchClientId)
      setAvailablePets(client?.pets || [])
    }
  }, [watchClientId, clients])

  useEffect(() => {
    setValue('services', selectedServices)
    const totalDuration = services
      .filter((s) => selectedServices.includes(s.id))
      .reduce((sum, s) => sum + s.baseDuration, 0)
    setValue('duration', totalDuration || 60)
  }, [selectedServices, services, setValue])

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients?limit=100')
      if (res.ok) {
        const data = await res.json()
        setClients(data.clients)
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error)
    }
  }

  const fetchServices = async () => {
    try {
      const res = await fetch('/api/services')
      if (res.ok) {
        const data = await res.json()
        setServices(data)
      }
    } catch (error) {
      console.error('Failed to fetch services:', error)
    }
  }

  const fetchGroomers = async () => {
    try {
      const res = await fetch('/api/users?role=GROOMER')
      if (res.ok) {
        const data = await res.json()
        setGroomers(data)
      }
    } catch (error) {
      console.error('Failed to fetch groomers:', error)
    }
  }

  const toggleService = (serviceId: string) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    )
  }

  const totalPrice = services
    .filter((s) => selectedServices.includes(s.id))
    .reduce((sum, s) => sum + s.basePrice, 0)

  const onSubmit = async (data: AppointmentFormData) => {
    setLoading(true)
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (res.ok) {
        const apt = await res.json()
        toast.success('Appointment booked successfully!')
        router.push(`/appointments/${apt.id}`)
      } else {
        const error = await res.json()
        toast.error(error.error || 'Failed to book appointment')
      }
    } catch (error) {
      toast.error('Failed to book appointment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/appointments">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">New Appointment</h1>
          <p className="text-gray-500">Book a grooming appointment</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Client & Pet Selection */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Client & Pet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Client *</Label>
                  <Controller
                    name="clientId"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger error={errors.clientId?.message}>
                          <SelectValue placeholder="Select client" />
                        </SelectTrigger>
                        <SelectContent>
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.firstName} {client.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Pet *</Label>
                  <Controller
                    name="petId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={!watchClientId}
                      >
                        <SelectTrigger error={errors.petId?.message}>
                          <SelectValue placeholder="Select pet" />
                        </SelectTrigger>
                        <SelectContent>
                          {availablePets.map((pet) => (
                            <SelectItem key={pet.id} value={pet.id}>
                              {pet.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Input
                    type="date"
                    {...register('scheduledDate')}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Time *</Label>
                  <Controller
                    name="scheduledTime"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger error={errors.scheduledTime?.message}>
                          <SelectValue placeholder="Select time" />
                        </SelectTrigger>
                        <SelectContent>
                          {timeSlots.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Groomer</Label>
                  <Controller
                    name="groomerId"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value || ''} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Any available" />
                        </SelectTrigger>
                        <SelectContent>
                          {groomers.map((groomer) => (
                            <SelectItem key={groomer.id} value={groomer.id}>
                              {groomer.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Special Requests</Label>
                <Textarea
                  {...register('specialRequests')}
                  placeholder="Any special requests or notes..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Services Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Services *</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {services.map((service) => (
                  <label
                    key={service.id}
                    className="flex items-center justify-between rounded-lg border p-3 cursor-pointer hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedServices.includes(service.id)}
                        onChange={() => toggleService(service.id)}
                        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <div>
                        <p className="font-medium">{service.name}</p>
                        <p className="text-sm text-gray-500">{service.baseDuration} min</p>
                      </div>
                    </div>
                    <p className="font-medium">{formatCurrency(service.basePrice)}</p>
                  </label>
                ))}
              </div>
              {errors.services && (
                <p className="mt-2 text-sm text-red-600">{errors.services.message}</p>
              )}

              <div className="mt-4 border-t pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(totalPrice)}</span>
                </div>
                <p className="text-sm text-gray-500">
                  Duration: {watch('duration')} minutes
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-4">
          <Link href="/appointments">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" loading={loading}>
            Book Appointment
          </Button>
        </div>
      </form>
    </div>
  )
}
