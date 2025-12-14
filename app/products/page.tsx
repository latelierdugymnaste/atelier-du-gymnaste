// app/products/page.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Product {
  id: string
  name: string
  category: string
  sku: string
  isActive: boolean
  variants: any[]
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL')
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    sku: '',
    isActive: true,
  })

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products')
      const data = await res.json()
      setProducts(data)
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingId ? `/api/products/${editingId}` : '/api/products'
      const method = editingId ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      
      if (res.ok) {
        await fetchProducts()
        setShowForm(false)
        setEditingId(null)
        setFormData({ name: '', category: '', sku: '', isActive: true })
      } else {
        const error = await res.json()
        alert(error.error)
      }
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const editProduct = (product: Product) => {
    setEditingId(product.id)
    setFormData({
      name: product.name,
      category: product.category,
      sku: product.sku,
      isActive: product.isActive,
    })
    setShowForm(true)
  }

  const deleteProduct = async (id: string) => {
    if (!confirm('Supprimer ce produit et toutes ses variantes ?')) return
    
    try {
      await fetch(`/api/products/${id}`, { method: 'DELETE' })
      await fetchProducts()
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const cancelEdit = () => {
    setShowForm(false)
    setEditingId(null)
    setFormData({ name: '', category: '', sku: '', isActive: true })
  }

  const exportCSV = () => {
    const csv = [
      ['Nom', 'Catégorie', 'SKU', 'Actif', 'Nb Variantes'],
      ...products.map(p => [
        p.name,
        p.category,
        p.sku,
        p.isActive ? 'Oui' : 'Non',
        p.variants.length,
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `produits_${new Date().toISOString()}.csv`
    a.click()
  }

  // Filtrer les produits selon la recherche et la catégorie
  const filteredProducts = products.filter(product => {
    const matchesSearch = searchTerm === '' ||
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = categoryFilter === 'ALL' || product.category === categoryFilter

    return matchesSearch && matchesCategory
  })

  if (loading) {
    return <div className="text-center py-12 text-gray-900 dark:text-gray-100">Chargement...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Produits</h1>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Link href="/products/search" className="flex-1 sm:flex-none px-4 py-2.5 bg-purple-500 text-white rounded-lg hover:bg-purple-600 shadow-md transition-all duration-200 text-sm sm:text-base min-h-[44px] flex items-center justify-center">
            🔍 Rechercher
          </Link>
          <button onClick={exportCSV} className="flex-1 sm:flex-none px-4 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 shadow-md transition-all duration-200 text-sm sm:text-base min-h-[44px]">
            Exporter CSV
          </button>
          <button onClick={() => { setShowForm(!showForm); if (showForm) cancelEdit(); }} className="flex-1 sm:flex-none px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 shadow-md transition-all duration-200 text-sm sm:text-base min-h-[44px]">
            {showForm ? 'Annuler' : 'Nouveau Produit'}
          </button>
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow space-y-4 transition-colors">
        <div className="flex gap-4 items-center">
          <input
            type="text"
            placeholder="Rechercher par nom ou SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border rounded-md dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCategoryFilter('ALL')}
            className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-md text-sm min-h-[44px] ${categoryFilter === 'ALL' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
          >
            Tous ({products.length})
          </button>
          <button
            onClick={() => setCategoryFilter('Habits')}
            className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-md text-sm min-h-[44px] ${categoryFilter === 'Habits' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
          >
            Habits ({products.filter(p => p.category === 'Habits').length})
          </button>
          <button
            onClick={() => setCategoryFilter('Justaucorps')}
            className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-md text-sm min-h-[44px] ${categoryFilter === 'Justaucorps' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
          >
            Justaucorps ({products.filter(p => p.category === 'Justaucorps').length})
          </button>
          <button
            onClick={() => setCategoryFilter('Accessoires')}
            className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-md text-sm min-h-[44px] ${categoryFilter === 'Accessoires' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
          >
            Accessoires ({products.filter(p => p.category === 'Accessoires').length})
          </button>
        </div>

        {filteredProducts.length > 0 && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''} trouvé{filteredProducts.length > 1 ? 's' : ''}
          </div>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow space-y-4 transition-colors">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{editingId ? 'Modifier le produit' : 'Nouveau produit'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Nom du produit"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="px-3 py-2.5 border rounded-md dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 min-h-[44px] text-base"
              required
            />
            <input
              type="text"
              placeholder="Catégorie"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="px-3 py-2.5 border rounded-md dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 min-h-[44px] text-base"
              required
            />
            <input
              type="text"
              placeholder="SKU"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              className="px-3 py-2.5 border rounded-md dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 min-h-[44px] text-base"
              required
            />
            <label className="flex items-center gap-3 text-gray-900 dark:text-gray-100 min-h-[44px]">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-5 h-5"
              />
              <span>Produit actif</span>
            </label>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button type="submit" className="w-full sm:w-auto px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 shadow-md transition-all duration-200 min-h-[44px]">
              {editingId ? 'Mettre à jour' : 'Créer le produit'}
            </button>
            {editingId && (
              <button type="button" onClick={cancelEdit} className="w-full sm:w-auto px-4 py-2.5 bg-gray-500 text-white rounded-md hover:bg-gray-600 min-h-[44px]">
                Annuler
              </button>
            )}
          </div>
        </form>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nom</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Catégorie</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Variantes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    Aucun produit trouvé
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-gray-100">{product.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100">{product.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100">{product.sku}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100">{product.variants.length}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs ${product.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {product.isActive ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button onClick={() => editProduct(product)} className="text-blue-600 hover:text-blue-800">
                          Modifier
                        </button>
                        <Link href={`/products/${product.id}`} className="text-green-600 hover:text-green-800">
                          Variantes
                        </Link>
                        <button onClick={() => deleteProduct(product.id)} className="text-red-600 hover:text-red-800">
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}