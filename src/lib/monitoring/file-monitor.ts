import { performanceMonitor } from './performance-monitor'

// File operation monitoring
export class FileMonitor {
  private uploadStats = new Map<string, {
    totalSize: number
    totalTime: number
    count: number
    errors: number
  }>()

  private downloadStats = new Map<string, {
    totalSize: number
    totalTime: number
    count: number
    errors: number
  }>()

  // Monitor file upload performance
  async monitorUpload<T>(
    fileName: string,
    fileSize: number,
    fileType: string,
    bucketId: string,
    uploadFn: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now()
    let result: T
    let error: Error | null = null

    try {
      result = await uploadFn()
    } catch (err) {
      error = err as Error
      throw err
    } finally {
      const duration = performance.now() - startTime
      
      // Record performance metric
      performanceMonitor.recordFileOperation(
        'upload',
        duration,
        fileSize,
        fileType,
        bucketId
      )

      // Update upload statistics
      this.updateUploadStats(fileType, fileSize, duration, error !== null)

      // Log slow uploads
      if (duration > 5000) { // 5 seconds
        console.warn(`Slow file upload detected: ${fileName} (${fileSize} bytes) took ${duration}ms`)
      }
    }

    return result!
  }

  // Monitor file download performance
  async monitorDownload<T>(
    fileName: string,
    fileSize: number,
    fileType: string,
    bucketId: string,
    downloadFn: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now()
    let result: T
    let error: Error | null = null

    try {
      result = await downloadFn()
    } catch (err) {
      error = err as Error
      throw err
    } finally {
      const duration = performance.now() - startTime
      
      // Record performance metric
      performanceMonitor.recordFileOperation(
        'download',
        duration,
        fileSize,
        fileType,
        bucketId
      )

      // Update download statistics
      this.updateDownloadStats(fileType, fileSize, duration, error !== null)

      // Log slow downloads
      if (duration > 3000) { // 3 seconds
        console.warn(`Slow file download detected: ${fileName} (${fileSize} bytes) took ${duration}ms`)
      }
    }

    return result!
  }

  // Monitor file deletion
  async monitorDeletion<T>(
    fileName: string,
    bucketId: string,
    deleteFn: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now()
    let result: T

    try {
      result = await deleteFn()
    } finally {
      const duration = performance.now() - startTime
      
      performanceMonitor.recordFileOperation(
        'delete',
        duration,
        undefined,
        undefined,
        bucketId
      )
    }

    return result
  }

  // Calculate upload speed (bytes per second)
  calculateUploadSpeed(fileSize: number, duration: number): number {
    return (fileSize / (duration / 1000)) // bytes per second
  }

  // Calculate download speed (bytes per second)
  calculateDownloadSpeed(fileSize: number, duration: number): number {
    return (fileSize / (duration / 1000)) // bytes per second
  }

  // Get upload statistics by file type
  getUploadStats(): Record<string, {
    averageSize: number
    averageTime: number
    averageSpeed: number // bytes per second
    totalUploads: number
    errorRate: number
  }> {
    const stats: Record<string, any> = {}

    this.uploadStats.forEach((stat, fileType) => {
      const averageSize = stat.totalSize / stat.count
      const averageTime = stat.totalTime / stat.count
      const averageSpeed = averageSize / (averageTime / 1000)

      stats[fileType] = {
        averageSize,
        averageTime,
        averageSpeed,
        totalUploads: stat.count,
        errorRate: (stat.errors / stat.count) * 100
      }
    })

    return stats
  }

  // Get download statistics by file type
  getDownloadStats(): Record<string, {
    averageSize: number
    averageTime: number
    averageSpeed: number // bytes per second
    totalDownloads: number
    errorRate: number
  }> {
    const stats: Record<string, any> = {}

    this.downloadStats.forEach((stat, fileType) => {
      const averageSize = stat.totalSize / stat.count
      const averageTime = stat.totalTime / stat.count
      const averageSpeed = averageSize / (averageTime / 1000)

      stats[fileType] = {
        averageSize,
        averageTime,
        averageSpeed,
        totalDownloads: stat.count,
        errorRate: (stat.errors / stat.count) * 100
      }
    })

    return stats
  }

