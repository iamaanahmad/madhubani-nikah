'use client';

import React from 'react';
import { useOffline } from '@/hooks/usePWA';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Wifi, 
  WifiOff, 
  Sync, 
  Clock, 
  AlertCircle, 
  CheckCircle,
  Database,
  Trash2
} from 'lucide-react';

interface OfflineIndicatorProps {
  className?: string;
  variant?: 'badge' | 'banner' | 'detailed';
  showStorageInfo?: boolean;
}

export function OfflineIndicator({ 
  className = '', 
  variant = 'badge',
  showStorageInfo = false 
}: OfflineIndicatorProps) {
  const { 
    offlineStatus, 
    storageUsage, 
    isOnline, 
    hasPendingActions, 
    isSyncing,
    clearCache 
  } = useOffline();

  if (variant === 'badge') {
    return (
      <Badge 
        variant={isOnline ? 'default' : 'destructive'} 
        className={`flex items-center space-x-1 ${className}`}
      >
        {isOnline ? (
          <>
            <Wifi className="h-3 w-3" />
            <span>Online</span>
          </>
        ) : (
          <>
            <WifiOff className="h-3 w-3" />
            <span>Offline</span>
          </>
        )}
        {isSyncing && <Sync className="h-3 w-3 animate-spin ml-1" />}
      </Badge>
    );
  }

  if (variant === 'banner' && (!isOnline || hasPendingActions)) {
    return (
      <div className={`bg-yellow-50 border-l-4 border-yellow-400 p-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {isOnline ? (
              <Sync className={`h-5 w-5 text-yellow-600 ${isSyncing ? 'animate-spin' : ''}`} />
            ) : (
              <WifiOff className="h-5 w-5 text-yellow-600" />
            )}
            
            <div>
              <h3 className="text-sm font-medium text-yellow-800">
                {isOnline ? 'Syncing Data' : 'You\'re Offline'}
              </h3>
              <p className="text-sm text-yellow-700">
                {isOnline 
                  ? `Syncing ${offlineStatus.pendingActions} pending actions...`
                  : 'Some features may be limited. Your actions will sync when you\'re back online.'
                }
              </p>
            </div>
          </div>
          
          {hasPendingActions && (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              {offlineStatus.pendingActions} pending
            </Badge>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {isOnline ? (
                <Wifi className="h-5 w-5 text-green-600" />
              ) : (
                <WifiOff className="h-5 w-5 text-red-600" />
              )}
              <CardTitle className="text-lg">
                Connection Status
              </CardTitle>
            </div>
            
            <Badge variant={isOnline ? 'default' : 'destructive'}>
              {isOnline ? 'Online' : 'Offline'}
            </Badge>
          </div>
          
          <CardDescription>
            {isOnline 
              ? 'All features are available'
              : 'Limited functionality - actions will sync when online'
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Sync Status */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              {isSyncing ? (
                <Sync className="h-4 w-4 text-blue-600 animate-spin" />
              ) : hasPendingActions ? (
                <Clock className="h-4 w-4 text-yellow-600" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-600" />
              )}
              
              <div>
                <div className="font-medium text-sm">
                  {isSyncing ? 'Syncing...' : hasPendingActions ? 'Pending Actions' : 'All Synced'}
                </div>
                <div className="text-xs text-gray-500">
                  {offlineStatus.pendingActions} actions in queue
                </div>
              </div>
            </div>
            
            {offlineStatus.pendingActions > 0 && (
              <Badge variant="secondary">
                {offlineStatus.pendingActions}
              </Badge>
            )}
          </div>

          {/* Last Online */}
          {!isOnline && (
            <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <div>
                <div className="font-medium text-sm text-red-800">
                  Connection Lost
                </div>
                <div className="text-xs text-red-600">
                  Last online: {new Date(offlineStatus.lastOnline).toLocaleString()}
                </div>
              </div>
            </div>
          )}

          {/* Storage Information */}
          {showStorageInfo && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Database className="h-4 w-4 text-gray-600" />
                  <span className="font-medium text-sm">Offline Storage</span>
                </div>
                <Button
                  onClick={clearCache}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Cached Data</span>
                  <span>{storageUsage.cache} items</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span>Pending Actions</span>
                  <span>{storageUsage.actions} items</span>
                </div>
                
                <div className="flex justify-between text-sm font-medium">
                  <span>Total</span>
                  <span>{storageUsage.total} items</span>
                </div>
              </div>
            </div>
          )}

          {/* Offline Features */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Available Offline:</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span>View cached profiles</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span>Send interests</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span>Update profile</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span>View messages</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}

export function OfflineToast() {
  const { isOnline, hasPendingActions, isSyncing } = useOffline();
  const [showToast, setShowToast] = React.useState(false);
  const [wasOffline, setWasOffline] = React.useState(false);

  React.useEffect(() => {
    if (!isOnline && !wasOffline) {
      setShowToast(true);
      setWasOffline(true);
      setTimeout(() => setShowToast(false), 5000);
    } else if (isOnline && wasOffline) {
      setShowToast(true);
      setWasOffline(false);
      setTimeout(() => setShowToast(false), 3000);
    }
  }, [isOnline, wasOffline]);

  if (!showToast) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-2">
      <Card className="w-80">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            {isOnline ? (
              <div className="p-2 bg-green-100 rounded-full">
                <Wifi className="h-4 w-4 text-green-600" />
              </div>
            ) : (
              <div className="p-2 bg-red-100 rounded-full">
                <WifiOff className="h-4 w-4 text-red-600" />
              </div>
            )}
            
            <div className="flex-1">
              <div className="font-medium text-sm">
                {isOnline ? 'Back Online' : 'You\'re Offline'}
              </div>
              <div className="text-xs text-gray-500">
                {isOnline 
                  ? hasPendingActions 
                    ? 'Syncing your changes...' 
                    : 'All features available'
                  : 'Limited features available'
                }
              </div>
            </div>
            
            {isSyncing && (
              <Sync className="h-4 w-4 text-blue-600 animate-spin" />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}