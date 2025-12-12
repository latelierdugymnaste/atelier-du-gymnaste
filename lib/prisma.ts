// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_qg4df8rMmRpi@ep-sweet-wildflower-agrplesm-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require"
    }
  }
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma