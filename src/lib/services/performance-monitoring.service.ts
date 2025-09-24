import { performanceMonitor } from '@/lib/monitoring/performance-monitor'
import { databaseMonitor } from '@/lib/monitoring/database-monitor'
import { fileMonitor } from '@/lib/monitoring/file-monitor'
import { realtimeMonitor } from '@/lib/monitoring/realtime-monitor'

export class PerformanceMonitoringService {
  private static instance: PerformanceMonitoringService
  private isInitialized = false

  static getInstance(): PerformanceMonitoringService {
    if (!PerformanceMonitoringService.instance) {
      PerformanceMonitoringService.instance = new PerformanceMonitoringService()
    }
    return PerformanceMonitoringService.instance
  }

  // Initialize all monitoring systems
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      // Initialize performance monitoring
      performanceMonitor.initializeMonitoring()

      // Set up periodic cleanup
      this.setupPeriodicCleanup()

      // Set up performance alerts
      this.setupPerformanceAlerts()

      this.isInitialized = true
      console.log('Performance monitoring initialized successfully')
    } catch (error) {
      console.error('Failed to initialize performance monitoring:', error)
      throw error
    }
  }

  // Monitor database operations with automatic performance tracking
  async monitorDatabaseOperation<T>(
    operationName: string,
    collection: string,
    operation: () => Promise<T>,
    options?: {
      enableCache?: boolean
      cacheTtl?: number
      cacheKey?: string
    }
  ): Promise<T> {
    return databaseMonitor.monitorQuery(operationName, collection, operation, options)
  }

  // Monitor file operations with automatic performance tracking
  async monitorFileUpload<T>(
    fileName: string,
    fileSize: number,
    fileType: string,
    bucketId: string,
    uploadFn: () => Promise<T>
  ): Promise<T> {
    return fileMonitor.monitorUpload(fileName, fileSize, fileType, bucketId, uploadFn)
  }

  async monitorFileDownload<T>(
    fileName: string,
    fileSize: number,
    fileType: string,
    bucketId: string,
    downloadFn: () => Promise<T>
  ): Promise<T> {
    return fileMonitor.monitorDownload(fileName, fileSize, fileType, bucketId, downloadFn)
  }

  // Monitor real-time operations
  recordRealtimeLatency(eventType: string, startTime: number, channelCount: number = 1): void {
    const latency = performance.now() - startTime
    realtimeMonitor.recordEventLatency(eventType, latency, channelCount)
  }

  // Monitor user experience metrics
  recordPageLoad(duration: number, metadata?: Record<string, any>): void {
    performanceMonitor.recordUserExperience('page_load', duration, metadata)
  }

  recordUserInteraction(duration: number, metadata?: Record<string, any>): void {
    performanceMonitor.recordUserExperience('interaction', duration, metadata)
  }

  recordFormSubmission(duration: number, metadata?: Record<string, any>): void {
    performanceMonitor.recordUserExperience('form_submission', duration, metadata)
  }

  recordSearchOperation(duration: number, metadata?: Record<string, any>): void {
    performanceMonitor.recordUserExperience('search', duration, metadata)
  }

  recordNavigation(duration: number, metadata?: Record<string, any>): void {
    performanceMonitor.recordUserExperience('navigation', duration, metadata)
  }

  // Get comprehensive performance statistics
  getPerformanceStats(timeWindow?: number) {
    return performanceMonitor.getStats(timeWindow)
  }

  // Get optimization recommendations
  getOptimizationRecommendations() {
    return performanceMonitor.getOptimizationRecommendations()
  }

  // Get performance insights
  getPerformanceInsights() {
    return performanceMonitor.getPerformanceInsights()
  }

  // Get slow operations
  getSlowOperations(threshold?: number) {
    return performanceMonitor.getSlowOperations(threshold)
  }

  // Get connection health
  getConnectionHealth() {
    return realtimeMonitor.getConnectionHealth()
  }

  // Get database statistics
  getDatabaseStats() {
    return databaseMonitor.getQueryStats()
  }

  // Get file operation statistics
  getFileOperationStats() {
    return {
      uploads: fileMonitor.getUploadStats(),
      downloads: fileMonitor.getDownloadStats(),
      slowOperations: fileMonitor.getSlowOperations(),
      recommendations: fileMonitor.getOptimizationRecommendations()
    }
  }

  // Get real-time statistics
  getRealtimeStats() {
    return realtimeMonitor.getRealtimeStats()
  }

  // Export performance data
  exportPerformanceData(format: 'json' | 'csv' = 'json'): string {
    return performanceMonitor.exportMetrics(format)
  }

  // Generate performance report
  generatePerformanceReport(): {
    summary: {
      healthScore: number
      totalMetrics: number
      timeRange: string
      status: 'healthy' | 'degraded' | 'unhealthy'
    }
    database: {
      averageQueryTime: number
      slowQueries: number
      cacheHitRate: number
      totalQueries: number
    }
    files: {
      averageUploadTime: number
      averageDownloadTime: number
      totalOperations: number
      errorRate: number
    }
    realtime: {
      averageLatency: number
      totalEvents: number
      connectionReliability: number
    }
    userExperience: {
      webVitals: {
        lcp: number
        fid: number
        cls: number
      }
      pageLoadTime: number
      interactionTime: number
    }
    recommendations: Array<{
      category: string
      priority: string
      issue: string
      recommendation: string
    }>
  } {
    const stats = this.getPerformanceStats()
    const recommendations = this.getOptimizationRecommendations()
    const connectionHealth = this.getConnectionHealth()
    const realtimeStats = this.getRealtimeStats()

    return {
      summary: {
        healthScore: stats.overall.healthScore,
        totalMetrics: stats.overall.totalMetrics,
        timeRange: stats.overall.timeRange,
        status: connectionHealth.status
      },
      database: {
        averageQueryTime: stats.database.averageQueryTime,
        slowQueries: stats.database.slowQueries.length,
        cacheHitRate: stats.database.cacheHitRate,
        totalQueries: stats.database.totalQueries
      },
      files: {
        averageUploadTime: stats.fileOperations.averageUploadTime,
        averageDownloadTime: stats.fileOperations.averageDownloadTime,
        totalOperations: stats.fileOperations.totalOperations,
        errorRate: 0 // Would need to track this separately
      },
      realtime: {
        averageLatency: stats.realtime.averageLatency,
        totalEvents: stats.realtime.totalEvents,
        connectionReliability: realtimeStats.connections.reliability
      },
      userExperience: {
        webVitals: {
          lcp: stats.userExperience.webVitals.lcp,
          fid: stats.userExperience.webVitals.fid,
          cls: stats.userExperience.webVitals.cls
        },
        pageLoadTime: stats.userExperience.pageLoad.averageTime,
        interactionTime: stats.userExperience.interactions.averageTime
      },
      recommendations: recommendations.map(rec => ({
        category: rec.category,
        priority: rec.priority,
        issue: rec.issue,
        recommendation: rec.recommendation
      }))
    }
  }

  // Set up periodic cleanup of old metrics
  private setupPeriodicCleanup(): void {
    // Clean up old metrics every hour
    setInterval(() => {
      const maxAge = 24 * 60 * 60 * 1000 // 24 hours
      performanceMonitor.clearOldMetrics(maxAge)
      realtimeMonitor.clearOldData(maxAge)
      databaseMonitor.clearExpiredCache()
    }, 60 * 60 * 1000) // Every hour
  }

  // Set up performance alerts
  private setupPerformanceAlerts(): void {
    // Check performance every 5 minutes
    setInterval(() => {
      const stats = this.getPerformanceStats(5 * 60 * 1000) // Last 5 minutes
      const recommendations = this.getOptimizationRecommendations()

      // Alert on critical issues
      const criticalRecommendations = recommendations.filter(rec => rec.priority === 'high')
      if (criticalRecommendations.length > 0) {
        console.warn('Critical performance issues detected:', criticalRecommendations)
        
        // In a real implementation, you might send alerts to monitoring services
        // this.sendAlert('critical', criticalRecommendations)
      }

      // Alert on low health score
      if (stats.overall.healthScore < 50) {
        console.warn(`Low performance health score: ${stats.overall.healthScore}/100`)
        
        // In a real implementation, you might send alerts to monitoring services
        // this.sendAlert('health_score', { score: stats.overall.healthScore })
      }
    }, 5 * 60 * 1000) // Every 5 minutes
  }

  // Decorator for automatic performance monitoring
  monitorMethod(operationName: string, category: 'database' | 'file' | 'api' | 'user_action' = 'api') {
    return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
      const method = descriptor.value

      descriptor.value = async function (...args: any[]) {
        const startTime = performance.now()

        try {
          const result = await method.apply(this, args)
          const duration = performance.now() - startTime

          // Record the operation based on category
          switch (category) {
            case 'database':
              performanceMonitor.recordDatabaseQuery(
                operationName,
                'unknown',
                duration,
                Array.isArray(result) ? result.length : 1,
                false
              )
              break
            case 'file':
              performanceMonitor.recordFileOperation(
                'upload', // Default to upload, could be parameterized
                duration
              )
              break
            case 'user_action':
              performanceMonitor.recordUserExperience('interaction', duration, {
                operationName,
                method: propertyName
              })
              break
            default:
              performanceMonitor.recordUserExperience('interaction', duration, {
                operationName,
                method: propertyName,
                category
              })
          }

          return result
        } catch (error) {
          const duration = performance.now() - startTime
          
          performanceMonitor.recordUserExperience('interaction', duration, {
            operationName,
            method: propertyName,
            category,
            error: error instanceof Error ? error.message : 'Unknown error'
          })

          throw error
        }
      }

      return descriptor
    }
  }
}

