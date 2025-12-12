// Script pour importer les données JSON vers PostgreSQL
// À exécuter avec: npx tsx scripts/import-to-postgres.ts <fichier-backup.json>

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

async function importData(backupFile: string) {
  console.log('📥 Import des données vers PostgreSQL...\n')

  try {
    // Lire le fichier de backup
    const filepath = path.join(process.cwd(), backupFile)
    if (!fs.existsSync(filepath)) {
      throw new Error(`Fichier non trouvé: ${filepath}`)
    }

    const rawData = fs.readFileSync(filepath, 'utf-8')
    const data = JSON.parse(rawData)

    console.log('📊 Données à importer:')
    console.log(`   - ${data.products?.length || 0} produits`)
    console.log(`   - ${data.customers?.length || 0} clients`)
    console.log(`   - ${data.orders?.length || 0} commandes`)
    console.log(`   - ${data.expenses?.length || 0} dépenses`)
    console.log(`   - ${data.giftCards?.length || 0} bons cadeaux\n`)

    console.log('🔄 Import en cours...\n')

    // 1. Importer les produits (sans relations)
    console.log('1️⃣ Import des produits...')
    for (const product of data.products || []) {
      const { variants, expenses, ...productData } = product
      await prisma.product.create({
        data: productData
      })
    }
    console.log(`   ✅ ${data.products?.length || 0} produits importés\n`)

    // 2. Importer les variantes
    console.log('2️⃣ Import des variantes...')
    for (const product of data.products || []) {
      for (const variant of product.variants || []) {
        await prisma.productVariant.create({
          data: variant
        })
      }
    }
    console.log(`   ✅ Variantes importées\n`)

    // 3. Importer les clients
    console.log('3️⃣ Import des clients...')
    for (const customer of data.customers || []) {
      await prisma.customer.create({
        data: customer
      })
    }
    console.log(`   ✅ ${data.customers?.length || 0} clients importés\n`)

    // 4. Importer les commandes (sans items)
    console.log('4️⃣ Import des commandes...')
    for (const order of data.orders || []) {
      const { items, ...orderData } = order
      await prisma.order.create({
        data: orderData
      })
    }
    console.log(`   ✅ ${data.orders?.length || 0} commandes importées\n`)

    // 5. Importer les items de commande
    console.log('5️⃣ Import des articles de commande...')
    for (const order of data.orders || []) {
      for (const item of order.items || []) {
        await prisma.orderItem.create({
          data: item
        })
      }
    }
    console.log(`   ✅ Articles importés\n`)

    // 6. Importer les dépenses
    console.log('6️⃣ Import des dépenses...')
    for (const expense of data.expenses || []) {
      await prisma.expense.create({
        data: expense
      })
    }
    console.log(`   ✅ ${data.expenses?.length || 0} dépenses importées\n`)

    // 7. Importer les bons cadeaux
    console.log('7️⃣ Import des bons cadeaux...')
    for (const giftCard of data.giftCards || []) {
      await prisma.giftCard.create({
        data: giftCard
      })
    }
    console.log(`   ✅ ${data.giftCards?.length || 0} bons cadeaux importés\n`)

    console.log('✅ Import terminé avec succès!')
    console.log(`📅 Backup du: ${data.exportDate}`)

  } catch (error) {
    console.error('❌ Erreur lors de l\'import:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

const backupFile = process.argv[2]
if (!backupFile) {
  console.error('❌ Usage: npx tsx scripts/import-to-postgres.ts <fichier-backup.json>')
  process.exit(1)
}

importData(backupFile)
  .then(() => {
    console.log('\n✨ Import terminé!')
    process.exit(0)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
