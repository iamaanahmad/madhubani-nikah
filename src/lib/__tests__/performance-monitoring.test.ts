import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { performanceMonitor } from '@/lib/monitoring/performance-monitor'
import { databaseMonitor } from '@/lib/monitoring/database-monitor'
import { fileMonitor } from '@/lib/monitoring/file-monitor'
import { realtimeMonitor } from '@/lib/monitoring/realtime-monitor'
import { performanceMonitoringService } from '@/lib/services/performance-monitoring.service'

// Mock performance API
const mockPerformance = {
  now: vi.fn(() => Date.now()),
  getEntriesByType: vi.fn(() => []),
  memory: {
    usedJSHeapSize: 1024 * 1024 * 50, // 50MB
    jsHeapSizeLimit: 1024 * 1024 * 100 // 100MB
  }
}

// Mock PerformanceObserver
const mockPerformanceObserver = vi.fn().mockImplementation((callback) => ({
  observe: vi.fn(),
  disconnect: vi.fn()
}))

// Setup global mocks
Object.defineProperty(global, 'performance', {
  value: mockPerformance,
  writable: true
})

Object.defineProperty(global, 'PerformanceObserver', {
  value: mockPerformanceObserver,
  writable: true
})

Object.defineProperty(global, 'window', {
  value: {
    performance: mockPerformance,
    location: { href: 'http://localhost:3000/test' },
    navigator: { userAgent: 'test-agent' }
  },
  writable: true
})

