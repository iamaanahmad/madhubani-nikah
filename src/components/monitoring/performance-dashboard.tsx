'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { 
  Activity, 
  Database, 
  Upload, 
  Download, 
  Wifi, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  Award,
  Zap
} from 'lucide-react'
import { usePerformanceMonitoring, type PerformanceStats, type OptimizationRecommendation, type PerformanceInsights } from '@/hooks/usePerformanceMonitoring'

// Fallback data for when monitoring is not available
const fallbackPerformanceData = {
  database: {
    averageQueryTime: 245,
    slowQueries: [
      { query: 'searchProfiles', averageTime: 1200, count: 45 },
      { query: 'getInterestStats', averageTime: 890, count: 23 }
    ],
    cacheHitRate: 78.5,
    totalQueries: 1247
  },
  fileOperations: {
    averageUploadTime: 3200,
    averageDownloadTime: 1800,
    totalOperations: 156,
    averageFileSize: 2.4 * 1024 * 1024 // 2.4 MB
  },
  realtime: {
    averageLatency: 320,
    totalEvents: 892,
    slowEvents: [
      { eventType: 'new_interest', averageLatency: 450, count: 34 },
      { eventType: 'profile_update', averageLatency: 380, count: 28 }
    ]
  },
  overall: {
    totalMetrics: 2295,
    timeRange: '24h'
  }
}

const mockConnectionHealth = {
  status: 'healthy' as const,
  issues: [] as string[],
  recommendations: [] as string[]
}

const mockSlowOperations = [
  { name: 'searchProfiles', duration: 1200, timestamp: Date.now() - 3600000 },
  { name: 'uploadProfilePicture', duration: 5400, timestamp: Date.now() - 7200000 },
  { name: 'getRecommendedMatches', duration: 890, timestamp: Date.now() - 1800000 }
]

