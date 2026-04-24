'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Trash,
} from 'lucide-react'
import { TableLoading } from '@/components/ui/loading'
import { formatDate, formatTime } from '@/lib/utils'
import { exportToCSV, exportToPDF } from '@/lib/export'
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

type SortField = 'scheduledTime' | 'pet' | 'client' | 'groomer' | 'status' | 'duration'
type SortOrder = 'asc' | 'desc'

const exportColumns = [
  { header: 'Time', accessor: (row: Appointment) => formatTime(row.scheduledTime) },
  { header: 'Pet', accessor: (row: Appointment) => row.pet.name },
  { header: 'Breed', accessor: (row: Appointment) => row.pet.breed.name },
  {
    header: 'Client',
    accessor: (row: Appointment) => `${row.client.firstName} ${row.client.lastName}`,
  },
  {
    header: 'Services',
    accessor: (row: Appointment) => row.services.map((s) => s.service.name).join(', '),
  },
  { header: 'Groomer', accessor: (row: Appointment) => row.groomer?.name || 'Unassigned' },
  { header: 'Status', accessor: (row: Appointment) => row.status },
  { header: 'Duration', accessor: (row: Appointment) => `${row.duration} min` },
]

export default function AppointmentsPage() {
  const router = useRouter()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [search, setSearch] = useState('')

  // Pagination state
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('scheduledTime')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Bulk action dialog state
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [bulkStatusOpen, setBulkStatusOpen] = useState(false)
  const [bulkStatus, setBulkStatus] = useState<string>('')

  // Client-side search filtering
  const filteredAppointments = useMemo(() => {
    return appointments.filter(
      (apt) =>
        search === '' ||
        apt.pet.name.toLowerCase().includes(search.toLowerCase()) ||
        apt.client.firstName.toLowerCase().includes(search.toLowerCase()) ||
        apt.client.lastName.toLowerCase().includes(search.toLowerCase()) ||
        apt.services.some((s) =>
          s.service.name.toLowerCase().includes(search.toLowerCase())
        ) ||
        (apt.groomer?.name.toLowerCase().includes(search.toLowerCase()) ?? false)
    )
  }, [appointments, search])

  // Sorted appointments
  const sortedAppointments = useMemo(() => {
    const sorted = [...filteredAppointments]
    sorted.sort((a, b) => {
      let aVal: string
      let bVal: string

      switch (sortField) {
        case 'scheduledTime':
          aVal = a.scheduledTime
          bVal = b.scheduledTime
          break
        case 'pet':
          aVal = a.pet.name.toLowerCase()
          bVal = b.pet.name.toLowerCase()
          break
        case 'client':
          aVal = `${a.client.firstName} ${a.client.lastName}`.toLowerCase()
          bVal = `${b.client.firstName} ${b.client.lastName}`.toLowerCase()
          break
        case 'groomer':
          aVal = (a.groomer?.name || 'zzz').toLowerCase()
          bVal = (b.groomer?.name || 'zzz').toLowerCase()
          break
        case 'status':
          aVal = a.status.toLowerCase()
          bVal = b.status.toLowerCase()
          break
        case 'duration':
          return sortOrder === 'asc' ? a.duration - b.duration : b.duration - a.duration
        default:
          return 0
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
      return 0
    })
    return sorted
  }, [filteredAppointments, sortField, sortOrder])

  // Pagination derived values
  const totalItems = sortedAppointments.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const paginatedAppointments = useMemo(() => {
    const start = (page - 1) * pageSize
    return sortedAppointments.slice(start, start + pageSize)
  }, [sortedAppointments, page, pageSize])

  // Reset page when filters, search, or sort change
  useEffect(() => {
    setPage(1)
  }, [search, sortField, sortOrder, pageSize])

  // Clear selection when data changes
  useEffect(() => {
    setSelectedIds(new Set())
  }, [appointments, search, sortField, sortOrder, page, pageSize])

  useEffect(() => {
    fetchAppointments()
  }, [selectedDate, statusFilter])

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      let url = `/api/appointments?date=${selectedDate}`
      if (statusFilter !== 'all') {
        url += `&status=${statusFilter}`
      }
      url += `&page=${page}&limit=${pageSize}`
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

  // Sorting handler
  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
      } else {
        setSortField(field)
        setSortOrder('asc')
      }
    },
    [sortField]
  )

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-1 h-3 w-3 text-gray-400" />
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="ml-1 h-3 w-3 text-primary-600" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3 text-primary-600" />
    )
  }

  // Bulk selection handlers
  const isAllSelected =
    paginatedAppointments.length > 0 &&
    paginatedAppointments.every((apt) => selectedIds.has(apt.id))

  const isSomeSelected = selectedIds.size > 0

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const newSet = new Set(selectedIds)
      paginatedAppointments.forEach((apt) => newSet.add(apt.id))
      setSelectedIds(newSet)
    } else {
      const newSet = new Set(selectedIds)
      paginatedAppointments.forEach((apt) => newSet.delete(apt.id))
      setSelectedIds(newSet)
    }
  }

  const handleSelectRow = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds)
    if (checked) {
      newSet.add(id)
    } else {
      newSet.delete(id)
    }
    setSelectedIds(newSet)
  }

  // Bulk delete handler
  const handleBulkDelete = async () => {
    try {
      const ids = Array.from(selectedIds)
      const results = await Promise.allSettled(
        ids.map((id) =>
          fetch(`/api/appointments/${id}`, { method: 'DELETE' })
        )
      )
      const succeeded = results.filter((r) => r.status === 'fulfilled').length
      const failed = results.filter((r) => r.status === 'rejected').length

      if (failed > 0) {
        toast.error(`${failed} appointment(s) failed to delete`)
      }
      if (succeeded > 0) {
        toast.success(`${succeeded} appointment(s) deleted`)
      }

      setSelectedIds(new Set())
      setBulkDeleteOpen(false)
      fetchAppointments()
    } catch (error) {
      toast.error('Failed to delete appointments')
    }
  }

  // Bulk status change handler
  const handleBulkStatusChange = async () => {
    if (!bulkStatus) return

    try {
      const ids = Array.from(selectedIds)
      const results = await Promise.allSettled(
        ids.map((id) =>
          fetch(`/api/appointments/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: bulkStatus }),
          })
        )
      )
      const succeeded = results.filter((r) => r.status === 'fulfilled').length
      const failed = results.filter((r) => r.status === 'rejected').length

      if (failed > 0) {
        toast.error(`${failed} appointment(s) failed to update`)
      }
      if (succeeded > 0) {
        toast.success(`${succeeded} appointment(s) updated to ${bulkStatus}`)
      }

      setSelectedIds(new Set())
      setBulkStatusOpen(false)
      setBulkStatus('')
      fetchAppointments()
    } catch (error) {
      toast.error('Failed to update appointments')
    }
  }

  // Export handlers
  const handleExportCSV = () => {
    const dataToExport = selectedIds.size > 0
      ? sortedAppointments.filter((apt) => selectedIds.has(apt.id))
      : sortedAppointments
    exportToCSV(dataToExport, exportColumns, `appointments-${selectedDate}`)
    toast.success('CSV exported successfully')
  }

  const handleExportPDF = () => {
    const dataToExport = selectedIds.size > 0
      ? sortedAppointments.filter((apt) => selectedIds.has(apt.id))
      : sortedAppointments
    exportToPDF(
      dataToExport,
      exportColumns,
      `appointments-${selectedDate}`,
      `Appointments - ${formatDate(selectedDate)}`
    )
    toast.success('PDF exported successfully')
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
                {selectedIds.size > 0 && (
                  <span className="ml-2 text-xs text-gray-500">
                    ({selectedIds.size} selected)
                  </span>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPDF}>
                <FileText className="mr-2 h-4 w-4" />
                Export as PDF
                {selectedIds.size > 0 && (
                  <span className="ml-2 text-xs text-gray-500">
                    ({selectedIds.size} selected)
                  </span>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Link href="/appointments/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Appointment
            </Button>
          </Link>
        </div>
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

      {/* Bulk Actions Bar */}
      {isSomeSelected && (
        <Card>
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700">
                {selectedIds.size} appointment{selectedIds.size !== 1 ? 's' : ''} selected
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBulkStatusOpen(true)}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Change Status
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setBulkDeleteOpen(true)}
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Delete Selected
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedIds(new Set())}
                >
                  <X className="mr-2 h-4 w-4" />
                  Clear Selection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Appointments Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {formatDate(selectedDate)} - {filteredAppointments.length} Appointment(s)
            {filteredAppointments.length !== appointments.length && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                (filtered from {appointments.length})
              </span>
            )}
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
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]">
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={(checked) =>
                          handleSelectAll(checked as boolean)
                        }
                        aria-label="Select all appointments on this page"
                      />
                    </TableHead>
                    <TableHead>
                      <button
                        className="flex items-center font-medium hover:text-gray-900"
                        onClick={() => handleSort('scheduledTime')}
                      >
                        Time
                        {getSortIcon('scheduledTime')}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        className="flex items-center font-medium hover:text-gray-900"
                        onClick={() => handleSort('pet')}
                      >
                        Pet
                        {getSortIcon('pet')}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        className="flex items-center font-medium hover:text-gray-900"
                        onClick={() => handleSort('client')}
                      >
                        Client
                        {getSortIcon('client')}
                      </button>
                    </TableHead>
                    <TableHead>Services</TableHead>
                    <TableHead>
                      <button
                        className="flex items-center font-medium hover:text-gray-900"
                        onClick={() => handleSort('groomer')}
                      >
                        Groomer
                        {getSortIcon('groomer')}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        className="flex items-center font-medium hover:text-gray-900"
                        onClick={() => handleSort('status')}
                      >
                        Status
                        {getSortIcon('status')}
                      </button>
                    </TableHead>
                    <TableHead className="w-[70px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedAppointments.map((apt) => (
                    <TableRow
                      key={apt.id}
                      className={`cursor-pointer hover:bg-gray-50 ${
                        selectedIds.has(apt.id) ? 'bg-primary-50' : ''
                      }`}
                      onClick={() => router.push(`/appointments/${apt.id}`)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedIds.has(apt.id)}
                          onCheckedChange={(checked) =>
                            handleSelectRow(apt.id, checked as boolean)
                          }
                          aria-label={`Select appointment for ${apt.pet.name}`}
                        />
                      </TableCell>
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

              {/* Pagination Controls */}
              <div className="flex items-center justify-between border-t pt-4 mt-4">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-500">Rows per page:</p>
                  <Select
                    value={String(pageSize)}
                    onValueChange={(val) => setPageSize(Number(val))}
                  >
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
                  <p className="text-sm text-gray-500 ml-4">
                    Showing {totalItems === 0 ? 0 : (page - 1) * pageSize + 1}-
                    {Math.min(page * pageSize, totalItems)} of {totalItems}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => {
                      // Show first, last, current, and neighbors
                      if (p === 1 || p === totalPages) return true
                      if (Math.abs(p - page) <= 1) return true
                      return false
                    })
                    .reduce<(number | 'ellipsis')[]>((acc, p, idx, arr) => {
                      if (idx > 0) {
                        const prev = arr[idx - 1]
                        if (p - prev > 1) {
                          acc.push('ellipsis')
                        }
                      }
                      acc.push(p)
                      return acc
                    }, [])
                    .map((item, idx) =>
                      item === 'ellipsis' ? (
                        <span
                          key={`ellipsis-${idx}`}
                          className="px-1 text-sm text-gray-400"
                        >
                          ...
                        </span>
                      ) : (
                        <Button
                          key={item}
                          variant={page === item ? 'default' : 'outline'}
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setPage(item)}
                        >
                          {item}
                        </Button>
                      )
                    )}
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Appointments</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedIds.size} selected appointment
              {selectedIds.size !== 1 ? 's' : ''}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBulkDelete}>
              <Trash className="mr-2 h-4 w-4" />
              Delete {selectedIds.size} Appointment{selectedIds.size !== 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Status Change Dialog */}
      <Dialog open={bulkStatusOpen} onOpenChange={setBulkStatusOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Status</DialogTitle>
            <DialogDescription>
              Select a new status for {selectedIds.size} selected appointment
              {selectedIds.size !== 1 ? 's' : ''}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={bulkStatus} onValueChange={setBulkStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select new status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                <SelectItem value="CHECKED_IN">Checked In</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                <SelectItem value="NO_SHOW">No Show</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setBulkStatusOpen(false)
                setBulkStatus('')
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleBulkStatusChange} disabled={!bulkStatus}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
