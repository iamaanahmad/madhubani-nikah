'use client';

import React, { useEffect, useState } from 'react';
import { AppwriteErrorResponse, ErrorSeverity } from '@/lib/appwrite-errors';
import { Button } from '@/components/ui/button';
import { X, AlertTriangle, AlertCircle, Info, CheckCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ErrorToastProps {
  error: AppwriteErrorResponse;
  onClose: () => void;
  onRetry?: () => void;
  autoClose?: boolean;
  duration?: number;
}

export function ErrorToast({ 
  error, 
  onClose, 
  onRetry, 
  autoClose = true, 
  duration = 5000 
}: ErrorToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (autoClose && error.severity !== ErrorSeverity.CRITICAL) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, error.severity]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Allow animation to complete
  };

  const getIcon = () => {
    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case ErrorSeverity.HIGH:
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      case ErrorSeverity.MEDIUM:
        return <Info className="h-5 w-5 text-blue-500" />;
      case ErrorSeverity.LOW:
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  const getBackgroundColor = () => {
    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        return 'bg-red-50 border-red-200';
      case ErrorSeverity.HIGH:
        return 'bg-orange-50 border-orange-200';
      case ErrorSeverity.MEDIUM:
        return 'bg-blue-50 border-blue-200';
      case ErrorSeverity.LOW:
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  if (!isVisible) return null;

  return (
    <div className={cn(
      "fixed top-4 right-4 z-50 max-w-md w-full transform transition-all duration-300 ease-in-out",
      isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
    )}>
      <div className={cn(
        "rounded-lg border shadow-lg p-4",
        getBackgroundColor()
      )}>
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-900">
                {error.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="h-6 w-6 p-0 hover:bg-gray-200"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <p className="text-sm text-gray-700 mt-1">
              {error.userMessage}
            </p>

            {error.suggestions && error.suggestions.length > 0 && (
              <div className="mt-2">
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-xs text-gray-500 hover:text-gray-700 underline"
                >
                  {showDetails ? 'Hide' : 'Show'} suggestions
                </button>
                
                {showDetails && (
                  <ul className="mt-1 text-xs text-gray-600 space-y-1">
                    {error.suggestions.map((suggestion, index) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-1">•</span>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {(error.canRetry && onRetry) && (
              <div className="mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onRetry}
                  className="text-xs"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Try Again
                </Button>
              </div>
            )}
          </div>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <details className="mt-3 text-xs">
            <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
              Debug Info
            </summary>
            <pre className="mt-1 bg-gray-100 p-2 rounded text-xs overflow-auto max-h-20">
              {JSON.stringify({
                type: error.type,
                code: error.code,
                message: error.message,
                timestamp: error.timestamp
              }, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

// Toast Manager for handling multiple toasts
interface ToastState {
  id: string;
  error: AppwriteErrorResponse;
  onRetry?: () => void;
}

export class ErrorToastManager {
  private static instance: ErrorToastManager;
  private toasts: ToastState[] = [];
  private listeners: ((toasts: ToastState[]) => void)[] = [];

  static getInstance(): ErrorToastManager {
    if (!ErrorToastManager.instance) {
      ErrorToastManager.instance = new ErrorToastManager();
    }
    return ErrorToastManager.instance;
  }

  showError(error: AppwriteErrorResponse, onRetry?: () => void): string {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const toast: ToastState = { id, error, onRetry };
    
    this.toasts.push(toast);
    this.notifyListeners();
    
    return id;
  }

  removeToast(id: string): void {
    this.toasts = this.toasts.filter(toast => toast.id !== id);
    this.notifyListeners();
  }

  clearAll(): void {
    this.toasts = [];
    this.notifyListeners();
  }

  subscribe(listener: (toasts: ToastState[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener([...this.toasts]));
  }
}

// React hook for using the toast manager
export function useErrorToast() {
  const [toasts, setToasts] = useState<ToastState[]>([]);
  const manager = ErrorToastManager.getInstance();

  useEffect(() => {
    const unsubscribe = manager.subscribe(setToasts);
    return unsubscribe;
  }, [manager]);

  const showError = (error: AppwriteErrorResponse, onRetry?: () => void) => {
    return manager.showError(error, onRetry);
  };

  const removeToast = (id: string) => {
    manager.removeToast(id);
  };

  const clearAll = () => {
    manager.clearAll();
  };

  return {
    toasts,
    showError,
    removeToast,
    clearAll
  };
}

// Toast Container Component
export function ErrorToastContainer() {
  const { toasts, removeToast } = useErrorToast();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <ErrorToast
          key={toast.id}
          error={toast.error}
          onClose={() => removeToast(toast.id)}
          onRetry={toast.onRetry}
        />
      ))}
    </div>
  );
}