// app/products/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

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

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
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
    return <div className="text-center py-12">Chargement...</div>
  }

  if (!product) {
    return <div className="text-center py-12">Produit non trouvé</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => router.back()} className="text-blue-600 hover:text-blue-800 mb-2">
            ← Retour
          </button>
          <h1 className="text-3xl font-bold">{product.name}</h1>
          <p className="text-gray-600">{product.category} • {product.sku}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Variantes</h2>
          <button
            onClick={() => {
              if (showVariantForm) {
                cancelEdit()
              } else {
                setShowVariantForm(true)
              }
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 shadow-md transition-all duration-200"
          >
            {showVariantForm ? 'Annuler' : 'Ajouter une variante'}
          </button>
        </div>

        {showVariantForm && (
          <form onSubmit={handleVariantSubmit} className="mb-6 p-4 bg-gray-50 rounded-md space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Taille (ex: S, M, L)"
                value={variantForm.size}
                onChange={(e) => setVariantForm({ ...variantForm, size: e.target.value })}
                className="px-3 py-2 border rounded-md"
                required
              />
              <input
                type="number"
                step="0.01"
                placeholder="Prix de vente (CHF)"
                value={variantForm.sellingPrice}
                onChange={(e) => setVariantForm({ ...variantForm, sellingPrice: parseFloat(e.target.value) || 0 })}
                className="px-3 py-2 border rounded-md"
                required
              />
              <input
                type="number"
                step="0.01"
                placeholder="Coût d'achat (CHF)"
                value={variantForm.costPrice}
                onChange={(e) => setVariantForm({ ...variantForm, costPrice: parseFloat(e.target.value) || 0 })}
                className="px-3 py-2 border rounded-md"
                required
              />
              <input
                type="number"
                placeholder="Stock initial"
                value={variantForm.stock}
                onChange={(e) => setVariantForm({ ...variantForm, stock: parseInt(e.target.value) })}
                className="px-3 py-2 border rounded-md"
                required
              />
              <input
                type="number"
                placeholder="Stock minimum"
                value={variantForm.minStock}
                onChange={(e) => setVariantForm({ ...variantForm, minStock: parseInt(e.target.value) })}
                className="px-3 py-2 border rounded-md"
                required
              />
            </div>
            <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 shadow-md transition-all duration-200">
              {editingVariantId ? 'Mettre à jour' : 'Ajouter'}
            </button>
          </form>
        )}

        <div className="space-y-3">
          {product.variants.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Aucune variante créée</p>
          ) : (
            product.variants.map((variant) => (
              <div key={variant.id} className="flex items-center justify-between p-4 border rounded-md">
                <div className="flex-1">
                  <p className="font-medium">
                    Taille {variant.size}
                  </p>
                  <p className="text-sm text-gray-600">
                    Prix de vente: {variant.sellingPrice} CHF • Coût: {variant.costPrice} CHF
                  </p>
                  <p className={`text-sm ${variant.stock < variant.minStock ? 'text-red-600' : 'text-gray-600'}`}>
                    Stock: {variant.stock} {variant.stock < variant.minStock && '⚠️ Bas'}
                  </p>
                </div>
                <div className="flex gap-2 items-center">
                  <button
                    onClick={() => updateStock(variant.id, variant.stock - 1)}
                    className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                    disabled={variant.stock === 0}
                  >
                    -
                  </button>
                  <span className="w-12 text-center font-medium">{variant.stock}</span>
                  <button
                    onClick={() => updateStock(variant.id, variant.stock + 1)}
                    className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    +
                  </button>
                  <button
                    onClick={() => editVariant(variant)}
                    className="ml-4 px-3 py-1 bg-blue-500 text-white rounded hover:bg-primary-dark"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => deleteVariant(variant.id)}
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}