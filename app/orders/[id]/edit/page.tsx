// app/orders/[id]/edit/page.tsx
'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'

interface Product {
  id: string
  name: string
  isActive: boolean
  variants: Variant[]
}

interface Variant {
  id: string
  size: string
  sellingPrice: number
  costPrice: number
  stock: number
}

interface OrderItem {
  productVariantId: string
  variantLabel: string
  quantity: number
  unitPrice: number
  costPriceAtSale: number
}

interface Customer {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
}

interface ExistingOrder {
  id: string
  customerId: string | null
  customerName: string
  customerEmail: string | null
  customerPhone: string | null
  customerAddress: string | null
  salesChannel: string
  date: string
  tags: string | null
  paymentMethod: string | null
  status: string
  items: Array<{
    id: string
    quantity: number
    unitPrice: number
    costPriceAtSale: number
    productVariant: {
      id: string
      size: string
      product: {
        id: string
        name: string
      }
    }
  }>
}

export default function EditOrderPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const customerInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    salesChannel: 'STAND' as 'STAND' | 'SITE' | 'PRECOMMANDE' | 'AUTRE',
    date: format(new Date(), 'yyyy-MM-dd'),
    tags: [] as string[],
    paymentMethod: '' as 'TWINT' | 'CASH' | 'AUTRE' | '',
  })
  const [items, setItems] = useState<OrderItem[]>([])
  const [selectedVariantId, setSelectedVariantId] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [customPrice, setCustomPrice] = useState<number | null>(null)

  useEffect(() => {
    fetchProducts()
    fetchCustomers()
    fetchOrder()
  }, [])

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products')
      const data = await res.json()
      setProducts(data.filter((p: Product) => p.isActive && p.variants.length > 0))
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers')
      const data = await res.json()
      setCustomers(data)
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${params.id}`)
      if (res.ok) {
        const order: ExistingOrder = await res.json()

        if (order.status !== 'DRAFT') {
          alert('Seules les commandes en brouillon peuvent être modifiées')
          router.push('/orders')
          return
        }

        setFormData({
          customerName: order.customerName,
          customerEmail: order.customerEmail || '',
          customerPhone: order.customerPhone || '',
          customerAddress: order.customerAddress || '',
          salesChannel: order.salesChannel as any,
          date: format(new Date(order.date), 'yyyy-MM-dd'),
          tags: order.tags ? order.tags.split(',') : [],
          paymentMethod: order.paymentMethod as any || '',
        })

        setSelectedCustomerId(order.customerId)

        const orderItems: OrderItem[] = order.items.map(item => ({
          productVariantId: item.productVariant.id,
          variantLabel: `${item.productVariant.product.name} - Taille ${item.productVariant.size}`,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          costPriceAtSale: Number(item.costPriceAtSale),
        }))

        setItems(orderItems)
      } else {
        alert('Commande non trouvée')
        router.push('/orders')
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors du chargement de la commande')
      router.push('/orders')
    } finally {
      setLoading(false)
    }
  }

  const handleCustomerNameChange = (value: string) => {
    setFormData({ ...formData, customerName: value })
    setSelectedCustomerId(null)

    if (value.length > 0) {
      const filtered = customers.filter(c =>
        c.name.toLowerCase().includes(value.toLowerCase())
      )
      setFilteredCustomers(filtered)
      setShowCustomerDropdown(true)
    } else {
      setShowCustomerDropdown(false)
    }
  }

  const selectCustomer = (customer: Customer) => {
    setSelectedCustomerId(customer.id)
    setFormData({
      ...formData,
      customerName: customer.name,
      customerEmail: customer.email || '',
      customerPhone: customer.phone || '',
      customerAddress: customer.address || '',
    })
    setShowCustomerDropdown(false)
  }

  const toggleTag = (tag: string) => {
    if (formData.tags.includes(tag)) {
      setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) })
    } else {
      setFormData({ ...formData, tags: [...formData.tags, tag] })
    }
  }

  const addItem = () => {
    if (!selectedVariantId) {
      alert('Sélectionnez une variante')
      return
    }

    let product: Product | undefined
    let variant: Variant | undefined

    for (const p of products) {
      const v = p.variants.find(v => v.id === selectedVariantId)
      if (v) {
        product = p
        variant = v
        break
      }
    }

    if (!product || !variant) return

    const unitPrice = customPrice !== null ? customPrice : Number(variant.sellingPrice)

    setItems([...items, {
      productVariantId: variant.id,
      variantLabel: `${product.name} - Taille ${variant.size}`,
      quantity,
      unitPrice,
      costPriceAtSale: Number(variant.costPrice),
    }])

    setSelectedVariantId('')
    setQuantity(1)
    setCustomPrice(null)
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
  }

  const handleSubmit = async (confirmOrder: boolean) => {
    if (items.length === 0) {
      alert('Ajoutez au moins un article')
      return
    }

    if (!formData.customerName) {
      alert('Le nom du client est requis')
      return
    }

    try {
      // Supprimer les anciens items et créer les nouveaux
      const res = await fetch(`/api/orders/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags.join(','),
          paymentMethod: formData.paymentMethod || null,
          customerId: selectedCustomerId,
          items,
        }),
      })

      if (res.ok) {
        const order = await res.json()

        if (confirmOrder) {
          const confirmRes = await fetch(`/api/orders/${order.id}/confirm`, { method: 'POST' })
          if (!confirmRes.ok) {
            const error = await confirmRes.json()
            alert(error.error)
            return
          }
        }

        router.push('/orders')
      } else {
        const error = await res.json()
        alert(error.error)
      }
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Chargement...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => router.push('/orders')} className="text-blue-600 hover:text-blue-800 mb-2">
            ← Retour
          </button>
          <h1 className="text-3xl font-bold">Modifier la commande</h1>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow space-y-6">
        <h3 className="font-bold text-lg">Informations client</h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="relative">
            <label className="block text-sm font-medium mb-1">Nom du client *</label>
            <input
              ref={customerInputRef}
              type="text"
              value={formData.customerName}
              onChange={(e) => handleCustomerNameChange(e.target.value)}
              onFocus={() => {
                if (formData.customerName && filteredCustomers.length > 0) {
                  setShowCustomerDropdown(true)
                }
              }}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Rechercher ou saisir un nom"
              required
            />
            {showCustomerDropdown && filteredCustomers.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                {filteredCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    onClick={() => selectCustomer(customer)}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                  >
                    <div className="font-medium">{customer.name}</div>
                    {customer.email && <div className="text-xs text-gray-500">{customer.email}</div>}
                    {customer.phone && <div className="text-xs text-gray-500">{customer.phone}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={formData.customerEmail}
              onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="client@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Téléphone</label>
            <input
              type="tel"
              value={formData.customerPhone}
              onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="+41 XX XXX XX XX"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Adresse</label>
            <input
              type="text"
              value={formData.customerAddress}
              onChange={(e) => setFormData({ ...formData, customerAddress: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Rue, ville, code postal"
            />
          </div>
        </div>

        <h3 className="font-bold text-lg pt-4">Informations commande</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Canal de vente</label>
            <select
              value={formData.salesChannel}
              onChange={(e) => setFormData({ ...formData, salesChannel: e.target.value as any })}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="STAND">Stand</option>
              <option value="SITE">Site web</option>
              <option value="PRECOMMANDE">Précommande</option>
              <option value="INSTAGRAM">Instagram</option>
              <option value="WHATSAPP">Whatsapp</option>
              <option value="EN_SALLE">En salle</option>
              <option value="AUTRE">Autre</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Mode de paiement</label>
            <select
              value={formData.paymentMethod}
              onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="">Sélectionner...</option>
              <option value="TWINT">Twint</option>
              <option value="CASH">Cash</option>
              <option value="AUTRE">Autre</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tags</label>
            <div className="flex flex-wrap gap-2">
              {['Livrer', 'Payer', 'Précommander', 'Commander', 'Reçu'].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    formData.tags.includes(tag)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="font-bold mb-4">Ajouter des articles</h3>
          <div className="grid grid-cols-12 gap-2 items-end">
            <div className="col-span-5">
              <label className="block text-sm font-medium mb-1">Produit / Variante</label>
              <select
                value={selectedVariantId}
                onChange={(e) => {
                  setSelectedVariantId(e.target.value)
                  const product = products.find(p => p.variants.some(v => v.id === e.target.value))
                  if (product) {
                    const variant = product.variants.find(v => v.id === e.target.value)
                    if (variant) {
                      setCustomPrice(Number(variant.sellingPrice))
                    }
                  }
                }}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">Sélectionner...</option>
                {products.map((product) =>
                  product.variants.map((variant) => (
                    <option key={variant.id} value={variant.id}>
                      {product.name} - Taille {variant.size} - {variant.sellingPrice} CHF (Stock: {variant.stock})
                    </option>
                  ))
                )}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Quantité</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value))}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Prix unitaire (CHF)</label>
              <input
                type="number"
                step="0.01"
                value={customPrice || ''}
                onChange={(e) => setCustomPrice(parseFloat(e.target.value))}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div className="col-span-3">
              <button
                onClick={addItem}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 shadow-md transition-all duration-200"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>

        {items.length > 0 && (
          <div className="border-t pt-6">
            <h3 className="font-bold mb-4">Articles de la commande</h3>
            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div className="flex-1">
                    <p className="font-medium">{item.variantLabel}</p>
                    <p className="text-sm text-gray-600">
                      Quantité: {item.quantity} × {item.unitPrice} CHF = {(item.quantity * item.unitPrice).toFixed(2)} CHF
                    </p>
                  </div>
                  <button
                    onClick={() => removeItem(index)}
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Retirer
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-4 text-right">
              <p className="text-2xl font-bold">Total: {calculateTotal().toFixed(2)} CHF</p>
            </div>
          </div>
        )}

        <div className="flex gap-4 justify-end border-t pt-6">
          <button
            onClick={() => handleSubmit(false)}
            className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
          >
            Enregistrer les modifications
          </button>
          <button
            onClick={() => handleSubmit(true)}
            className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 shadow-md transition-all duration-200"
          >
            Enregistrer et confirmer
          </button>
        </div>
      </div>
    </div>
  )
}
