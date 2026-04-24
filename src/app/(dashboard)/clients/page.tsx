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
import { Checkbox } from '@/components/ui/checkbox'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Search, MoreHorizontal, Edit, Trash, Eye, PawPrint, Download, FileText, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { TableLoading } from '@/components/ui/loading'
import { exportToCSV, exportToPDF } from '@/lib/export'
import toast from 'react-hot-toast'

interface Client {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  loyaltyPoints: number
  pets: Array<{
    id: string
    name: string
    breed: { name: string }
  }>
  _count: {
    appointments: number
  }
}

export default function ClientsPage() {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null)
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)

  // Pagination
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const totalPages = Math.ceil(total / pageSize)

  // Sorting
  const [sortField, setSortField] = useState<string>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const allSelected = clients.length > 0 && clients.every((c) => selectedIds.has(c.id))

  useEffect(() => {
    fetchClients()
  }, [search, page, pageSize, sortField, sortOrder])

  const fetchClients = async () => {
    try {
      const params = new URLSearchParams({
        search,
        page: String(page),
        limit: String(pageSize),
        sortBy: sortField,
        sortOrder,
      })
      const res = await fetch(`/api/clients?${params}`)
      if (res.ok) {
        const data = await res.json()
        setClients(data.clients)
        setTotal(data.pagination.total)
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error)
      toast.error('Failed to fetch clients')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!clientToDelete) return
    try {
      const res = await fetch(`/api/clients/${clientToDelete.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Client deleted successfully')
        fetchClients()
      } else {
        toast.error('Failed to delete client')
      }
    } catch {
      toast.error('Failed to delete client')
    } finally {
      setDeleteDialogOpen(false)
      setClientToDelete(null)
    }
  }

  const handleBulkDelete = async () => {
    try {
      const promises = Array.from(selectedIds).map((id) =>
        fetch(`/api/clients/${id}`, { method: 'DELETE' })
      )
      await Promise.all(promises)
      toast.success(`Deleted ${selectedIds.size} client(s)`)
      setSelectedIds(new Set())
      fetchClients()
    } catch {
      toast.error('Failed to delete some clients')
    } finally {
      setBulkDeleteDialogOpen(false)
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(clients.map((c) => c.id)))
    }
  }

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <ArrowUpDown className="ml-1 h-3 w-3" />
    return sortOrder === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
  }

  const exportColumns = [
    { header: 'Name', accessor: (r: Client) => `${r.firstName} ${r.lastName}` },
    { header: 'Email', accessor: 'email' },
    { header: 'Phone', accessor: 'phone' },
    { header: 'Pets', accessor: (r: Client) => r.pets.map((p) => p.name).join(', ') },
    { header: 'Appointments', accessor: (r: Client) => String(r._count.appointments) },
    { header: 'Loyalty Points', accessor: (r: Client) => String(r.loyaltyPoints) },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-500">Manage your client database</p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => exportToCSV(clients, exportColumns, 'clients')}>
                <FileText className="mr-2 h-4 w-4" />
                Export CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportToPDF(clients, exportColumns, 'clients', 'Clients List')}>
                <FileText className="mr-2 h-4 w-4" />
                Export PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Link href="/clients/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Client
            </Button>
          </Link>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <Card className="border-primary-200 bg-primary-50">
          <CardContent className="flex items-center justify-between py-3">
            <span className="text-sm font-medium">{selectedIds.size} item(s) selected</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedIds(new Set())}>
                Clear Selection
              </Button>
              <Button variant="destructive" size="sm" onClick={() => setBulkDeleteDialogOpen(true)}>
                <Trash className="mr-2 h-4 w-4" />
                Delete Selected
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Clients ({total})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableLoading />
          ) : clients.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center text-gray-500">
              <p>No clients found</p>
              <Link href="/clients/new">
                <Button variant="link">Add your first client</Button>
              </Link>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]">
                      <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} />
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('firstName')}>
                      <span className="flex items-center">Client <SortIcon field="firstName" /></span>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('email')}>
                      <span className="flex items-center">Contact <SortIcon field="email" /></span>
                    </TableHead>
                    <TableHead>Pets</TableHead>
                    <TableHead>Appointments</TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('loyaltyPoints')}>
                      <span className="flex items-center">Loyalty Points <SortIcon field="loyaltyPoints" /></span>
                    </TableHead>
                    <TableHead className="w-[70px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((client) => (
                    <TableRow
                      key={client.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => router.push(`/clients/${client.id}`)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedIds.has(client.id)}
                          onCheckedChange={() => toggleSelect(client.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{client.firstName} {client.lastName}</p>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{client.email}</p>
                          <p className="text-gray-500">{client.phone}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {client.pets.length === 0 ? (
                            <span className="text-gray-400">No pets</span>
                          ) : (
                            client.pets.map((pet) => (
                              <Badge key={pet.id} variant="secondary">
                                <PawPrint className="mr-1 h-3 w-3" />
                                {pet.name}
                              </Badge>
                            ))
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{client._count.appointments}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{client.loyaltyPoints} pts</Badge>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/clients/${client.id}`)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/clients/${client.id}/edit`)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/pets/new?clientId=${client.id}`)}>
                              <PawPrint className="mr-2 h-4 w-4" />
                              Add Pet
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => { setClientToDelete(client); setDeleteDialogOpen(true) }}
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

              {/* Pagination */}
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>Rows per page:</span>
                  <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1) }}>
                    <SelectTrigger className="w-[70px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                  <span>{(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} of {total}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const start = Math.max(1, Math.min(page - 2, totalPages - 4))
                    const p = start + i
                    if (p > totalPages) return null
                    return (
                      <Button key={p} variant={p === page ? 'default' : 'outline'} size="icon" className="h-8 w-8" onClick={() => setPage(p)}>
                        {p}
                      </Button>
                    )
                  })}
                  <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Client</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {clientToDelete?.firstName}{' '}
              {clientToDelete?.lastName}? This will also deactivate all their pets.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {selectedIds.size} Client(s)</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedIds.size} selected client(s)? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleBulkDelete}>Delete All</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
