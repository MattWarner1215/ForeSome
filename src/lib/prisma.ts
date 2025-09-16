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
    timeout: 8000,  // Reduced from 15s to 8s
    maxWait: 5000,  // Reduced from 10s to 5s
    isolationLevel: 'ReadCommitted', // Better performance for read-heavy workloads
  }
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

// Simple in-memory cache for frequent queries
const queryCache = new Map<string, { data: any; timestamp: number; ttl: number }>()

// Cache management
export function getCachedQuery<T>(key: string): T | null {
  const cached = queryCache.get(key)
  if (!cached) return null
  
  const now = Date.now()
  if (now - cached.timestamp > cached.ttl) {
    queryCache.delete(key)
    return null
  }
  
  return cached.data
}

export function setCachedQuery<T>(key: string, data: T, ttlMs = 30000): void {
  queryCache.set(key, { data, timestamp: Date.now(), ttl: ttlMs })
}

// Clean up expired cache entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of Array.from(queryCache.entries())) {
    if (now - value.timestamp > value.ttl) {
      queryCache.delete(key)
    }
  }
}, 300000)

// Wrapper function for database operations with retry logic and caching
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 2,
  cacheKey?: string,
  cacheTtl = 30000
): Promise<T | null> {
  // Check cache first
  if (cacheKey) {
    const cached = getCachedQuery<T>(cacheKey)
    if (cached) return cached
  }

  for (let i = 0; i <= maxRetries; i++) {
    try {
      const result = await operation()
      
      // Cache successful results
      if (cacheKey && result !== null) {
        setCachedQuery(cacheKey, result, cacheTtl)
      }
      
      return result
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