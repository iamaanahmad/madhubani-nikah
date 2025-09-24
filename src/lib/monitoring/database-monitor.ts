import { performanceMonitor } from './performance-monitor'

// Database query monitoring wrapper
export class DatabaseMonitor {
  private queryCache = new Map<string, { result: any; timestamp: number; ttl: number }>()
  private queryStats = new Map<string, { count: number; totalTime: number; errors: number }>()

  // Monitor database query performance
  async monitorQuery<T>(
    queryName: string,
    collection: string,
    queryFn: () => Promise<T>,
    options: {
      enableCache?: boolean
      cacheTtl?: number
      cacheKey?: string
    } = {}
  ): Promise<T> {
    const { enableCache = false, cacheTtl = 300000, cacheKey } = options // 5 min default TTL
    const operationId = `query_${queryName}_${Date.now()}`
    
    // Check cache first
    if (enableCache && cacheKey) {
      const cached = this.queryCache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        performanceMonitor.recordDatabaseQuery(
          queryName,
          collection,
          0, // Cache hit has 0 duration
          Array.isArray(cached.result) ? cached.result.length : 1,
          true
        )
        return cached.result
      }
    }

    const startTime = performance.now()
    let result: T
    let error: Error | null = null

    try {
      result = await queryFn()
      
      // Cache the result if enabled
      if (enableCache && cacheKey) {
        this.queryCache.set(cacheKey, {
          result,
          timestamp: Date.now(),
          ttl: cacheTtl
        })
      }

    } catch (err) {
      error = err as Error
      throw err
    } finally {
      const duration = performance.now() - startTime
      const resultCount = result && Array.isArray(result) ? result.length : (result ? 1 : 0)

      // Record performance metric
      performanceMonitor.recordDatabaseQuery(
        queryName,
        collection,
        duration,
        resultCount,
        false
      )

      // Update query statistics
      this.updateQueryStats(queryName, duration, error !== null)
    }

    return result!
  }

  // Monitor batch operations
  async monitorBatchOperation<T>(
    operationName: string,
    collection: string,
    operations: Array<() => Promise<T>>,
    options: {
      concurrency?: number
      failFast?: boolean
    } = {}
  ): Promise<T[]> {
    const { concurrency = 5, failFast = false } = options
    const startTime = performance.now()
    const results: T[] = []
    const errors: Error[] = []

    // Process operations in batches
    for (let i = 0; i < operations.length; i += concurrency) {
      const batch = operations.slice(i, i + concurrency)
      const batchPromises = batch.map(async (op, index) => {
        try {
          return await op()
        } catch (error) {
          errors.push(error as Error)
          if (failFast) throw error
          return null
        }
      })

      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults.filter(r => r !== null) as T[])
    }

    const duration = performance.now() - startTime
    
    performanceMonitor.recordDatabaseQuery(
      `batch_${operationName}`,
      collection,
      duration,
      results.length,
      false
    )

    if (errors.length > 0 && failFast) {
      throw new Error(`Batch operation failed with ${errors.length} errors`)
    }

    return results
  }

  // Get query performance statistics
  getQueryStats(): Record<string, {
    count: number
    averageTime: number
    errorRate: number
    totalTime: number
  }> {
    const stats: Record<string, any> = {}
    
    this.queryStats.forEach((stat, queryName) => {
      stats[queryName] = {
        count: stat.count,
        averageTime: stat.totalTime / stat.count,
        errorRate: (stat.errors / stat.count) * 100,
        totalTime: stat.totalTime
      }
    })

    return stats
  }

  // Get slow queries
  getSlowQueries(threshold: number = 1000): Array<{
    query: string
    averageTime: number
    count: number
  }> {
    const slowQueries: Array<{
      query: string
      averageTime: number
      count: number
    }> = []

    this.queryStats.forEach((stat, queryName) => {
      const averageTime = stat.totalTime / stat.count
      if (averageTime > threshold) {
        slowQueries.push({
          query: queryName,
          averageTime,
          count: stat.count
        })
      }
    })

    return slowQueries.sort((a, b) => b.averageTime - a.averageTime)
  }

  // Clear cache
  clearCache(): void {
    this.queryCache.clear()
  }

  // Clear old cache entries
  clearExpiredCache(): void {
    const now = Date.now()
    for (const [key, value] of this.queryCache.entries()) {
      if (now - value.timestamp > value.ttl) {
        this.queryCache.delete(key)
      }
    }
  }

  // Get cache statistics
  getCacheStats(): {
    totalEntries: number
    hitRate: number
    memoryUsage: number
  } {
    const totalEntries = this.queryCache.size
    
    // Calculate approximate memory usage
    let memoryUsage = 0
    this.queryCache.forEach((value, key) => {
      memoryUsage += key.length * 2 // Approximate string size
      memoryUsage += JSON.stringify(value.result).length * 2
    })

    return {
      totalEntries,
      hitRate: 0, // Would need to track hits vs misses
      memoryUsage
    }
  }

  private updateQueryStats(queryName: string, duration: number, hasError: boolean): void {
    const existing = this.queryStats.get(queryName) || { count: 0, totalTime: 0, errors: 0 }
    
    this.queryStats.set(queryName, {
      count: existing.count + 1,
      totalTime: existing.totalTime + duration,
      errors: existing.errors + (hasError ? 1 : 0)
    })
  }
}

// Singleton instance
export const databaseMonitor = new DatabaseMonitor()

// Utility function to create monitored database operations
export function createMonitoredQuery<T>(
  queryName: string,
  collection: string,
  queryFn: () => Promise<T>,
  options?: {
    enableCache?: boolean
    cacheTtl?: number
    cacheKey?: string
  }
): Promise<T> {
  return databaseMonitor.monitorQuery(queryName, collection, queryFn, options)
}