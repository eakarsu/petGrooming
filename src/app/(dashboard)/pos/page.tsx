'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DollarSign,
  CreditCard,
  Gift,
  Trash,
  Plus,
  Minus,
  ShoppingCart,
  User,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'

interface Client {
  id: string
  firstName: string
  lastName: string
  loyaltyPoints: number
}

interface Service {
  id: string
  name: string
  basePrice: number
  category: string
}

interface Product {
  id: string
  name: string
  price: number
  category: string
}

interface CartItem {
  id: string
  name: string
  type: 'SERVICE' | 'PRODUCT'
  price: number
  quantity: number
}

interface BusinessSettings {
  taxRate: number
  loyaltyPointsPerDollar: number
  loyaltyPointsValue: number
}

export default function POSPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [settings, setSettings] = useState<BusinessSettings>({ taxRate: 8, loyaltyPointsPerDollar: 1, loyaltyPointsValue: 0.01 })
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [tip, setTip] = useState(0)
  const [discount, setDiscount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('CREDIT_CARD')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [clientsRes, servicesRes, productsRes, settingsRes] = await Promise.all([
        fetch('/api/clients?limit=100'),
        fetch('/api/services?active=true'),
        fetch('/api/products?active=true'),
        fetch('/api/settings'),
      ])

      if (clientsRes.ok) {
        const data = await clientsRes.json()
        setClients(data.clients)
      }
      if (servicesRes.ok) {
        const data = await servicesRes.json()
        setServices(data)
      }
      if (productsRes.ok) {
        const data = await productsRes.json()
        setProducts(data)
      }
      if (settingsRes.ok) {
        const data = await settingsRes.json()
        setSettings({
          taxRate: data.taxRate || 8,
          loyaltyPointsPerDollar: data.loyaltyPointsPerDollar || 1,
          loyaltyPointsValue: data.loyaltyPointsValue || 0.01,
        })
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    }
  }

  const addToCart = (item: Service | Product, type: 'SERVICE' | 'PRODUCT') => {
    const existing = cart.find((c) => c.id === item.id && c.type === type)
    if (existing) {
      setCart(
        cart.map((c) =>
          c.id === item.id && c.type === type ? { ...c, quantity: c.quantity + 1 } : c
        )
      )
    } else {
      setCart([
        ...cart,
        {
          id: item.id,
          name: item.name,
          type,
          price: type === 'SERVICE' ? (item as Service).basePrice : (item as Product).price,
          quantity: 1,
        },
      ])
    }
  }

  const updateQuantity = (id: string, type: string, delta: number) => {
    setCart(
      cart
        .map((item) => {
          if (item.id === id && item.type === type) {
            const newQty = item.quantity + delta
            return newQty > 0 ? { ...item, quantity: newQty } : null
          }
          return item
        })
        .filter(Boolean) as CartItem[]
    )
  }

  const removeFromCart = (id: string, type: string) => {
    setCart(cart.filter((item) => !(item.id === id && item.type === type)))
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const discountAmount = subtotal * (discount / 100)
  const taxRate = settings.taxRate / 100 // Convert percentage to decimal
  const tax = (subtotal - discountAmount) * taxRate
  const total = subtotal - discountAmount + tax + tip

  const processPayment = async () => {
    if (!selectedClient) {
      toast.error('Please select a client')
      return
    }
    if (cart.length === 0) {
      toast.error('Cart is empty')
      return
    }

    setProcessing(true)
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClient.id,
          items: cart,
          subtotal,
          tax,
          discount: discountAmount,
          tip,
          total,
          paymentMethod,
        }),
      })

      if (res.ok) {
        toast.success('Payment processed successfully!')
        setCart([])
        setSelectedClient(null)
        setTip(0)
        setDiscount(0)
      } else {
        toast.error('Payment failed')
      }
    } catch (error) {
      toast.error('Payment failed')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Point of Sale</h1>
        <p className="text-gray-500">Process payments and manage transactions</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Products/Services Selection */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Services & Products</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="services">
                <TabsList>
                  <TabsTrigger value="services">Services</TabsTrigger>
                  <TabsTrigger value="products">Products</TabsTrigger>
                </TabsList>

                <TabsContent value="services" className="mt-4">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {services.map((service) => (
                      <Card
                        key={service.id}
                        className="cursor-pointer transition-shadow hover:shadow-md"
                        onClick={() => addToCart(service, 'SERVICE')}
                      >
                        <CardContent className="p-4">
                          <p className="font-medium">{service.name}</p>
                          <p className="text-sm text-gray-500">{service.category}</p>
                          <p className="mt-2 font-bold text-primary-600">
                            {formatCurrency(service.basePrice)}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="products" className="mt-4">
                  {products.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No products available</p>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {products.map((product) => (
                        <Card
                          key={product.id}
                          className="cursor-pointer transition-shadow hover:shadow-md"
                          onClick={() => addToCart(product, 'PRODUCT')}
                        >
                          <CardContent className="p-4">
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-gray-500">{product.category}</p>
                            <p className="mt-2 font-bold text-primary-600">
                              {formatCurrency(product.price)}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Cart & Checkout */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Cart
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Client Selection */}
            <div className="space-y-2">
              <Label>Client *</Label>
              <Select
                value={selectedClient?.id || ''}
                onValueChange={(value) =>
                  setSelectedClient(clients.find((c) => c.id === value) || null)
                }
              >
                <SelectTrigger>
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
              {selectedClient && (
                <p className="text-sm text-gray-500">
                  Loyalty Points: {selectedClient.loyaltyPoints}
                </p>
              )}
            </div>

            {/* Cart Items */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {cart.length === 0 ? (
                <p className="text-center text-gray-500 py-4">Cart is empty</p>
              ) : (
                cart.map((item) => (
                  <div
                    key={`${item.type}-${item.id}`}
                    className="flex items-center justify-between rounded-lg border p-2"
                  >
                    <div>
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-gray-500">
                        {formatCurrency(item.price)} x {item.quantity}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => updateQuantity(item.id, item.type, -1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-sm">{item.quantity}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => updateQuantity(item.id, item.type, 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-red-500"
                        onClick={() => removeFromCart(item.id, item.type)}
                      >
                        <Trash className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Discount & Tip */}
            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">Discount %</Label>
                <Input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  min={0}
                  max={100}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Tip $</Label>
                <Input
                  type="number"
                  value={tip}
                  onChange={(e) => setTip(parseFloat(e.target.value) || 0)}
                  min={0}
                />
              </div>
            </div>

            {/* Totals */}
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount ({discount}%)</span>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span>Tax ({settings.taxRate}%)</span>
                <span>{formatCurrency(tax)}</span>
              </div>
              {tip > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Tip</span>
                  <span>{formatCurrency(tip)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
                  <SelectItem value="DEBIT_CARD">Debit Card</SelectItem>
                  <SelectItem value="GIFT_CARD">Gift Card</SelectItem>
                  <SelectItem value="CHECK">Check</SelectItem>
                  <SelectItem value="LOYALTY_POINTS">Loyalty Points</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Process Payment */}
            <Button
              className="w-full"
              size="lg"
              onClick={processPayment}
              disabled={processing || cart.length === 0 || !selectedClient}
              loading={processing}
            >
              <CreditCard className="mr-2 h-5 w-5" />
              Process Payment
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
