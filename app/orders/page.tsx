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
  paymentMethod: string | null
  totalAmount: number
  items: any[]
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL')

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

  // Filtrer les commandes selon la recherche, le statut et le moyen de paiement
  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchTerm === '' ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.customerEmail && order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.customerPhone && order.customerPhone.includes(searchTerm))

    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter
    const matchesPayment = paymentFilter === 'ALL' || order.paymentMethod === paymentFilter

    return matchesSearch && matchesStatus && matchesPayment
  })

  // Calculer les totaux par moyen de paiement (commandes confirmées uniquement)
  const confirmedOrders = filteredOrders.filter(o => o.status === 'CONFIRMED')
  const cashTotal = confirmedOrders
    .filter(o => o.paymentMethod === 'CASH')
    .reduce((sum, o) => sum + Number(o.totalAmount), 0)
  const twintTotal = confirmedOrders
    .filter(o => o.paymentMethod === 'TWINT')
    .reduce((sum, o) => sum + Number(o.totalAmount), 0)
  const totalConfirmed = confirmedOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0)

  if (loading) {
    return <div className="text-center py-12 text-gray-900 dark:text-gray-100">Chargement...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Commandes</h1>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button onClick={exportCSV} className="flex-1 sm:flex-none px-4 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 shadow-md transition-all duration-200 text-sm sm:text-base min-h-[44px]">
            Exporter CSV
          </button>
          <Link href="/orders/new" className="flex-1 sm:flex-none px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 shadow-md transition-all duration-200 text-sm sm:text-base min-h-[44px] flex items-center justify-center">
            Nouvelle Commande
          </Link>
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow space-y-4 transition-colors">
        <div className="flex gap-4 items-center">
          <input
            type="text"
            placeholder="Rechercher par nom, email ou téléphone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border rounded-md dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
          />
        </div>

        <div className="space-y-3">
          <div>
            <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Statut</div>
            <div className="flex gap-2 flex-wrap">
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
          </div>

          <div>
            <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Moyen de paiement</div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setPaymentFilter('ALL')}
                className={`px-4 py-2 rounded-md ${paymentFilter === 'ALL' ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                Tous
              </button>
              <button
                onClick={() => setPaymentFilter('CASH')}
                className={`px-4 py-2 rounded-md ${paymentFilter === 'CASH' ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                Cash ({orders.filter(o => o.paymentMethod === 'CASH' && o.status === 'CONFIRMED').length})
              </button>
              <button
                onClick={() => setPaymentFilter('TWINT')}
                className={`px-4 py-2 rounded-md ${paymentFilter === 'TWINT' ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                Twint ({orders.filter(o => o.paymentMethod === 'TWINT' && o.status === 'CONFIRMED').length})
              </button>
            </div>
          </div>
        </div>

        {filteredOrders.length > 0 && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {filteredOrders.length} commande{filteredOrders.length > 1 ? 's' : ''} trouvée{filteredOrders.length > 1 ? 's' : ''}
          </div>
        )}

        {/* Totaux par moyen de paiement */}
        {confirmedOrders.length > 0 && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/30 dark:to-blue-900/30 p-4 rounded-lg border border-purple-200 dark:border-purple-700">
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">💰 Totaux (commandes confirmées)</div>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-700 p-3 rounded-lg shadow-sm">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Cash</div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{cashTotal.toFixed(2)} CHF</div>
              </div>
              <div className="bg-white dark:bg-gray-700 p-3 rounded-lg shadow-sm">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Twint</div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{twintTotal.toFixed(2)} CHF</div>
              </div>
              <div className="bg-white dark:bg-gray-700 p-3 rounded-lg shadow-sm">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total</div>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{totalConfirmed.toFixed(2)} CHF</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="min-w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Client</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Canal</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Paiement</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Statut</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Articles</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                  Aucune commande trouvée
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr key={order.id}>
                <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100">
                  {format(new Date(order.date), 'dd/MM/yyyy')}
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900 dark:text-gray-100">{order.customerName}</div>
                  {order.customerAddress && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">{order.customerAddress}</div>
                  )}
                </td>
                <td className="px-6 py-4">
                  {order.customerEmail && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">{order.customerEmail}</div>
                  )}
                  {order.customerPhone && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">{order.customerPhone}</div>
                  )}
                  {!order.customerEmail && !order.customerPhone && (
                    <span className="text-xs text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100">{order.salesChannel}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {order.paymentMethod ? (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      order.paymentMethod === 'CASH' ? 'bg-green-100 text-green-800' :
                      order.paymentMethod === 'TWINT' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.paymentMethod === 'CASH' ? '💵 Cash' : order.paymentMethod === 'TWINT' ? '📱 Twint' : order.paymentMethod}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-gray-100">{order.totalAmount} CHF</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100">{order.items.length}</td>
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
    </div>
  )
}