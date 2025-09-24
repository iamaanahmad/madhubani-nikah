'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { RealtimeService } from '@/lib/services/realtime.service';
import { NotificationService } from '@/lib/services/notification.service';
import { NotificationToastContainer } from './notification-toast';
import type { 
  Notification, 
  RealtimeNotificationData,
  NotificationSoundOptions,
  NotificationVisualOptions 
} from '@/lib/types/notification.types';

interface RealtimeNotificationContextType {
  // State
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  toastNotifications: Notification[];
  
  // Actions
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  dismissToast: (notificationId: string) => void;
  clearAllToasts: () => void;
  
  // Settings
  updateSoundSettings: (options: Partial<NotificationSoundOptions>) => void;
  updateVisualSettings: (options: Partial<NotificationVisualOptions>) => void;
  requestPermissions: () => Promise<boolean>;
  
  // Connection management
  connect: () => void;
  disconnect: () => void;
}

const RealtimeNotificationContext = createContext<RealtimeNotificationContextType | null>(null);

interface RealtimeNotificationProviderProps {
  children: ReactNode;
  userId?: string;
  enableToasts?: boolean;
  maxToasts?: number;
  toastPosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  autoRequestPermissions?: boolean;
}

export function RealtimeNotificationProvider({
  children,
  userId,
  enableToasts = true,
  maxToasts = 3,
  toastPosition = 'top-right',
  autoRequestPermissions = true,
}: RealtimeNotificationProviderProps) {
  // State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [toastNotifications, setToastNotifications] = useState<Notification[]>([]);
  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null);

  // Handle realtime notification updates
  const handleRealtimeNotification = useCallback((data: RealtimeNotificationData) => {
    const { notification, action } = data;

    switch (action) {
      case 'created':
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Add to toast notifications if enabled
        if (enableToasts) {
          setToastNotifications(prev => [notification, ...prev.slice(0, maxToasts - 1)]);
        }
        break;
        
      case 'updated':
        setNotifications(prev => 
          prev.map(n => n.$id === notification.$id ? notification : n)
        );
        
        // Update unread count if read status changed
        if (notification.isRead) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
        break;
        
      case 'deleted':
        setNotifications(prev => prev.filter(n => n.$id !== notification.$id));
        setToastNotifications(prev => prev.filter(n => n.$id !== notification.$id));
        
        if (!notification.isRead) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
        break;
    }
  }, [enableToasts, maxToasts]);

  // Connect to realtime notifications
  const connect = useCallback(() => {
    if (!userId || unsubscribe) return;

    try {
      const unsubscribeFn = RealtimeService.subscribeToNotifications(
        userId,
        handleRealtimeNotification
      );
      
      setUnsubscribe(() => unsubscribeFn);
      setIsConnected(true);
    } catch (error) {
      console.error('Failed to connect to realtime notifications:', error);
      setIsConnected(false);
    }
  }, [userId, handleRealtimeNotification, unsubscribe]);

  // Disconnect from realtime notifications
  const disconnect = useCallback(() => {
    if (unsubscribe) {
      unsubscribe();
      setUnsubscribe(null);
      setIsConnected(false);
    }
  }, [unsubscribe]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!userId) return;

    try {
      await NotificationService.markAsRead(userId, notificationId);
      
      // Update local state if not using realtime
      if (!isConnected) {
        setNotifications(prev => 
          prev.map(n => 
            n.$id === notificationId 
              ? { ...n, isRead: true, readAt: new Date().toISOString() }
              : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, [userId, isConnected]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!userId) return;

    try {
      await NotificationService.markAllAsRead(userId);
      
      // Update local state if not using realtime
      if (!isConnected) {
        setNotifications(prev => 
          prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }, [userId, isConnected]);

  // Dismiss toast notification
  const dismissToast = useCallback((notificationId: string) => {
    setToastNotifications(prev => prev.filter(n => n.$id !== notificationId));
  }, []);

  // Clear all toast notifications
  const clearAllToasts = useCallback(() => {
    setToastNotifications([]);
  }, []);

  // Update sound settings
  const updateSoundSettings = useCallback((options: Partial<NotificationSoundOptions>) => {
    RealtimeService.configureSoundOptions(options);
  }, []);

  // Update visual settings
  const updateVisualSettings = useCallback((options: Partial<NotificationVisualOptions>) => {
    RealtimeService.configureVisualOptions(options);
  }, []);

  // Request notification permissions
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      const permission = await RealtimeService.requestNotificationPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Failed to request notification permissions:', error);
      return false;
    }
  }, []);

  // Handle toast action
  const handleToastAction = useCallback((notification: Notification) => {
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
    
    // Auto-mark as read when action is taken
    if (!notification.isRead) {
      markAsRead(notification.$id);
    }
  }, [markAsRead]);

  // Load initial notifications
  useEffect(() => {
    if (!userId) return;

    const loadInitialNotifications = async () => {
      try {
        const result = await NotificationService.getUserNotifications(userId, {
          limit: 50,
          isRead: false,
        });
        
        setNotifications(result.notifications);
        setUnreadCount(result.unreadCount);
      } catch (error) {
        console.error('Failed to load initial notifications:', error);
      }
    };

    loadInitialNotifications();
  }, [userId]);

  // Auto-connect when userId is available
  useEffect(() => {
    if (userId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [userId, connect, disconnect]);

  // Auto-request permissions
  useEffect(() => {
    if (autoRequestPermissions && RealtimeService.isNotificationSupported()) {
      requestPermissions();
    }
  }, [autoRequestPermissions, requestPermissions]);

  // Listen for badge update events
  useEffect(() => {
    const handleBadgeUpdate = () => {
      // Trigger any additional badge update logic here
      console.log('Notification badge updated');
    };

    window.addEventListener('notification-badge-update', handleBadgeUpdate);
    return () => window.removeEventListener('notification-badge-update', handleBadgeUpdate);
  }, []);

  const contextValue: RealtimeNotificationContextType = {
    // State
    notifications,
    unreadCount,
    isConnected,
    toastNotifications,
    
    // Actions
    markAsRead,
    markAllAsRead,
    dismissToast,
    clearAllToasts,
    
    // Settings
    updateSoundSettings,
    updateVisualSettings,
    requestPermissions,
    
    // Connection management
    connect,
    disconnect,
  };

  return (
    <RealtimeNotificationContext.Provider value={contextValue}>
      {children}
      
      {/* Toast notifications */}
      {enableToasts && toastNotifications.length > 0 && (
        <NotificationToastContainer
          notifications={toastNotifications}
          onClose={dismissToast}
          onAction={handleToastAction}
          maxToasts={maxToasts}
          position={toastPosition}
        />
      )}
    </RealtimeNotificationContext.Provider>
  );
}

// Hook to use the realtime notification context
export function useRealtimeNotifications() {
  const context = useContext(RealtimeNotificationContext);
  
  if (!context) {
    throw new Error('useRealtimeNotifications must be used within a RealtimeNotificationProvider');
  }
  
  return context;
}

// Hook for notification badge
export function useNotificationBadge() {
  const { unreadCount, isConnected } = useRealtimeNotifications();
  
  return {
    count: unreadCount,
    isOnline: isConnected,
    hasHighPriority: false, // This could be enhanced to check for high priority notifications
  };
}