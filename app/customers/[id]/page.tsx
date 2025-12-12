// app/customers/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Product {
  id: string
  name: string
  category: string
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
    return <div className="text-center py-12">Chargement...</div>
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">Client non trouvé</p>
        <button
          onClick={() => router.push('/customers')}
          className="text-blue-600 hover:text-blue-800"
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
          className="text-blue-600 hover:text-blue-800 mb-2"
        >
          ← Retour aux clients
        </button>
        <h1 className="text-3xl font-bold">{customer.name}</h1>
        <p className="text-gray-600">Client depuis le {new Date(customer.createdAt).toLocaleDateString('fr-FR')}</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Informations du client</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Nom</p>
            <p className="font-medium">{customer.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Email</p>
            <p className="font-medium">{customer.email || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Téléphone</p>
            <p className="font-medium">{customer.phone || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Adresse</p>
            <p className="font-medium">{customer.address || '-'}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Statistiques</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 rounded-md">
            <p className="text-sm text-gray-600">Nombre de commandes</p>
            <p className="text-2xl font-bold text-blue-600">{customer.orders.length}</p>
          </div>
          <div className="p-4 bg-green-50 rounded-md">
            <p className="text-sm text-gray-600">Revenu total</p>
            <p className="text-2xl font-bold text-green-600">{totalRevenue.toFixed(2)} CHF</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">Commandes ({customer.orders.length})</h2>
        </div>

        {customer.orders.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Aucune commande pour ce client
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {customer.orders.map((order) => (
              <div key={order.id} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-medium text-lg">
                      Commande du {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                    <p className="text-sm text-gray-600">
                      Paiement: {order.paymentMethod}
                      {order.tags && ` • Tags: ${order.tags}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">
                      {Number(order.totalAmount).toFixed(2)} CHF
                    </p>
                    <Link
                      href={`/orders/${order.id}`}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Voir détails →
                    </Link>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-md p-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Articles commandés:</p>
                  <div className="space-y-2">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-sm">
                        <div className="flex-1">
                          <span className="font-medium">{item.productVariant.product.name}</span>
                          <span className="text-gray-600"> • Taille {item.productVariant.size}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-gray-600">Qté: {item.quantity}</span>
                          <span className="font-medium">{Number(item.unitPrice).toFixed(2)} CHF</span>
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
