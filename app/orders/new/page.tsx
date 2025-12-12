// app/orders/new/page.tsx
'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'

interface Product {
  id: string
  name: string
  sku: string
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

export default function NewOrderPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false)
  const [showNewProductModal, setShowNewProductModal] = useState(false)
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

  const [newProductData, setNewProductData] = useState({
    name: '',
    category: '',
    sku: '',
    size: '',
    sellingPrice: '',
    costPrice: '',
    stock: ''
  })

  const [items, setItems] = useState<OrderItem[]>([])
  const [selectedVariantId, setSelectedVariantId] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [customPrice, setCustomPrice] = useState<number | null>(null)
  const [giftCardCode, setGiftCardCode] = useState('')
  const [appliedGiftCard, setAppliedGiftCard] = useState<any>(null)
  const [giftCardDiscount, setGiftCardDiscount] = useState(0)
  const [availableGiftCards, setAvailableGiftCards] = useState<any[]>([])
  const [productSearchTerm, setProductSearchTerm] = useState('')

  useEffect(() => {
    fetchProducts()
    fetchCustomers()
    fetchAvailableGiftCards()
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

  const fetchAvailableGiftCards = async () => {
    try {
      const res = await fetch('/api/gift-cards?status=ACTIVE')
      const data = await res.json()
      if (Array.isArray(data)) {
        setAvailableGiftCards(data.filter(gc => Number(gc.remainingAmount) > 0))
      }
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const createNewProduct = async () => {
    if (!newProductData.name || !newProductData.category || !newProductData.sku || !newProductData.size || !newProductData.sellingPrice) {
      alert('Veuillez remplir tous les champs obligatoires')
      return
    }

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProductData.name,
          category: newProductData.category,
          sku: newProductData.sku,
          isActive: true,
          variants: [{
            size: newProductData.size,
            sellingPrice: parseFloat(newProductData.sellingPrice),
            costPrice: parseFloat(newProductData.costPrice) || 0,
            stock: parseInt(newProductData.stock) || 0
          }]
        }),
      })

      if (res.ok) {
        const newProduct = await res.json()
        await fetchProducts()

        if (newProduct.variants && newProduct.variants.length > 0) {
          setSelectedVariantId(newProduct.variants[0].id)
          setCustomPrice(parseFloat(newProductData.sellingPrice))
        }

        setShowNewProductModal(false)
        setNewProductData({
          name: '',
          category: '',
          sku: '',
          size: '',
          sellingPrice: '',
          costPrice: '',
          stock: ''
        })
        alert('Produit créé avec succès!')
      } else {
        const error = await res.json()
        alert(error.error || 'Erreur lors de la création du produit')
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la création du produit')
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

  const createNewCustomer = async () => {
    if (!formData.customerName) {
      alert('Le nom du client est requis')
      return
    }

    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.customerName,
          email: formData.customerEmail || null,
          phone: formData.customerPhone || null,
          address: formData.customerAddress || null,
        }),
      })

      if (res.ok) {
        const newCustomer = await res.json()
        setSelectedCustomerId(newCustomer.id)
        setCustomers([...customers, newCustomer])
        setShowNewCustomerForm(false)
        alert('Client créé avec succès')
      } else {
        alert('Erreur lors de la création du client')
      }
    } catch (error) {
      console.error('Erreur:', error)
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

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
  }

  const calculateTotal = () => {
    return calculateSubtotal() - giftCardDiscount
  }

  const applyGiftCard = async () => {
    if (!giftCardCode) {
      alert('Veuillez entrer un code de bon cadeau')
      return
    }

    const subtotal = calculateSubtotal()
    if (subtotal === 0) {
      alert('Ajoutez des articles avant d\'appliquer un bon cadeau')
      return
    }

    try {
      const res = await fetch('/api/gift-cards/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: giftCardCode,
          orderAmount: subtotal,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setAppliedGiftCard(data.giftCard)
        setGiftCardDiscount(data.discount)
        alert(`Bon cadeau appliqué ! Réduction de ${data.discount.toFixed(2)} CHF`)
      } else {
        const error = await res.json()
        alert(error.error || 'Code de bon cadeau invalide')
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la validation du bon cadeau')
    }
  }

  const removeGiftCard = () => {
    setGiftCardCode('')
    setAppliedGiftCard(null)
    setGiftCardDiscount(0)
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
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags.join(','),
          paymentMethod: formData.paymentMethod || null,
          customerId: selectedCustomerId,
          items,
          giftCardCode: appliedGiftCard ? appliedGiftCard.code : null,
          giftCardDiscount: giftCardDiscount,
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => router.back()} className="text-blue-600 hover:text-blue-800 mb-2">
            ← Retour
          </button>
          <h1 className="text-3xl font-bold">Nouvelle Commande</h1>
        </div>
      </div>

      {/* Modal Nouveau Produit */}
      {showNewProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Créer un nouveau produit</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nom du produit *</label>
                  <input
                    type="text"
                    value={newProductData.name}
                    onChange={(e) => setNewProductData({ ...newProductData, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="ex: Legging femme"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Catégorie *</label>
                  <select
                    value={newProductData.category}
                    onChange={(e) => setNewProductData({ ...newProductData, category: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="">Sélectionner...</option>
                    <option value="Justaucorps">Justaucorps</option>
                    <option value="Justaucorps H">Justaucorps H</option>
                    <option value="Habits">Habits</option>
                    <option value="Accessoires">Accessoires</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">SKU *</label>
                  <input
                    type="text"
                    value={newProductData.sku}
                    onChange={(e) => setNewProductData({ ...newProductData, sku: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="ex: LEG-001"
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Variante</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Taille *</label>
                    <input
                      type="text"
                      value={newProductData.size}
                      onChange={(e) => setNewProductData({ ...newProductData, size: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                      placeholder="ex: S, M, L, XL"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Prix de vente (CHF) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newProductData.sellingPrice}
                      onChange={(e) => setNewProductData({ ...newProductData, sellingPrice: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Prix d'achat (CHF)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newProductData.costPrice}
                      onChange={(e) => setNewProductData({ ...newProductData, costPrice: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Stock initial</label>
                    <input
                      type="number"
                      value={newProductData.stock}
                      onChange={(e) => setNewProductData({ ...newProductData, stock: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={createNewProduct}
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 shadow-md transition-all duration-200"
                >
                  Créer le produit
                </button>
                <button
                  onClick={() => {
                    setShowNewProductModal(false)
                    setNewProductData({
                      name: '',
                      category: '',
                      sku: '',
                      size: '',
                      sellingPrice: '',
                      costPrice: '',
                      stock: ''
                    })
                  }}
                  className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">Informations client</h3>
          {!showNewCustomerForm && (
            <button
              onClick={() => setShowNewCustomerForm(true)}
              className="text-sm px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 shadow-md transition-all duration-200"
            >
              + Nouveau client
            </button>
          )}
        </div>

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

        {showNewCustomerForm && (
          <div className="flex gap-2 pt-2">
            <button
              onClick={createNewCustomer}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 shadow-md transition-all duration-200"
            >
              Enregistrer le nouveau client
            </button>
            <button
              onClick={() => setShowNewCustomerForm(false)}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              Annuler
            </button>
          </div>
        )}

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
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">Ajouter des articles</h3>
            <button
              onClick={() => setShowNewProductModal(true)}
              className="text-sm px-3 py-1 bg-purple-500 text-white rounded-lg hover:bg-purple-600 shadow-md transition-all duration-200"
            >
              + Nouveau produit
            </button>
          </div>
          <div className="space-y-4">
            {/* Barre de recherche */}
            <div>
              <label className="block text-sm font-medium mb-1">Rechercher un produit</label>
              <input
                type="text"
                placeholder="Rechercher par nom, SKU, taille..."
                value={productSearchTerm}
                onChange={(e) => setProductSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border rounded-md"
              />
            </div>

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
                  {products
                    .filter(product => {
                      if (productSearchTerm === '') return true
                      const searchLower = productSearchTerm.toLowerCase()
                      return (
                        product.name.toLowerCase().includes(searchLower) ||
                        product.sku.toLowerCase().includes(searchLower) ||
                        product.variants.some(v => v.size.toLowerCase().includes(searchLower))
                      )
                    })
                    .map((product) =>
                      product.variants.map((variant) => (
                        <option key={variant.id} value={variant.id}>
                          {product.sku} - {product.name} - Taille {variant.size} - {variant.sellingPrice} CHF (Stock: {variant.stock})
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

            {/* Section Bon Cadeau */}
            <div className="mt-6 border-t pt-4">
              <h4 className="font-semibold mb-3">Bon cadeau</h4>
              {!appliedGiftCard ? (
                <div className="space-y-3">
                  {availableGiftCards.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium mb-1">Sélectionner un bon cadeau existant</label>
                      <select
                        value={giftCardCode}
                        onChange={(e) => setGiftCardCode(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md"
                      >
                        <option value="">-- Choisir un bon cadeau --</option>
                        {availableGiftCards.map((gc) => (
                          <option key={gc.id} value={gc.code}>
                            {gc.code} - Solde: {Number(gc.remainingAmount).toFixed(2)} CHF
                            {gc.recipientName && ` - Pour: ${gc.recipientName}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium mb-1">Ou entrer un code manuellement</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={giftCardCode}
                        onChange={(e) => setGiftCardCode(e.target.value.toUpperCase())}
                        placeholder="Entrez le code du bon cadeau"
                        className="flex-1 px-3 py-2 border rounded-md"
                      />
                      <button
                        onClick={applyGiftCard}
                        className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600"
                      >
                        Appliquer
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-purple-50 p-4 rounded-md border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-purple-800">Code: {appliedGiftCard.code}</p>
                      <p className="text-sm text-purple-600">
                        Réduction appliquée: -{giftCardDiscount.toFixed(2)} CHF
                      </p>
                      {appliedGiftCard.remainingAmount - giftCardDiscount > 0 && (
                        <p className="text-xs text-purple-500">
                          Solde restant après utilisation: {(appliedGiftCard.remainingAmount - giftCardDiscount).toFixed(2)} CHF
                        </p>
                      )}
                    </div>
                    <button
                      onClick={removeGiftCard}
                      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                    >
                      Retirer
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 text-right space-y-2">
              <p className="text-lg">Sous-total: {calculateSubtotal().toFixed(2)} CHF</p>
              {giftCardDiscount > 0 && (
                <p className="text-lg text-purple-600">Bon cadeau: -{giftCardDiscount.toFixed(2)} CHF</p>
              )}
              <p className="text-2xl font-bold border-t pt-2">Total: {calculateTotal().toFixed(2)} CHF</p>
            </div>
          </div>
        )}

        <div className="flex gap-4 justify-end border-t pt-6">
          <button
            onClick={() => handleSubmit(false)}
            className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
          >
            Enregistrer en brouillon
          </button>
          <button
            onClick={() => handleSubmit(true)}
            className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 shadow-md transition-all duration-200"
          >
            Confirmer la commande
          </button>
        </div>
      </div>
    </div>
  )
}
