// app/customers/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Product {
  id: string
  name: string
  category: string
  sku: string
}

interface ProductVariant {
  id: string
  size: string
  sellingPrice: number
  product: Product
}

interface OrderItem {
  id: string
  quantity: number
  unitPrice: number
  productVariant: ProductVariant
}

interface Order {
  id: string
  totalAmount: number
  paymentMethod: string
  tags: string | null
  createdAt: string
  items: OrderItem[]
}

interface Customer {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  createdAt: string
  orders: Order[]
}

export default function CustomerDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCustomer()
  }, [])

  const fetchCustomer = async () => {
    try {
      const res = await fetch(`/api/customers/${params.id}`)
      if (res.ok) {
        const data = await res.json()
        setCustomer(data)
      } else {
        console.error('Client non trouvé')
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-900 dark:text-gray-100">Chargement...</div>
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400 mb-4">Client non trouvé</p>
        <button
          onClick={() => router.push('/customers')}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
        >
          ← Retour aux clients
        </button>
      </div>
    )
  }

  const totalRevenue = customer.orders.reduce((sum, order) => sum + Number(order.totalAmount), 0)

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={() => router.push('/customers')}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mb-2 text-sm sm:text-base"
        >
          ← Retour aux clients
        </button>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{customer.name}</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Client depuis le {new Date(customer.createdAt).toLocaleDateString('fr-FR')}</p>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow transition-colors">
        <h2 className="text-lg sm:text-xl font-bold mb-4 text-gray-900 dark:text-white">Informations du client</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Nom</p>
            <p className="font-medium text-gray-900 dark:text-gray-100">{customer.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
            <p className="font-medium text-gray-900 dark:text-gray-100 break-all">{customer.email || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Téléphone</p>
            <p className="font-medium text-gray-900 dark:text-gray-100">{customer.phone || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Adresse</p>
            <p className="font-medium text-gray-900 dark:text-gray-100">{customer.address || '-'}</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow transition-colors">
        <h2 className="text-lg sm:text-xl font-bold mb-4 text-gray-900 dark:text-white">Statistiques</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-md">
            <p className="text-sm text-gray-600 dark:text-gray-400">Nombre de commandes</p>
            <p className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">{customer.orders.length}</p>
          </div>
          <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-md">
            <p className="text-sm text-gray-600 dark:text-gray-400">Revenu total</p>
            <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">{totalRevenue.toFixed(2)} CHF</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow transition-colors">
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Commandes ({customer.orders.length})</h2>
        </div>

        {customer.orders.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            Aucune commande pour ce client
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {customer.orders.map((order) => (
              <div key={order.id} className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
                  <div>
                    <p className="font-medium text-base sm:text-lg text-gray-900 dark:text-white">
                      Commande du {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Paiement: {order.paymentMethod}
                      {order.tags && ` • Tags: ${order.tags}`}
                    </p>
                  </div>
                  <div className="text-left sm:text-right w-full sm:w-auto">
                    <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
                      {Number(order.totalAmount).toFixed(2)} CHF
                    </p>
                    <Link
                      href={`/orders/${order.id}`}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                    >
                      Voir détails →
                    </Link>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-md p-3 sm:p-4 transition-colors">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Articles commandés:</p>
                  <div className="space-y-2">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between text-sm gap-2">
                        <div className="flex-1">
                          <span className="font-medium text-gray-900 dark:text-gray-100">{item.productVariant.product.name}</span>
                          <span className="text-gray-600 dark:text-gray-400"> • Taille {item.productVariant.size}</span>
                          <span className="text-gray-600 dark:text-gray-400"> • SKU {item.productVariant.product.sku}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-gray-600 dark:text-gray-400">Qté: {item.quantity}</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">{Number(item.unitPrice).toFixed(2)} CHF</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
