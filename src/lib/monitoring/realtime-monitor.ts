import { performanceMonitor } from './performance-monitor'

// Real-time notification monitoring
export class RealtimeMonitor {
  private connectionStats = {
    totalConnections: 0,
    activeConnections: 0,
    reconnections: 0,
    connectionErrors: 0
  }

  private eventStats = new Map<string, {
    count: number
    totalLatency: number
    errors: number
    lastEventTime: number
  }>()

  private latencyHistory: Array<{
    timestamp: number
    latency: number
    eventType: string
  }> = []

  // Monitor real-time event latency
  recordEventLatency(eventType: string, latency: number, channelCount: number = 1): void {
    // Record in performance monitor
    performanceMonitor.recordRealtimeLatency(eventType, latency, channelCount)

    // Update event statistics
    const existing = this.eventStats.get(eventType) || {
      count: 0,
      totalLatency: 0,
      errors: 0,
      lastEventTime: 0
    }

    this.eventStats.set(eventType, {
      count: existing.count + 1,
      totalLatency: existing.totalLatency + latency,
      errors: existing.errors,
      lastEventTime: Date.now()
    })

    // Add to latency history
    this.latencyHistory.push({
      timestamp: Date.now(),
      latency,
      eventType
    })

    // Keep only last 1000 entries
    if (this.latencyHistory.length > 1000) {
      this.latencyHistory = this.latencyHistory.slice(-1000)
    }

    // Log slow events
    if (latency > 1000) { // 1 second
      console.warn(`Slow real-time event detected: ${eventType} took ${latency}ms`)
    }
  }

  // Record connection events
  recordConnection(): void {
    this.connectionStats.totalConnections++
    this.connectionStats.activeConnections++
  }

  recordDisconnection(): void {
    this.connectionStats.activeConnections = Math.max(0, this.connectionStats.activeConnections - 1)
  }

  recordReconnection(): void {
    this.connectionStats.reconnections++
    this.connectionStats.activeConnections++
  }

  recordConnectionError(): void {
    this.connectionStats.connectionErrors++
  }

  // Get real-time statistics
  getRealtimeStats(): {
    connections: {
      total: number
      active: number
      reconnections: number
      errors: number
      reliability: number // percentage
    }
    events: Record<string, {
      count: number
      averageLatency: number
      errorRate: number
      lastEventTime: number
    }>
    latency: {
      overall: {
        average: number
        p95: number
        p99: number
      }
      byEventType: Record<string, {
        average: number
        p95: number
        p99: number
      }>
    }
  } {
    // Calculate connection reliability
    const totalAttempts = this.connectionStats.totalConnections + this.connectionStats.reconnections
    const reliability = totalAttempts > 0 
      ? ((totalAttempts - this.connectionStats.connectionErrors) / totalAttempts) * 100 
      : 100

    // Calculate event statistics
    const events: Record<string, any> = {}
    this.eventStats.forEach((stat, eventType) => {
      events[eventType] = {
        count: stat.count,
        averageLatency: stat.totalLatency / stat.count,
        errorRate: (stat.errors / stat.count) * 100,
        lastEventTime: stat.lastEventTime
      }
    })

    // Calculate latency percentiles
    const allLatencies = this.latencyHistory.map(h => h.latency).sort((a, b) => a - b)
    const overallLatency = {
      average: allLatencies.length > 0 ? allLatencies.reduce((sum, l) => sum + l, 0) / allLatencies.length : 0,
      p95: this.calculatePercentile(allLatencies, 95),
      p99: this.calculatePercentile(allLatencies, 99)
    }

    // Calculate latency by event type
    const byEventType: Record<string, any> = {}
    this.eventStats.forEach((stat, eventType) => {
      const eventLatencies = this.latencyHistory
        .filter(h => h.eventType === eventType)
        .map(h => h.latency)
        .sort((a, b) => a - b)

      byEventType[eventType] = {
        average: stat.totalLatency / stat.count,
        p95: this.calculatePercentile(eventLatencies, 95),
        p99: this.calculatePercentile(eventLatencies, 99)
      }
    })

    return {
      connections: {
        total: this.connectionStats.totalConnections,
        active: this.connectionStats.activeConnections,
        reconnections: this.connectionStats.reconnections,
        errors: this.connectionStats.connectionErrors,
        reliability
      },
      events,
      latency: {
        overall: overallLatency,
        byEventType
      }
    }
  }

