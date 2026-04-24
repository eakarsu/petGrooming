'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import {
  Plus,
  Edit,
  Trash,
  Package,
  AlertTriangle,
  Search,
  X,
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

interface Product {
  id: string
  name: string
  description: string | null
  sku: string
  category: string
  price: number
  cost: number | null
  quantity: number
  reorderLevel: number
  isActive: boolean
}

const categories = [
  { value: 'SHAMPOO', label: 'Shampoo' },
  { value: 'CONDITIONER', label: 'Conditioner' },
  { value: 'BRUSH', label: 'Brush' },
  { value: 'COLLAR', label: 'Collar' },
  { value: 'LEASH', label: 'Leash' },
  { value: 'TOY', label: 'Toy' },
  { value: 'TREAT', label: 'Treat' },
  { value: 'ACCESSORY', label: 'Accessory' },
  { value: 'OTHER', label: 'Other' },
]

const exportColumns = [
  { header: 'Name', accessor: 'name' },
  { header: 'SKU', accessor: 'sku' },
  { header: 'Category', accessor: 'category' },
  { header: 'Price', accessor: (row: Product) => formatCurrency(row.price) },
  { header: 'Cost', accessor: (row: Product) => row.cost ? formatCurrency(row.cost) : '' },
  { header: 'Stock', accessor: (row: Product) => String(row.quantity) },
  { header: 'Reorder Level', accessor: (row: Product) => String(row.reorderLevel) },
  { header: 'Status', accessor: (row: Product) => (row.isActive ? 'Active' : 'Inactive') },
]

