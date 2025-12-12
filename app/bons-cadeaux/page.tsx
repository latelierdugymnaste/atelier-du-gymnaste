// app/bons-cadeaux/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface GiftCard {
  id: string
  code: string
  initialAmount: number
  remainingAmount: number
  status: string
  purchasedByName?: string
  purchasedByEmail?: string
  purchasedByPhone?: string
  recipientName?: string
  recipientEmail?: string
  expirationDate?: string
  createdAt: string
}

interface Customer {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
}

export default function GiftCardsPage() {
  const [giftCards, setGiftCards] = useState<GiftCard[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false)
  const [newCustomerData, setNewCustomerData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  })
  const [formData, setFormData] = useState({
    code: '',
    initialAmount: '',
    recipientName: '',
    recipientEmail: '',
    purchasedByName: '',
    purchasedByEmail: '',
    purchasedByPhone: '',
    expirationDate: '',
    paymentMethod: '' as 'TWINT' | 'CASH' | 'AUTRE' | '',
  })

  const fetchGiftCards = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'ALL') params.append('status', statusFilter)
      if (searchTerm) params.append('search', searchTerm)

      const res = await fetch(`/api/gift-cards?${params}`)
      const data = await res.json()

      // Vérifier si data est un tableau, sinon utiliser un tableau vide
      if (Array.isArray(data)) {
        setGiftCards(data)
      } else {
        console.error('Les données reçues ne sont pas un tableau:', data)
        setGiftCards([])
      }
    } catch (error) {
      console.error('Erreur:', error)
      setGiftCards([])
    } finally {
      setLoading(false)
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

  useEffect(() => {
    fetchGiftCards()
    fetchCustomers()
  }, [statusFilter])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchGiftCards()
  }

  const handleCustomerNameChange = (value: string) => {
    setFormData({ ...formData, purchasedByName: value })
    setSelectedCustomerId(null)

    if (value.length > 0) {
      const filtered = customers.filter(c =>
        c.name.toLowerCase().includes(value.toLowerCase())
      )
      setFilteredCustomers(filtered)
      setShowCustomerDropdown(filtered.length > 0)
    } else {
      setFilteredCustomers([])
      setShowCustomerDropdown(false)
    }
  }

  const selectCustomer = (customer: Customer) => {
    setSelectedCustomerId(customer.id)
    setFormData({
      ...formData,
      purchasedByName: customer.name,
      purchasedByEmail: customer.email || '',
      purchasedByPhone: customer.phone || '',
    })
    setShowCustomerDropdown(false)
  }

  const handleCreateNewCustomer = async () => {
    if (!newCustomerData.name) {
      alert('Le nom du client est requis')
      return
    }

    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCustomerData),
      })

      if (res.ok) {
        const customer = await res.json()
        setSelectedCustomerId(customer.id)
        setFormData({
          ...formData,
          purchasedByName: customer.name,
          purchasedByEmail: customer.email || '',
          purchasedByPhone: customer.phone || '',
        })
        setNewCustomerData({ name: '', email: '', phone: '', address: '' })
        setShowNewCustomerModal(false)
        fetchCustomers() // Rafraîchir la liste des clients
        alert('Client créé avec succès !')
      } else {
        const error = await res.json()
        alert(error.error || 'Erreur lors de la création du client')
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la création du client')
    }
  }

  const generateCode = async () => {
    try {
      const res = await fetch('/api/gift-cards/generate-code')
      if (res.ok) {
        const data = await res.json()
        setFormData({ ...formData, code: data.code })
      } else {
        const error = await res.json()
        alert(error.error || 'Erreur lors de la génération du code')
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la génération du code')
    }
  }

  const handleEdit = (card: GiftCard) => {
    setEditingId(card.id)
    setFormData({
      code: card.code,
      initialAmount: card.initialAmount.toString(),
      recipientName: card.recipientName || '',
      recipientEmail: card.recipientEmail || '',
      purchasedByName: card.purchasedByName || '',
      purchasedByEmail: card.purchasedByEmail || '',
      purchasedByPhone: card.purchasedByPhone || '',
      expirationDate: card.expirationDate ? new Date(card.expirationDate).toISOString().split('T')[0] : '',
      paymentMethod: '',
    })
    setShowModal(true)
  }

  const resetForm = () => {
    setEditingId(null)
    setFormData({
      code: '',
      initialAmount: '',
      recipientName: '',
      recipientEmail: '',
      purchasedByName: '',
      purchasedByEmail: '',
      purchasedByPhone: '',
      expirationDate: '',
      paymentMethod: '',
    })
    setSelectedCustomerId(null)
    setShowCustomerDropdown(false)
    setFilteredCustomers([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const dataToSend = {
        ...formData,
        customerId: selectedCustomerId,
        ...(editingId && { id: editingId }),
      }
      console.log('Envoi des données:', dataToSend)

      const url = editingId ? '/api/gift-cards' : '/api/gift-cards'
      const method = editingId ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      })

      console.log('Status de la réponse:', res.status)

      let data
      try {
        const text = await res.text()
        console.log('Texte brut de la réponse:', text)
        data = text ? JSON.parse(text) : {}
      } catch (parseError) {
        console.error('Erreur de parsing JSON:', parseError)
        alert('Erreur: La réponse du serveur est invalide')
        return
      }

      console.log('Réponse du serveur:', data)

      if (res.ok) {
        setShowModal(false)
        resetForm()
        fetchGiftCards()
        alert(editingId ? 'Bon cadeau modifié avec succès !' : 'Bon cadeau créé avec succès !')
      } else {
        alert(data.error || `Erreur lors de la ${editingId ? 'modification' : 'création'}`)
        if (data.details) {
          console.error('Détails de l\'erreur:', data.details)
        }
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert(`Erreur lors de la ${editingId ? 'modification' : 'création'} du bon cadeau: ` + error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce bon cadeau ?')) return

    try {
      const res = await fetch(`/api/gift-cards?id=${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        fetchGiftCards()
      } else {
        const error = await res.json()
        alert(error.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la suppression')
    }
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch('/api/gift-cards', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      })

      if (res.ok) {
        fetchGiftCards()
      } else {
        const error = await res.json()
        alert(error.error || 'Erreur lors de la mise à jour')
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la mise à jour')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CH', { style: 'currency', currency: 'CHF' }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-800',
      USED: 'bg-gray-100 text-gray-800',
      EXPIRED: 'bg-red-100 text-red-800',
    }
    return badges[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      ACTIVE: 'Actif',
      USED: 'Utilisé',
      EXPIRED: 'Expiré',
    }
    return labels[status] || status
  }

  if (loading) {
    return <div className="text-center py-12">Chargement...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Bons Cadeaux</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
        >
          + Créer un bon cadeau
        </button>
      </div>

      {/* Filtres */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              placeholder="Rechercher par code ou nom..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 border rounded-md px-3 py-2"
            />
            <button
              type="submit"
              className="bg-gray-200 px-4 py-2 rounded-md hover:bg-gray-300"
            >
              Rechercher
            </button>
          </form>

          <div className="flex gap-2">
            {['ALL', 'ACTIVE', 'USED', 'EXPIRED'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-md transition-colors ${
                  statusFilter === status
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status === 'ALL' ? 'Tous' : getStatusLabel(status)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Liste des bons cadeaux */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant initial</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant restant</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Destinataire</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acheté par</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiration</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {giftCards.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                  Aucun bon cadeau trouvé
                </td>
              </tr>
            ) : (
              giftCards.map((card) => (
                <tr key={card.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-mono font-bold text-blue-600">
                    {card.code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatCurrency(Number(card.initialAmount))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-semibold">
                    {formatCurrency(Number(card.remainingAmount))}
                  </td>
                  <td className="px-6 py-4">
                    {card.recipientName || '-'}
                    {card.recipientEmail && (
                      <div className="text-xs text-gray-500">{card.recipientEmail}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {card.purchasedByName || '-'}
                    {card.purchasedByEmail && (
                      <div className="text-xs text-gray-500">{card.purchasedByEmail}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {card.expirationDate
                      ? format(new Date(card.expirationDate), 'dd/MM/yyyy', { locale: fr })
                      : 'Aucune'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(card.status)}`}>
                      {getStatusLabel(card.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex gap-2 items-center">
                      <button
                        onClick={() => handleEdit(card)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Modifier
                      </button>
                      <select
                        value={card.status}
                        onChange={(e) => handleStatusChange(card.id, e.target.value)}
                        className="border rounded px-2 py-1 text-xs"
                      >
                        <option value="ACTIVE">Actif</option>
                        <option value="USED">Utilisé</option>
                        <option value="EXPIRED">Expiré</option>
                      </select>
                      <button
                        onClick={() => handleDelete(card.id)}
                        className="text-red-600 hover:text-red-800"
                      >
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

      {/* Modal de création/édition */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 my-8">
            <h2 className="text-xl font-bold mb-4">{editingId ? 'Modifier le bon cadeau' : 'Créer un bon cadeau'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Code */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Code</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="flex-1 border rounded-md px-3 py-2"
                      required
                      disabled={!!editingId}
                    />
                    {!editingId && (
                      <button
                        type="button"
                        onClick={generateCode}
                        className="bg-gray-200 px-4 py-2 rounded-md hover:bg-gray-300 whitespace-nowrap"
                      >
                        Générer
                      </button>
                    )}
                  </div>
                  {editingId && (
                    <p className="text-xs text-gray-500 mt-1">Le code ne peut pas être modifié</p>
                  )}
                </div>

                {/* Montant */}
                <div>
                  <label className="block text-sm font-medium mb-1">Montant (CHF) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.initialAmount}
                    onChange={(e) => setFormData({ ...formData, initialAmount: e.target.value })}
                    className="w-full border rounded-md px-3 py-2"
                    required
                    disabled={!!editingId}
                  />
                  {editingId && (
                    <p className="text-xs text-gray-500 mt-1">Le montant initial ne peut pas être modifié</p>
                  )}
                </div>

                {/* Mode de paiement */}
                {!editingId && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Mode de paiement *</label>
                    <select
                      value={formData.paymentMethod}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as 'TWINT' | 'CASH' | 'AUTRE' })}
                      className="w-full border rounded-md px-3 py-2"
                      required
                    >
                      <option value="">-- Sélectionner --</option>
                      <option value="TWINT">TWINT</option>
                      <option value="CASH">Cash</option>
                      <option value="AUTRE">Autre</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Informations de l'acheteur</h3>
                  <button
                    type="button"
                    onClick={() => setShowNewCustomerModal(true)}
                    className="text-sm bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600"
                  >
                    + Nouveau client
                  </button>
                </div>

                {/* Nom de l'acheteur avec autocomplete */}
                <div className="relative mb-4">
                  <label className="block text-sm font-medium mb-1">
                    Nom de l'acheteur {selectedCustomerId && <span className="text-green-600">(Client existant)</span>}
                  </label>
                  <input
                    type="text"
                    value={formData.purchasedByName}
                    onChange={(e) => handleCustomerNameChange(e.target.value)}
                    onFocus={() => {
                      if (formData.purchasedByName && filteredCustomers.length > 0) {
                        setShowCustomerDropdown(true)
                      }
                    }}
                    className="w-full border rounded-md px-3 py-2"
                    placeholder="Commencez à taper pour rechercher..."
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Email acheteur */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Email acheteur</label>
                    <input
                      type="email"
                      value={formData.purchasedByEmail}
                      onChange={(e) => setFormData({ ...formData, purchasedByEmail: e.target.value })}
                      className="w-full border rounded-md px-3 py-2"
                      disabled={!!selectedCustomerId}
                    />
                  </div>

                  {/* Téléphone acheteur */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Téléphone acheteur</label>
                    <input
                      type="text"
                      value={formData.purchasedByPhone}
                      onChange={(e) => setFormData({ ...formData, purchasedByPhone: e.target.value })}
                      className="w-full border rounded-md px-3 py-2"
                      disabled={!!selectedCustomerId}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Informations du destinataire (optionnel)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Nom destinataire */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Nom du destinataire</label>
                    <input
                      type="text"
                      value={formData.recipientName}
                      onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                      className="w-full border rounded-md px-3 py-2"
                    />
                  </div>

                  {/* Email destinataire */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Email destinataire</label>
                    <input
                      type="email"
                      value={formData.recipientEmail}
                      onChange={(e) => setFormData({ ...formData, recipientEmail: e.target.value })}
                      className="w-full border rounded-md px-3 py-2"
                    />
                  </div>

                  {/* Date d'expiration */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Date d'expiration</label>
                    <input
                      type="date"
                      value={formData.expirationDate}
                      onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                      className="w-full border rounded-md px-3 py-2"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600"
                >
                  {editingId ? 'Modifier le bon cadeau' : 'Créer le bon cadeau'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    resetForm()
                  }}
                  className="flex-1 bg-gray-200 py-2 rounded-md hover:bg-gray-300"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de création de nouveau client */}
      {showNewCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Nouveau client</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nom *</label>
                <input
                  type="text"
                  value={newCustomerData.name}
                  onChange={(e) => setNewCustomerData({ ...newCustomerData, name: e.target.value })}
                  className="w-full border rounded-md px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={newCustomerData.email}
                  onChange={(e) => setNewCustomerData({ ...newCustomerData, email: e.target.value })}
                  className="w-full border rounded-md px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Téléphone</label>
                <input
                  type="text"
                  value={newCustomerData.phone}
                  onChange={(e) => setNewCustomerData({ ...newCustomerData, phone: e.target.value })}
                  className="w-full border rounded-md px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Adresse</label>
                <textarea
                  value={newCustomerData.address}
                  onChange={(e) => setNewCustomerData({ ...newCustomerData, address: e.target.value })}
                  className="w-full border rounded-md px-3 py-2"
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={handleCreateNewCustomer}
                  className="flex-1 bg-green-500 text-white py-2 rounded-md hover:bg-green-600"
                >
                  Créer
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewCustomerModal(false)
                    setNewCustomerData({ name: '', email: '', phone: '', address: '' })
                  }}
                  className="flex-1 bg-gray-200 py-2 rounded-md hover:bg-gray-300"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
