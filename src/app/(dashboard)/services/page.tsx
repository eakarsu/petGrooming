'use client'

import { useEffect, useState } from 'react'
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
import { Plus, Edit, Trash, Search, X, Eye } from 'lucide-react'
import { TableLoading } from '@/components/ui/loading'
import { formatCurrency } from '@/lib/utils'
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

  const filteredServices = services.filter((service) =>
    search === '' ||
    service.name.toLowerCase().includes(search.toLowerCase()) ||
    service.category.toLowerCase().includes(search.toLowerCase()) ||
    (service.description && service.description.toLowerCase().includes(search.toLowerCase()))
  )

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
        <Button onClick={() => openDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Service
        </Button>
      </div>

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
                    <TableHead>Service</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredServices.map((service) => (
                    <TableRow
                      key={service.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => setSelectedService(service)}
                    >
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
                  <p className="font-medium">{selectedService.isAddOn ? 'Add-On Service' : 'Main Service'}</p>
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
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
