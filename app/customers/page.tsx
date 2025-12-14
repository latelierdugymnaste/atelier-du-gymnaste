// app/customers/page.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Customer {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  createdAt: string
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  })

  useEffect(() => {
    fetchCustomers()
  }, [searchQuery])

  const fetchCustomers = async () => {
    try {
      const url = searchQuery
        ? `/api/customers?search=${encodeURIComponent(searchQuery)}`
        : '/api/customers'
      const res = await fetch(url)
      const data = await res.json()
      setCustomers(data)
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingId ? `/api/customers` : '/api/customers'
      const method = editingId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingId ? { id: editingId, ...formData } : formData),
      })

      if (res.ok) {
        await fetchCustomers()
        setShowForm(false)
        setEditingId(null)
        setFormData({ name: '', email: '', phone: '', address: '' })
      } else {
        const error = await res.json()
        alert(error.error)
      }
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const editCustomer = (customer: Customer) => {
    setEditingId(customer.id)
    setFormData({
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
    })
    setShowForm(true)
  }

  const deleteCustomer = async (id: string) => {
    if (!confirm('Supprimer ce client ? Attention, cela pourrait affecter les commandes associées.')) return

    try {
      await fetch(`/api/customers?id=${id}`, { method: 'DELETE' })
      await fetchCustomers()
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const cancelEdit = () => {
    setShowForm(false)
    setEditingId(null)
    setFormData({ name: '', email: '', phone: '', address: '' })
  }

  const exportCSV = () => {
    const csv = [
      ['Nom', 'Email', 'Téléphone', 'Adresse', 'Date de création'],
      ...customers.map(c => [
        c.name,
        c.email || '',
        c.phone || '',
        c.address || '',
        new Date(c.createdAt).toLocaleDateString('fr-FR'),
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `clients_${new Date().toISOString()}.csv`
    a.click()
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-900 dark:text-gray-100">Chargement...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Clients</h1>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button onClick={exportCSV} className="flex-1 sm:flex-none px-4 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 shadow-md transition-all duration-200 text-sm sm:text-base min-h-[44px]">
            Exporter CSV
          </button>
          <button
            onClick={() => {
              if (showForm) {
                cancelEdit()
              } else {
                setShowForm(true)
              }
            }}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 shadow-md transition-all duration-200 text-sm sm:text-base min-h-[44px]"
          >
            {showForm ? 'Annuler' : 'Nouveau Client'}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow transition-colors">
        <input
          type="text"
          placeholder="Rechercher un client (nom, email, téléphone)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
        />
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow space-y-4 transition-colors">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{editingId ? 'Modifier le client' : 'Nouveau client'}</h2>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Nom *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
            />
            <input
              type="tel"
              placeholder="Téléphone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
            />
            <input
              type="text"
              placeholder="Adresse"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="px-3 py-2 border rounded-md col-span-2 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 shadow-md transition-all duration-200">
              {editingId ? 'Mettre à jour' : 'Créer le client'}
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nom</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Téléphone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Adresse</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {customers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                  Aucun client enregistré
                </td>
              </tr>
            ) : (
              customers.map((customer) => (
                <tr key={customer.id}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-gray-100">{customer.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100">{customer.email || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100">{customer.phone || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100">{customer.address || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-2">
                      <Link href={`/customers/${customer.id}`} className="text-green-600 hover:text-green-800">
                        Voir
                      </Link>
                      <button onClick={() => editCustomer(customer)} className="text-blue-600 hover:text-blue-800">
                        Modifier
                      </button>
                      <button onClick={() => deleteCustomer(customer.id)} className="text-red-600 hover:text-red-800">
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
