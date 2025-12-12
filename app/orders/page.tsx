// app/orders/page.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
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
  totalAmount: number
  items: any[]
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders')
      const data = await res.json()
      setOrders(data)
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const confirmOrder = async (orderId: string) => {
    if (!confirm('Confirmer cette commande ? Le stock sera décrémenté.')) return
    
    try {
      const res = await fetch(`/api/orders/${orderId}/confirm`, { method: 'POST' })
      if (res.ok) {
        await fetchOrders()
        alert('Commande confirmée avec succès')
      } else {
        const error = await res.json()
        alert(error.error)
      }
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const cancelOrder = async (orderId: string) => {
    if (!confirm('Annuler cette commande ?')) return
    
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      })
      if (res.ok) {
        await fetchOrders()
      } else {
        const error = await res.json()
        alert(error.error)
      }
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const deleteOrder = async (orderId: string) => {
    if (!confirm('Supprimer définitivement cette commande ?')) return
    
    try {
      await fetch(`/api/orders/${orderId}`, { method: 'DELETE' })
      await fetchOrders()
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const exportCSV = () => {
    const csv = [
      ['Date', 'Client', 'Canal', 'Statut', 'Montant', 'Nb Articles'],
      ...orders.map(o => [
        format(new Date(o.date), 'dd/MM/yyyy'),
        o.customerName,
        o.salesChannel,
        o.status,
        o.totalAmount,
        o.items.length,
      ])
    ].map(row => row.join(',')).join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `commandes_${new Date().toISOString()}.csv`
    a.click()
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

  // Filtrer les commandes selon la recherche et le statut
  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchTerm === '' ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.customerEmail && order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.customerPhone && order.customerPhone.includes(searchTerm))

    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter

    return matchesSearch && matchesStatus
  })

  if (loading) {
    return <div className="text-center py-12">Chargement...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Commandes</h1>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 shadow-md transition-all duration-200">
            Exporter CSV
          </button>
          <Link href="/orders/new" className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 shadow-md transition-all duration-200">
            Nouvelle Commande
          </Link>
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="flex gap-4 items-center">
          <input
            type="text"
            placeholder="Rechercher par nom, email ou téléphone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border rounded-md"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-4 py-2 rounded-md ${statusFilter === 'ALL' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            Toutes ({orders.length})
          </button>
          <button
            onClick={() => setStatusFilter('DRAFT')}
            className={`px-4 py-2 rounded-md ${statusFilter === 'DRAFT' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            Brouillons ({orders.filter(o => o.status === 'DRAFT').length})
          </button>
          <button
            onClick={() => setStatusFilter('CONFIRMED')}
            className={`px-4 py-2 rounded-md ${statusFilter === 'CONFIRMED' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            Confirmées ({orders.filter(o => o.status === 'CONFIRMED').length})
          </button>
          <button
            onClick={() => setStatusFilter('CANCELLED')}
            className={`px-4 py-2 rounded-md ${statusFilter === 'CANCELLED' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            Annulées ({orders.filter(o => o.status === 'CANCELLED').length})
          </button>
        </div>

        {filteredOrders.length > 0 && (
          <div className="text-sm text-gray-600">
            {filteredOrders.length} commande{filteredOrders.length > 1 ? 's' : ''} trouvée{filteredOrders.length > 1 ? 's' : ''}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Canal</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Articles</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                  Aucune commande trouvée
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr key={order.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {format(new Date(order.date), 'dd/MM/yyyy')}
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium">{order.customerName}</div>
                  {order.customerAddress && (
                    <div className="text-xs text-gray-500">{order.customerAddress}</div>
                  )}
                </td>
                <td className="px-6 py-4">
                  {order.customerEmail && (
                    <div className="text-sm text-gray-600">{order.customerEmail}</div>
                  )}
                  {order.customerPhone && (
                    <div className="text-sm text-gray-600">{order.customerPhone}</div>
                  )}
                  {!order.customerEmail && !order.customerPhone && (
                    <span className="text-xs text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{order.salesChannel}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-medium">{order.totalAmount} CHF</td>
                <td className="px-6 py-4 whitespace-nowrap">{order.items.length}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex gap-2">
                    <Link
                      href={`/orders/${order.id}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Voir
                    </Link>
                    {order.status === 'DRAFT' && (
                      <>
                        <Link
                          href={`/orders/${order.id}/edit`}
                          className="text-purple-600 hover:text-purple-800"
                        >
                          Modifier
                        </Link>
                        <button
                          onClick={() => confirmOrder(order.id)}
                          className="text-green-600 hover:text-green-800 font-medium"
                        >
                          Confirmer
                        </button>
                        <button
                          onClick={() => cancelOrder(order.id)}
                          className="text-orange-600 hover:text-orange-800"
                        >
                          Annuler
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => deleteOrder(order.id)}
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
    </div>
  )
}