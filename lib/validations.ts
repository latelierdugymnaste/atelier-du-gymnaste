// lib/validations.ts
import { z } from 'zod'

export const productSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  category: z.string().min(1, "La catégorie est requise"),
  sku: z.string().min(1, "Le SKU est requis"),
  isActive: z.boolean().default(true),
})

export const variantSchema = z.object({
  productId: z.string(),
  size: z.string().min(1, "La taille est requise"),
  sellingPrice: z.number().min(0, "Le prix de vente doit être positif"),
  costPrice: z.number().min(0, "Le coût d'achat doit être positif"),
  stock: z.number().int().min(0, "Le stock doit être positif"),
  minStock: z.number().int().min(0, "Le stock minimum doit être positif"),
})

export const orderSchema = z.object({
  customerId: z.string().optional().nullable(),
  customerName: z.string().min(1, "Le nom du client est requis"),
  customerEmail: z.string().email("Email invalide").optional().nullable().or(z.literal("")),
  customerPhone: z.string().optional().nullable(),
  customerAddress: z.string().optional().nullable(),
  salesChannel: z.enum(["STAND", "SITE", "PRECOMMANDE", "INSTAGRAM", "WHATSAPP", "EN_SALLE", "AUTRE"]),
  date: z.string().or(z.date()),
  tags: z.string().optional().nullable(),
  paymentMethod: z.enum(["TWINT", "CASH", "AUTRE"]).optional().nullable(),
})

export const orderItemSchema = z.object({
  productVariantId: z.string(),
  quantity: z.number().int().min(1, "La quantité doit être au moins 1"),
  unitPrice: z.number().min(0, "Le prix doit être positif"),
  costPriceAtSale: z.number().min(0, "Le coût doit être positif"),
})

export const expenseSchema = z.object({
  amount: z.number().min(0, "Le montant doit être positif"),
  category: z.enum(["PRODUCTION", "LOGISTIQUE", "MARKETING", "STAND", "AGIVA_SPORT", "PANDACOLA", "AUTRE"]),
  description: z.string().min(1, "La description est requise"),
  date: z.string().or(z.date()),
  productId: z.string().optional().nullable(),
  invoiceUrl: z.string().optional().nullable(),
})

export const giftCardSchema = z.object({
  code: z.string().min(8, "Le code doit contenir au moins 8 caractères"),
  initialAmount: z.number().min(1, "Le montant doit être au moins 1 CHF"),
  recipientName: z.string().optional().nullable(),
  recipientEmail: z.string().email("Email invalide").optional().nullable().or(z.literal("")),
  expirationDate: z.string().or(z.date()).optional().nullable(),
  purchasedByName: z.string().optional().nullable(),
  purchasedByEmail: z.string().email("Email invalide").optional().nullable().or(z.literal("")),
  purchasedByPhone: z.string().optional().nullable(),
  paymentMethod: z.enum(["TWINT", "CASH", "AUTRE"]).optional().nullable(),
  customerId: z.string().optional().nullable(),
})

export const applyGiftCardSchema = z.object({
  code: z.string().min(1, "Le code est requis"),
  orderAmount: z.number().min(0, "Le montant de la commande doit être positif"),
})