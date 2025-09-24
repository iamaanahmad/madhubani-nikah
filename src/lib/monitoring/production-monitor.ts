/**
 * Production Monitoring and Logging
 * Comprehensive monitoring setup for production environment
 */

import { PRODUCTION_CONFIG } from '../config/production.config';

export interface ProductionMetrics {
  timestamp: string;
  environment: 'production' | 'staging';
  version: string;
  uptime: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: number;
  activeConnections: number;
  requestCount: number;
  errorCount: number;
  responseTime: number;
  databaseConnections: number;
  cacheHitRate: number;
}

export interface AlertConfig {
  type: 'error' | 'warning' | 'info';
  threshold: number;
  metric: keyof ProductionMetrics;
  message: string;
  recipients: string[];
}

export class ProductionMonitor {
  private static instance: ProductionMonitor;
  private metrics: ProductionMetrics;
  private alerts: AlertConfig[] = [];
  private startTime: number;

  private constructor() {
    this.startTime = Date.now();
    this.metrics = this.initializeMetrics();
    this.setupDefaultAlerts();
    this.startMonitoring();
  }

  static getInstance(): ProductionMonitor {
    if (!ProductionMonitor.instance) {
      ProductionMonitor.instance = new ProductionMonitor();
    }
    return ProductionMonitor.instance;
  }

  private initializeMetrics(): ProductionMetrics {
    return {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV === 'production' ? 'production' : 'staging',
      version: process.env.npm_package_version || '1.0.0',
      uptime: 0,
      memoryUsage: process.memoryUsage(),
      cpuUsage: 0,
      activeConnections: 0,
      requestCount: 0,
      errorCount: 0,
      responseTime: 0,
      databaseConnections: 0,
      cacheHitRate: 0,
    };
  }

  private setupDefaultAlerts(): void {
    this.alerts = [
      {
        type: 'error',
        threshold: 100,
        metric: 'errorCount',
        message: 'High error rate detected',
        recipients: ['admin@madhubaninikah.com'],
      },
      {
        type: 'warning',
        threshold: 1000,
        metric: 'responseTime',
        message: 'High response time detected',
        recipients: ['admin@madhubaninikah.com'],
      },
      {
        type: 'warning',
        threshold: 500 * 1024 * 1024, // 500MB
        metric: 'memoryUsage',
        message: 'High memory usage detected',
        recipients: ['admin@madhubaninikah.com'],
      },
    ];
  }

  private startMonitoring(): void {
    if (!PRODUCTION_CONFIG.monitoring.enablePerformanceMonitoring) {
      return;
    }

    // Update metrics every 30 seconds
    setInterval(() => {
      this.updateMetrics();
      this.checkAlerts();
    }, 30000);

    // Log metrics every 5 minutes
    setInterval(() => {
      this.logMetrics();
    }, 300000);
  }

  private updateMetrics(): void {
    this.metrics = {
      ...this.metrics,
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      memoryUsage: process.memoryUsage(),
      cpuUsage: this.getCPUUsage(),
    };
  }

  private getCPUUsage(): number {
    const startUsage = process.cpuUsage();
    setTimeout(() => {
      const endUsage = process.cpuUsage(startUsage);
      const totalUsage = endUsage.user + endUsage.system;
      return totalUsage / 1000000; // Convert to milliseconds
    }, 100);
    return 0; // Placeholder
  }

  private checkAlerts(): void {
    for (const alert of this.alerts) {
      const currentValue = this.getMetricValue(alert.metric);
      if (currentValue > alert.threshold) {
        this.triggerAlert(alert, currentValue);
      }
    }
  }

  private getMetricValue(metric: keyof ProductionMetrics): number {
    const value = this.metrics[metric];
    if (typeof value === 'number') {
      return value;
    }
    if (metric === 'memoryUsage') {
      return this.metrics.memoryUsage.heapUsed;
    }
    return 0;
  }

