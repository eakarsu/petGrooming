'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
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
import { Switch } from '@/components/ui/switch'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

const petSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  clientId: z.string().min(1, 'Owner is required'),
  species: z.enum(['DOG', 'CAT', 'OTHER']),
  breedId: z.string().min(1, 'Breed is required'),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE']),
  weight: z.number().optional(),
  color: z.string().optional(),
  microchipNumber: z.string().optional(),
  isNeutered: z.boolean().optional(),
  temperament: z.string().optional(),
  specialNeeds: z.string().optional(),
  allergies: z.string().optional(),
})

type PetFormData = z.infer<typeof petSchema>

interface Client {
  id: string
  firstName: string
  lastName: string
}

interface Breed {
  id: string
  name: string
  species: string
}

export default function NewPetPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedClientId = searchParams.get('clientId')

  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [breeds, setBreeds] = useState<Breed[]>([])
  const [selectedSpecies, setSelectedSpecies] = useState<string>('DOG')

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PetFormData>({
    resolver: zodResolver(petSchema),
    defaultValues: {
      species: 'DOG',
      gender: 'MALE',
      isNeutered: false,
      clientId: preselectedClientId || '',
    },
  })

  const watchSpecies = watch('species')

  useEffect(() => {
    fetchClients()
    fetchBreeds()
  }, [])

  useEffect(() => {
    setSelectedSpecies(watchSpecies)
    fetchBreeds(watchSpecies)
  }, [watchSpecies])

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

  const fetchBreeds = async (species?: string) => {
    try {
      const url = species ? `/api/breeds?species=${species}` : '/api/breeds'
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setBreeds(data)
      }
    } catch (error) {
      console.error('Failed to fetch breeds:', error)
    }
  }

  const onSubmit = async (data: PetFormData) => {
    setLoading(true)
    try {
      const res = await fetch('/api/pets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (res.ok) {
        const pet = await res.json()
        toast.success('Pet registered successfully!')
        router.push(`/pets/${pet.id}`)
      } else {
        const error = await res.json()
        toast.error(error.error || 'Failed to register pet')
      }
    } catch (error) {
      toast.error('Failed to register pet')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/pets">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Register New Pet</h1>
          <p className="text-gray-500">Add a new pet to the system</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="clientId">Owner *</Label>
                <Select
                  value={watch('clientId')}
                  onValueChange={(value) => setValue('clientId', value)}
                >
                  <SelectTrigger error={errors.clientId?.message}>
                    <SelectValue placeholder="Select owner" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.firstName} {client.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.clientId && (
                  <p className="text-sm text-red-600">{errors.clientId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Pet Name *</Label>
                <Input
                  id="name"
                  {...register('name')}
                  error={errors.name?.message}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Species *</Label>
                  <Select
                    value={watch('species')}
                    onValueChange={(value: 'DOG' | 'CAT' | 'OTHER') =>
                      setValue('species', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DOG">Dog</SelectItem>
                      <SelectItem value="CAT">Cat</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Breed *</Label>
                  <Select
                    value={watch('breedId')}
                    onValueChange={(value) => setValue('breedId', value)}
                  >
                    <SelectTrigger error={errors.breedId?.message}>
                      <SelectValue placeholder="Select breed" />
                    </SelectTrigger>
                    <SelectContent>
                      {breeds.map((breed) => (
                        <SelectItem key={breed.id} value={breed.id}>
                          {breed.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Gender *</Label>
                  <Select
                    value={watch('gender')}
                    onValueChange={(value: 'MALE' | 'FEMALE') =>
                      setValue('gender', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">Male</SelectItem>
                      <SelectItem value="FEMALE">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    {...register('dateOfBirth')}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (lbs)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    {...register('weight', { valueAsNumber: true })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <Input id="color" {...register('color')} />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="isNeutered">Spayed/Neutered</Label>
                <Switch
                  id="isNeutered"
                  checked={watch('isNeutered')}
                  onCheckedChange={(checked) => setValue('isNeutered', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="microchipNumber">Microchip Number</Label>
                <Input id="microchipNumber" {...register('microchipNumber')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="temperament">Temperament</Label>
                <Textarea
                  id="temperament"
                  {...register('temperament')}
                  placeholder="e.g., Friendly, Calm, Nervous around other dogs..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="specialNeeds">Special Needs</Label>
                <Textarea
                  id="specialNeeds"
                  {...register('specialNeeds')}
                  placeholder="Any special care requirements..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="allergies">Allergies</Label>
                <Textarea
                  id="allergies"
                  {...register('allergies')}
                  placeholder="Known allergies to shampoos, products, etc..."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-4">
          <Link href="/pets">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" loading={loading}>
            Register Pet
          </Button>
        </div>
      </form>
    </div>
  )
}
