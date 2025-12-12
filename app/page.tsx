// app/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { format, subDays, subMonths, startOfYear } from 'date-fns'

interface DashboardData {
  totalRevenue: number
  totalCost: number
  totalExpenses: number
  profit: number
  potentialRevenue: number
  potentialCost: number
  potentialProfit: number
  globalRevenue: number
  globalCost: number
  globalProfit: number
  topProducts: Array<{ name: string; quantity: number }>
  lowStockVariants: Array<{ id: string; size: string; stock: number; minStock: number; product: { name: string } }>
}

type PeriodFilter = '7days' | '30days' | '3months' | 'year' | 'all'

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [period, setPeriod] = useState<PeriodFilter>('all')
  const [loading, setLoading] = useState(true)

  const getDateRange = (periodFilter: PeriodFilter) => {
    const today = new Date()
    switch (periodFilter) {
      case '7days':
        return {
          startDate: format(subDays(today, 7), 'yyyy-MM-dd'),
          endDate: format(today, 'yyyy-MM-dd')
        }
      case '30days':
        return {
          startDate: format(subDays(today, 30), 'yyyy-MM-dd'),
          endDate: format(today, 'yyyy-MM-dd')
        }
      case '3months':
        return {
          startDate: format(subMonths(today, 3), 'yyyy-MM-dd'),
          endDate: format(today, 'yyyy-MM-dd')
        }
      case 'year':
        return {
          startDate: format(startOfYear(today), 'yyyy-MM-dd'),
          endDate: format(today, 'yyyy-MM-dd')
        }
      case 'all':
        return {
          startDate: '2000-01-01',
          endDate: format(today, 'yyyy-MM-dd')
        }
    }
  }

  const fetchData = async (periodFilter: PeriodFilter) => {
    setLoading(true)
    try {
      const { startDate, endDate } = getDateRange(periodFilter)
      const res = await fetch(`/api/dashboard?startDate=${startDate}&endDate=${endDate}`)
      const json = await res.json()
      setData(json)
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData(period)
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CH', { style: 'currency', currency: 'CHF' }).format(amount)
  }

  if (loading) {
    return <div className="text-center py-12">Chargement...</div>
  }

  const handlePeriodChange = (newPeriod: PeriodFilter) => {
    setPeriod(newPeriod)
    fetchData(newPeriod)
  }

  const getPeriodLabel = (p: PeriodFilter) => {
    switch (p) {
      case '7days': return '7 derniers jours'
      case '30days': return 'Dernier mois'
      case '3months': return '3 derniers mois'
      case 'year': return 'Année en cours'
      case 'all': return 'Depuis le début'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex gap-2">
          <button
            onClick={() => fetchData(period)}
            className="px-4 py-2 rounded-md bg-green-500 text-white hover:bg-secondary-dark"
            title="Rafraîchir les données"
          >
            🔄 Rafraîchir
          </button>
          {(['7days', '30days', '3months', 'year', 'all'] as PeriodFilter[]).map((p) => (
            <button
              key={p}
              onClick={() => handlePeriodChange(p)}
              className={`px-4 py-2 rounded-md transition-colors ${
                period === p
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {getPeriodLabel(p)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold mb-3">Statistiques réalisées</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-sm text-gray-600">Chiffre d'affaires</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(data?.totalRevenue || 0)}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-sm text-gray-600">Coût des produits</p>
              <p className="text-2xl font-bold text-orange-600">{formatCurrency(data?.totalCost || 0)}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-sm text-gray-600">Dépenses</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(data?.totalExpenses || 0)}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-sm text-gray-600">Bénéfice</p>
              <p className={`text-2xl font-bold ${(data?.profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(data?.profit || 0)}
              </p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-3">🌍 Vision globale (Réalisé + Potentiel)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 p-6 rounded-lg shadow border-2 border-cyan-300">
              <p className="text-sm text-cyan-700 font-medium">CA Global</p>
              <p className="text-2xl font-bold text-cyan-700">{formatCurrency(data?.globalRevenue || 0)}</p>
              <p className="text-xs text-cyan-600 mt-1">Réalisé + Stock restant</p>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-6 rounded-lg shadow border-2 border-amber-300">
              <p className="text-sm text-amber-700 font-medium">Coût des produits Global</p>
              <p className="text-2xl font-bold text-amber-700">{formatCurrency(data?.globalCost || 0)}</p>
              <p className="text-xs text-amber-600 mt-1">Vendus + En stock</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-lg shadow border-2 border-emerald-300">
              <p className="text-sm text-emerald-700 font-medium">Bénéfice Global</p>
              <p className={`text-2xl font-bold ${(data?.globalProfit || 0) >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                {formatCurrency(data?.globalProfit || 0)}
              </p>
              <p className="text-xs text-emerald-600 mt-1">CA global - Dépenses</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Top 5 Produits</h2>
          {data?.topProducts && data.topProducts.length > 0 ? (
            <div className="space-y-3">
              {data.topProducts.map((product, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="font-medium">{product.name}</span>
                  <span className="text-gray-600">{product.quantity} unités</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Aucune vente sur la période</p>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">⚠️ Alertes Stock Bas</h2>
          {data?.lowStockVariants && data.lowStockVariants.length > 0 ? (
            <div className="space-y-3">
              {data.lowStockVariants.map((variant) => (
                <div key={variant.id} className="border-l-4 border-red-500 pl-3">
                  <p className="font-medium">{variant.product.name}</p>
                  <p className="text-sm text-gray-600">
                    Taille {variant.size}
                  </p>
                  <p className="text-sm text-red-600">
                    Stock: {variant.stock} / Min: {variant.minStock}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Tous les stocks sont OK</p>
          )}
        </div>
      </div>
    </div>
  )
}