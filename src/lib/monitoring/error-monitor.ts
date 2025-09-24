import { AppwriteErrorResponse, ErrorContext, ErrorLogger, ErrorSeverity } from '../appwrite-errors';

export interface ErrorMetrics {
  totalErrors: number;
  errorsByType: Record<string, number>;
  errorsBySeverity: Record<ErrorSeverity, number>;
  errorsByHour: Record<string, number>;
  topErrors: Array<{
    message: string;
    count: number;
    lastOccurred: string;
  }>;
  userAffectedCount: number;
  averageErrorsPerUser: number;
}

export interface UserActionMetrics {
  totalActions: number;
  successfulActions: number;
  failedActions: number;
  successRate: number;
  actionsByType: Record<string, { success: number; failed: number }>;
  averageResponseTime: number;
}

export interface MonitoringConfig {
  enableConsoleLogging: boolean;
  enableRemoteLogging: boolean;
  enableMetrics: boolean;
  maxErrorsInMemory: number;
  metricsRetentionHours: number;
  criticalErrorThreshold: number;
  remoteEndpoint?: string;
  apiKey?: string;
}

export class ErrorMonitor implements ErrorLogger {
  private config: MonitoringConfig;
  private errors: Array<AppwriteErrorResponse & { context?: ErrorContext }> = [];
  private userActions: Array<{
    action: string;
    success: boolean;
    timestamp: string;
    responseTime?: number;
    metadata?: any;
  }> = [];
  private criticalErrorCount = 0;
  private startTime = Date.now();

  constructor(config: Partial<MonitoringConfig> = {}) {
    this.config = {
      enableConsoleLogging: true,
      enableRemoteLogging: false,
      enableMetrics: true,
      maxErrorsInMemory: 1000,
      metricsRetentionHours: 24,
      criticalErrorThreshold: 10,
      ...config
    };

    // Clean up old data periodically
    setInterval(() => this.cleanup(), 60 * 60 * 1000); // Every hour
  }

  logError(error: AppwriteErrorResponse, context?: ErrorContext): void {
    const errorWithContext = { ...error, context };

    if (this.config.enableMetrics) {
      this.errors.push(errorWithContext);
      
      // Trim if exceeding max
      if (this.errors.length > this.config.maxErrorsInMemory) {
        this.errors = this.errors.slice(-this.config.maxErrorsInMemory);
      }
    }

    if (this.config.enableConsoleLogging) {
      this.logToConsole(error, context);
    }

    if (this.config.enableRemoteLogging) {
      this.logToRemote(error, context);
    }

    // Track critical errors
    if (error.severity === ErrorSeverity.CRITICAL) {
      this.criticalErrorCount++;
      this.reportCriticalError(error);
    }
  }

  logUserAction(action: string, success: boolean, metadata?: any): void {
    const actionLog = {
      action,
      success,
      timestamp: new Date().toISOString(),
      responseTime: metadata?.responseTime,
      metadata
    };

    if (this.config.enableMetrics) {
      this.userActions.push(actionLog);
      
      // Trim if exceeding max
      if (this.userActions.length > this.config.maxErrorsInMemory) {
        this.userActions = this.userActions.slice(-this.config.maxErrorsInMemory);
      }
    }

    if (this.config.enableConsoleLogging) {
      console.info('User Action:', actionLog);
    }
  }

  reportCriticalError(error: AppwriteErrorResponse): void {
    console.error('CRITICAL ERROR REPORTED:', {
      error,
      criticalErrorCount: this.criticalErrorCount,
      timestamp: new Date().toISOString()
    });

    // In production, this would trigger alerts
    if (this.criticalErrorCount >= this.config.criticalErrorThreshold) {
      console.error('CRITICAL ERROR THRESHOLD EXCEEDED:', {
        threshold: this.config.criticalErrorThreshold,
        currentCount: this.criticalErrorCount
      });
    }
  }

  getErrorMetrics(): ErrorMetrics {
    const now = Date.now();
    const cutoffTime = now - (this.config.metricsRetentionHours * 60 * 60 * 1000);
    
    const recentErrors = this.errors.filter(error => 
      new Date(error.timestamp).getTime() > cutoffTime
    );

    const errorsByType: Record<string, number> = {};
    const errorsBySeverity: Record<ErrorSeverity, number> = {
      [ErrorSeverity.LOW]: 0,
      [ErrorSeverity.MEDIUM]: 0,
      [ErrorSeverity.HIGH]: 0,
      [ErrorSeverity.CRITICAL]: 0
    };
    const errorsByHour: Record<string, number> = {};
    const errorCounts: Record<string, number> = {};
    const userIds = new Set<string>();

    recentErrors.forEach(error => {
      // Count by type
      errorsByType[error.type] = (errorsByType[error.type] || 0) + 1;
      
      // Count by severity
      errorsBySeverity[error.severity]++;
      
      // Count by hour
      const hour = new Date(error.timestamp).toISOString().slice(0, 13);
      errorsByHour[hour] = (errorsByHour[hour] || 0) + 1;
      
      // Count error messages
      errorCounts[error.message] = (errorCounts[error.message] || 0) + 1;
      
      // Track unique users
      if (error.context?.userId) {
        userIds.add(error.context.userId);
      }
    });

    const topErrors = Object.entries(errorCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([message, count]) => ({
        message,
        count,
        lastOccurred: recentErrors
          .filter(e => e.message === message)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]
          ?.timestamp || ''
      }));

