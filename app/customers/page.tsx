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

  if (loading) {
    return <div className="text-center py-12">Chargement...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Clients</h1>
        <button
          onClick={() => {
            if (showForm) {
              cancelEdit()
            } else {
              setShowForm(true)
            }
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 shadow-md transition-all duration-200"
        >
          {showForm ? 'Annuler' : 'Nouveau Client'}
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <input
          type="text"
          placeholder="Rechercher un client (nom, email, téléphone)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border rounded-md"
        />
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-4">
          <h2 className="text-xl font-bold">{editingId ? 'Modifier le client' : 'Nouveau client'}</h2>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Nom *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="px-3 py-2 border rounded-md"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="px-3 py-2 border rounded-md"
            />
            <input
              type="tel"
              placeholder="Téléphone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="px-3 py-2 border rounded-md"
            />
            <input
              type="text"
              placeholder="Adresse"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="px-3 py-2 border rounded-md col-span-2"
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

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Téléphone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Adresse</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {customers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  Aucun client enregistré
                </td>
              </tr>
            ) : (
              customers.map((customer) => (
                <tr key={customer.id}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{customer.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{customer.email || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{customer.phone || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{customer.address || '-'}</td>
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
  )
}
