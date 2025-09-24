// Performance monitoring utilities
interface PerformanceMetric {
  name: string
  duration: number
  timestamp: number
  metadata?: Record<string, any>
}

interface DatabaseQueryMetric extends PerformanceMetric {
  query: string
  collection: string
  resultCount?: number
  cacheHit?: boolean
}

interface FileOperationMetric extends PerformanceMetric {
  operation: 'upload' | 'download' | 'delete'
  fileSize?: number
  fileType?: string
  bucketId?: string
}

interface RealtimeMetric extends PerformanceMetric {
  eventType: string
  channelCount: number
  latency: number
}

interface UserExperienceMetric extends PerformanceMetric {
  metricType: 'page_load' | 'interaction' | 'navigation' | 'search' | 'form_submission'
  userId?: string
  pageUrl?: string
  userAgent?: string
  connectionType?: string
}

interface SystemResourceMetric extends PerformanceMetric {
  resourceType: 'memory' | 'cpu' | 'network' | 'storage'
  value: number
  unit: string
  threshold?: number
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private activeTimers: Map<string, number> = new Map()
  private userExperienceMetrics: UserExperienceMetric[] = []
  private systemResourceMetrics: SystemResourceMetric[] = []
  private performanceObserver: PerformanceObserver | null = null
  
  private thresholds = {
    database: 1000, // 1 second
    fileUpload: 5000, // 5 seconds
    fileDownload: 3000, // 3 seconds
    realtime: 500, // 500ms
    pageLoad: 3000, // 3 seconds
    interaction: 100, // 100ms
    navigation: 2000, // 2 seconds
  }

  // Start timing an operation
  startTimer(operationId: string): void {
    this.activeTimers.set(operationId, performance.now())
  }

  // End timing and record metric
  endTimer(operationId: string, name: string, metadata?: Record<string, any>): number {
    const startTime = this.activeTimers.get(operationId)
    if (!startTime) {
      console.warn(`No start time found for operation: ${operationId}`)
      return 0
    }

    const duration = performance.now() - startTime
    this.activeTimers.delete(operationId)

    const metric: PerformanceMetric = {
      name,
      duration,
      timestamp: Date.now(),
      metadata
    }

    this.metrics.push(metric)
    this.checkThreshold(metric)

    return duration
  }

  // Record database query performance
  recordDatabaseQuery(
    query: string,
    collection: string,
    duration: number,
    resultCount?: number,
    cacheHit?: boolean
  ): void {
    const metric: DatabaseQueryMetric = {
      name: 'database_query',
      query,
      collection,
      duration,
      timestamp: Date.now(),
      resultCount,
      cacheHit
    }

    this.metrics.push(metric)
    this.checkThreshold(metric)
  }

  // Record file operation performance
  recordFileOperation(
    operation: 'upload' | 'download' | 'delete',
    duration: number,
    fileSize?: number,
    fileType?: string,
    bucketId?: string
  ): void {
    const metric: FileOperationMetric = {
      name: 'file_operation',
      operation,
      duration,
      timestamp: Date.now(),
      fileSize,
      fileType,
      bucketId
    }

    this.metrics.push(metric)
    this.checkThreshold(metric)
  }

  // Record real-time notification latency
  recordRealtimeLatency(
    eventType: string,
    latency: number,
    channelCount: number
  ): void {
    const metric: RealtimeMetric = {
      name: 'realtime_notification',
      eventType,
      duration: latency,
      timestamp: Date.now(),
      channelCount,
      latency
    }

    this.metrics.push(metric)
    this.checkThreshold(metric)
  }

