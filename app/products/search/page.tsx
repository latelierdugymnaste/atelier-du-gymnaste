// app/products/search/page.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Variant {
  id: string
  size: string
  stock: number
  sellingPrice: number
}

interface Product {
  id: string
  name: string
  sku: string
  category: string
  isActive: boolean
  totalStock: number
  variantCount: number
  variants: Variant[]
}

export default function ProductSearchPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setLoading(true)
    setSearched(true)
    try {
      const res = await fetch(`/api/products/search?q=${encodeURIComponent(searchQuery)}`)
      const data = await res.json()
      setProducts(data)
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      TSHIRT: 'T-Shirt',
      HOODIE: 'Hoodie',
      ACCESSOIRE: 'Accessoire',
      AUTRE: 'Autre',
    }
    return labels[category] || category
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Recherche de produits
        </h1>
      </div>

      {/* Formulaire de recherche */}
      <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow transition-colors">
        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
              Rechercher par nom ou SKU
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Ex: T-shirt, TSHIRT-001, Hoodie..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-2.5 border rounded-md dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 min-h-[44px] text-base"
              />
              <button
                type="submit"
                disabled={loading || !searchQuery.trim()}
                className="w-full sm:w-auto px-6 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 shadow-md transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed min-h-[44px]"
              >
                {loading ? 'Recherche...' : 'Rechercher'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Résultats */}
      {loading ? (
        <div className="text-center py-12 text-gray-900 dark:text-gray-100">
          Recherche en cours...
        </div>
      ) : searched ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow transition-colors">
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
              Résultats de recherche ({products.length})
            </h2>
            {searchQuery && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Recherche pour: "{searchQuery}"
              </p>
            )}
          </div>

          {products.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              Aucun produit trouvé pour cette recherche
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="p-4 sm:p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                        <Link
                          href={`/products/${product.id}`}
                          className="text-lg font-bold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          {product.name}
                        </Link>
                        {!product.isActive && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200 w-fit">
                            Inactif
                          </span>
                        )}
                      </div>
                      <div className="space-y-1 text-sm">
                        <p className="text-gray-600 dark:text-gray-400">
                          <span className="font-medium">SKU:</span> {product.sku}
                        </p>
                        <p className="text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Catégorie:</span> {getCategoryLabel(product.category)}
                        </p>
                        <p className="text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Variantes:</span> {product.variantCount}
                        </p>
                        <p className={`font-medium ${product.totalStock > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          Stock total: {product.totalStock}
                        </p>
                      </div>

                      {/* Détails des variantes */}
                      {product.variants.length > 0 && (
                        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase mb-2">
                            Détails des variantes:
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                            {product.variants.map((variant) => (
                              <div
                                key={variant.id}
                                className="text-xs p-2 bg-white dark:bg-gray-700 rounded border dark:border-gray-600"
                              >
                                <p className="font-medium text-gray-900 dark:text-gray-100">
                                  Taille {variant.size}
                                </p>
                                <p className="text-gray-600 dark:text-gray-400">
                                  Stock: {variant.stock}
                                </p>
                                <p className="text-gray-600 dark:text-gray-400">
                                  {variant.sellingPrice} CHF
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 sm:ml-4">
                      <Link
                        href={`/products/${product.id}`}
                        className="w-full sm:w-auto px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 shadow-md transition-all duration-200 text-center min-h-[44px] flex items-center justify-center text-sm"
                      >
                        Voir détails
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 p-8 sm:p-12 rounded-lg shadow text-center transition-colors">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Recherchez un produit
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Utilisez le formulaire ci-dessus pour rechercher un produit par nom ou SKU
          </p>
        </div>
      )}
    </div>
  )
}
