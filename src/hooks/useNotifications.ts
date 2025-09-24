import { useState, useEffect, useCallback, useRef } from 'react';
import { NotificationService } from '../lib/services/notification.service';
import { RealtimeService } from '../lib/services/realtime.service';
import type {
  Notification,
  CreateNotificationData,
  NotificationFilters,
  NotificationHistory,
  NotificationStats,
  NotificationPreferences,
  RealtimeNotificationData
} from '../lib/types/notification.types';

interface UseNotificationsReturn {
  // State
  notifications: Notification[];
  unreadCount: number;
  stats: NotificationStats | null;
  preferences: NotificationPreferences | null;
  loading: boolean;
  error: string | null;
  isRealtimeConnected: boolean;

  // Actions
  createNotification: (data: CreateNotificationData) => Promise<Notification | null>;
  markAsRead: (notificationId: string) => Promise<Notification | null>;
  markAllAsRead: () => Promise<number>;
  deleteNotification: (notificationId: string) => Promise<boolean>;
  
  // Data fetching
  refreshNotifications: (filters?: NotificationFilters) => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
  refreshStats: () => Promise<void>;
  refreshPreferences: () => Promise<void>;
  
  // Preferences
  updatePreferences: (preferences: Partial<NotificationPreferences>) => Promise<NotificationPreferences | null>;
  
  // Realtime
  enableRealtime: () => void;
  disableRealtime: () => void;
  
  // Utility
  clearError: () => void;
}

export const useNotifications = (userId?: string): UseNotificationsReturn => {
  // State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);

  // Refs for cleanup
  const realtimeUnsubscribe = useRef<(() => void) | null>(null);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Handle realtime notification updates
  const handleRealtimeNotification = useCallback((data: RealtimeNotificationData) => {
    const { notification, action } = data;

    switch (action) {
      case 'created':
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
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
        if (!notification.isRead) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
        break;
    }
  }, []);

  // Enable realtime notifications
  const enableRealtime = useCallback(() => {
    if (!userId || realtimeUnsubscribe.current) return;

    try {
      const unsubscribe = RealtimeService.subscribeToNotifications(
        userId,
        handleRealtimeNotification
      );
      
      realtimeUnsubscribe.current = unsubscribe;
      setIsRealtimeConnected(true);
    } catch (err: any) {
      console.error('Failed to enable realtime notifications:', err);
      setError('Failed to enable real-time notifications');
    }
  }, [userId, handleRealtimeNotification]);

  // Disable realtime notifications
  const disableRealtime = useCallback(() => {
    if (realtimeUnsubscribe.current) {
      realtimeUnsubscribe.current();
      realtimeUnsubscribe.current = null;
      setIsRealtimeConnected(false);
    }
  }, []);

  // Create notification
  const createNotification = useCallback(async (data: CreateNotificationData): Promise<Notification | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const notification = await NotificationService.createNotification(data);
      
      // If not using realtime, manually update the list
      if (!isRealtimeConnected) {
        setNotifications(prev => [notification, ...prev]);
        if (data.userId === userId) {
          setUnreadCount(prev => prev + 1);
        }
      }
      
      return notification;
    } catch (err: any) {
      setError(err.message || 'Failed to create notification');
      return null;
    } finally {
      setLoading(false);
    }
  }, [userId, isRealtimeConnected]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string): Promise<Notification | null> => {
    if (!userId) {
      setError('User not authenticated');
      return null;
    }

    try {
      const updatedNotification = await NotificationService.markAsRead(userId, notificationId);
      
      // If not using realtime, manually update the list
      if (!isRealtimeConnected) {
        setNotifications(prev => 
          prev.map(n => n.$id === notificationId ? updatedNotification : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      return updatedNotification;
    } catch (err: any) {
      setError(err.message || 'Failed to mark notification as read');
      return null;
    }
  }, [userId, isRealtimeConnected]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async (): Promise<number> => {
    if (!userId) {
      setError('User not authenticated');
      return 0;
    }

    try {
      setLoading(true);
      const markedCount = await NotificationService.markAllAsRead(userId);
      
      // If not using realtime, manually update the list
      if (!isRealtimeConnected) {
        setNotifications(prev => 
          prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
        );
        setUnreadCount(0);
      }
      
      return markedCount;
    } catch (err: any) {
      setError(err.message || 'Failed to mark all notifications as read');
      return 0;
    } finally {
      setLoading(false);
    }
  }, [userId, isRealtimeConnected]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string): Promise<boolean> => {
    if (!userId) {
      setError('User not authenticated');
      return false;
    }

    try {
      await NotificationService.deleteNotification(userId, notificationId);
      
      // If not using realtime, manually update the list
      if (!isRealtimeConnected) {
        const notification = notifications.find(n => n.$id === notificationId);
        setNotifications(prev => prev.filter(n => n.$id !== notificationId));
        if (notification && !notification.isRead) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
      
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to delete notification');
      return false;
    }
  }, [userId, notifications, isRealtimeConnected]);

  // Refresh notifications
  const refreshNotifications = useCallback(async (filters?: NotificationFilters): Promise<void> => {
    if (!userId) return;

    try {
      setLoading(true);
      const result = await NotificationService.getUserNotifications(userId, filters);
      setNotifications(result.notifications);
      setUnreadCount(result.unreadCount);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Refresh unread count
  const refreshUnreadCount = useCallback(async (): Promise<void> => {
    if (!userId) return;

    try {
      const count = await NotificationService.getUnreadCount(userId);
      setUnreadCount(count);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch unread count');
    }
  }, [userId]);

  // Refresh stats
  const refreshStats = useCallback(async (): Promise<void> => {
    if (!userId) return;

    try {
      const notificationStats = await NotificationService.getNotificationStats(userId);
      setStats(notificationStats);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch notification statistics');
    }
  }, [userId]);

  // Refresh preferences
  const refreshPreferences = useCallback(async (): Promise<void> => {
    if (!userId) return;

    try {
      const userPreferences = await NotificationService.getNotificationPreferences(userId);
      setPreferences(userPreferences);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch notification preferences');
    }
  }, [userId]);

  // Update preferences
  const updatePreferences = useCallback(async (
    newPreferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences | null> => {
    if (!userId) {
      setError('User not authenticated');
      return null;
    }

    try {
      setLoading(true);
      const updatedPreferences = await NotificationService.updateNotificationPreferences(
        userId,
        newPreferences
      );
      setPreferences(updatedPreferences);
      return updatedPreferences;
    } catch (err: any) {
      setError(err.message || 'Failed to update notification preferences');
      return null;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Initial data loading
  useEffect(() => {
    if (userId) {
      Promise.all([
        refreshNotifications(),
        refreshStats(),
        refreshPreferences(),
      ]);
    }
  }, [userId, refreshNotifications, refreshStats, refreshPreferences]);

  // Auto-enable realtime when user is available
  useEffect(() => {
    if (userId && RealtimeService.isRealtimeAvailable()) {
      enableRealtime();
    }

    // Cleanup on unmount or user change
    return () => {
      disableRealtime();
    };
  }, [userId, enableRealtime, disableRealtime]);

  return {
    // State
    notifications,
    unreadCount,
    stats,
    preferences,
    loading,
    error,
    isRealtimeConnected,

    // Actions
    createNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,

    // Data fetching
    refreshNotifications,
    refreshUnreadCount,
    refreshStats,
    refreshPreferences,

    // Preferences
    updatePreferences,

    // Realtime
    enableRealtime,
    disableRealtime,

    // Utility
    clearError,
  };
};