  // Record user experience metrics
  recordUserExperience(
    metricType: 'page_load' | 'interaction' | 'navigation' | 'search' | 'form_submission',
    duration: number,
    metadata?: {
      userId?: string
      pageUrl?: string
      userAgent?: string
      connectionType?: string
      [key: string]: any
    }
  ): void {
    const metric: UserExperienceMetric = {
      name: 'user_experience',
      metricType,
      duration,
      timestamp: Date.now(),
      userId: metadata?.userId,
      pageUrl: metadata?.pageUrl,
      userAgent: metadata?.userAgent,
      connectionType: metadata?.connectionType,
      metadata
    }

    this.userExperienceMetrics.push(metric)
    this.checkThreshold(metric)
  }

  // Record system resource usage
  recordSystemResource(
    resourceType: 'memory' | 'cpu' | 'network' | 'storage',
    value: number,
    unit: string,
    threshold?: number
  ): void {
    const metric: SystemResourceMetric = {
      name: 'system_resource',
      resourceType,
      duration: 0, // Not applicable for resource metrics
      timestamp: Date.now(),
      value,
      unit,
      threshold
    }

    this.systemResourceMetrics.push(metric)
    
    // Check if resource usage exceeds threshold
    if (threshold && value > threshold) {
      console.warn(`High ${resourceType} usage detected: ${value}${unit} (threshold: ${threshold}${unit})`)
    }
  }

  // Initialize performance monitoring
  initializeMonitoring(): void {
    if (typeof window === 'undefined') return

    // Monitor Web Vitals
    this.monitorWebVitals()
    
    // Monitor navigation timing
    this.monitorNavigationTiming()
    
    // Monitor resource timing
    this.monitorResourceTiming()
    
    // Monitor long tasks
    this.monitorLongTasks()
    
    // Monitor memory usage
    this.monitorMemoryUsage()
  }