  // Get slow file operations
  getSlowOperations(threshold: number = 3000): Array<{
    operation: string
    fileType: string
    averageTime: number
    count: number
  }> {
    const slowOps: Array<{
      operation: string
      fileType: string
      averageTime: number
      count: number
    }> = []

    // Check uploads
    this.uploadStats.forEach((stat, fileType) => {
      const averageTime = stat.totalTime / stat.count
      if (averageTime > threshold) {
        slowOps.push({
          operation: 'upload',
          fileType,
          averageTime,
          count: stat.count
        })
      }
    })

    // Check downloads
    this.downloadStats.forEach((stat, fileType) => {
      const averageTime = stat.totalTime / stat.count
      if (averageTime > threshold) {
        slowOps.push({
          operation: 'download',
          fileType,
          averageTime,
          count: stat.count
        })
      }
    })

    return slowOps.sort((a, b) => b.averageTime - a.averageTime)
  }

  // Get file type distribution
  getFileTypeDistribution(): {
    uploads: Record<string, number>
    downloads: Record<string, number>
  } {
    const uploads: Record<string, number> = {}
    const downloads: Record<string, number> = {}

    this.uploadStats.forEach((stat, fileType) => {
      uploads[fileType] = stat.count
    })

    this.downloadStats.forEach((stat, fileType) => {
      downloads[fileType] = stat.count
    })

    return { uploads, downloads }
  }

  // Optimize file operations based on statistics
  getOptimizationRecommendations(): Array<{
    type: 'warning' | 'suggestion'
    message: string
    metric: string
    value: number
  }> {
    const recommendations: Array<{
      type: 'warning' | 'suggestion'
      message: string
      metric: string
      value: number
    }> = []

    // Check for slow uploads
    this.uploadStats.forEach((stat, fileType) => {
      const averageTime = stat.totalTime / stat.count
      const averageSize = stat.totalSize / stat.count
      const averageSpeed = averageSize / (averageTime / 1000)

      if (averageTime > 10000) { // 10 seconds
        recommendations.push({
          type: 'warning',
          message: `${fileType} uploads are very slow (${Math.round(averageTime)}ms average)`,
          metric: 'upload_time',
          value: averageTime
        })
      }

      if (averageSpeed < 100000) { // Less than 100KB/s
        recommendations.push({
          type: 'suggestion',
          message: `Consider implementing compression for ${fileType} files to improve upload speed`,
          metric: 'upload_speed',
          value: averageSpeed
        })
      }
    })

    // Check error rates
    this.uploadStats.forEach((stat, fileType) => {
      const errorRate = (stat.errors / stat.count) * 100
      if (errorRate > 5) { // More than 5% error rate
        recommendations.push({
          type: 'warning',
          message: `High error rate for ${fileType} uploads (${errorRate.toFixed(1)}%)`,
          metric: 'error_rate',
          value: errorRate
        })
      }
    })

    return recommendations
  }

  private updateUploadStats(fileType: string, fileSize: number, duration: number, hasError: boolean): void {
    const existing = this.uploadStats.get(fileType) || {
      totalSize: 0,
      totalTime: 0,
      count: 0,
      errors: 0
    }

    this.uploadStats.set(fileType, {
      totalSize: existing.totalSize + fileSize,
      totalTime: existing.totalTime + duration,
      count: existing.count + 1,
      errors: existing.errors + (hasError ? 1 : 0)
    })
  }

  private updateDownloadStats(fileType: string, fileSize: number, duration: number, hasError: boolean): void {
    const existing = this.downloadStats.get(fileType) || {
      totalSize: 0,
      totalTime: 0,
      count: 0,
      errors: 0
    }

    this.downloadStats.set(fileType, {
      totalSize: existing.totalSize + fileSize,
      totalTime: existing.totalTime + duration,
      count: existing.count + 1,
      errors: existing.errors + (hasError ? 1 : 0)
    })
  }
}

// Singleton instance
export const fileMonitor = new FileMonitor()

// Utility functions for easy monitoring
export function monitorFileUpload<T>(
  fileName: string,
  fileSize: number,
  fileType: string,
  bucketId: string,
  uploadFn: () => Promise<T>
): Promise<T> {
  return fileMonitor.monitorUpload(fileName, fileSize, fileType, bucketId, uploadFn)
}

export function monitorFileDownload<T>(
  fileName: string,
  fileSize: number,
  fileType: string,
  bucketId: string,
  downloadFn: () => Promise<T>
): Promise<T> {
  return fileMonitor.monitorDownload(fileName, fileSize, fileType, bucketId, downloadFn)
}