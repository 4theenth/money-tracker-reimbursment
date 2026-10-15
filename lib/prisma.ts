import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

console.log('[lib/prisma.ts] Initializing Prisma Client...')

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query', 'error', 'warn'],
  })

console.log('[lib/prisma.ts] Prisma Client initialized:', !!prisma)

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
