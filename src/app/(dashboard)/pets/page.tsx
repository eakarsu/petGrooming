'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Plus, Search, MoreHorizontal, Edit, Trash, Eye, Calendar, Scissors } from 'lucide-react'
import { TableLoading } from '@/components/ui/loading'
import { calculateAge } from '@/lib/utils'
import toast from 'react-hot-toast'

interface Pet {
  id: string
  name: string
  species: string
  gender: string
  dateOfBirth: string | null
  breed: { name: string; size: string }
  client: { firstName: string; lastName: string }
  _count: { groomingHistory: number }
}

export default function PetsPage() {
  const router = useRouter()
  const [pets, setPets] = useState<Pet[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [petToDelete, setPetToDelete] = useState<Pet | null>(null)

  useEffect(() => {
    fetchPets()
  }, [search])

  const fetchPets = async () => {
    try {
      const res = await fetch(`/api/pets?search=${encodeURIComponent(search)}`)
      if (res.ok) {
        const data = await res.json()
        setPets(data.pets)
      }
    } catch (error) {
      console.error('Failed to fetch pets:', error)
      toast.error('Failed to fetch pets')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!petToDelete) return

    try {
      const res = await fetch(`/api/pets/${petToDelete.id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        toast.success('Pet deleted successfully')
        fetchPets()
      } else {
        toast.error('Failed to delete pet')
      }
    } catch (error) {
      toast.error('Failed to delete pet')
    } finally {
      setDeleteDialogOpen(false)
      setPetToDelete(null)
    }
  }

  const getSpeciesEmoji = (species: string) => {
    switch (species) {
      case 'DOG':
        return '🐕'
      case 'CAT':
        return '🐈'
      default:
        return '🐾'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pets</h1>
          <p className="text-gray-500">Manage all registered pets</p>
        </div>
        <Link href="/pets/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Pet
          </Button>
        </Link>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search by pet name or owner name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Pets Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Pets ({pets.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableLoading />
          ) : pets.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center text-gray-500">
              <p>No pets found</p>
              <Link href="/pets/new">
                <Button variant="link">Register a pet</Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pet</TableHead>
                  <TableHead>Breed</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Grooming Sessions</TableHead>
                  <TableHead className="w-[70px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pets.map((pet) => (
                  <TableRow
                    key={pet.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => router.push(`/pets/${pet.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getSpeciesEmoji(pet.species)}</span>
                        <div>
                          <p className="font-medium">{pet.name}</p>
                          <p className="text-sm text-gray-500">{pet.gender}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p>{pet.breed.name}</p>
                        <Badge variant="outline" className="mt-1">
                          {pet.breed.size.replace('_', ' ')}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {pet.client.firstName} {pet.client.lastName}
                    </TableCell>
                    <TableCell>
                      {pet.dateOfBirth ? calculateAge(pet.dateOfBirth) : 'Unknown'}
                    </TableCell>
                    <TableCell>{pet._count.groomingHistory}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => router.push(`/pets/${pet.id}`)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => router.push(`/pets/${pet.id}/edit`)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => router.push(`/appointments/new?petId=${pet.id}`)}
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            Book Appointment
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => router.push(`/grooming?petId=${pet.id}`)}
                          >
                            <Scissors className="mr-2 h-4 w-4" />
                            Grooming History
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => {
                              setPetToDelete(pet)
                              setDeleteDialogOpen(true)
                            }}
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
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

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Pet</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {petToDelete?.name}? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
