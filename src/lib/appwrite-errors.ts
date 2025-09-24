import { AppwriteException } from 'appwrite';

export enum AppwriteErrorType {
  AUTHENTICATION_ERROR = 'auth_error',
  PERMISSION_ERROR = 'permission_error',
  VALIDATION_ERROR = 'validation_error',
  NETWORK_ERROR = 'network_error',
  RATE_LIMIT_ERROR = 'rate_limit_error',
  STORAGE_ERROR = 'storage_error',
  DATABASE_ERROR = 'database_error',
  FORM_VALIDATION_ERROR = 'form_validation_error',
  FILE_VALIDATION_ERROR = 'file_validation_error',
  BUSINESS_LOGIC_ERROR = 'business_logic_error',
  UNKNOWN_ERROR = 'unknown_error'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface AppwriteErrorResponse {
  type: AppwriteErrorType;
  message: string;
  code?: number;
  details?: any;
  userMessage: string;
  canRetry: boolean;
  severity: ErrorSeverity;
  timestamp: string;
  context?: ErrorContext;
  suggestions?: string[];
}

export interface ErrorContext {
  userId?: string;
  action?: string;
  component?: string;
  url?: string;
  userAgent?: string;
  sessionId?: string;
  additionalData?: Record<string, any>;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
}

export interface FormValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings?: ValidationError[];
}

export class AppwriteErrorHandler {
  private static errorLogger: ErrorLogger | null = null;
  private static retryAttempts = new Map<string, number>();

  static setErrorLogger(logger: ErrorLogger) {
    this.errorLogger = logger;
  }

  static initializeGlobalErrorHandling() {
    // Set up global error monitor
    if (typeof window !== 'undefined') {
      try {
        // Temporarily disabled to fix build issues
        // const { globalErrorMonitor } = require('../monitoring/error-monitor');
        // this.setErrorLogger(globalErrorMonitor);
        
        // Error monitoring temporarily disabled
        console.log('Error monitoring setup skipped during build');
      } catch (error) {
        console.warn('Failed to load error monitor:', error);
      }
    }
  }

  static handleError(
    error: AppwriteException | Error, 
    context?: ErrorContext
  ): AppwriteErrorResponse {
    const errorResponse = error instanceof AppwriteException 
      ? this.handleAppwriteException(error, context)
      : this.handleGenericError(error, context);

    // Log the error
    this.logError(errorResponse, context);

    return errorResponse;
  }

  private static handleGenericError(
    error: Error, 
    context?: ErrorContext
  ): AppwriteErrorResponse {
    return {
      type: AppwriteErrorType.UNKNOWN_ERROR,
      message: error.message,
      userMessage: 'An unexpected error occurred. Please try again.',
      canRetry: true,
      severity: ErrorSeverity.MEDIUM,
      timestamp: new Date().toISOString(),
      context,
      suggestions: ['Try refreshing the page', 'Check your internet connection']
    };
  }