// Export singleton instance
export const performanceMonitoringService = PerformanceMonitoringService.getInstance()

// Utility functions for easy access
export const monitorDatabaseOperation = <T>(
  operationName: string,
  collection: string,
  operation: () => Promise<T>,
  options?: {
    enableCache?: boolean
    cacheTtl?: number
    cacheKey?: string
  }
): Promise<T> => {
  return performanceMonitoringService.monitorDatabaseOperation(operationName, collection, operation, options)
}

export const monitorFileUpload = <T>(
  fileName: string,
  fileSize: number,
  fileType: string,
  bucketId: string,
  uploadFn: () => Promise<T>
): Promise<T> => {
  return performanceMonitoringService.monitorFileUpload(fileName, fileSize, fileType, bucketId, uploadFn)
}

export const monitorFileDownload = <T>(
  fileName: string,
  fileSize: number,
  fileType: string,
  bucketId: string,
  downloadFn: () => Promise<T>
): Promise<T> => {
  return performanceMonitoringService.monitorFileDownload(fileName, fileSize, fileType, bucketId, downloadFn)
}

export const recordRealtimeLatency = (eventType: string, startTime: number, channelCount?: number): void => {
  performanceMonitoringService.recordRealtimeLatency(eventType, startTime, channelCount)
}

export const recordPageLoad = (duration: number, metadata?: Record<string, any>): void => {
  performanceMonitoringService.recordPageLoad(duration, metadata)
}

export const recordUserInteraction = (duration: number, metadata?: Record<string, any>): void => {
  performanceMonitoringService.recordUserInteraction(duration, metadata)
}

// Performance monitoring decorator
export const MonitorPerformance = (operationName: string, category?: 'database' | 'file' | 'api' | 'user_action') => {
  return performanceMonitoringService.monitorMethod(operationName, category)
}