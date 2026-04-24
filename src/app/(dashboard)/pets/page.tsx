'use client'

import { useEffect, useState, useCallback } from 'react'
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
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash,
  Eye,
  Calendar,
  Scissors,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
} from 'lucide-react'
import { TableLoading } from '@/components/ui/loading'
import { calculateAge } from '@/lib/utils'
import { exportToCSV, exportToPDF } from '@/lib/export'
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

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

type SortField = 'name' | 'species' | 'breed' | 'owner' | 'age' | 'groomingSessions'
type SortOrder = 'asc' | 'desc'

const exportColumns = [
  { header: 'Pet Name', accessor: (row: Pet) => row.name },
  { header: 'Species', accessor: (row: Pet) => row.species },
  { header: 'Breed', accessor: (row: Pet) => row.breed.name },
  {
    header: 'Owner',
    accessor: (row: Pet) => `${row.client.firstName} ${row.client.lastName}`,
  },
  { header: 'Gender', accessor: (row: Pet) => row.gender },
  {
    header: 'Age',
    accessor: (row: Pet) =>
      row.dateOfBirth ? calculateAge(row.dateOfBirth) : 'Unknown',
  },
  {
    header: 'Grooming Sessions',
    accessor: (row: Pet) => String(row._count.groomingHistory),
  },
]

export default function PetsPage() {
  const router = useRouter()
  const [pets, setPets] = useState<Pet[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [petToDelete, setPetToDelete] = useState<Pet | null>(null)

  // Pagination state
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })

  // Sorting state
  const [sortField, setSortField] = useState<SortField | ''>('')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)

  const fetchPets = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      params.set('page', String(page))
      params.set('limit', String(pageSize))
      if (sortField) {
        params.set('sortBy', sortField)
        params.set('sortOrder', sortOrder)
      }

      const res = await fetch(`/api/pets?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setPets(data.pets)
        if (data.pagination) {
          setPagination(data.pagination)
        }
      }
    } catch (error) {
      console.error('Failed to fetch pets:', error)
      toast.error('Failed to fetch pets')
    } finally {
      setLoading(false)
    }
  }, [search, page, pageSize, sortField, sortOrder])

  useEffect(() => {
    fetchPets()
  }, [fetchPets])

  // Reset to page 1 when search changes
  useEffect(() => {
    setPage(1)
  }, [search])

  // Clear selections when data changes
  useEffect(() => {
    setSelectedIds(new Set())
  }, [pets])

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

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds)
    let successCount = 0
    let failCount = 0

    for (const id of ids) {
      try {
        const res = await fetch(`/api/pets/${id}`, { method: 'DELETE' })
        if (res.ok) {
          successCount++
        } else {
          failCount++
        }
      } catch {
        failCount++
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} pet${successCount > 1 ? 's' : ''} deleted successfully`)
    }
    if (failCount > 0) {
      toast.error(`Failed to delete ${failCount} pet${failCount > 1 ? 's' : ''}`)
    }

    setSelectedIds(new Set())
    setBulkDeleteDialogOpen(false)
    fetchPets()
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortOrder === 'asc') {
        setSortOrder('desc')
      } else {
        // Third click clears sort
        setSortField('')
        setSortOrder('asc')
      }
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
    setPage(1)
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="ml-1 h-4 w-4 text-gray-400" />
    if (sortOrder === 'asc') return <ArrowUp className="ml-1 h-4 w-4" />
    return <ArrowDown className="ml-1 h-4 w-4" />
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === pets.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(pets.map((p) => p.id)))
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
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

  const handleExportCSV = () => {
    exportToCSV(pets, exportColumns, 'pets')
    toast.success('CSV exported successfully')
  }

  const handleExportPDF = () => {
    exportToPDF(pets, exportColumns, 'pets', 'Pets List')
    toast.success('PDF exported successfully')
  }

  // Generate page numbers to display
  const getPageNumbers = () => {
    const totalPages = pagination.totalPages
    const current = page
    const pages: (number | 'ellipsis')[] = []

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (current > 3) pages.push('ellipsis')
      const start = Math.max(2, current - 1)
      const end = Math.min(totalPages - 1, current + 1)
      for (let i = start; i <= end; i++) pages.push(i)
      if (current < totalPages - 2) pages.push('ellipsis')
      pages.push(totalPages)
    }

    return pages
  }

  const isAllSelected = pets.length > 0 && selectedIds.size === pets.length
  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < pets.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pets</h1>
          <p className="text-gray-500">Manage all registered pets</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportCSV}>
                <FileText className="mr-2 h-4 w-4" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPDF}>
                <FileText className="mr-2 h-4 w-4" />
                Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Link href="/pets/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Pet
            </Button>
          </Link>
        </div>
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

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <Card>
          <CardContent className="flex items-center justify-between py-3">
            <span className="text-sm text-gray-700">
              {selectedIds.size} pet{selectedIds.size > 1 ? 's' : ''} selected
            </span>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setBulkDeleteDialogOpen(true)}
            >
              <Trash className="mr-2 h-4 w-4" />
              Delete Selected
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Pets Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Pets ({pagination.total})</CardTitle>
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
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]">
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all"
                        {...(isSomeSelected ? { 'data-state': 'indeterminate' } : {})}
                      />
                    </TableHead>
                    <TableHead>
                      <button
                        className="flex items-center font-medium hover:text-gray-900"
                        onClick={() => handleSort('name')}
                      >
                        Pet
                        {getSortIcon('name')}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        className="flex items-center font-medium hover:text-gray-900"
                        onClick={() => handleSort('breed')}
                      >
                        Breed
                        {getSortIcon('breed')}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        className="flex items-center font-medium hover:text-gray-900"
                        onClick={() => handleSort('owner')}
                      >
                        Owner
                        {getSortIcon('owner')}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        className="flex items-center font-medium hover:text-gray-900"
                        onClick={() => handleSort('age')}
                      >
                        Age
                        {getSortIcon('age')}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        className="flex items-center font-medium hover:text-gray-900"
                        onClick={() => handleSort('groomingSessions')}
                      >
                        Grooming Sessions
                        {getSortIcon('groomingSessions')}
                      </button>
                    </TableHead>
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
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedIds.has(pet.id)}
                          onCheckedChange={() => toggleSelect(pet.id)}
                          aria-label={`Select ${pet.name}`}
                        />
                      </TableCell>
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

              {/* Pagination Controls */}
              <div className="flex items-center justify-between border-t pt-4 mt-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">Rows per page:</span>
                  <Select
                    value={String(pageSize)}
                    onValueChange={(value) => {
                      setPageSize(Number(value))
                      setPage(1)
                    }}
                  >
                    <SelectTrigger className="h-8 w-[70px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-gray-500">
                    Showing {(page - 1) * pageSize + 1}-
                    {Math.min(page * pageSize, pagination.total)} of {pagination.total}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>

                  {getPageNumbers().map((pageNum, idx) =>
                    pageNum === 'ellipsis' ? (
                      <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">
                        ...
                      </span>
                    ) : (
                      <Button
                        key={pageNum}
                        variant={page === pageNum ? 'default' : 'outline'}
                        size="sm"
                        className="min-w-[32px]"
                        onClick={() => setPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    )
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={page >= pagination.totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
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

      {/* Bulk Delete Dialog */}
      <Dialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Selected Pets</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedIds.size} selected pet
              {selectedIds.size > 1 ? 's' : ''}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBulkDelete}>
              Delete {selectedIds.size} Pet{selectedIds.size > 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