  // Get performance statistics
  getStats(timeWindow?: number) {
    const cutoffTime = timeWindow ? Date.now() - timeWindow : 0
    const filteredMetrics = this.metrics.filter(m => m.timestamp > cutoffTime)
    const filteredUXMetrics = this.userExperienceMetrics.filter(m => m.timestamp > cutoffTime)
    const filteredResourceMetrics = this.systemResourceMetrics.filter(m => m.timestamp > cutoffTime)

    const databaseMetrics = filteredMetrics.filter(m => m.name === 'database_query') as DatabaseQueryMetric[]
    const fileMetrics = filteredMetrics.filter(m => m.name === 'file_operation') as FileOperationMetric[]
    const realtimeMetrics = filteredMetrics.filter(m => m.name === 'realtime_notification') as RealtimeMetric[]

    // Process user experience metrics
    const fcpMetrics = filteredUXMetrics.filter(m => m.metadata?.metric === 'FCP')
    const lcpMetrics = filteredUXMetrics.filter(m => m.metadata?.metric === 'LCP')
    const fidMetrics = filteredUXMetrics.filter(m => m.metadata?.metric === 'FID')
    const clsMetrics = filteredUXMetrics.filter(m => m.metadata?.metric === 'CLS')
    
    const pageLoadMetrics = filteredUXMetrics.filter(m => m.metricType === 'page_load')
    const interactionMetrics = filteredUXMetrics.filter(m => m.metricType === 'interaction')
    const navigationMetrics = filteredUXMetrics.filter(m => m.metricType === 'navigation')
    
    const dnsMetrics = navigationMetrics.filter(m => m.metadata?.metric === 'DNS_lookup')
    const serverResponseMetrics = navigationMetrics.filter(m => m.metadata?.metric === 'server_response')
    
    // Process system resource metrics
    const memoryMetrics = filteredResourceMetrics.filter(m => m.resourceType === 'memory')
    const longTaskMetrics = filteredUXMetrics.filter(m => m.metadata?.metric === 'long_task')

    // Calculate health score
    const healthScore = this.calculateHealthScore({
      databaseAvg: this.calculateAverage(databaseMetrics.map(m => m.duration)),
      realtimeAvg: this.calculateAverage(realtimeMetrics.map(m => m.latency)),
      pageLoadAvg: this.calculateAverage(pageLoadMetrics.map(m => m.duration)),
      interactionAvg: this.calculateAverage(interactionMetrics.map(m => m.duration))
    })

    return {
      database: {
        averageQueryTime: this.calculateAverage(databaseMetrics.map(m => m.duration)),
        slowQueries: databaseMetrics.filter(m => m.duration > this.thresholds.database),
        cacheHitRate: this.calculateCacheHitRate(databaseMetrics),
        totalQueries: databaseMetrics.length
      },
      fileOperations: {
        averageUploadTime: this.calculateAverage(
          fileMetrics.filter(m => m.operation === 'upload').map(m => m.duration)
        ),
        averageDownloadTime: this.calculateAverage(
          fileMetrics.filter(m => m.operation === 'download').map(m => m.duration)
        ),
        totalOperations: fileMetrics.length,
        averageFileSize: this.calculateAverage(
          fileMetrics.map(m => m.fileSize).filter(Boolean) as number[]
        )
      },
      realtime: {
        averageLatency: this.calculateAverage(realtimeMetrics.map(m => m.latency)),
        totalEvents: realtimeMetrics.length,
        slowEvents: realtimeMetrics.filter(m => m.latency > this.thresholds.realtime)
      },
      userExperience: {
        webVitals: {
          fcp: this.calculateAverage(fcpMetrics.map(m => m.duration)),
          lcp: this.calculateAverage(lcpMetrics.map(m => m.duration)),
          fid: this.calculateAverage(fidMetrics.map(m => m.duration)),
          cls: this.calculateAverage(clsMetrics.map(m => m.duration))
        },
        pageLoad: {
          averageTime: this.calculateAverage(pageLoadMetrics.map(m => m.duration)),
          slowPages: pageLoadMetrics.filter(m => m.duration > this.thresholds.pageLoad)
        },
        interactions: {
          averageTime: this.calculateAverage(interactionMetrics.map(m => m.duration)),
          slowInteractions: interactionMetrics.filter(m => m.duration > this.thresholds.interaction)
        },
        navigation: {
          averageTime: this.calculateAverage(navigationMetrics.map(m => m.duration)),
          dnsLookup: this.calculateAverage(dnsMetrics.map(m => m.duration)),
          serverResponse: this.calculateAverage(serverResponseMetrics.map(m => m.duration))
        }
      },
      systemResources: {
        memory: {
          current: memoryMetrics.length > 0 ? memoryMetrics[memoryMetrics.length - 1].value : 0,
          peak: Math.max(...memoryMetrics.map(m => m.value), 0),
          average: this.calculateAverage(memoryMetrics.map(m => m.value)),
          unit: memoryMetrics.length > 0 ? memoryMetrics[0].unit : 'bytes'
        },
        performance: {
          longTasks: longTaskMetrics.length,
          averageTaskDuration: this.calculateAverage(longTaskMetrics.map(m => m.duration))
        }
      },
      overall: {
        totalMetrics: filteredMetrics.length + filteredUXMetrics.length + filteredResourceMetrics.length,
        timeRange: timeWindow ? `${timeWindow}ms` : 'all time',
        healthScore
      }
    }
  }

  // Get slow operations
  getSlowOperations(threshold?: number): PerformanceMetric[] {
    const defaultThreshold = 2000 // 2 seconds
    const actualThreshold = threshold || defaultThreshold

    return this.metrics.filter(m => m.duration > actualThreshold)
      .sort((a, b) => b.duration - a.duration)
  }