    return {
      totalErrors: recentErrors.length,
      errorsByType,
      errorsBySeverity,
      errorsByHour,
      topErrors,
      userAffectedCount: userIds.size,
      averageErrorsPerUser: userIds.size > 0 ? recentErrors.length / userIds.size : 0
    };
  }

  getUserActionMetrics(): UserActionMetrics {
    const now = Date.now();
    const cutoffTime = now - (this.config.metricsRetentionHours * 60 * 60 * 1000);
    
    const recentActions = this.userActions.filter(action => 
      new Date(action.timestamp).getTime() > cutoffTime
    );

    const actionsByType: Record<string, { success: number; failed: number }> = {};
    let totalResponseTime = 0;
    let responseTimeCount = 0;

    recentActions.forEach(action => {
      if (!actionsByType[action.action]) {
        actionsByType[action.action] = { success: 0, failed: 0 };
      }
      
      if (action.success) {
        actionsByType[action.action].success++;
      } else {
        actionsByType[action.action].failed++;
      }

      if (action.responseTime) {
        totalResponseTime += action.responseTime;
        responseTimeCount++;
      }
    });

    const successfulActions = recentActions.filter(a => a.success).length;
    const failedActions = recentActions.length - successfulActions;

    return {
      totalActions: recentActions.length,
      successfulActions,
      failedActions,
      successRate: recentActions.length > 0 ? successfulActions / recentActions.length : 0,
      actionsByType,
      averageResponseTime: responseTimeCount > 0 ? totalResponseTime / responseTimeCount : 0
    };
  }

  getSystemHealth(): {
    status: 'healthy' | 'warning' | 'critical';
    uptime: number;
    errorRate: number;
    criticalErrors: number;
    lastError?: AppwriteErrorResponse;
  } {
    const metrics = this.getErrorMetrics();
    const actionMetrics = this.getUserActionMetrics();
    
    const errorRate = actionMetrics.totalActions > 0 
      ? metrics.totalErrors / actionMetrics.totalActions 
      : 0;

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    
    if (this.criticalErrorCount >= this.config.criticalErrorThreshold) {
      status = 'critical';
    } else if (errorRate > 0.1 || metrics.errorsBySeverity[ErrorSeverity.HIGH] > 10) {
      status = 'warning';
    }

    return {
      status,
      uptime: Date.now() - this.startTime,
      errorRate,
      criticalErrors: this.criticalErrorCount,
      lastError: this.errors[this.errors.length - 1]
    };
  }

  exportMetrics(): {
    errors: ErrorMetrics;
    userActions: UserActionMetrics;
    systemHealth: ReturnType<ErrorMonitor['getSystemHealth']>;
    exportedAt: string;
  } {
    return {
      errors: this.getErrorMetrics(),
      userActions: this.getUserActionMetrics(),
      systemHealth: this.getSystemHealth(),
      exportedAt: new Date().toISOString()
    };
  }

  clearMetrics(): void {
    this.errors = [];
    this.userActions = [];
    this.criticalErrorCount = 0;
    this.startTime = Date.now();
  }

  private logToConsole(error: AppwriteErrorResponse, context?: ErrorContext): void {
    const logLevel = this.getLogLevel(error.severity);
    console[logLevel]('Error Monitor:', {
      timestamp: error.timestamp,
      type: error.type,
      severity: error.severity,
      message: error.message,
      userMessage: error.userMessage,
      code: error.code,
      context,
      suggestions: error.suggestions
    });
  }

  private async logToRemote(error: AppwriteErrorResponse, context?: ErrorContext): Promise<void> {
    if (!this.config.remoteEndpoint || !this.config.apiKey) {
      return;
    }

    try {
      await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          error,
          context,
          timestamp: new Date().toISOString(),
          source: 'madhubani-nikah-frontend'
        })
      });
    } catch (remoteError) {
      console.error('Failed to log error remotely:', remoteError);
    }
  }

  private getLogLevel(severity: ErrorSeverity): 'error' | 'warn' | 'info' {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        return 'error';
      case ErrorSeverity.MEDIUM:
        return 'warn';
      case ErrorSeverity.LOW:
      default:
        return 'info';
    }
  }

  private cleanup(): void {
    const now = Date.now();
    const cutoffTime = now - (this.config.metricsRetentionHours * 60 * 60 * 1000);
    
    this.errors = this.errors.filter(error => 
      new Date(error.timestamp).getTime() > cutoffTime
    );
    
    this.userActions = this.userActions.filter(action => 
      new Date(action.timestamp).getTime() > cutoffTime
    );
  }
}

// Global error monitor instance
export const globalErrorMonitor = new ErrorMonitor({
  enableConsoleLogging: process.env.NODE_ENV === 'development',
  enableRemoteLogging: process.env.NODE_ENV === 'production',
  enableMetrics: true,
  maxErrorsInMemory: 1000,
  metricsRetentionHours: 24,
  criticalErrorThreshold: 10,
  remoteEndpoint: process.env.NEXT_PUBLIC_ERROR_MONITORING_ENDPOINT,
  apiKey: process.env.NEXT_PUBLIC_ERROR_MONITORING_API_KEY
});