export function PerformanceDashboard() {
  const {
    stats,
    isLoading,
    error,
    refreshStats,
    getOptimizationRecommendations,
    getPerformanceInsights,
    getSlowOperations,
    getConnectionHealth
  } = usePerformanceMonitoring()

  const [data, setData] = useState<PerformanceStats>(fallbackPerformanceData)
  const [recommendations, setRecommendations] = useState<OptimizationRecommendation[]>([])
  const [insights, setInsights] = useState<PerformanceInsights | null>(null)
  const [connectionHealth, setConnectionHealth] = useState({ status: 'healthy' as const, issues: [], recommendations: [] })
  const [slowOperations, setSlowOperations] = useState<any[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Update data when stats change
  useEffect(() => {
    if (stats) {
      setData(stats)
      setRecommendations(getOptimizationRecommendations())
      setInsights(getPerformanceInsights())
      setConnectionHealth(getConnectionHealth())
      setSlowOperations(getSlowOperations())
    }
  }, [stats, getOptimizationRecommendations, getPerformanceInsights, getConnectionHealth, getSlowOperations])

  const refreshData = async () => {
    setIsRefreshing(true)
    try {
      refreshStats()
      // Add a small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (err) {
      console.error('Failed to refresh performance data:', err)
    } finally {
      setIsRefreshing(false)
    }
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  const formatFileSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 B'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600'
      case 'degraded': return 'text-yellow-600'
      case 'unhealthy': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'degraded': return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'unhealthy': return <XCircle className="h-4 w-4 text-red-600" />
      default: return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Performance Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor application performance and identify optimization opportunities
          </p>
        </div>
        <Button 
          onClick={refreshData} 
          disabled={isRefreshing}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(data.database.averageQueryTime)}</div>
            <p className="text-xs text-muted-foreground">
              Average query time
            </p>
            <div className="mt-2">
              <Badge variant={data.database.averageQueryTime < 500 ? 'default' : 'destructive'}>
                {data.database.totalQueries} queries
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">File Operations</CardTitle>
            <Upload className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(data.fileOperations.averageUploadTime)}</div>
            <p className="text-xs text-muted-foreground">
              Average upload time
            </p>
            <div className="mt-2">
              <Badge variant={data.fileOperations.averageUploadTime < 3000 ? 'default' : 'destructive'}>
                {data.fileOperations.totalOperations} operations
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Real-time</CardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(data.realtime.averageLatency)}</div>
            <p className="text-xs text-muted-foreground">
              Average latency
            </p>
            <div className="mt-2">
              <Badge variant={data.realtime.averageLatency < 500 ? 'default' : 'destructive'}>
                {data.realtime.totalEvents} events
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            {getStatusIcon(connectionHealth.status)}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold capitalize ${getStatusColor(connectionHealth.status)}`}>
              {connectionHealth.status}
            </div>
            <p className="text-xs text-muted-foreground">
              Overall system status
            </p>
            <div className="mt-2">
              <Badge variant="outline">
                {data.overall.totalMetrics} metrics
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
          <TabsTrigger value="realtime">Real-time</TabsTrigger>
          <TabsTrigger value="ux">User Experience</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="issues">Issues</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Health Score */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Health Score
                </CardTitle>
                <CardDescription>Overall system performance health</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">{data.overall.healthScore}/100</div>
                <Progress value={data.overall.healthScore} className="h-3 mb-2" />
                <p className="text-sm text-muted-foreground">
                  {data.overall.healthScore >= 90 ? 'Excellent' : 
                   data.overall.healthScore >= 70 ? 'Good' : 
                   data.overall.healthScore >= 50 ? 'Fair' : 'Poor'} performance
                </p>
              </CardContent>
            </Card>

            {/* Web Vitals */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Core Web Vitals
                </CardTitle>
                <CardDescription>Key user experience metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">LCP</span>
                  <Badge variant={data.userExperience.webVitals.lcp < 2500 ? 'default' : 'destructive'}>
                    {(data.userExperience.webVitals.lcp / 1000).toFixed(1)}s
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">FID</span>
                  <Badge variant={data.userExperience.webVitals.fid < 100 ? 'default' : 'destructive'}>
                    {data.userExperience.webVitals.fid.toFixed(0)}ms
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">CLS</span>
                  <Badge variant={data.userExperience.webVitals.cls < 100 ? 'default' : 'destructive'}>
                    {(data.userExperience.webVitals.cls / 1000).toFixed(3)}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* System Resources */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  System Resources
                </CardTitle>
                <CardDescription>Memory and performance metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Memory Usage</span>
                  <span className="text-sm font-medium">
                    {(data.systemResources.memory.current / 1024 / 1024).toFixed(1)} MB
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Long Tasks</span>
                  <Badge variant={data.systemResources.performance.longTasks > 5 ? 'destructive' : 'default'}>
                    {data.systemResources.performance.longTasks}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total Metrics</span>
                  <span className="text-sm font-medium">{data.overall.totalMetrics}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Recommendations */}
          {recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Top Recommendations</CardTitle>
                <CardDescription>Priority optimizations for better performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recommendations.slice(0, 3).map((rec, index) => (
                    <Alert key={index} className={rec.priority === 'high' ? 'border-red-200' : rec.priority === 'medium' ? 'border-yellow-200' : 'border-blue-200'}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle className="capitalize">{rec.priority} Priority - {rec.category}</AlertTitle>
                      <AlertDescription>{rec.recommendation}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Query Performance</CardTitle>
                <CardDescription>Database query statistics and metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Average Query Time</span>
                  <span className="text-sm">{formatDuration(data.database.averageQueryTime)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Cache Hit Rate</span>
                  <span className="text-sm">{data.database.cacheHitRate}%</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Cache Efficiency</span>
                    <span>{data.database.cacheHitRate}%</span>
                  </div>
                  <Progress value={data.database.cacheHitRate} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Slow Queries</CardTitle>
                <CardDescription>Queries that exceed performance thresholds</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.database.slowQueries.map((query, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{query.query}</p>
                        <p className="text-xs text-muted-foreground">{query.count} executions</p>
                      </div>
                      <Badge variant="destructive">
                        {formatDuration(query.averageTime)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="files" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Upload Performance</CardTitle>
                <CardDescription>File upload statistics and metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Average Upload Time</span>
                  <span className="text-sm">{formatDuration(data.fileOperations.averageUploadTime)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Average File Size</span>
                  <span className="text-sm">{formatFileSize(data.fileOperations.averageFileSize)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Upload Speed</span>
                  <span className="text-sm">
                    {formatFileSize(data.fileOperations.averageFileSize / (data.fileOperations.averageUploadTime / 1000))}/s
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Download Performance</CardTitle>
                <CardDescription>File download statistics and metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Average Download Time</span>
                  <span className="text-sm">{formatDuration(data.fileOperations.averageDownloadTime)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Operations</span>
                  <span className="text-sm">{data.fileOperations.totalOperations}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Download Speed</span>
                  <span className="text-sm">
                    {formatFileSize(data.fileOperations.averageFileSize / (data.fileOperations.averageDownloadTime / 1000))}/s
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="realtime" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Real-time Performance</CardTitle>
                <CardDescription>WebSocket and notification latency metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Average Latency</span>
                  <span className="text-sm">{formatDuration(data.realtime.averageLatency)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Events</span>
                  <span className="text-sm">{data.realtime.totalEvents}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Latency Performance</span>
                    <span>{data.realtime.averageLatency < 500 ? 'Good' : 'Needs Improvement'}</span>
                  </div>
                  <Progress 
                    value={Math.max(0, 100 - (data.realtime.averageLatency / 10))} 
                    className="h-2" 
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Slow Events</CardTitle>
                <CardDescription>Real-time events with high latency</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.realtime.slowEvents.map((event, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{event.eventType}</p>
                        <p className="text-xs text-muted-foreground">{event.count} events</p>
                      </div>
                      <Badge variant="destructive">
                        {formatDuration(event.averageLatency)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ux" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Core Web Vitals</CardTitle>
                <CardDescription>Essential user experience metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">Largest Contentful Paint (LCP)</span>
                      <span className="text-sm">{(data.userExperience.webVitals.lcp / 1000).toFixed(1)}s</span>
                    </div>
                    <Progress 
                      value={Math.max(0, 100 - (data.userExperience.webVitals.lcp / 40))} 
                      className="h-2" 
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {data.userExperience.webVitals.lcp < 2500 ? 'Good' : data.userExperience.webVitals.lcp < 4000 ? 'Needs Improvement' : 'Poor'}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">First Input Delay (FID)</span>
                      <span className="text-sm">{data.userExperience.webVitals.fid.toFixed(0)}ms</span>
                    </div>
                    <Progress 
                      value={Math.max(0, 100 - (data.userExperience.webVitals.fid / 3))} 
                      className="h-2" 
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {data.userExperience.webVitals.fid < 100 ? 'Good' : data.userExperience.webVitals.fid < 300 ? 'Needs Improvement' : 'Poor'}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">Cumulative Layout Shift (CLS)</span>
                      <span className="text-sm">{(data.userExperience.webVitals.cls / 1000).toFixed(3)}</span>
                    </div>
                    <Progress 
                      value={Math.max(0, 100 - (data.userExperience.webVitals.cls / 2.5))} 
                      className="h-2" 
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {data.userExperience.webVitals.cls < 100 ? 'Good' : data.userExperience.webVitals.cls < 250 ? 'Needs Improvement' : 'Poor'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Page Performance</CardTitle>
                <CardDescription>Page load and interaction metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Average Page Load</span>
                  <span className="text-sm">{formatDuration(data.userExperience.pageLoad.averageTime)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Average Interaction</span>
                  <span className="text-sm">{formatDuration(data.userExperience.interactions.averageTime)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">DNS Lookup</span>
                  <span className="text-sm">{formatDuration(data.userExperience.navigation.dnsLookup)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Server Response</span>
                  <span className="text-sm">{formatDuration(data.userExperience.navigation.serverResponse)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Slow Pages */}
          {data.userExperience.pageLoad.slowPages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Slow Pages</CardTitle>
                <CardDescription>Pages that exceed performance thresholds</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.userExperience.pageLoad.slowPages.slice(0, 5).map((page, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{page.pageUrl || 'Unknown Page'}</p>
                        <p className="text-xs text-muted-foreground">
                          {page.metadata?.metric || 'Page Load'}
                        </p>
                      </div>
                      <Badge variant="destructive">
                        {formatDuration(page.duration)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          {insights && (
            <>
              {/* Performance Trends */}
              {insights.trends.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Performance Trends
                    </CardTitle>
                    <CardDescription>Recent performance changes and trends</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {insights.trends.map((trend, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            {trend.trend === 'improving' ? (
                              <TrendingUp className="h-4 w-4 text-green-600" />
                            ) : trend.trend === 'degrading' ? (
                              <TrendingDown className="h-4 w-4 text-red-600" />
                            ) : (
                              <Minus className="h-4 w-4 text-gray-600" />
                            )}
                            <div>
                              <p className="font-medium text-sm">{trend.metric}</p>
                              <p className="text-xs text-muted-foreground">{trend.timeframe}</p>
                            </div>
                          </div>
                          <Badge variant={trend.trend === 'improving' ? 'default' : trend.trend === 'degrading' ? 'destructive' : 'secondary'}>
                            {trend.trend === 'improving' ? '-' : trend.trend === 'degrading' ? '+' : '±'}{trend.change.toFixed(0)}ms
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Achievements */}
              {insights.achievements.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-green-600" />
                      Performance Achievements
                    </CardTitle>
                    <CardDescription>Areas where performance is excelling</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {insights.achievements.map((achievement, index) => (
                        <Alert key={index} className="border-green-200">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <AlertTitle>{achievement.metric}</AlertTitle>
                          <AlertDescription>{achievement.description}</AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Bottlenecks */}
              {insights.bottlenecks.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      Performance Bottlenecks
                    </CardTitle>
                    <CardDescription>Areas that need immediate attention</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {insights.bottlenecks.map((bottleneck, index) => (
                        <Alert key={index} variant={bottleneck.severity === 'critical' ? 'destructive' : 'default'}>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertTitle className="capitalize">{bottleneck.severity} - {bottleneck.area}</AlertTitle>
                          <AlertDescription>{bottleneck.description}</AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Optimization Recommendations */}
              {recommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Optimization Recommendations</CardTitle>
                    <CardDescription>Actionable steps to improve performance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recommendations.map((rec, index) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'default' : 'secondary'}>
                                {rec.priority}
                              </Badge>
                              <span className="font-medium capitalize">{rec.category}</span>
                            </div>
                            {rec.metric && (
                              <span className="text-sm text-muted-foreground">
                                {rec.metric > 1000 ? `${(rec.metric / 1000).toFixed(1)}s` : `${rec.metric.toFixed(0)}ms`}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{rec.issue}</p>
                          <p className="text-sm font-medium mb-1">{rec.recommendation}</p>
                          <p className="text-xs text-muted-foreground">{rec.impact}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="issues" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Slow Operations</CardTitle>
              <CardDescription>Operations that exceed performance thresholds</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {slowOperations.map((operation, index) => (
                  <Alert key={index}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>{operation.name}</AlertTitle>
                    <AlertDescription>
                      Operation took {formatDuration(operation.duration)} to complete.
                      Occurred {new Date(operation.timestamp).toLocaleString()}.
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>

          {connectionHealth.issues.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>System Issues</CardTitle>
                <CardDescription>Current system health issues and recommendations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {connectionHealth.issues.map((issue, index) => (
                    <Alert key={index} variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertTitle>Issue Detected</AlertTitle>
                      <AlertDescription>{issue}</AlertDescription>
                    </Alert>
                  ))}
                </div>
                
                {connectionHealth.recommendations.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h4 className="font-medium">Recommendations:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      {connectionHealth.recommendations.map((rec, index) => (
                        <li key={index}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}