  private triggerAlert(alert: AlertConfig, currentValue: number): void {
    const alertMessage = {
      type: alert.type,
      message: alert.message,
      metric: alert.metric,
      currentValue,
      threshold: alert.threshold,
      timestamp: new Date().toISOString(),
      environment: this.metrics.environment,
    };

    console.error('PRODUCTION ALERT:', alertMessage);

    // In a real implementation, send alerts via email, Slack, etc.
    this.sendAlert(alertMessage, alert.recipients);
  }

  private async sendAlert(alert: any, recipients: string[]): Promise<void> {
    // Placeholder for alert sending logic
    // In production, integrate with email service, Slack, PagerDuty, etc.
    console.log('Alert would be sent to:', recipients, alert);
  }

  private logMetrics(): void {
    if (PRODUCTION_CONFIG.monitoring.logLevel === 'error') {
      return; // Only log errors in production
    }

    console.log('Production Metrics:', {
      timestamp: this.metrics.timestamp,
      uptime: Math.floor(this.metrics.uptime / 1000 / 60), // minutes
      memoryUsage: Math.floor(this.metrics.memoryUsage.heapUsed / 1024 / 1024), // MB
      requestCount: this.metrics.requestCount,
      errorCount: this.metrics.errorCount,
      responseTime: this.metrics.responseTime,
    });
  }

  // Public methods for updating metrics
  incrementRequestCount(): void {
    this.metrics.requestCount++;
  }

  incrementErrorCount(): void {
    this.metrics.errorCount++;
  }

  updateResponseTime(time: number): void {
    this.metrics.responseTime = time;
  }

  updateActiveConnections(count: number): void {
    this.metrics.activeConnections = count;
  }

  updateDatabaseConnections(count: number): void {
    this.metrics.databaseConnections = count;
  }

  updateCacheHitRate(rate: number): void {
    this.metrics.cacheHitRate = rate;
  }

  getMetrics(): ProductionMetrics {
    return { ...this.metrics };
  }

  // Health check endpoint data
  getHealthCheck(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    uptime: number;
    version: string;
    environment: string;
    checks: Record<string, boolean>;
  } {
    const checks = {
      memory: this.metrics.memoryUsage.heapUsed < 500 * 1024 * 1024, // < 500MB
      responseTime: this.metrics.responseTime < 1000, // < 1s
      errorRate: this.metrics.errorCount < 100,
      uptime: this.metrics.uptime > 60000, // > 1 minute
    };

    const healthyChecks = Object.values(checks).filter(Boolean).length;
    const totalChecks = Object.keys(checks).length;

    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (healthyChecks === totalChecks) {
      status = 'healthy';
    } else if (healthyChecks >= totalChecks * 0.7) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return {
      status,
      timestamp: this.metrics.timestamp,
      uptime: this.metrics.uptime,
      version: this.metrics.version,
      environment: this.metrics.environment,
      checks,
    };
  }
}

// Error tracking for production
export class ProductionErrorTracker {
  private static instance: ProductionErrorTracker;

  static getInstance(): ProductionErrorTracker {
    if (!ProductionErrorTracker.instance) {
      ProductionErrorTracker.instance = new ProductionErrorTracker();
    }
    return ProductionErrorTracker.instance;
  }

  trackError(error: Error, context?: Record<string, any>): void {
    if (!PRODUCTION_CONFIG.monitoring.enableErrorTracking) {
      return;
    }

    const errorData = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      context,
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version,
    };

    // Log error
    console.error('Production Error:', errorData);

    // Update metrics
    ProductionMonitor.getInstance().incrementErrorCount();

    // Send to error tracking service (Sentry, etc.)
    if (PRODUCTION_CONFIG.monitoring.sentryDsn) {
      this.sendToSentry(errorData);
    }
  }

  private sendToSentry(errorData: any): void {
    // Placeholder for Sentry integration
    console.log('Error would be sent to Sentry:', errorData);
  }
}

// Initialize monitoring in production
if (process.env.NODE_ENV === 'production') {
  ProductionMonitor.getInstance();
  ProductionErrorTracker.getInstance();
}

export default ProductionMonitor;