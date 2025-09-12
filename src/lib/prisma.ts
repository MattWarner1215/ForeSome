import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  transactionOptions: {
    timeout: 15000, // 15 seconds
    maxWait: 10000,  // 10 seconds
  },
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Test database connection
export async function testDatabaseConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`
    console.log('✅ Database connection successful')
    return true
  } catch (error) {
    console.error('❌ Database connection failed:', error instanceof Error ? error.message : error)
    return false
  }
}

// Enhanced Prisma client with connection retry
export async function connectWithRetry(maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await prisma.$connect()
      console.log(`✅ Database connected successfully (attempt ${i + 1})`)
      return true
    } catch (error) {
      console.error(`❌ Database connection attempt ${i + 1} failed:`, error instanceof Error ? error.message : error)
      if (i === maxRetries - 1) {
        throw error
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)))
    }
  }
  return false
}

// Wrapper function for database operations with retry logic
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 2
): Promise<T | null> {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await operation()
    } catch (error) {
      if (error instanceof Error && 
          (error.message.includes('connect') || 
           error.message.includes('timeout') ||
           error.message.includes('ECONNRESET'))) {
        
        if (i === maxRetries) {
          console.error(`Database operation failed after ${maxRetries + 1} attempts:`, error.message)
          return null
        }
        
        console.warn(`Database operation failed (attempt ${i + 1}), retrying...`)
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
      } else {
        // Non-connection errors should be thrown immediately
        throw error
      }
    }
  }
  return null
}