type SortField = 'name' | 'sku' | 'category' | 'price' | 'quantity' | 'isActive'
type SortOrder = 'asc' | 'desc'

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [search, setSearch] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sku: '',
    category: 'OTHER',
    price: 0,
    cost: 0,
    quantity: 0,
    reorderLevel: 5,
    isActive: true,
  })

  // Pagination state
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Sorting state
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Export dropdown state
  const [exportOpen, setExportOpen] = useState(false)

  const filteredProducts = products.filter(
    (product) =>
      search === '' ||
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.sku.toLowerCase().includes(search.toLowerCase()) ||
      product.category.toLowerCase().includes(search.toLowerCase()) ||
      (product.description &&
        product.description.toLowerCase().includes(search.toLowerCase()))
  )

  // Sort filtered products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (!sortField) return 0

    let aVal: string | number | boolean = a[sortField]
    let bVal: string | number | boolean = b[sortField]

    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase()
      bVal = (bVal as string).toLowerCase()
    }

    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
    return 0
  })

  // Paginate sorted products
  const totalPages = Math.max(1, Math.ceil(sortedProducts.length / pageSize))
  const paginatedProducts = sortedProducts.slice(
    (page - 1) * pageSize,
    page * pageSize
  )

  // Reset to page 1 when search or pageSize changes
  useEffect(() => {
    setPage(1)
  }, [search, pageSize])

  // Clear selection when data changes
  useEffect(() => {
    setSelectedIds(new Set())
  }, [products, search])

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products')
      if (res.ok) {
        const data = await res.json()
        setProducts(data)
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
      toast.error('Failed to fetch products')
    } finally {
      setLoading(false)
    }
  }

  const openDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product)
      setFormData({
        name: product.name,
        description: product.description || '',
        sku: product.sku,
        category: product.category,
        price: product.price,
        cost: product.cost || 0,
        quantity: product.quantity,
        reorderLevel: product.reorderLevel,
        isActive: product.isActive,
      })
    } else {
      setEditingProduct(null)
      setFormData({
        name: '',
        description: '',
        sku: `PRD-${Date.now().toString().slice(-6)}`,
        category: 'OTHER',
        price: 0,
        cost: 0,
        quantity: 0,
        reorderLevel: 5,
        isActive: true,
      })
    }
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    try {
      const url = editingProduct
        ? `/api/products/${editingProduct.id}`
        : '/api/products'
      const method = editingProduct ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        toast.success(editingProduct ? 'Product updated' : 'Product created')
        setDialogOpen(false)
        fetchProducts()
      } else {
        toast.error('Failed to save product')
      }
    } catch (error) {
      toast.error('Failed to save product')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return

    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Product deleted')
        fetchProducts()
      } else {
        toast.error('Failed to delete product')
      }
    } catch (error) {
      toast.error('Failed to delete product')
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return
    if (
      !confirm(
        `Are you sure you want to delete ${selectedIds.size} product(s)?`
      )
    )
      return

    try {
      const deletePromises = Array.from(selectedIds).map((id) =>
        fetch(`/api/products/${id}`, { method: 'DELETE' })
      )
      const results = await Promise.all(deletePromises)
      const successCount = results.filter((r) => r.ok).length
      const failCount = results.length - successCount

      if (successCount > 0) {
        toast.success(`${successCount} product(s) deleted`)
      }
      if (failCount > 0) {
        toast.error(`Failed to delete ${failCount} product(s)`)
      }

      setSelectedIds(new Set())
      fetchProducts()
    } catch (error) {
      toast.error('Failed to delete products')
    }
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-1 h-3 w-3 text-gray-400" />
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="ml-1 h-3 w-3" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3" />
    )
  }

  const toggleSelectAll = () => {
    const currentPageIds = paginatedProducts.map((p) => p.id)
    const allSelected = currentPageIds.every((id) => selectedIds.has(id))

    const newSelected = new Set(selectedIds)
    if (allSelected) {
      currentPageIds.forEach((id) => newSelected.delete(id))
    } else {
      currentPageIds.forEach((id) => newSelected.add(id))
    }
    setSelectedIds(newSelected)
  }

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const handleExportCSV = () => {
    exportToCSV(filteredProducts, exportColumns, 'products')
    setExportOpen(false)
    toast.success('CSV exported')
  }

  const handleExportPDF = () => {
    exportToPDF(filteredProducts, exportColumns, 'products', 'Products Report')
    setExportOpen(false)
    toast.success('PDF exported')
  }

  const allOnPageSelected =
    paginatedProducts.length > 0 &&
    paginatedProducts.every((p) => selectedIds.has(p.id))

  const lowStockProducts = products.filter((p) => p.quantity <= p.reorderLevel)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500">Manage retail products and inventory</p>
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
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setExportOpen(false)}
                />
                <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-md border bg-white shadow-lg">
                  <button
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100"
                    onClick={handleExportCSV}
                  >
                    <FileText className="h-4 w-4" />
                    Export as CSV
                  </button>
                  <button
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100"
                    onClick={handleExportPDF}
                  >
                    <FileText className="h-4 w-4" />
                    Export as PDF
                  </button>
                </div>
              </>
            )}
          </div>
          <Button onClick={() => openDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800">Low Stock Alert</p>
                <p className="text-sm text-yellow-600">
                  {lowStockProducts.length} product(s) are at or below reorder
                  level
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-100 p-2">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{products.length}</p>
                <p className="text-sm text-gray-500">Total Products</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-green-100 p-2">
                <Package className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {products.filter((p) => p.isActive).length}
                </p>
                <p className="text-sm text-gray-500">Active Products</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-yellow-100 p-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{lowStockProducts.length}</p>
                <p className="text-sm text-gray-500">Low Stock</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="flex items-center justify-between p-4">
            <p className="text-sm font-medium text-blue-800">
              {selectedIds.size} product(s) selected
            </p>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
            >
              <Trash className="mr-2 h-4 w-4" />
              Delete Selected
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Products</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableLoading />
          ) : products.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="mx-auto h-12 w-12 mb-2" />
              <p>No products yet</p>
              <Button variant="link" onClick={() => openDialog()}>
                Add your first product
              </Button>
            </div>
          ) : (
            <>
              {products.length > 5 && (
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search by name, SKU, or category..."
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
                        checked={allOnPageSelected}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead>
                      <button
                        className="flex items-center font-medium"
                        onClick={() => handleSort('name')}
                      >
                        Product
                        {getSortIcon('name')}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        className="flex items-center font-medium"
                        onClick={() => handleSort('sku')}
                      >
                        SKU
                        {getSortIcon('sku')}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        className="flex items-center font-medium"
                        onClick={() => handleSort('category')}
                      >
                        Category
                        {getSortIcon('category')}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        className="flex items-center font-medium"
                        onClick={() => handleSort('price')}
                      >
                        Price
                        {getSortIcon('price')}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        className="flex items-center font-medium"
                        onClick={() => handleSort('quantity')}
                      >
                        Stock
                        {getSortIcon('quantity')}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        className="flex items-center font-medium"
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
                  {paginatedProducts.map((product) => (
                    <TableRow
                      key={product.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => setSelectedProduct(product)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedIds.has(product.id)}
                          onCheckedChange={() => toggleSelect(product.id)}
                          aria-label={`Select ${product.name}`}
                        />
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{product.name}</p>
                        {product.description && (
                          <p className="text-sm text-gray-500 truncate max-w-xs">
                            {product.description}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {product.sku}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{product.category}</Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(product.price)}</TableCell>
                      <TableCell>
                        <span
                          className={
                            product.quantity <= product.reorderLevel
                              ? 'text-red-600 font-medium'
                              : ''
                          }
                        >
                          {product.quantity}
                        </span>
                        {product.quantity <= product.reorderLevel && (
                          <Badge variant="warning" className="ml-2">
                            Low
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            product.isActive ? 'success' : 'secondary'
                          }
                        >
                          {product.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDialog(product)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(product.id)}
                          >
                            <Trash className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredProducts.length === 0 && search && (
                <p className="text-center py-4 text-gray-500">
                  No products found
                </p>
              )}

              {/* Pagination Controls */}
              {sortedProducts.length > 0 && (
                <div className="flex items-center justify-between border-t pt-4 mt-4">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-gray-500">Rows per page:</p>
                    <Select
                      value={String(pageSize)}
                      onValueChange={(value) => setPageSize(Number(value))}
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
                      Showing {(page - 1) * pageSize + 1}-
                      {Math.min(page * pageSize, sortedProducts.length)} of{' '}
                      {sortedProducts.length}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <p className="text-sm text-gray-600 min-w-[80px] text-center">
                      Page {page} of {totalPages}
                    </p>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={page === totalPages}
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>SKU *</Label>
                <Input
                  value={formData.sku}
                  onChange={(e) =>
                    setFormData({ ...formData, sku: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
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
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Price ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price: parseFloat(e.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Cost ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      cost: parseFloat(e.target.value),
                    })
                  }
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      quantity: parseInt(e.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Reorder Level</Label>
                <Input
                  type="number"
                  value={formData.reorderLevel}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      reorderLevel: parseInt(e.target.value),
                    })
                  }
                />
              </div>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingProduct ? 'Save Changes' : 'Create Product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product Detail Dialog */}
      <Dialog
        open={!!selectedProduct}
        onOpenChange={() => setSelectedProduct(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">{selectedProduct.name}</h3>
                <Badge
                  variant={
                    selectedProduct.isActive ? 'success' : 'secondary'
                  }
                >
                  {selectedProduct.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              {selectedProduct.description && (
                <p className="text-gray-600">{selectedProduct.description}</p>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">SKU</p>
                  <p className="font-mono font-medium">
                    {selectedProduct.sku}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Category</p>
                  <Badge variant="outline">{selectedProduct.category}</Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Price</p>
                  <p className="font-medium">
                    {formatCurrency(selectedProduct.price)}
                  </p>
                </div>
                {selectedProduct.cost && (
                  <div>
                    <p className="text-sm text-gray-500">Cost</p>
                    <p className="font-medium">
                      {formatCurrency(selectedProduct.cost)}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500">Stock Quantity</p>
                  <p
                    className={`font-medium ${
                      selectedProduct.quantity <=
                      selectedProduct.reorderLevel
                        ? 'text-red-600'
                        : ''
                    }`}
                  >
                    {selectedProduct.quantity}
                    {selectedProduct.quantity <=
                      selectedProduct.reorderLevel && (
                      <Badge variant="warning" className="ml-2">
                        Low Stock
                      </Badge>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Reorder Level</p>
                  <p className="font-medium">
                    {selectedProduct.reorderLevel}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    openDialog(selectedProduct)
                    setSelectedProduct(null)
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    const id = selectedProduct.id
                    setSelectedProduct(null)
                    handleDelete(id)
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
