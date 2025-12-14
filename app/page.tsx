// app/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { format, subDays, subMonths, startOfYear } from 'date-fns'
import * as XLSX from 'xlsx'

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

interface AnalyticsData {
  mostProfitableProducts: Array<{
    productName: string
    totalQuantity: number
    totalRevenue: number
    totalCost: number
    totalProfit: number
    unitMargin: number
  }>
  bestPerformingChannels: Array<{
    channel: string
    orderCount: number
    totalRevenue: number
    totalCost: number
    totalProfit: number
    profitMargin: number
  }>
  averageCartByChannel: Array<{
    channel: string
    orderCount: number
    totalRevenue: number
    averageCart: number
  }>
}

type PeriodFilter = '7days' | '30days' | '3months' | 'year' | 'all'

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
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

      // Fetch dashboard data
      const res = await fetch(`/api/dashboard?startDate=${startDate}&endDate=${endDate}`)
      const json = await res.json()
      setData(json)

      // Fetch analytics data
      const analyticsRes = await fetch(`/api/dashboard/analytics?startDate=${startDate}&endDate=${endDate}`)
      const analyticsJson = await analyticsRes.json()
      setAnalyticsData(analyticsJson)
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

  const exportToExcel = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/export/database')
      const data = await res.json()

      // Créer un nouveau classeur
      const wb = XLSX.utils.book_new()

      // 1. Onglet Statistiques
      const statsData = [
        ['STATISTIQUES GÉNÉRALES'],
        [''],
        ['Indicateur', 'Valeur'],
        ['Nombre total de commandes', data.statistics.totalOrders],
        ['Chiffre d\'affaires total', `${data.statistics.totalRevenue.toFixed(2)} CHF`],
        ['Dépenses totales', `${data.statistics.totalExpenses.toFixed(2)} CHF`],
        ['Bénéfice net', `${data.statistics.netProfit.toFixed(2)} CHF`],
        ['Nombre de produits', data.statistics.totalProducts],
        ['Nombre de clients', data.statistics.totalCustomers],
        ['Nombre de bons cadeaux', data.statistics.totalGiftCards],
        ['Solde total bons cadeaux', `${data.statistics.totalGiftCardBalance.toFixed(2)} CHF`],
      ]
      const wsStats = XLSX.utils.aoa_to_sheet(statsData)
      XLSX.utils.book_append_sheet(wb, wsStats, 'Statistiques')

      // 2. Onglet Produits
      const productsData = [
        ['Nom', 'Catégorie', 'SKU', 'Actif', 'Nb Variantes', 'Stock Total']
      ]
      data.products.forEach((p: any) => {
        productsData.push([
          p.name,
          p.category,
          p.sku,
          p.isActive ? 'Oui' : 'Non',
          p.variantCount,
          p.totalStock
        ])
      })
      const wsProducts = XLSX.utils.aoa_to_sheet(productsData)
      XLSX.utils.book_append_sheet(wb, wsProducts, 'Produits')

      // 3. Onglet Variantes
      const variantsData = [
        ['Produit', 'Taille', 'Stock', 'Seuil Min', 'Prix Achat (CHF)', 'Prix Vente (CHF)']
      ]
      data.products.forEach((p: any) => {
        p.variants.forEach((v: any) => {
          variantsData.push([
            p.name,
            v.size,
            v.stock,
            v.minStock,
            v.costPrice.toFixed(2),
            v.sellingPrice.toFixed(2)
          ])
        })
      })
      const wsVariants = XLSX.utils.aoa_to_sheet(variantsData)
      XLSX.utils.book_append_sheet(wb, wsVariants, 'Variantes')

      // 4. Onglet Commandes
      const ordersData = [
        ['Date', 'Client', 'Email', 'Téléphone', 'Statut', 'Canal', 'Paiement', 'Montant (CHF)', 'Articles', 'Tags']
      ]
      data.orders.forEach((o: any) => {
        ordersData.push([
          format(new Date(o.date), 'dd/MM/yyyy'),
          o.customerName,
          o.customerEmail || '',
          o.customerPhone || '',
          o.status,
          o.salesChannel,
          o.paymentMethod || '',
          o.totalAmount.toFixed(2),
          o.itemCount,
          o.tags || ''
        ])
      })
      const wsOrders = XLSX.utils.aoa_to_sheet(ordersData)
      XLSX.utils.book_append_sheet(wb, wsOrders, 'Commandes')

      // 5. Onglet Détails Commandes
      const orderItemsData = [
        ['Commande (Date)', 'Client', 'Produit', 'Taille', 'Quantité', 'Prix Unit. (CHF)', 'Total (CHF)']
      ]
      data.orders.forEach((o: any) => {
        o.items.forEach((item: any) => {
          orderItemsData.push([
            format(new Date(o.date), 'dd/MM/yyyy'),
            o.customerName,
            item.productName,
            item.variantSize,
            item.quantity,
            item.unitPrice.toFixed(2),
            item.lineTotal.toFixed(2)
          ])
        })
      })
      const wsOrderItems = XLSX.utils.aoa_to_sheet(orderItemsData)
      XLSX.utils.book_append_sheet(wb, wsOrderItems, 'Détails Commandes')

      // 6. Onglet Clients
      const customersData = [
        ['Nom', 'Email', 'Téléphone', 'Adresse', 'Nb Commandes', 'Total Dépensé (CHF)']
      ]
      data.customers.forEach((c: any) => {
        customersData.push([
          c.name,
          c.email || '',
          c.phone || '',
          c.address || '',
          c.totalOrders,
          c.totalSpent.toFixed(2)
        ])
      })
      const wsCustomers = XLSX.utils.aoa_to_sheet(customersData)
      XLSX.utils.book_append_sheet(wb, wsCustomers, 'Clients')

      // 7. Onglet Dépenses
      const expensesData = [
        ['Date', 'Catégorie', 'Description', 'Montant (CHF)', 'Facture URL']
      ]
      data.expenses.forEach((e: any) => {
        expensesData.push([
          format(new Date(e.date), 'dd/MM/yyyy'),
          e.category,
          e.description,
          e.amount.toFixed(2),
          e.invoiceUrl || ''
        ])
      })
      const wsExpenses = XLSX.utils.aoa_to_sheet(expensesData)
      XLSX.utils.book_append_sheet(wb, wsExpenses, 'Dépenses')

      // 8. Onglet Bons Cadeaux
      const giftCardsData = [
        ['Code', 'Montant Initial (CHF)', 'Solde Restant (CHF)', 'Statut', 'Bénéficiaire', 'Email Bénéficiaire', 'Acheteur', 'Email Acheteur', 'Date Expiration']
      ]
      data.giftCards.forEach((g: any) => {
        giftCardsData.push([
          g.code,
          g.initialAmount.toFixed(2),
          g.remainingAmount.toFixed(2),
          g.status,
          g.recipientName || '',
          g.recipientEmail || '',
          g.purchasedByName || '',
          g.purchasedByEmail || '',
          g.expirationDate ? format(new Date(g.expirationDate), 'dd/MM/yyyy') : ''
        ])
      })
      const wsGiftCards = XLSX.utils.aoa_to_sheet(giftCardsData)
      XLSX.utils.book_append_sheet(wb, wsGiftCards, 'Bons Cadeaux')

      // Générer et télécharger le fichier
      const fileName = `AtelierDuGymnaste_Export_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.xlsx`
      XLSX.writeFile(wb, fileName)

      alert('Export Excel réussi !')
    } catch (error) {
      console.error('Erreur lors de l\'export:', error)
      alert('Erreur lors de l\'export')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-900 dark:text-gray-100">Chargement...</div>
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
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <button
              onClick={exportToExcel}
              disabled={loading}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed min-h-[44px]"
              title="Exporter toute la base de données en Excel"
            >
              📊 Exporter Base de Données
            </button>
            <button
              onClick={() => fetchData(period)}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-md bg-green-500 text-white hover:bg-green-600 transition-colors min-h-[44px]"
              title="Rafraîchir les données"
            >
              🔄 Rafraîchir
            </button>
          </div>
        </div>

        <div className="overflow-x-auto -mx-4 px-4">
          <div className="flex gap-2 min-w-min">
            {(['7days', '30days', '3months', 'year', 'all'] as PeriodFilter[]).map((p) => (
              <button
                key={p}
                onClick={() => handlePeriodChange(p)}
                className={`px-4 py-2.5 rounded-md transition-colors whitespace-nowrap min-h-[44px] ${
                  period === p
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {getPeriodLabel(p)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Statistiques réalisées</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow transition-colors">
              <p className="text-sm text-gray-600 dark:text-gray-400">Chiffre d'affaires</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(data?.totalRevenue || 0)}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow transition-colors">
              <p className="text-sm text-gray-600 dark:text-gray-400">Coût des produits</p>
              <p className="text-2xl font-bold text-orange-600">{formatCurrency(data?.totalCost || 0)}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow transition-colors">
              <p className="text-sm text-gray-600 dark:text-gray-400">Dépenses</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(data?.totalExpenses || 0)}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow transition-colors">
              <p className="text-sm text-gray-600 dark:text-gray-400">Bénéfice</p>
              <p className={`text-2xl font-bold ${(data?.profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(data?.profit || 0)}
              </p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">🌍 Vision globale (Réalisé + Potentiel)</h2>
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
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow transition-colors">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Top 5 Produits</h2>
          {data?.topProducts && data.topProducts.length > 0 ? (
            <div className="space-y-3">
              {data.topProducts.map((product, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="font-medium text-gray-900 dark:text-gray-100">{product.name}</span>
                  <span className="text-gray-600 dark:text-gray-400">{product.quantity} unités</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">Aucune vente sur la période</p>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow transition-colors">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">⚠️ Alertes Stock Bas</h2>
          {data?.lowStockVariants && data.lowStockVariants.length > 0 ? (
            <div className="space-y-3">
              {data.lowStockVariants.map((variant) => (
                <div key={variant.id} className="border-l-4 border-red-500 pl-3">
                  <p className="font-medium text-gray-900 dark:text-gray-100">{variant.product.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Taille {variant.size}
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-400">
                    Stock: {variant.stock} / Min: {variant.minStock}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">Tous les stocks sont OK</p>
          )}
        </div>
      </div>

      {/* Section Analytics */}
      <div className="mt-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Analytics</h2>

        {/* Produits les plus rentables */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6 transition-colors">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Produits les plus rentables (marge × volume)</h3>
          {analyticsData?.mostProfitableProducts && analyticsData.mostProfitableProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b dark:border-gray-700">
                    <th className="text-left py-2 text-gray-900 dark:text-gray-100">Produit</th>
                    <th className="text-right py-2 text-gray-900 dark:text-gray-100">Quantité</th>
                    <th className="text-right py-2 text-gray-900 dark:text-gray-100">CA</th>
                    <th className="text-right py-2 text-gray-900 dark:text-gray-100">Coût</th>
                    <th className="text-right py-2 text-gray-900 dark:text-gray-100">Bénéfice</th>
                    <th className="text-right py-2 text-gray-900 dark:text-gray-100">Marge unit.</th>
                  </tr>
                </thead>
                <tbody>
                  {analyticsData.mostProfitableProducts.map((product, index) => (
                    <tr key={index} className="border-b dark:border-gray-700">
                      <td className="py-3 font-medium text-gray-900 dark:text-gray-100">{product.productName}</td>
                      <td className="text-right text-gray-600 dark:text-gray-400">{product.totalQuantity}</td>
                      <td className="text-right text-gray-600 dark:text-gray-400">{formatCurrency(product.totalRevenue)}</td>
                      <td className="text-right text-gray-600 dark:text-gray-400">{formatCurrency(product.totalCost)}</td>
                      <td className="text-right font-medium text-green-600 dark:text-green-400">{formatCurrency(product.totalProfit)}</td>
                      <td className="text-right text-gray-600 dark:text-gray-400">{formatCurrency(product.unitMargin)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">Aucune vente sur la période</p>
          )}
        </div>

        {/* Canaux de vente les plus performants & Panier moyen */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Canaux de vente les plus performants */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow transition-colors">
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Canaux de vente les plus performants</h3>
            {analyticsData?.bestPerformingChannels && analyticsData.bestPerformingChannels.length > 0 ? (
              <div className="space-y-4">
                {analyticsData.bestPerformingChannels.map((channel, index) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-3">
                    <p className="font-medium text-gray-900 dark:text-gray-100">{channel.channel}</p>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      <p>{channel.orderCount} commandes</p>
                      <p>CA: {formatCurrency(channel.totalRevenue)}</p>
                      <p>Bénéfice: <span className="text-green-600 dark:text-green-400">{formatCurrency(channel.totalProfit)}</span></p>
                      <p>Marge: <span className="font-medium">{channel.profitMargin.toFixed(1)}%</span></p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">Aucune vente sur la période</p>
            )}
          </div>

          {/* Panier moyen par canal */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow transition-colors">
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Panier moyen par canal de vente</h3>
            {analyticsData?.averageCartByChannel && analyticsData.averageCartByChannel.length > 0 ? (
              <div className="space-y-4">
                {analyticsData.averageCartByChannel.map((channel, index) => (
                  <div key={index} className="border-l-4 border-purple-500 pl-3">
                    <p className="font-medium text-gray-900 dark:text-gray-100">{channel.channel}</p>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      <p>{channel.orderCount} commandes</p>
                      <p>CA total: {formatCurrency(channel.totalRevenue)}</p>
                      <p className="font-medium text-purple-600 dark:text-purple-400 text-base mt-1">
                        Panier moyen: {formatCurrency(channel.averageCart)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">Aucune vente sur la période</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}