  // Get slow events
  getSlowEvents(threshold: number = 500): Array<{
    eventType: string
    averageLatency: number
    count: number
    p95Latency: number
  }> {
    const slowEvents: Array<{
      eventType: string
      averageLatency: number
      count: number
      p95Latency: number
    }> = []

    this.eventStats.forEach((stat, eventType) => {
      const averageLatency = stat.totalLatency / stat.count
      if (averageLatency > threshold) {
        const eventLatencies = this.latencyHistory
          .filter(h => h.eventType === eventType)
          .map(h => h.latency)
          .sort((a, b) => a - b)

        slowEvents.push({
          eventType,
          averageLatency,
          count: stat.count,
          p95Latency: this.calculatePercentile(eventLatencies, 95)
        })
      }
    })

    return slowEvents.sort((a, b) => b.averageLatency - a.averageLatency)
  }

  // Get event frequency analysis
  getEventFrequency(timeWindow: number = 60000): Record<string, {
    eventsPerMinute: number
    peakEventsPerMinute: number
    lastEventTime: number
  }> {
    const now = Date.now()
    const cutoffTime = now - timeWindow
    const recentEvents = this.latencyHistory.filter(h => h.timestamp > cutoffTime)

    const frequency: Record<string, {
      eventsPerMinute: number
      peakEventsPerMinute: number
      lastEventTime: number
    }> = {}

    // Group events by type
    const eventsByType = new Map<string, number[]>()
    recentEvents.forEach(event => {
      if (!eventsByType.has(event.eventType)) {
        eventsByType.set(event.eventType, [])
      }
      eventsByType.get(event.eventType)!.push(event.timestamp)
    })

    // Calculate frequency metrics
    eventsByType.forEach((timestamps, eventType) => {
      const eventsPerMinute = (timestamps.length / (timeWindow / 60000))
      
      // Calculate peak events per minute (in 1-minute windows)
      let peakEventsPerMinute = 0
      for (let windowStart = cutoffTime; windowStart < now; windowStart += 60000) {
        const windowEnd = windowStart + 60000
        const eventsInWindow = timestamps.filter(t => t >= windowStart && t < windowEnd).length
        peakEventsPerMinute = Math.max(peakEventsPerMinute, eventsInWindow)
      }

      const stat = this.eventStats.get(eventType)
      frequency[eventType] = {
        eventsPerMinute,
        peakEventsPerMinute,
        lastEventTime: stat?.lastEventTime || 0
      }
    })

    return frequency
  }

  // Get connection health
  getConnectionHealth(): {
    status: 'healthy' | 'degraded' | 'unhealthy'
    issues: string[]
    recommendations: string[]
  } {
    const stats = this.getRealtimeStats()
    const issues: string[] = []
    const recommendations: string[] = []
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'

    // Check connection reliability
    if (stats.connections.reliability < 95) {
      issues.push(`Low connection reliability: ${stats.connections.reliability.toFixed(1)}%`)
      recommendations.push('Implement connection retry logic with exponential backoff')
      status = 'degraded'
    }

    if (stats.connections.reliability < 85) {
      status = 'unhealthy'
    }

    // Check reconnection rate
    const reconnectionRate = stats.connections.total > 0 
      ? (stats.connections.reconnections / stats.connections.total) * 100 
      : 0

    if (reconnectionRate > 20) {
      issues.push(`High reconnection rate: ${reconnectionRate.toFixed(1)}%`)
      recommendations.push('Investigate network stability and connection timeout settings')
      status = status === 'healthy' ? 'degraded' : status
    }

    // Check latency
    if (stats.latency.overall.average > 1000) {
      issues.push(`High average latency: ${stats.latency.overall.average.toFixed(0)}ms`)
      recommendations.push('Optimize server processing or consider regional deployment')
      status = status === 'healthy' ? 'degraded' : status
    }

    if (stats.latency.overall.p95 > 2000) {
      issues.push(`High P95 latency: ${stats.latency.overall.p95.toFixed(0)}ms`)
      status = 'unhealthy'
    }

    return { status, issues, recommendations }
  }

  // Clear old data
  clearOldData(maxAge: number = 24 * 60 * 60 * 1000): void {
    const cutoffTime = Date.now() - maxAge
    this.latencyHistory = this.latencyHistory.filter(h => h.timestamp > cutoffTime)
  }

  private calculatePercentile(sortedArray: number[], percentile: number): number {
    if (sortedArray.length === 0) return 0
    
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1
    return sortedArray[Math.max(0, Math.min(index, sortedArray.length - 1))]
  }
}

// Singleton instance
export const realtimeMonitor = new RealtimeMonitor()

// Utility function to measure event latency
export function measureEventLatency(eventType: string, startTime: number, channelCount: number = 1): void {
  const latency = performance.now() - startTime
  realtimeMonitor.recordEventLatency(eventType, latency, channelCount)
}