  private static handleAppwriteException(
    error: AppwriteException, 
    context?: ErrorContext
  ): AppwriteErrorResponse {
    const { code, message, type } = error;
    const timestamp = new Date().toISOString();

    switch (code) {
      case 401:
        return {
          type: AppwriteErrorType.AUTHENTICATION_ERROR,
          message,
          code,
          userMessage: 'Your session has expired. Please log in again.',
          canRetry: false,
          severity: ErrorSeverity.HIGH,
          timestamp,
          context,
          suggestions: ['Log in again', 'Clear browser cache and cookies']
        };

      case 403:
        return {
          type: AppwriteErrorType.PERMISSION_ERROR,
          message,
          code,
          userMessage: 'You do not have permission to perform this action.',
          canRetry: false,
          severity: ErrorSeverity.MEDIUM,
          timestamp,
          context,
          suggestions: ['Contact support if you believe this is an error']
        };

      case 400:
        return {
          type: AppwriteErrorType.VALIDATION_ERROR,
          message,
          code,
          userMessage: 'Please check your input and try again.',
          canRetry: false,
          severity: ErrorSeverity.LOW,
          timestamp,
          context,
          suggestions: ['Verify all required fields are filled', 'Check data format requirements']
        };

      case 429:
        return {
          type: AppwriteErrorType.RATE_LIMIT_ERROR,
          message,
          code,
          userMessage: 'Too many requests. Please wait a moment and try again.',
          canRetry: true,
          severity: ErrorSeverity.MEDIUM,
          timestamp,
          context,
          suggestions: ['Wait 30 seconds before trying again', 'Reduce the frequency of your actions']
        };

      case 500:
      case 502:
      case 503:
      case 504:
        return {
          type: AppwriteErrorType.NETWORK_ERROR,
          message,
          code,
          userMessage: 'Server is temporarily unavailable. Please try again later.',
          canRetry: true,
          severity: ErrorSeverity.HIGH,
          timestamp,
          context,
          suggestions: ['Try again in a few minutes', 'Check your internet connection']
        };

      default:
        if (type === 'storage_invalid_file_size' || type === 'storage_invalid_file') {
          return {
            type: AppwriteErrorType.STORAGE_ERROR,
            message,
            code,
            userMessage: 'Invalid file. Please check file size and format.',
            canRetry: false,
            severity: ErrorSeverity.LOW,
            timestamp,
            context,
            suggestions: ['Use a smaller file (max 5MB)', 'Ensure file is in supported format (JPG, PNG, PDF)']
          };
        }

        if (type?.includes('database')) {
          return {
            type: AppwriteErrorType.DATABASE_ERROR,
            message,
            code,
            userMessage: 'Database error occurred. Please try again.',
            canRetry: true,
            severity: ErrorSeverity.HIGH,
            timestamp,
            context,
            suggestions: ['Try again in a moment', 'Contact support if problem persists']
          };
        }

        return {
          type: AppwriteErrorType.UNKNOWN_ERROR,
          message,
          code,
          userMessage: 'An error occurred. Please try again.',
          canRetry: true,
          severity: ErrorSeverity.MEDIUM,
          timestamp,
          context,
          suggestions: ['Try refreshing the page', 'Contact support if problem persists']
        };
    }
  }

  static isRetryableError(error: AppwriteErrorResponse): boolean {
    return error.canRetry;
  }

  static getRetryDelay(attemptNumber: number): number {
    // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
    return Math.min(1000 * Math.pow(2, attemptNumber - 1), 30000);
  }

  static async retryOperation<T>(
    operation: () => Promise<T>,
    maxAttempts: number = 3,
    context?: ErrorContext
  ): Promise<T> {
    const operationId = `${context?.action || 'unknown'}_${Date.now()}`;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await operation();
        // Reset retry count on success
        this.retryAttempts.delete(operationId);
        return result;
      } catch (error) {
        const errorResponse = this.handleError(error as Error, {
          ...context,
          additionalData: { attempt, maxAttempts }
        });

        if (!errorResponse.canRetry || attempt === maxAttempts) {
          throw error;
        }

        const delay = this.getRetryDelay(attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw new Error('Max retry attempts exceeded');
  }

  private static logError(error: AppwriteErrorResponse, context?: ErrorContext) {
    if (this.errorLogger) {
      this.errorLogger.logError(error, context);
    } else {
      // Fallback to console logging
      console.error('Appwrite Error:', {
        ...error,
        context
      });
    }
  }

  static createBusinessLogicError(
    message: string,
    userMessage: string,
    context?: ErrorContext
  ): AppwriteErrorResponse {
    return {
      type: AppwriteErrorType.BUSINESS_LOGIC_ERROR,
      message,
      userMessage,
      canRetry: false,
      severity: ErrorSeverity.MEDIUM,
      timestamp: new Date().toISOString(),
      context,
      suggestions: ['Please review your input and try again']
    };
  }
}

// Error Logger Interface
export interface ErrorLogger {
  logError(error: AppwriteErrorResponse, context?: ErrorContext): void;
  logUserAction(action: string, success: boolean, metadata?: any): void;
  reportCriticalError(error: AppwriteErrorResponse): void;
}

// Default Console Error Logger
export class ConsoleErrorLogger implements ErrorLogger {
  logError(error: AppwriteErrorResponse, context?: ErrorContext): void {
    const logLevel = this.getLogLevel(error.severity);
    console[logLevel]('Appwrite Error:', {
      timestamp: error.timestamp,
      type: error.type,
      message: error.message,
      userMessage: error.userMessage,
      code: error.code,
      severity: error.severity,
      context,
      suggestions: error.suggestions
    });
  }

  logUserAction(action: string, success: boolean, metadata?: any): void {
    console.info('User Action:', {
      action,
      success,
      timestamp: new Date().toISOString(),
      metadata
    });
  }

  reportCriticalError(error: AppwriteErrorResponse): void {
    console.error('CRITICAL ERROR:', error);
    // In production, this would send to monitoring service
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
}