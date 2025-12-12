// prisma/seed.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Début du seeding...')

  // Créer des produits
  const tshirt = await prisma.product.create({
    data: {
      name: 'T-Shirt Performance',
      category: 'Hauts',
      sku: 'TSH-PERF-001',
      isActive: true,
      variants: {
        create: [
          { size: 'S', sellingPrice: 27.99, costPrice: 12.00, stock: 15, minStock: 5 },
          { size: 'M', sellingPrice: 29.99, costPrice: 12.50, stock: 20, minStock: 5 },
          { size: 'L', sellingPrice: 31.99, costPrice: 13.00, stock: 18, minStock: 5 },
          { size: 'XL', sellingPrice: 33.99, costPrice: 13.50, stock: 10, minStock: 5 },
        ],
      },
    },
  })

  const legging = await prisma.product.create({
    data: {
      name: 'Legging Compression',
      category: 'Bas',
      sku: 'LEG-COMP-001',
      isActive: true,
      variants: {
        create: [
          { size: 'XS', sellingPrice: 37.99, costPrice: 17.00, stock: 8, minStock: 5 },
          { size: 'S', sellingPrice: 39.99, costPrice: 18.00, stock: 12, minStock: 5 },
          { size: 'M', sellingPrice: 39.99, costPrice: 18.00, stock: 15, minStock: 5 },
          { size: 'L', sellingPrice: 41.99, costPrice: 19.00, stock: 10, minStock: 5 },
          { size: 'XL', sellingPrice: 43.99, costPrice: 20.00, stock: 3, minStock: 5 },
        ],
      },
    },
  })

  const brassiere = await prisma.product.create({
    data: {
      name: 'Brassière Sport',
      category: 'Hauts',
      sku: 'BRA-SPT-001',
      isActive: true,
      variants: {
        create: [
          { size: 'S', sellingPrice: 32.99, costPrice: 14.00, stock: 10, minStock: 5 },
          { size: 'M', sellingPrice: 34.99, costPrice: 15.00, stock: 14, minStock: 5 },
          { size: 'L', sellingPrice: 36.99, costPrice: 16.00, stock: 8, minStock: 5 },
        ],
      },
    },
  })

  console.log('✅ Produits créés:', { tshirt, legging, brassiere })

  // Créer des clients
  const customer1 = await prisma.customer.create({
    data: {
      name: 'Marie Dupont',
      email: 'marie.dupont@example.com',
      phone: '+41 79 123 45 67',
      address: 'Rue de Lausanne 12, 1000 Lausanne',
    },
  })

  const customer2 = await prisma.customer.create({
    data: {
      name: 'Jean Martin',
      email: 'jean.martin@example.com',
      phone: '+41 76 987 65 43',
      address: 'Avenue du Léman 45, 1005 Lausanne',
    },
  })

  console.log('✅ Clients créés')

  // Créer des dépenses
  await prisma.expense.createMany({
    data: [
      {
        date: new Date('2024-11-15'),
        amount: 1500.00,
        category: 'PRODUCTION',
        description: 'Commande de tissus techniques',
        productId: null,
      },
      {
        date: new Date('2024-11-20'),
        amount: 250.00,
        category: 'MARKETING',
        description: 'Publicité Facebook',
        productId: null,
      },
      {
        date: new Date('2024-11-25'),
        amount: 180.00,
        category: 'STAND',
        description: 'Location stand marché de Noël',
        productId: null,
      },
      {
        date: new Date('2024-12-01'),
        amount: 75.00,
        category: 'LOGISTIQUE',
        description: 'Frais d\'expédition',
        productId: null,
      },
    ],
  })

  console.log('✅ Dépenses créées')

  // Créer une commande exemple
  const variant = await prisma.productVariant.findFirst({
    where: { productId: tshirt.id, size: 'M' },
  })

  if (variant) {
    const order = await prisma.order.create({
      data: {
        date: new Date('2024-12-05'),
        customerId: customer1.id,
        customerName: customer1.name,
        customerEmail: customer1.email,
        customerPhone: customer1.phone,
        customerAddress: customer1.address,
        salesChannel: 'STAND',
        status: 'CONFIRMED',
        paymentMethod: 'TWINT',
        tags: 'Livrer,Payer',
        totalAmount: 89.97,
        items: {
          create: [
            {
              productVariantId: variant.id,
              quantity: 3,
              unitPrice: variant.sellingPrice,
              costPriceAtSale: variant.costPrice,
              lineTotal: Number(variant.sellingPrice) * 3,
            },
          ],
        },
      },
    })

    // Décrémenter le stock
    await prisma.productVariant.update({
      where: { id: variant.id },
      data: { stock: { decrement: 3 } },
    })

    console.log('✅ Commande créée:', order)
  }

  console.log('🎉 Seeding terminé !')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
