'use client'

import { useEffect, useCallback, useState } from 'react'
import { performanceMonitor } from '@/lib/monitoring/performance-monitor'
import { databaseMonitor } from '@/lib/monitoring/database-monitor'
import { fileMonitor } from '@/lib/monitoring/file-monitor'
import { realtimeMonitor } from '@/lib/monitoring/realtime-monitor'

export interface PerformanceStats {
  database: {
    averageQueryTime: number
    slowQueries: any[]
    cacheHitRate: number
    totalQueries: number
  }
  fileOperations: {
    averageUploadTime: number
    averageDownloadTime: number
    totalOperations: number
    averageFileSize: number
  }
  realtime: {
    averageLatency: number
    totalEvents: number
    slowEvents: any[]
  }
  userExperience: {
    webVitals: {
      fcp: number
      lcp: number
      fid: number
      cls: number
    }
    pageLoad: {
      averageTime: number
      slowPages: any[]
    }
    interactions: {
      averageTime: number
      slowInteractions: any[]
    }
    navigation: {
      averageTime: number
      dnsLookup: number
      serverResponse: number
    }
  }
  systemResources: {
    memory: {
      current: number
      peak: number
      average: number
      unit: string
    }
    performance: {
      longTasks: number
      averageTaskDuration: number
    }
  }
  overall: {
    totalMetrics: number
    timeRange: string
    healthScore: number
  }
}

export interface OptimizationRecommendation {
  category: 'database' | 'files' | 'realtime' | 'ux' | 'system'
  priority: 'high' | 'medium' | 'low'
  issue: string
  recommendation: string
  impact: string
  metric?: number
}

export interface PerformanceInsights {
  trends: Array<{
    metric: string
    trend: 'improving' | 'degrading' | 'stable'
    change: number
    timeframe: string
  }>
  bottlenecks: Array<{
    area: string
    severity: 'critical' | 'major' | 'minor'
    description: string
  }>
  achievements: Array<{
    metric: string
    description: string
    improvement: number
  }>
}