describe('Performance Monitoring', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPerformance.now.mockReturnValue(1000)
  })

  afterEach(() => {
    // Clear metrics after each test
    performanceMonitor.clearOldMetrics(0)
    // Clear realtime monitor data
    realtimeMonitor.clearOldData(0)
  })

  describe('PerformanceMonitor', () => {
    it('should record database query metrics', () => {
      performanceMonitor.recordDatabaseQuery('testQuery', 'users', 250, 10, false)
      
      const stats = performanceMonitor.getStats()
      expect(stats.database.totalQueries).toBe(1)
      expect(stats.database.averageQueryTime).toBe(250)
    })

    it('should record file operation metrics', () => {
      performanceMonitor.recordFileOperation('upload', 3000, 1024 * 1024, 'image/jpeg', 'profile_pictures')
      
      const stats = performanceMonitor.getStats()
      expect(stats.fileOperations.totalOperations).toBe(1)
      expect(stats.fileOperations.averageUploadTime).toBe(3000)
    })

    it('should record real-time notification latency', () => {
      performanceMonitor.recordRealtimeLatency('new_interest', 150, 1)
      
      const stats = performanceMonitor.getStats()
      expect(stats.realtime.totalEvents).toBe(1)
      expect(stats.realtime.averageLatency).toBe(150)
    })

    it('should record user experience metrics', () => {
      performanceMonitor.recordUserExperience('page_load', 2000, {
        pageUrl: '/profile',
        metric: 'LCP'
      })
      
      const stats = performanceMonitor.getStats()
      expect(stats.userExperience.pageLoad.averageTime).toBe(2000)
    })

    it('should calculate health score correctly', () => {
      // Add some good metrics
      performanceMonitor.recordDatabaseQuery('fastQuery', 'users', 100, 5, true)
      performanceMonitor.recordRealtimeLatency('notification', 50, 1)
      performanceMonitor.recordUserExperience('page_load', 1000)
      performanceMonitor.recordUserExperience('interaction', 50)
      
      const stats = performanceMonitor.getStats()
      expect(stats.overall.healthScore).toBeGreaterThan(80)
    })

    it('should identify slow operations', () => {
      performanceMonitor.recordDatabaseQuery('slowQuery', 'users', 2000, 5, false)
      performanceMonitor.recordFileOperation('upload', 6000, 1024 * 1024, 'image/jpeg')
      
      const slowOps = performanceMonitor.getSlowOperations(1000)
      expect(slowOps).toHaveLength(2)
      expect(slowOps[0].duration).toBe(6000) // Should be sorted by duration
    })

    it('should generate optimization recommendations', () => {
      // Add slow operations
      performanceMonitor.recordDatabaseQuery('slowQuery', 'users', 2000, 5, false)
      performanceMonitor.recordUserExperience('page_load', 4000, { metric: 'LCP' })
      
      const recommendations = performanceMonitor.getOptimizationRecommendations()
      expect(recommendations.length).toBeGreaterThan(0)
      expect(recommendations.some(r => r.category === 'database')).toBe(true)
      expect(recommendations.some(r => r.category === 'ux')).toBe(true)
    })

    it('should export metrics in JSON format', () => {
      performanceMonitor.recordDatabaseQuery('testQuery', 'users', 250, 10, false)
      
      const exported = performanceMonitor.exportMetrics('json')
      const parsed = JSON.parse(exported)
      expect(Array.isArray(parsed)).toBe(true)
      expect(parsed.length).toBe(1)
      expect(parsed[0].name).toBe('database_query')
    })
  })

  describe('DatabaseMonitor', () => {
    it('should monitor database queries with caching', async () => {
      const mockQuery = vi.fn().mockResolvedValue([{ id: 1 }, { id: 2 }])
      
      const result = await databaseMonitor.monitorQuery(
        'getUsers',
        'users',
        mockQuery,
        { enableCache: true, cacheKey: 'users_list' }
      )
      
      expect(result).toHaveLength(2)
      expect(mockQuery).toHaveBeenCalledTimes(1)
      
      // Second call should use cache
      const cachedResult = await databaseMonitor.monitorQuery(
        'getUsers',
        'users',
        mockQuery,
        { enableCache: true, cacheKey: 'users_list' }
      )
      
      expect(cachedResult).toHaveLength(2)
      expect(mockQuery).toHaveBeenCalledTimes(1) // Should not call again
    })

    it('should track query statistics', async () => {
      const mockQuery = vi.fn().mockResolvedValue([{ id: 1 }])
      
      // Mock performance.now to return increasing values
      mockPerformance.now.mockReturnValueOnce(1000).mockReturnValueOnce(1100)
        .mockReturnValueOnce(2000).mockReturnValueOnce(2150)
      
      await databaseMonitor.monitorQuery('testQuery', 'users', mockQuery)
      await databaseMonitor.monitorQuery('testQuery', 'users', mockQuery)
      
      const stats = databaseMonitor.getQueryStats()
      expect(stats.testQuery.count).toBe(2)
      expect(stats.testQuery.averageTime).toBeGreaterThan(0)
    })

    it('should identify slow queries', async () => {
      const slowQuery = vi.fn().mockResolvedValue([])
      
      // Mock performance.now to simulate slow query
      mockPerformance.now.mockReturnValueOnce(1000).mockReturnValueOnce(2500) // 1500ms duration
      
      await databaseMonitor.monitorQuery('slowQuery', 'users', slowQuery)
      
      const slowQueries = databaseMonitor.getSlowQueries(1000)
      expect(slowQueries.length).toBe(1)
      expect(slowQueries[0].query).toBe('slowQuery')
    })
  })

  describe('FileMonitor', () => {
    it('should monitor file upload performance', async () => {
      const mockUpload = vi.fn().mockResolvedValue({ fileId: '123' })
      
      const result = await fileMonitor.monitorUpload(
        'test.jpg',
        1024 * 1024,
        'image/jpeg',
        'profile_pictures',
        mockUpload
      )
      
      expect(result.fileId).toBe('123')
      
      const stats = fileMonitor.getUploadStats()
      expect(stats['image/jpeg'].totalUploads).toBe(1)
      expect(stats['image/jpeg'].averageSize).toBe(1024 * 1024)
    })

    it('should calculate upload speed', () => {
      const fileSize = 1024 * 1024 // 1MB
      const duration = 2000 // 2 seconds
      
      const speed = fileMonitor.calculateUploadSpeed(fileSize, duration)
      expect(speed).toBe(524288) // 512KB/s
    })

    it('should provide optimization recommendations', async () => {
      // Simulate slow upload with mock timing
      const slowUpload = vi.fn().mockResolvedValue({})
      
      // Mock performance.now to simulate 12 second upload (exceeds 10s threshold)
      mockPerformance.now.mockReturnValueOnce(1000).mockReturnValueOnce(13000)
      
      await fileMonitor.monitorUpload(
        'large.jpg',
        10 * 1024 * 1024, // 10MB
        'image/jpeg',
        'profile_pictures',
        slowUpload
      )
      
      const recommendations = fileMonitor.getOptimizationRecommendations()
      expect(recommendations.length).toBeGreaterThan(0)
      expect(recommendations[0].type).toBe('warning')
    })
  })

  describe('RealtimeMonitor', () => {
    it('should record event latency', () => {
      realtimeMonitor.recordEventLatency('new_interest', 150, 1)
      realtimeMonitor.recordEventLatency('profile_update', 200, 1)
      
      const stats = realtimeMonitor.getRealtimeStats()
      expect(stats.events['new_interest'].count).toBe(1)
      expect(stats.events['new_interest'].averageLatency).toBe(150)
    })

    it('should track connection statistics', () => {
      realtimeMonitor.recordConnection()
      realtimeMonitor.recordConnection()
      realtimeMonitor.recordDisconnection()
      realtimeMonitor.recordReconnection()
      
      const stats = realtimeMonitor.getRealtimeStats()
      expect(stats.connections.total).toBe(2)
      expect(stats.connections.active).toBe(2) // One disconnected, one reconnected
      expect(stats.connections.reconnections).toBe(1)
    })

    it('should identify slow events', () => {
      realtimeMonitor.recordEventLatency('slow_event', 1500, 1)
      realtimeMonitor.recordEventLatency('fast_event', 100, 1)
      
      const slowEvents = realtimeMonitor.getSlowEvents(500)
      expect(slowEvents.length).toBe(1)
      expect(slowEvents[0].eventType).toBe('slow_event')
    })

    it('should assess connection health', () => {
      // Clear any previous state
      realtimeMonitor.clearOldData(0)
      
      // Simulate multiple good connections to improve reliability
      for (let i = 0; i < 10; i++) {
        realtimeMonitor.recordConnection()
        realtimeMonitor.recordEventLatency('test_event', 100, 1)
      }
      
      const health = realtimeMonitor.getConnectionHealth()
      expect(health.status).toBe('healthy')
      expect(health.issues.length).toBe(0)
    })
  })

  describe('PerformanceMonitoringService', () => {
    it('should initialize successfully', async () => {
      await expect(performanceMonitoringService.initialize()).resolves.not.toThrow()
    })

    it('should generate comprehensive performance report', async () => {
      // Add some test data
      performanceMonitor.recordDatabaseQuery('testQuery', 'users', 250, 10, true)
      performanceMonitor.recordFileOperation('upload', 2000, 1024 * 1024, 'image/jpeg')
      performanceMonitor.recordRealtimeLatency('notification', 100, 1)
      performanceMonitor.recordUserExperience('page_load', 1500, { metric: 'LCP' })
      
      const report = performanceMonitoringService.generatePerformanceReport()
      
      expect(report.summary.healthScore).toBeGreaterThan(0)
      expect(report.database.totalQueries).toBe(1)
      expect(report.files.totalOperations).toBe(1)
      expect(report.realtime.totalEvents).toBe(1)
      expect(report.userExperience.webVitals.lcp).toBe(1500)
    })

    it('should monitor database operations', async () => {
      const mockOperation = vi.fn().mockResolvedValue([{ id: 1 }])
      
      const result = await performanceMonitoringService.monitorDatabaseOperation(
        'getUsers',
        'users',
        mockOperation
      )
      
      expect(result).toHaveLength(1)
      expect(mockOperation).toHaveBeenCalledTimes(1)
      
      const stats = performanceMonitoringService.getPerformanceStats()
      expect(stats.database.totalQueries).toBe(1)
    })

    it('should monitor file operations', async () => {
      const mockUpload = vi.fn().mockResolvedValue({ fileId: '123' })
      
      const result = await performanceMonitoringService.monitorFileUpload(
        'test.jpg',
        1024 * 1024,
        'image/jpeg',
        'profile_pictures',
        mockUpload
      )
      
      expect(result.fileId).toBe('123')
      
      const stats = performanceMonitoringService.getPerformanceStats()
      expect(stats.fileOperations.totalOperations).toBe(1)
    })
  })

  describe('Performance Decorator', () => {
    it('should monitor method performance automatically', async () => {
      class TestService {
        async testMethod(delay: number = 100): Promise<string> {
          // Mock the delay instead of using setTimeout
          mockPerformance.now.mockReturnValueOnce(1000).mockReturnValueOnce(1200)
          return 'success'
        }
      }
      
      // Apply decorator manually for testing
      const service = new TestService()
      const originalMethod = service.testMethod
      const decoratedMethod = performanceMonitoringService.monitorMethod('testOperation', 'api')(
        service, 
        'testMethod', 
        { value: originalMethod, configurable: true, enumerable: true, writable: true }
      )
      
      service.testMethod = decoratedMethod.value
      
      const result = await service.testMethod(200)
      
      expect(result).toBe('success')
      
      const stats = performanceMonitoringService.getPerformanceStats()
      expect(stats.overall.totalMetrics).toBeGreaterThan(0)
    })
  })
})