  // Get optimization recommendations
  getOptimizationRecommendations() {
    const recommendations: Array<{
      category: 'database' | 'files' | 'realtime' | 'ux' | 'system'
      priority: 'high' | 'medium' | 'low'
      issue: string
      recommendation: string
      impact: string
      metric?: number
    }> = []

    const stats = this.getStats()

    // Database recommendations
    if (stats.database.averageQueryTime > this.thresholds.database) {
      recommendations.push({
        category: 'database',
        priority: 'high',
        issue: `Average database query time is ${stats.database.averageQueryTime.toFixed(0)}ms`,
        recommendation: 'Optimize slow queries, add database indexes, implement query caching',
        impact: 'Improved page load times and user experience',
        metric: stats.database.averageQueryTime
      })
    }

    if (stats.database.cacheHitRate < 70) {
      recommendations.push({
        category: 'database',
        priority: 'medium',
        issue: `Low cache hit rate: ${stats.database.cacheHitRate.toFixed(1)}%`,
        recommendation: 'Improve caching strategy, increase cache TTL for stable data',
        impact: 'Reduced database load and faster response times',
        metric: stats.database.cacheHitRate
      })
    }

    // File operation recommendations
    if (stats.fileOperations.averageUploadTime > this.thresholds.fileUpload) {
      recommendations.push({
        category: 'files',
        priority: 'high',
        issue: `Slow file uploads: ${(stats.fileOperations.averageUploadTime / 1000).toFixed(1)}s average`,
        recommendation: 'Implement file compression, use CDN, optimize upload chunk size',
        impact: 'Better user experience for profile picture uploads',
        metric: stats.fileOperations.averageUploadTime
      })
    }

    // Real-time recommendations
    if (stats.realtime.averageLatency > this.thresholds.realtime) {
      recommendations.push({
        category: 'realtime',
        priority: 'high',
        issue: `High real-time notification latency: ${stats.realtime.averageLatency.toFixed(0)}ms`,
        recommendation: 'Optimize WebSocket connections, implement connection pooling',
        impact: 'Faster notifications and better real-time experience',
        metric: stats.realtime.averageLatency
      })
    }

    // User experience recommendations
    if (stats.userExperience.webVitals.lcp > 2500) {
      recommendations.push({
        category: 'ux',
        priority: 'high',
        issue: `Poor Largest Contentful Paint: ${(stats.userExperience.webVitals.lcp / 1000).toFixed(1)}s`,
        recommendation: 'Optimize images, implement lazy loading, use image CDN',
        impact: 'Better Core Web Vitals and SEO ranking',
        metric: stats.userExperience.webVitals.lcp
      })
    }

    if (stats.userExperience.webVitals.fid > 100) {
      recommendations.push({
        category: 'ux',
        priority: 'medium',
        issue: `High First Input Delay: ${stats.userExperience.webVitals.fid.toFixed(0)}ms`,
        recommendation: 'Reduce JavaScript bundle size, implement code splitting',
        impact: 'More responsive user interactions',
        metric: stats.userExperience.webVitals.fid
      })
    }

    if (stats.userExperience.webVitals.cls > 0.1) {
      recommendations.push({
        category: 'ux',
        priority: 'medium',
        issue: `High Cumulative Layout Shift: ${(stats.userExperience.webVitals.cls / 1000).toFixed(3)}`,
        recommendation: 'Set explicit dimensions for images, avoid dynamic content insertion',
        impact: 'More stable visual experience',
        metric: stats.userExperience.webVitals.cls
      })
    }

    // System resource recommendations
    if (stats.systemResources.performance.longTasks > 10) {
      recommendations.push({
        category: 'system',
        priority: 'medium',
        issue: `${stats.systemResources.performance.longTasks} long tasks detected`,
        recommendation: 'Break up long-running JavaScript tasks, use Web Workers',
        impact: 'Smoother user interface and better responsiveness',
        metric: stats.systemResources.performance.longTasks
      })
    }

    // Sort by priority
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    return recommendations.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority])
  }

  // Get performance insights
  getPerformanceInsights() {
    const stats = this.getStats()
    const previousStats = this.getStats(24 * 60 * 60 * 1000) // 24 hours ago
    
    const trends: Array<{
      metric: string
      trend: 'improving' | 'degrading' | 'stable'
      change: number
      timeframe: string
    }> = []

    const bottlenecks: Array<{
      area: string
      severity: 'critical' | 'major' | 'minor'
      description: string
    }> = []

    const achievements: Array<{
      metric: string
      description: string
      improvement: number
    }> = []

    // Analyze trends (simplified - in real implementation, you'd compare with historical data)
    const dbChange = stats.database.averageQueryTime - previousStats.database.averageQueryTime
    if (Math.abs(dbChange) > 50) {
      trends.push({
        metric: 'Database Performance',
        trend: dbChange < 0 ? 'improving' : 'degrading',
        change: Math.abs(dbChange),
        timeframe: '24h'
      })
    }

    // Identify bottlenecks
    if (stats.database.averageQueryTime > 2000) {
      bottlenecks.push({
        area: 'Database',
        severity: 'critical',
        description: 'Database queries are extremely slow, affecting overall performance'
      })
    } else if (stats.database.averageQueryTime > 1000) {
      bottlenecks.push({
        area: 'Database',
        severity: 'major',
        description: 'Database queries are slower than optimal'
      })
    }

    if (stats.userExperience.webVitals.lcp > 4000) {
      bottlenecks.push({
        area: 'Page Loading',
        severity: 'critical',
        description: 'Pages are loading very slowly, impacting user experience'
      })
    }

    if (stats.realtime.averageLatency > 1000) {
      bottlenecks.push({
        area: 'Real-time Features',
        severity: 'major',
        description: 'Real-time notifications have high latency'
      })
    }

    // Identify achievements
    if (stats.database.cacheHitRate > 85) {
      achievements.push({
        metric: 'Cache Performance',
        description: 'Excellent cache hit rate reducing database load',
        improvement: stats.database.cacheHitRate
      })
    }

    if (stats.userExperience.webVitals.fcp < 1800) {
      achievements.push({
        metric: 'First Contentful Paint',
        description: 'Fast initial page rendering providing good user experience',
        improvement: 1800 - stats.userExperience.webVitals.fcp
      })
    }

    return { trends, bottlenecks, achievements }
  }

  // Clear old metrics
  clearOldMetrics(maxAge: number = 24 * 60 * 60 * 1000): void {
    const cutoffTime = Date.now() - maxAge
    this.metrics = this.metrics.filter(m => m.timestamp > cutoffTime)
    this.userExperienceMetrics = this.userExperienceMetrics.filter(m => m.timestamp > cutoffTime)
    this.systemResourceMetrics = this.systemResourceMetrics.filter(m => m.timestamp > cutoffTime)
  }

  // Export metrics for analysis
  exportMetrics(format: 'json' | 'csv' = 'json'): string {
    const allMetrics = [...this.metrics, ...this.userExperienceMetrics, ...this.systemResourceMetrics]
    
    if (format === 'csv') {
      const headers = ['name', 'duration', 'timestamp', 'metadata']
      const rows = allMetrics.map(m => [
        m.name,
        m.duration.toString(),
        m.timestamp.toString(),
        JSON.stringify(m.metadata || {})
      ])
      
      return [headers, ...rows].map(row => row.join(',')).join('\n')
    }

    return JSON.stringify(allMetrics, null, 2)
  }

  // Private helper methods
  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0
    return values.reduce((sum, val) => sum + val, 0) / values.length
  }

  private calculateCacheHitRate(metrics: DatabaseQueryMetric[]): number {
    const metricsWithCache = metrics.filter(m => m.cacheHit !== undefined)
    if (metricsWithCache.length === 0) return 0

    const hits = metricsWithCache.filter(m => m.cacheHit).length
    return (hits / metricsWithCache.length) * 100
  }

  // Calculate overall health score (0-100)
  private calculateHealthScore(metrics: {
    databaseAvg: number
    realtimeAvg: number
    pageLoadAvg: number
    interactionAvg: number
  }): number {
    let score = 100

    // Database performance (25% weight)
    if (metrics.databaseAvg > this.thresholds.database) {
      score -= 25 * Math.min(1, (metrics.databaseAvg - this.thresholds.database) / this.thresholds.database)
    }

    // Real-time performance (25% weight)
    if (metrics.realtimeAvg > this.thresholds.realtime) {
      score -= 25 * Math.min(1, (metrics.realtimeAvg - this.thresholds.realtime) / this.thresholds.realtime)
    }

    // Page load performance (25% weight)
    if (metrics.pageLoadAvg > this.thresholds.pageLoad) {
      score -= 25 * Math.min(1, (metrics.pageLoadAvg - this.thresholds.pageLoad) / this.thresholds.pageLoad)
    }

    // Interaction performance (25% weight)
    if (metrics.interactionAvg > this.thresholds.interaction) {
      score -= 25 * Math.min(1, (metrics.interactionAvg - this.thresholds.interaction) / this.thresholds.interaction)
    }

    return Math.max(0, Math.round(score))
  }

  private checkThreshold(metric: PerformanceMetric): void {
    let threshold = 0

    switch (metric.name) {
      case 'database_query':
        threshold = this.thresholds.database
        break
      case 'file_operation':
        const fileMetric = metric as FileOperationMetric
        threshold = fileMetric.operation === 'upload' 
          ? this.thresholds.fileUpload 
          : this.thresholds.fileDownload
        break
      case 'realtime_notification':
        threshold = this.thresholds.realtime
        break
      case 'user_experience':
        const uxMetric = metric as UserExperienceMetric
        switch (uxMetric.metricType) {
          case 'page_load':
            threshold = this.thresholds.pageLoad
            break
          case 'interaction':
            threshold = this.thresholds.interaction
            break
          case 'navigation':
            threshold = this.thresholds.navigation
            break
        }
        break
    }

    if (threshold > 0 && metric.duration > threshold) {
      console.warn(`Slow operation detected: ${metric.name} took ${metric.duration}ms (threshold: ${threshold}ms)`, metric)
    }
  }

  // Monitor Web Vitals
  private monitorWebVitals(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return

    try {
      // First Contentful Paint (FCP)
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            this.recordUserExperience('page_load', entry.startTime, {
              metric: 'FCP',
              pageUrl: window.location.href
            })
          }
        }
      }).observe({ entryTypes: ['paint'] })

      // Largest Contentful Paint (LCP)
      new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        this.recordUserExperience('page_load', lastEntry.startTime, {
          metric: 'LCP',
          pageUrl: window.location.href
        })
      }).observe({ entryTypes: ['largest-contentful-paint'] })

      // First Input Delay (FID)
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordUserExperience('interaction', (entry as any).processingStart - entry.startTime, {
            metric: 'FID',
            pageUrl: window.location.href
          })
        }
      }).observe({ entryTypes: ['first-input'] })

      // Cumulative Layout Shift (CLS)
      let clsValue = 0
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value
          }
        }
        this.recordUserExperience('page_load', clsValue * 1000, {
          metric: 'CLS',
          pageUrl: window.location.href
        })
      }).observe({ entryTypes: ['layout-shift'] })
    } catch (e) {
      // Performance Observer not supported
    }
  }

  // Monitor navigation timing
  private monitorNavigationTiming(): void {
    if (typeof window === 'undefined' || !window.performance?.getEntriesByType) return

    const navigation = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    if (navigation) {
      // DNS lookup time
      this.recordUserExperience('navigation', navigation.domainLookupEnd - navigation.domainLookupStart, {
        metric: 'DNS_lookup',
        pageUrl: window.location.href
      })

      // TCP connection time
      this.recordUserExperience('navigation', navigation.connectEnd - navigation.connectStart, {
        metric: 'TCP_connection',
        pageUrl: window.location.href
      })

      // Server response time
      this.recordUserExperience('navigation', navigation.responseEnd - navigation.requestStart, {
        metric: 'server_response',
        pageUrl: window.location.href
      })

      // DOM content loaded
      this.recordUserExperience('page_load', navigation.domContentLoadedEventEnd - navigation.navigationStart, {
        metric: 'DOM_content_loaded',
        pageUrl: window.location.href
      })

      // Page load complete
      this.recordUserExperience('page_load', navigation.loadEventEnd - navigation.navigationStart, {
        metric: 'page_load_complete',
        pageUrl: window.location.href
      })
    }
  }

  // Monitor resource timing
  private monitorResourceTiming(): void {
    if (typeof window === 'undefined' || !window.performance?.getEntriesByType) return

    const resources = window.performance.getEntriesByType('resource') as PerformanceResourceTiming[]
    resources.forEach(resource => {
      const duration = resource.responseEnd - resource.startTime
      this.recordUserExperience('page_load', duration, {
        metric: 'resource_load',
        resourceName: resource.name,
        resourceType: resource.initiatorType,
        transferSize: resource.transferSize,
        pageUrl: window.location.href
      })
    })
  }

  // Monitor long tasks
  private monitorLongTasks(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return

    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordUserExperience('interaction', entry.duration, {
            metric: 'long_task',
            taskName: entry.name,
            pageUrl: window.location.href
          })
        }
      }).observe({ entryTypes: ['longtask'] })
    } catch (e) {
      // Long task API not supported
    }
  }

  // Monitor memory usage
  private monitorMemoryUsage(): void {
    if (typeof window === 'undefined' || !(window.performance as any)?.memory) return

    const memory = (window.performance as any).memory
    this.recordSystemResource('memory', memory.usedJSHeapSize, 'bytes', memory.jsHeapSizeLimit * 0.8)
    
    // Monitor memory usage periodically
    setInterval(() => {
      const currentMemory = (window.performance as any).memory
      this.recordSystemResource('memory', currentMemory.usedJSHeapSize, 'bytes', currentMemory.jsHeapSizeLimit * 0.8)
    }, 30000) // Every 30 seconds
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor()

// Decorator for automatic performance monitoring
export function monitorPerformance(operationName: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const operationId = `${operationName}_${Date.now()}_${Math.random()}`
      performanceMonitor.startTimer(operationId)

      try {
        const result = await method.apply(this, args)
        performanceMonitor.endTimer(operationId, operationName, {
          method: propertyName,
          args: args.length
        })
        return result
      } catch (error) {
        performanceMonitor.endTimer(operationId, operationName, {
          method: propertyName,
          args: args.length,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        throw error
      }
    }

    return descriptor
  }
}

// Hook for React components
export function usePerformanceMonitoring() {
  const recordMetric = (name: string, duration: number, metadata?: Record<string, any>) => {
    performanceMonitor.recordDatabaseQuery(name, 'unknown', duration, undefined, undefined)
  }

  const getStats = (timeWindow?: number) => {
    return performanceMonitor.getStats(timeWindow)
  }

  const getSlowOperations = (threshold?: number) => {
    return performanceMonitor.getSlowOperations(threshold)
  }

  return {
    recordMetric,
    getStats,
    getSlowOperations,
    recordUserExperience: (metricType: any, duration: number, metadata?: any) => 
      performanceMonitor.recordUserExperience(metricType, duration, metadata),
    recordSystemResource: (resourceType: any, value: number, unit: string, threshold?: number) =>
      performanceMonitor.recordSystemResource(resourceType, value, unit, threshold),
    getOptimizationRecommendations: () => performanceMonitor.getOptimizationRecommendations(),
    getPerformanceInsights: () => performanceMonitor.getPerformanceInsights(),
    initializeMonitoring: () => performanceMonitor.initializeMonitoring()
  }
}