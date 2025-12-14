// app/products/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import Link from 'next/link'

interface Variant {
  id: string
  size: string
  sellingPrice: number
  costPrice: number
  stock: number
  minStock: number
}

interface Product {
  id: string
  name: string
  category: string
  sku: string
  isActive: boolean
  variants: Variant[]
}

interface OrderItem {
  id: string
  quantity: number
  unitPrice: number
  lineTotal: number
  variantSize: string
}

interface Order {
  id: string
  date: string
  createdAt: string
  customerName: string | null
  customerEmail: string | null
  customerPhone: string | null
  status: string
  salesChannel: string
  paymentMethod: string
  totalAmount: number
  items: OrderItem[]
}

interface OrdersData {
  product: {
    id: string
    name: string
    sku: string
    category: string
    variantCount: number
  }
  stats: {
    totalQuantitySold: number
    totalRevenue: number
    orderCount: number
    currentStock: number
  }
  orders: Order[]
}

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [ordersData, setOrdersData] = useState<OrdersData | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [showVariantForm, setShowVariantForm] = useState(false)
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null)
  const [variantForm, setVariantForm] = useState({
    size: '',
    sellingPrice: 0,
    costPrice: 0,
    stock: 0,
    minStock: 5,
  })

  useEffect(() => {
    fetchProduct()
    fetchOrders()
  }, [])

  const fetchProduct = async () => {
    try {
      const res = await fetch(`/api/products/${params.id}`)
      const data = await res.json()
      setProduct(data)
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchOrders = async () => {
    try {
      const res = await fetch(`/api/products/${params.id}/orders`)
      const data = await res.json()
      setOrdersData(data)
    } catch (error) {
      console.error('Erreur lors du chargement des commandes:', error)
    } finally {
      setLoadingOrders(false)
    }
  }

  const handleVariantSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingVariantId) {
        // Mode édition
        const res = await fetch('/api/variants', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingVariantId,
            ...variantForm,
          }),
        })

        if (res.ok) {
          await fetchProduct()
          setShowVariantForm(false)
          setEditingVariantId(null)
          setVariantForm({ size: '', sellingPrice: 0, costPrice: 0, stock: 0, minStock: 5 })
        } else {
          const error = await res.json()
          alert(error.error)
        }
      } else {
        // Mode création
        const res = await fetch('/api/variants', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...variantForm,
            productId: params.id,
          }),
        })

        if (res.ok) {
          await fetchProduct()
          setShowVariantForm(false)
          setVariantForm({ size: '', sellingPrice: 0, costPrice: 0, stock: 0, minStock: 5 })
        } else {
          const error = await res.json()
          alert(error.error)
        }
      }
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const editVariant = (variant: Variant) => {
    setEditingVariantId(variant.id)
    setVariantForm({
      size: variant.size,
      sellingPrice: Number(variant.sellingPrice),
      costPrice: Number(variant.costPrice),
      stock: variant.stock,
      minStock: variant.minStock,
    })
    setShowVariantForm(true)
  }

  const cancelEdit = () => {
    setShowVariantForm(false)
    setEditingVariantId(null)
    setVariantForm({ size: '', sellingPrice: 0, costPrice: 0, stock: 0, minStock: 5 })
  }

  const deleteVariant = async (variantId: string) => {
    if (!confirm('Supprimer cette variante ?')) return

    try {
      await fetch(`/api/variants?id=${variantId}`, { method: 'DELETE' })
      await fetchProduct()
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const updateStock = async (variantId: string, newStock: number) => {
    try {
      const variant = product?.variants.find(v => v.id === variantId)
      if (!variant) return

      await fetch('/api/variants', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: variantId,
          size: variant.size,
          sellingPrice: variant.sellingPrice,
          costPrice: variant.costPrice,
          stock: newStock,
          minStock: variant.minStock,
        }),
      })

      await fetchProduct()
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-900 dark:text-gray-100">Chargement...</div>
  }

  if (!product) {
    return <div className="text-center py-12 text-gray-900 dark:text-gray-100">Produit non trouvé</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <button onClick={() => router.back()} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mb-2 text-sm sm:text-base">
            ← Retour
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{product.name}</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">{product.category} • {product.sku}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow transition-colors">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Variantes</h2>
          <button
            onClick={() => {
              if (showVariantForm) {
                cancelEdit()
              } else {
                setShowVariantForm(true)
              }
            }}
            className="w-full sm:w-auto px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 shadow-md transition-all duration-200 min-h-[44px]"
          >
            {showVariantForm ? 'Annuler' : 'Ajouter une variante'}
          </button>
        </div>

        {showVariantForm && (
          <form onSubmit={handleVariantSubmit} className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-md space-y-4 transition-colors">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Taille (ex: S, M, L)"
                value={variantForm.size}
                onChange={(e) => setVariantForm({ ...variantForm, size: e.target.value })}
                className="px-3 py-2.5 border rounded-md dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500 min-h-[44px] text-base"
                required
              />
              <input
                type="number"
                step="0.01"
                placeholder="Prix de vente (CHF)"
                value={variantForm.sellingPrice}
                onChange={(e) => setVariantForm({ ...variantForm, sellingPrice: parseFloat(e.target.value) || 0 })}
                className="px-3 py-2.5 border rounded-md dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500 min-h-[44px] text-base"
                required
              />
              <input
                type="number"
                step="0.01"
                placeholder="Coût d'achat (CHF)"
                value={variantForm.costPrice}
                onChange={(e) => setVariantForm({ ...variantForm, costPrice: parseFloat(e.target.value) || 0 })}
                className="px-3 py-2.5 border rounded-md dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500 min-h-[44px] text-base"
                required
              />
              <input
                type="number"
                placeholder="Stock initial"
                value={variantForm.stock}
                onChange={(e) => setVariantForm({ ...variantForm, stock: parseInt(e.target.value) })}
                className="px-3 py-2.5 border rounded-md dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500 min-h-[44px] text-base"
                required
              />
              <input
                type="number"
                placeholder="Stock minimum"
                value={variantForm.minStock}
                onChange={(e) => setVariantForm({ ...variantForm, minStock: parseInt(e.target.value) })}
                className="px-3 py-2.5 border rounded-md dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500 min-h-[44px] text-base"
                required
              />
            </div>
            <button type="submit" className="w-full sm:w-auto px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 shadow-md transition-all duration-200 min-h-[44px]">
              {editingVariantId ? 'Mettre à jour' : 'Ajouter'}
            </button>
          </form>
        )}

        <div className="space-y-3">
          {product.variants.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">Aucune variante créée</p>
          ) : (
            product.variants.map((variant) => (
              <div key={variant.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border dark:border-gray-600 rounded-md gap-4 transition-colors">
                <div className="flex-1 w-full sm:w-auto">
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    Taille {variant.size}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Prix de vente: {variant.sellingPrice} CHF • Coût: {variant.costPrice} CHF
                  </p>
                  <p className={`text-sm ${variant.stock < variant.minStock ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}>
                    Stock: {variant.stock} {variant.stock < variant.minStock && '⚠️ Bas'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 items-center w-full sm:w-auto justify-between sm:justify-end">
                  <div className="flex gap-2 items-center">
                    <button
                      onClick={() => updateStock(variant.id, variant.stock - 1)}
                      className="px-3 py-2 bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-gray-100 rounded hover:bg-gray-300 dark:hover:bg-gray-500 min-h-[44px] min-w-[44px]"
                      disabled={variant.stock === 0}
                    >
                      -
                    </button>
                    <span className="w-12 text-center font-medium text-gray-900 dark:text-gray-100">{variant.stock}</span>
                    <button
                      onClick={() => updateStock(variant.id, variant.stock + 1)}
                      className="px-3 py-2 bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-gray-100 rounded hover:bg-gray-300 dark:hover:bg-gray-500 min-h-[44px] min-w-[44px]"
                    >
                      +
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => editVariant(variant)}
                      className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 min-h-[44px] text-sm"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => deleteVariant(variant.id)}
                      className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 min-h-[44px] text-sm"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Historique des ventes */}
      <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow transition-colors">
        <h2 className="text-lg sm:text-xl font-bold mb-4 text-gray-900 dark:text-white">Historique des ventes</h2>

        {loadingOrders ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">Chargement...</div>
        ) : ordersData ? (
          <>
            {/* Statistiques */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-md transition-colors">
                <p className="text-sm text-gray-600 dark:text-gray-400">Quantité vendue</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {ordersData.stats.totalQuantitySold} unités
                </p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-md transition-colors">
                <p className="text-sm text-gray-600 dark:text-gray-400">Revenu total</p>
                <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
                  {ordersData.stats.totalRevenue.toFixed(2)} CHF
                </p>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-900/30 rounded-md transition-colors">
                <p className="text-sm text-gray-600 dark:text-gray-400">Nombre de commandes</p>
                <p className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {ordersData.stats.orderCount}
                </p>
              </div>
              <div className="p-4 bg-orange-50 dark:bg-orange-900/30 rounded-md transition-colors">
                <p className="text-sm text-gray-600 dark:text-gray-400">Stock actuel</p>
                <p className="text-xl sm:text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {ordersData.stats.currentStock}
                </p>
              </div>
            </div>

            {/* Liste des commandes */}
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-3 text-gray-900 dark:text-white">
                Commandes ({ordersData.orders.length})
              </h3>
              {ordersData.orders.length === 0 ? (
                <p className="text-center py-8 text-gray-500 dark:text-gray-400">
                  Aucune commande pour ce produit
                </p>
              ) : (
                <div className="space-y-4">
                  {ordersData.orders.map((order) => (
                    <div
                      key={order.id}
                      className="border dark:border-gray-600 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                        <div className="flex-1">
                          <Link
                            href={`/orders/${order.id}`}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-base sm:text-lg"
                          >
                            Commande #{order.id.slice(0, 8)}
                          </Link>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {format(new Date(order.date), 'dd/MM/yyyy')}
                          </p>
                          {order.customerName && (
                            <p className="text-sm text-gray-900 dark:text-gray-100">
                              Client: {order.customerName}
                            </p>
                          )}
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="font-bold text-gray-900 dark:text-gray-100">
                            {Number(order.totalAmount).toFixed(2)} CHF
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                            {order.status}
                          </p>
                        </div>
                      </div>

                      {/* Items de cette commande pour ce produit */}
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-3 space-y-2">
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                          Articles de ce produit:
                        </p>
                        {order.items.map((item) => (
                          <div key={item.id} className="flex justify-between items-center text-sm">
                            <span className="text-gray-900 dark:text-gray-100">
                              Taille {item.variantSize} × {item.quantity}
                            </span>
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {Number(item.lineTotal).toFixed(2)} CHF
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <p className="text-center py-8 text-gray-500 dark:text-gray-400">
            Erreur lors du chargement des données
          </p>
        )}
      </div>
    </div>
  )
}