export function usePerformanceMonitoring() {
  const [stats, setStats] = useState<PerformanceStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Initialize performance monitoring
  useEffect(() => {
    try {
      performanceMonitor.initializeMonitoring()
      setIsLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize performance monitoring')
      setIsLoading(false)
    }
  }, [])

  // Record user experience metrics
  const recordPageLoad = useCallback((duration: number, pageUrl?: string) => {
    performanceMonitor.recordUserExperience('page_load', duration, {
      pageUrl: pageUrl || window.location.href,
      userAgent: navigator.userAgent,
      connectionType: (navigator as any).connection?.effectiveType
    })
  }, [])

  const recordInteraction = useCallback((duration: number, interactionType?: string) => {
    performanceMonitor.recordUserExperience('interaction', duration, {
      interactionType,
      pageUrl: window.location.href
    })
  }, [])

  const recordNavigation = useCallback((duration: number, navigationType?: string) => {
    performanceMonitor.recordUserExperience('navigation', duration, {
      navigationType,
      pageUrl: window.location.href
    })
  }, [])

  const recordSearch = useCallback((duration: number, searchQuery?: string, resultCount?: number) => {
    performanceMonitor.recordUserExperience('search', duration, {
      searchQuery,
      resultCount,
      pageUrl: window.location.href
    })
  }, [])

  const recordFormSubmission = useCallback((duration: number, formType?: string, success?: boolean) => {
    performanceMonitor.recordUserExperience('form_submission', duration, {
      formType,
      success,
      pageUrl: window.location.href
    })
  }, [])

  // Record system resource metrics
  const recordMemoryUsage = useCallback(() => {
    if (typeof window !== 'undefined' && (window.performance as any)?.memory) {
      const memory = (window.performance as any).memory
      performanceMonitor.recordSystemResource(
        'memory',
        memory.usedJSHeapSize,
        'bytes',
        memory.jsHeapSizeLimit * 0.8
      )
    }
  }, [])

  // Get performance statistics
  const getStats = useCallback((timeWindow?: number): PerformanceStats => {
    return performanceMonitor.getStats(timeWindow)
  }, [])

  // Get optimization recommendations
  const getOptimizationRecommendations = useCallback((): OptimizationRecommendation[] => {
    return performanceMonitor.getOptimizationRecommendations()
  }, [])

  // Get performance insights
  const getPerformanceInsights = useCallback((): PerformanceInsights => {
    return performanceMonitor.getPerformanceInsights()
  }, [])

  // Get slow operations
  const getSlowOperations = useCallback((threshold?: number) => {
    return performanceMonitor.getSlowOperations(threshold)
  }, [])

  // Refresh stats
  const refreshStats = useCallback((timeWindow?: number) => {
    try {
      const newStats = getStats(timeWindow)
      setStats(newStats)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh stats')
    }
  }, [getStats])

  // Auto-refresh stats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      refreshStats()
    }, 30000) // Refresh every 30 seconds

    // Initial load
    refreshStats()

    return () => clearInterval(interval)
  }, [refreshStats])

  // Monitor component performance
  const measureComponentRender = useCallback((componentName: string) => {
    const startTime = performance.now()
    
    return () => {
      const duration = performance.now() - startTime
      performanceMonitor.recordUserExperience('interaction', duration, {
        componentName,
        metric: 'component_render',
        pageUrl: window.location.href
      })
    }
  }, [])

  // Monitor API call performance
  const measureApiCall = useCallback((apiName: string, method: string) => {
    const startTime = performance.now()
    
    return (success: boolean, statusCode?: number) => {
      const duration = performance.now() - startTime
      performanceMonitor.recordUserExperience('interaction', duration, {
        apiName,
        method,
        success,
        statusCode,
        metric: 'api_call',
        pageUrl: window.location.href
      })
    }
  }, [])

  // Monitor database operations
  const measureDatabaseOperation = useCallback(<T>(
    operationName: string,
    collection: string,
    operation: () => Promise<T>,
    options?: {
      enableCache?: boolean
      cacheTtl?: number
      cacheKey?: string
    }
  ): Promise<T> => {
    return databaseMonitor.monitorQuery(operationName, collection, operation, options)
  }, [])

  // Monitor file operations
  const measureFileUpload = useCallback(<T>(
    fileName: string,
    fileSize: number,
    fileType: string,
    bucketId: string,
    uploadFn: () => Promise<T>
  ): Promise<T> => {
    return fileMonitor.monitorUpload(fileName, fileSize, fileType, bucketId, uploadFn)
  }, [])

  const measureFileDownload = useCallback(<T>(
    fileName: string,
    fileSize: number,
    fileType: string,
    bucketId: string,
    downloadFn: () => Promise<T>
  ): Promise<T> => {
    return fileMonitor.monitorDownload(fileName, fileSize, fileType, bucketId, downloadFn)
  }, [])

  // Monitor real-time events
  const recordRealtimeLatency = useCallback((eventType: string, startTime: number, channelCount: number = 1) => {
    const latency = performance.now() - startTime
    realtimeMonitor.recordEventLatency(eventType, latency, channelCount)
  }, [])

  // Get connection health
  const getConnectionHealth = useCallback(() => {
    return realtimeMonitor.getConnectionHealth()
  }, [])

  // Export performance data
  const exportPerformanceData = useCallback((format: 'json' | 'csv' = 'json') => {
    return performanceMonitor.exportMetrics(format)
  }, [])

  // Clear old metrics
  const clearOldMetrics = useCallback((maxAge: number = 24 * 60 * 60 * 1000) => {
    performanceMonitor.clearOldMetrics(maxAge)
    realtimeMonitor.clearOldData(maxAge)
  }, [])

  return {
    // State
    stats,
    isLoading,
    error,

    // User Experience Monitoring
    recordPageLoad,
    recordInteraction,
    recordNavigation,
    recordSearch,
    recordFormSubmission,
    measureComponentRender,
    measureApiCall,

    // System Monitoring
    recordMemoryUsage,

    // Database Monitoring
    measureDatabaseOperation,

    // File Monitoring
    measureFileUpload,
    measureFileDownload,

    // Real-time Monitoring
    recordRealtimeLatency,
    getConnectionHealth,

    // Analytics
    getStats,
    refreshStats,
    getOptimizationRecommendations,
    getPerformanceInsights,
    getSlowOperations,

    // Utilities
    exportPerformanceData,
    clearOldMetrics
  }
}

// Higher-order component for automatic performance monitoring
export function withPerformanceMonitoring<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string
) {
  return function PerformanceMonitoredComponent(props: P) {
    const { measureComponentRender } = usePerformanceMonitoring()

    useEffect(() => {
      const endMeasurement = measureComponentRender(componentName)
      return endMeasurement
    }, [measureComponentRender])

    return <WrappedComponent {...props} />
  }
}

// Hook for monitoring specific operations
export function useOperationMonitoring() {
  const { measureApiCall, measureDatabaseOperation, measureFileUpload, measureFileDownload } = usePerformanceMonitoring()

  const monitorOperation = useCallback(async <T>(
    operationType: 'api' | 'database' | 'file_upload' | 'file_download',
    operationName: string,
    operation: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> => {
    const startTime = performance.now()

    try {
      const result = await operation()
      const duration = performance.now() - startTime

      // Record the operation based on type
      switch (operationType) {
        case 'api':
          performanceMonitor.recordUserExperience('interaction', duration, {
            operationName,
            operationType,
            success: true,
            ...metadata
          })
          break
        case 'database':
          performanceMonitor.recordDatabaseQuery(
            operationName,
            metadata?.collection || 'unknown',
            duration,
            metadata?.resultCount,
            metadata?.cacheHit
          )
          break
        case 'file_upload':
        case 'file_download':
          performanceMonitor.recordFileOperation(
            operationType === 'file_upload' ? 'upload' : 'download',
            duration,
            metadata?.fileSize,
            metadata?.fileType,
            metadata?.bucketId
          )
          break
      }

      return result
    } catch (error) {
      const duration = performance.now() - startTime
      
      performanceMonitor.recordUserExperience('interaction', duration, {
        operationName,
        operationType,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        ...metadata
      })

      throw error
    }
  }, [measureApiCall, measureDatabaseOperation, measureFileUpload, measureFileDownload])

  return { monitorOperation }
}