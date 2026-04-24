'use client'

import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Plus,
  Edit,
  Trash,
  Search,
  X,
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
} from 'lucide-react'
import { TableLoading } from '@/components/ui/loading'
import { formatCurrency } from '@/lib/utils'
import { exportToCSV, exportToPDF } from '@/lib/export'
import toast from 'react-hot-toast'

interface Service {
  id: string
  name: string
  description: string | null
  category: string
  basePrice: number
  baseDuration: number
  isActive: boolean
  isAddOn: boolean
}

type SortField = 'name' | 'category' | 'baseDuration' | 'basePrice' | 'isActive'
type SortOrder = 'asc' | 'desc'

const categories = [
  { value: 'BATH', label: 'Bath' },
  { value: 'HAIRCUT', label: 'Haircut' },
  { value: 'STYLING', label: 'Styling' },
  { value: 'NAIL_CARE', label: 'Nail Care' },
  { value: 'EAR_CARE', label: 'Ear Care' },
  { value: 'TEETH_CARE', label: 'Teeth Care' },
  { value: 'SPECIALTY', label: 'Specialty' },
  { value: 'ADD_ON', label: 'Add-On' },
]

const exportColumns = [
  { header: 'Name', accessor: 'name' },
  { header: 'Category', accessor: (row: Service) => row.category.replace('_', ' ') },
  { header: 'Duration', accessor: (row: Service) => `${row.baseDuration} min` },
  { header: 'Price', accessor: (row: Service) => `$${row.basePrice.toFixed(2)}` },
  { header: 'Status', accessor: (row: Service) => (row.isActive ? 'Active' : 'Inactive') },
  { header: 'Add-On', accessor: (row: Service) => (row.isAddOn ? 'Yes' : 'No') },
]

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [search, setSearch] = useState('')
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'BATH',
    basePrice: 0,
    baseDuration: 30,
    isActive: true,
    isAddOn: false,
  })

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')

  // Pagination state
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Export dropdown state
  const [exportOpen, setExportOpen] = useState(false)

  const filteredServices = useMemo(() => {
    return services.filter(
      (service) =>
        search === '' ||
        service.name.toLowerCase().includes(search.toLowerCase()) ||
        service.category.toLowerCase().includes(search.toLowerCase()) ||
        (service.description &&
          service.description.toLowerCase().includes(search.toLowerCase()))
    )
  }, [services, search])

  // Sorted services
  const sortedServices = useMemo(() => {
    const sorted = [...filteredServices].sort((a, b) => {
      let aVal: string | number | boolean
      let bVal: string | number | boolean

      switch (sortField) {
        case 'name':
          aVal = a.name.toLowerCase()
          bVal = b.name.toLowerCase()
          break
        case 'category':
          aVal = a.category.toLowerCase()
          bVal = b.category.toLowerCase()
          break
        case 'baseDuration':
          aVal = a.baseDuration
          bVal = b.baseDuration
          break
        case 'basePrice':
          aVal = a.basePrice
          bVal = b.basePrice
          break
        case 'isActive':
          aVal = a.isActive ? 1 : 0
          bVal = b.isActive ? 1 : 0
          break
        default:
          return 0
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
      return 0
    })
    return sorted
  }, [filteredServices, sortField, sortOrder])

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(sortedServices.length / pageSize))
  const paginatedServices = useMemo(() => {
    const start = (page - 1) * pageSize
    return sortedServices.slice(start, start + pageSize)
  }, [sortedServices, page, pageSize])

  // Reset page when search or pageSize changes
  useEffect(() => {
    setPage(1)
  }, [search, pageSize])

  // Clear selection when services change
  useEffect(() => {
    setSelectedIds(new Set())
  }, [services])

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      const res = await fetch('/api/services')
      if (res.ok) {
        const data = await res.json()
        setServices(data)
      }
    } catch (error) {
      console.error('Failed to fetch services:', error)
      toast.error('Failed to fetch services')
    } finally {
      setLoading(false)
    }
  }

  const openDialog = (service?: Service) => {
    if (service) {
      setEditingService(service)
      setFormData({
        name: service.name,
        description: service.description || '',
        category: service.category,
        basePrice: service.basePrice,
        baseDuration: service.baseDuration,
        isActive: service.isActive,
        isAddOn: service.isAddOn,
      })
    } else {
      setEditingService(null)
      setFormData({
        name: '',
        description: '',
        category: 'BATH',
        basePrice: 0,
        baseDuration: 30,
        isActive: true,
        isAddOn: false,
      })
    }
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    try {
      const url = editingService
        ? `/api/services/${editingService.id}`
        : '/api/services'
      const method = editingService ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        toast.success(editingService ? 'Service updated' : 'Service created')
        setDialogOpen(false)
        fetchServices()
      } else {
        toast.error('Failed to save service')
      }
    } catch (error) {
      toast.error('Failed to save service')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return

    try {
      const res = await fetch(`/api/services/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Service deleted')
        fetchServices()
      } else {
        toast.error('Failed to delete service')
      }
    } catch (error) {
      toast.error('Failed to delete service')
    }
  }

  // Sorting handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="ml-1 h-3 w-3 inline" />
    if (sortOrder === 'asc') return <ArrowUp className="ml-1 h-3 w-3 inline" />
    return <ArrowDown className="ml-1 h-3 w-3 inline" />
  }

  // Bulk selection handlers
  const allPageSelected =
    paginatedServices.length > 0 &&
    paginatedServices.every((s) => selectedIds.has(s.id))

  const somePageSelected =
    paginatedServices.some((s) => selectedIds.has(s.id)) && !allPageSelected

  const handleSelectAll = (checked: boolean) => {
    const newSet = new Set(selectedIds)
    if (checked) {
      paginatedServices.forEach((s) => newSet.add(s.id))
    } else {
      paginatedServices.forEach((s) => newSet.delete(s.id))
    }
    setSelectedIds(newSet)
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds)
    if (checked) {
      newSet.add(id)
    } else {
      newSet.delete(id)
    }
    setSelectedIds(newSet)
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return
    if (
      !confirm(
        `Are you sure you want to delete ${selectedIds.size} service${selectedIds.size > 1 ? 's' : ''}?`
      )
    )
      return

    try {
      const deletePromises = Array.from(selectedIds).map((id) =>
        fetch(`/api/services/${id}`, { method: 'DELETE' })
      )
      const results = await Promise.all(deletePromises)
      const successCount = results.filter((r) => r.ok).length
      const failCount = results.length - successCount

      if (successCount > 0) {
        toast.success(`${successCount} service${successCount > 1 ? 's' : ''} deleted`)
      }
      if (failCount > 0) {
        toast.error(`Failed to delete ${failCount} service${failCount > 1 ? 's' : ''}`)
      }

      setSelectedIds(new Set())
      fetchServices()
    } catch (error) {
      toast.error('Failed to delete services')
    }
  }

  // Export handlers
  const handleExportCSV = () => {
    exportToCSV(sortedServices, exportColumns, 'services')
    setExportOpen(false)
    toast.success('CSV exported')
  }

  const handleExportPDF = () => {
    exportToPDF(sortedServices, exportColumns, 'services', 'Services List')
    setExportOpen(false)
    toast.success('PDF exported')
  }

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      BATH: 'bg-blue-100 text-blue-800',
      HAIRCUT: 'bg-purple-100 text-purple-800',
      STYLING: 'bg-pink-100 text-pink-800',
      NAIL_CARE: 'bg-orange-100 text-orange-800',
      EAR_CARE: 'bg-yellow-100 text-yellow-800',
      TEETH_CARE: 'bg-green-100 text-green-800',
      SPECIALTY: 'bg-red-100 text-red-800',
      ADD_ON: 'bg-gray-100 text-gray-800',
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[category]}`}>
        {category.replace('_', ' ')}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Services</h1>
          <p className="text-gray-500">Manage grooming services and pricing</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Export Dropdown */}
          <div className="relative">
            <Button
              variant="outline"
              onClick={() => setExportOpen(!exportOpen)}
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            {exportOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                <button
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={handleExportCSV}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Export as CSV
                </button>
                <button
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={handleExportPDF}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Export as PDF
                </button>
              </div>
            )}
          </div>
          <Button onClick={() => openDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Add Service
          </Button>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
          <span className="text-sm font-medium text-blue-800">
            {selectedIds.size} service{selectedIds.size > 1 ? 's' : ''} selected
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDelete}
          >
            <Trash className="mr-2 h-4 w-4" />
            Delete Selected
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedIds(new Set())}
          >
            Clear Selection
          </Button>
        </div>
      )}

      {/* Services Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Services ({services.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableLoading />
          ) : (
            <>
              {services.length > 5 && (
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search by name, category, or description..."
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
              )}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]">
                      <Checkbox
                        checked={allPageSelected}
                        ref={(el) => {
                          if (el) {
                            (el as HTMLButtonElement).dataset.state = somePageSelected
                              ? 'indeterminate'
                              : allPageSelected
                                ? 'checked'
                                : 'unchecked'
                          }
                        }}
                        onCheckedChange={(checked) => handleSelectAll(!!checked)}
                      />
                    </TableHead>
                    <TableHead>
                      <button
                        className="flex items-center font-medium hover:text-gray-900"
                        onClick={() => handleSort('name')}
                      >
                        Service
                        {getSortIcon('name')}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        className="flex items-center font-medium hover:text-gray-900"
                        onClick={() => handleSort('category')}
                      >
                        Category
                        {getSortIcon('category')}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        className="flex items-center font-medium hover:text-gray-900"
                        onClick={() => handleSort('baseDuration')}
                      >
                        Duration
                        {getSortIcon('baseDuration')}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        className="flex items-center font-medium hover:text-gray-900"
                        onClick={() => handleSort('basePrice')}
                      >
                        Price
                        {getSortIcon('basePrice')}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        className="flex items-center font-medium hover:text-gray-900"
                        onClick={() => handleSort('isActive')}
                      >
                        Status
                        {getSortIcon('isActive')}
                      </button>
                    </TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedServices.map((service) => (
                    <TableRow
                      key={service.id}
                      className={`cursor-pointer hover:bg-gray-50 ${
                        selectedIds.has(service.id) ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => setSelectedService(service)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedIds.has(service.id)}
                          onCheckedChange={(checked) =>
                            handleSelectOne(service.id, !!checked)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{service.name}</p>
                          {service.description && (
                            <p className="text-sm text-gray-500">{service.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getCategoryBadge(service.category)}</TableCell>
                      <TableCell>{service.baseDuration} min</TableCell>
                      <TableCell>{formatCurrency(service.basePrice)}</TableCell>
                      <TableCell>
                        <Badge variant={service.isActive ? 'success' : 'secondary'}>
                          {service.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDialog(service)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(service.id)}
                          >
                            <Trash className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredServices.length === 0 && search && (
                <p className="text-center py-4 text-gray-500">No services found</p>
              )}

              {/* Pagination Controls */}
              {sortedServices.length > 0 && (
                <div className="flex items-center justify-between border-t pt-4 mt-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>Rows per page:</span>
                    <Select
                      value={String(pageSize)}
                      onValueChange={(value) => setPageSize(Number(value))}
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
                    <span className="ml-2">
                      {(page - 1) * pageSize + 1}-
                      {Math.min(page * pageSize, sortedServices.length)} of{' '}
                      {sortedServices.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      disabled={page <= 1}
                      onClick={() => setPage(page - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-gray-600">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      disabled={page >= totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingService ? 'Edit Service' : 'Add New Service'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Duration (minutes)</Label>
                <Input
                  type="number"
                  value={formData.baseDuration}
                  onChange={(e) =>
                    setFormData({ ...formData, baseDuration: parseInt(e.target.value) })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Base Price ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.basePrice}
                onChange={(e) =>
                  setFormData({ ...formData, basePrice: parseFloat(e.target.value) })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isActive: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Is Add-On Service</Label>
              <Switch
                checked={formData.isAddOn}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isAddOn: checked })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingService ? 'Save Changes' : 'Create Service'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Service Detail Dialog */}
      <Dialog open={!!selectedService} onOpenChange={() => setSelectedService(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Service Details</DialogTitle>
          </DialogHeader>
          {selectedService && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">{selectedService.name}</h3>
                <Badge variant={selectedService.isActive ? 'success' : 'secondary'}>
                  {selectedService.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              {selectedService.description && (
                <p className="text-gray-600">{selectedService.description}</p>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Category</p>
                  {getCategoryBadge(selectedService.category)}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Duration</p>
                  <p className="font-medium">{selectedService.baseDuration} minutes</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Price</p>
                  <p className="font-medium">{formatCurrency(selectedService.basePrice)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Type</p>
                  <p className="font-medium">
                    {selectedService.isAddOn ? 'Add-On Service' : 'Main Service'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    openDialog(selectedService)
                    setSelectedService(null)
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    handleDelete(selectedService.id)
                    setSelectedService(null)
                  }}
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
