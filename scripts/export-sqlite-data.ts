// Script pour exporter les données de SQLite vers JSON
// À exécuter avec: npx tsx scripts/export-sqlite-data.ts

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./dev.db'
    }
  }
})

async function exportData() {
  console.log('📤 Export des données SQLite en cours...\n')

  try {
    // Exporter toutes les tables
    const data = {
      products: await prisma.product.findMany({ include: { variants: true, expenses: true } }),
      productVariants: await prisma.productVariant.findMany(),
      customers: await prisma.customer.findMany(),
      orders: await prisma.order.findMany({ include: { items: true } }),
      orderItems: await prisma.orderItem.findMany(),
      expenses: await prisma.expense.findMany(),
      giftCards: await prisma.giftCard.findMany(),
      exportDate: new Date().toISOString()
    }

    // Créer le dossier backups s'il n'existe pas
    const backupDir = path.join(process.cwd(), 'backups')
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir)
    }

    // Sauvegarder dans un fichier JSON
    const filename = `backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
    const filepath = path.join(backupDir, filename)

    fs.writeFileSync(filepath, JSON.stringify(data, null, 2))

    console.log('✅ Export terminé avec succès!')
    console.log(`📁 Fichier sauvegardé: ${filepath}\n`)
    console.log('📊 Statistiques:')
    console.log(`   - ${data.products.length} produits`)
    console.log(`   - ${data.productVariants.length} variantes`)
    console.log(`   - ${data.customers.length} clients`)
    console.log(`   - ${data.orders.length} commandes`)
    console.log(`   - ${data.orderItems.length} articles de commande`)
    console.log(`   - ${data.expenses.length} dépenses`)
    console.log(`   - ${data.giftCards.length} bons cadeaux`)

    return filepath
  } catch (error) {
    console.error('❌ Erreur lors de l\'export:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

exportData()
  .then(() => {
    console.log('\n✨ Export terminé!')
    process.exit(0)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
