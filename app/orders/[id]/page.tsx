// app/orders/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'

interface Order {
  id: string
  date: string
  customerName: string
  customerEmail: string | null
  customerPhone: string | null
  customerAddress: string | null
  salesChannel: string
  status: string
  tags: string | null
  paymentMethod: string | null
  totalAmount: number
  items: OrderItem[]
  createdAt: string
}

interface OrderItem {
  id: string
  quantity: number
  unitPrice: number
  costPriceAtSale: number
  lineTotal: number
  productVariant: {
    id: string
    size: string
    color: string
    product: {
      name: string
    }
  }
}

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    salesChannel: 'STAND' as 'STAND' | 'SITE' | 'PRECOMMANDE' | 'AUTRE',
    date: '',
    tags: [] as string[],
    paymentMethod: '' as 'TWINT' | 'CASH' | 'AUTRE' | '',
  })

  useEffect(() => {
    fetchOrder()
  }, [])

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${params.id}`)
      if (res.ok) {
        const data = await res.json()
        setOrder(data)
        setFormData({
          customerName: data.customerName,
          customerEmail: data.customerEmail || '',
          customerPhone: data.customerPhone || '',
          customerAddress: data.customerAddress || '',
          salesChannel: data.salesChannel,
          date: format(new Date(data.date), 'yyyy-MM-dd'),
          tags: data.tags ? data.tags.split(',') : [],
          paymentMethod: data.paymentMethod || '',
        })
      } else {
        alert('Commande non trouvée')
        router.push('/orders')
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleTag = (tag: string) => {
    if (formData.tags.includes(tag)) {
      setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) })
    } else {
      setFormData({ ...formData, tags: [...formData.tags, tag] })
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch(`/api/orders/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags.join(','),
          paymentMethod: formData.paymentMethod || null,
        }),
      })

      if (res.ok) {
        await fetchOrder()
        setEditing(false)
        alert('Commande mise à jour avec succès')
      } else {
        const error = await res.json()
        alert(error.error)
      }
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const confirmOrder = async () => {
    if (!confirm('Confirmer cette commande ? Le stock sera décrémenté.')) return

    try {
      const res = await fetch(`/api/orders/${params.id}/confirm`, { method: 'POST' })
      if (res.ok) {
        await fetchOrder()
        alert('Commande confirmée avec succès')
      } else {
        const error = await res.json()
        alert(error.error)
      }
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const cancelOrder = async () => {
    if (!confirm('Annuler cette commande ?')) return

    try {
      const res = await fetch(`/api/orders/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      })
      if (res.ok) {
        await fetchOrder()
      } else {
        const error = await res.json()
        alert(error.error)
      }
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const deleteOrder = async () => {
    if (!confirm('Supprimer définitivement cette commande ?')) return

    try {
      await fetch(`/api/orders/${params.id}`, { method: 'DELETE' })
      router.push('/orders')
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-green-100 text-green-800'
      case 'DRAFT': return 'bg-yellow-100 text-yellow-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'Confirmée'
      case 'DRAFT': return 'Brouillon'
      case 'CANCELLED': return 'Annulée'
      default: return status
    }
  }

  if (loading) {
    return <div className="text-center py-12">Chargement...</div>
  }

  if (!order) {
    return <div className="text-center py-12">Commande non trouvée</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => router.back()} className="text-blue-600 hover:text-blue-800 mb-2">
            ← Retour
          </button>
          <h1 className="text-3xl font-bold">Commande #{order.id.slice(-8)}</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
            {getStatusLabel(order.status)}
          </span>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Informations</h2>
          {!editing && order.status === 'DRAFT' && (
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 shadow-md transition-all duration-200"
            >
              Modifier
            </button>
          )}
        </div>

        {editing ? (
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nom du client *</label>
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Téléphone</label>
                <input
                  type="tel"
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Adresse</label>
                <input
                  type="text"
                  value={formData.customerAddress}
                  onChange={(e) => setFormData({ ...formData, customerAddress: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
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
              <div className="col-span-2">
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
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 shadow-md transition-all duration-200">
                Enregistrer
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              >
                Annuler
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Client</h3>
              <p className="font-medium">{order.customerName}</p>
              {order.customerEmail && <p className="text-sm text-gray-600">{order.customerEmail}</p>}
              {order.customerPhone && <p className="text-sm text-gray-600">{order.customerPhone}</p>}
              {order.customerAddress && <p className="text-sm text-gray-600">{order.customerAddress}</p>}
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Commande</h3>
              <p className="text-sm"><span className="font-medium">Date:</span> {format(new Date(order.date), 'dd/MM/yyyy')}</p>
              <p className="text-sm"><span className="font-medium">Canal:</span> {order.salesChannel}</p>
              <p className="text-sm"><span className="font-medium">Paiement:</span> {order.paymentMethod || '-'}</p>
              <p className="text-sm"><span className="font-medium">Créée le:</span> {format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm')}</p>
              {order.tags && (
                <div className="mt-2">
                  <span className="text-sm font-medium">Tags: </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {order.tags.split(',').map((tag) => (
                      <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Articles</h2>
        <div className="overflow-hidden border rounded-lg">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Taille</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Couleur</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantité</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prix unit.</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4">{item.productVariant.product.name}</td>
                  <td className="px-6 py-4">{item.productVariant.size}</td>
                  <td className="px-6 py-4">{item.productVariant.color}</td>
                  <td className="px-6 py-4">{item.quantity}</td>
                  <td className="px-6 py-4">{item.unitPrice} CHF</td>
                  <td className="px-6 py-4 font-medium">{item.lineTotal} CHF</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex justify-end">
          <div className="text-right">
            <p className="text-2xl font-bold">Total: {order.totalAmount} CHF</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Actions</h2>
        <div className="flex gap-3">
          {order.status === 'DRAFT' && (
            <>
              <button
                onClick={confirmOrder}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 shadow-md transition-all duration-200"
              >
                Confirmer la commande
              </button>
              <button
                onClick={cancelOrder}
                className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
              >
                Annuler la commande
              </button>
            </>
          )}
          <button
            onClick={deleteOrder}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  )
}
