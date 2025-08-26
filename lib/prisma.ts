import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Verbose query logs in development; quiet in production
    log: process.env.NODE_ENV === "production" ? [] : ["query"],
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
