// app/expenses/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'

interface Expense {
  id: string
  date: string
  amount: number
  category: string
  description: string
  product: { id: string; name: string } | null
  invoiceUrl: string | null
}

interface Product {
  id: string
  name: string
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [importing, setImporting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    amount: 0,
    category: 'PRODUCTION' as 'PRODUCTION' | 'LOGISTIQUE' | 'MARKETING' | 'STAND' | 'AGIVA_SPORT' | 'PANDACOLA' | 'AUTRE',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    productId: '',
    invoiceUrl: '',
  })

  useEffect(() => {
    fetchExpenses()
    fetchProducts()
  }, [])

  const fetchExpenses = async () => {
    try {
      const res = await fetch('/api/expenses')
      const data = await res.json()
      setExpenses(data)
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products')
      const data = await res.json()
      setProducts(data)
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingId ? `/api/expenses/${editingId}` : '/api/expenses'
      const method = editingId ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          productId: formData.productId || null,
        }),
      })

      if (res.ok) {
        await fetchExpenses()
        setShowForm(false)
        setEditingId(null)
        setFormData({
          amount: 0,
          category: 'PRODUCTION',
          description: '',
          date: format(new Date(), 'yyyy-MM-dd'),
          productId: '',
          invoiceUrl: '',
        })
      } else {
        const error = await res.json()
        alert(error.error)
      }
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const editExpense = (expense: Expense) => {
    setEditingId(expense.id)
    setFormData({
      amount: Number(expense.amount),
      category: expense.category as any,
      description: expense.description,
      date: format(new Date(expense.date), 'yyyy-MM-dd'),
      productId: expense.product?.id || '',
      invoiceUrl: expense.invoiceUrl || '',
    })
    setShowForm(true)
  }

  const deleteExpense = async (id: string) => {
    if (!confirm('Supprimer cette dépense ?')) return

    try {
      await fetch(`/api/expenses?id=${id}`, { method: 'DELETE' })
      await fetchExpenses()
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const cancelEdit = () => {
    setShowForm(false)
    setEditingId(null)
    setFormData({
      amount: 0,
      category: 'PRODUCTION',
      description: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      productId: '',
      invoiceUrl: '',
    })
  }

  const exportCSV = () => {
    const csv = [
      ['Date', 'Catégorie', 'Description', 'Montant', 'Produit'],
      ...expenses.map(e => [
        format(new Date(e.date), 'dd/MM/yyyy'),
        e.category,
        e.description,
        e.amount,
        e.product?.name || '-',
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `depenses_${new Date().toISOString()}.csv`
    a.click()
  }

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      PRODUCTION: 'Production',
      LOGISTIQUE: 'Logistique',
      MARKETING: 'Marketing',
      STAND: 'Stand',
      AGIVA_SPORT: 'Agiva Sport',
      PANDACOLA: 'Pandacola',
      AUTRE: 'Autre',
    }
    return labels[category] || category
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      PRODUCTION: 'bg-blue-100 text-blue-800',
      LOGISTIQUE: 'bg-purple-100 text-purple-800',
      MARKETING: 'bg-pink-100 text-pink-800',
      STAND: 'bg-green-100 text-green-800',
      AGIVA_SPORT: 'bg-orange-100 text-orange-800',
      PANDACOLA: 'bg-red-100 text-red-800',
      AUTRE: 'bg-gray-100 text-gray-800',
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-900 dark:text-gray-100">Chargement...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Dépenses</h1>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button onClick={exportCSV} className="flex-1 sm:flex-none px-4 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 shadow-md transition-all duration-200 text-sm sm:text-base min-h-[44px]">
            Exporter CSV
          </button>
          <button
            onClick={() => { setShowForm(!showForm); if (showForm) cancelEdit(); }}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 shadow-md transition-all duration-200 text-sm sm:text-base min-h-[44px]"
          >
            {showForm ? 'Annuler' : 'Nouvelle Dépense'}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow space-y-4 transition-colors">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{editingId ? 'Modifier la dépense' : 'Nouvelle dépense'}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">Montant (CHF)</label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">Catégorie</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
              >
                <option value="PRODUCTION">Production</option>
                <option value="AGIVA_SPORT">Agiva Sport</option>
                <option value="PANDACOLA">Pandacola</option>
                <option value="LOGISTIQUE">Logistique</option>
                <option value="MARKETING">Marketing</option>
                <option value="STAND">Stand</option>
                <option value="AUTRE">Autre</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">Produit associé (optionnel)</label>
              <select
                value={formData.productId}
                onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
              >
                <option value="">Aucun</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                rows={3}
                required
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">Lien de la facture PDF (optionnel)</label>
              <input
                type="url"
                placeholder="https://example.com/facture.pdf"
                value={formData.invoiceUrl}
                onChange={(e) => setFormData({ ...formData, invoiceUrl: e.target.value })}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Vous pouvez héberger vos factures sur Google Drive, Dropbox ou tout autre service cloud et coller le lien ici
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 shadow-md transition-all duration-200">
              {editingId ? 'Mettre à jour' : 'Enregistrer la dépense'}
            </button>
            {editingId && (
              <button type="button" onClick={cancelEdit} className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600">
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Catégorie</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Produit</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Montant</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Facture</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {expenses.map((expense) => (
              <tr key={expense.id}>
                <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100">
                  {format(new Date(expense.date), 'dd/MM/yyyy')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-full text-xs ${getCategoryColor(expense.category)}`}>
                    {getCategoryLabel(expense.category)}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-900 dark:text-gray-100">{expense.description}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                  {expense.product?.name || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-medium text-red-600 dark:text-red-400">
                  {expense.amount} CHF
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {expense.invoiceUrl ? (
                    <a
                      href={expense.invoiceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      PDF
                    </a>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500 text-sm">-</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex gap-2">
                    <button onClick={() => editExpense(expense)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                      Modifier
                    </button>
                    <button onClick={() => deleteExpense(expense.id)} className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300">
                      Supprimer
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        {expenses.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            Aucune dépense enregistrée
          </div>
        )}
      </div>
    </div>
  )
}