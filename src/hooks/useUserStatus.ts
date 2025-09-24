import { useState, useEffect, useCallback, useRef } from 'react';
import { UserStatusService } from '@/lib/services/user-status.service';
import { RealtimeService } from '@/lib/services/realtime.service';
import type { 
  UserStatus, 
  UserActivity, 
  OnlineUser, 
  ActivityStats 
} from '@/lib/services/user-status.service';

interface UseUserStatusReturn {
  // Current user status
  userStatus: UserStatus | null;
  isOnline: boolean;
  lastSeenAt: string | null;
  currentActivity: string | null;
  
  // Online users
  onlineUsers: OnlineUser[];
  onlineCount: number;
  
  // Activity tracking
  activities: UserActivity[];
  activityStats: ActivityStats | null;
  
  // Loading states
  loading: boolean;
  error: string | null;
  
  // Actions
  setOnline: () => Promise<void>;
  setOffline: () => Promise<void>;
  updateActivity: (activity: string) => Promise<void>;
  trackActivity: (type: UserActivity['activityType'], data?: Record<string, any>) => Promise<void>;
  refreshStatus: () => Promise<void>;
  refreshOnlineUsers: () => Promise<void>;
  refreshActivities: () => Promise<void>;
  refreshStats: () => Promise<void>;
  
  // Utility
  clearError: () => void;
}

export const useUserStatus = (userId?: string): UseUserStatusReturn => {
  // State
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [activityStats, setActivityStats] = useState<ActivityStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs for cleanup and intervals
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);
  const activityTimeout = useRef<NodeJS.Timeout | null>(null);
  const realtimeUnsubscribe = useRef<(() => void) | null>(null);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Set user online
  const setOnline = useCallback(async () => {
    if (!userId) return;

    try {
      const status = await UserStatusService.setUserOnline(userId);
      setUserStatus(status);
    } catch (err: any) {
      setError(err.message || 'Failed to set user online');
    }
  }, [userId]);

  // Set user offline
  const setOffline = useCallback(async () => {
    if (!userId) return;

    try {
      await UserStatusService.setUserOffline(userId);
      setUserStatus(prev => prev ? { ...prev, isOnline: false } : null);
    } catch (err: any) {
      setError(err.message || 'Failed to set user offline');
    }
  }, [userId]);

  // Update current activity
  const updateActivity = useCallback(async (activity: string) => {
    if (!userId) return;

    try {
      const status = await UserStatusService.updateOnlineStatus(userId, true, activity);
      setUserStatus(status);
    } catch (err: any) {
      setError(err.message || 'Failed to update activity');
    }
  }, [userId]);

  // Track specific activity
  const trackActivity = useCallback(async (
    type: UserActivity['activityType'], 
    data?: Record<string, any>
  ) => {
    if (!userId) return;

    try {
      const activity = await UserStatusService.trackActivity(userId, type, data);
      setActivities(prev => [activity, ...prev.slice(0, 49)]); // Keep last 50
    } catch (err: any) {
      setError(err.message || 'Failed to track activity');
    }
  }, [userId]);

  // Refresh user status
  const refreshStatus = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const status = await UserStatusService.getUserStatus(userId);
      setUserStatus(status);
    } catch (err: any) {
      setError(err.message || 'Failed to refresh status');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Refresh online users
  const refreshOnlineUsers = useCallback(async () => {
    try {
      const users = await UserStatusService.getOnlineUsers(50);
      setOnlineUsers(users);
    } catch (err: any) {
      setError(err.message || 'Failed to refresh online users');
    }
  }, []);

  // Refresh activities
  const refreshActivities = useCallback(async () => {
    if (!userId) return;

    try {
      const userActivities = await UserStatusService.getUserActivityHistory(userId, 50);
      setActivities(userActivities);
    } catch (err: any) {
      setError(err.message || 'Failed to refresh activities');
    }
  }, [userId]);

  // Refresh activity stats
  const refreshStats = useCallback(async () => {
    if (!userId) return;

    try {
      const stats = await UserStatusService.getUserActivityStats(userId);
      setActivityStats(stats);
    } catch (err: any) {
      setError(err.message || 'Failed to refresh stats');
    }
  }, [userId]);

  // Start heartbeat to maintain online status
  const startHeartbeat = useCallback(() => {
    if (!userId || heartbeatInterval.current) return;

    heartbeatInterval.current = setInterval(async () => {
      try {
        await UserStatusService.updateOnlineStatus(userId, true);
      } catch (error) {
        console.error('Heartbeat failed:', error);
      }
    }, 30000); // Update every 30 seconds
  }, [userId]);

  // Stop heartbeat
  const stopHeartbeat = useCallback(() => {
    if (heartbeatInterval.current) {
      clearInterval(heartbeatInterval.current);
      heartbeatInterval.current = null;
    }
  }, []);

  // Handle user activity detection
  const handleUserActivity = useCallback(() => {
    if (!userId) return;

    // Clear existing timeout
    if (activityTimeout.current) {
      clearTimeout(activityTimeout.current);
    }

    // Set user as active
    updateActivity('active');

    // Set timeout to mark as idle after 5 minutes of inactivity
    activityTimeout.current = setTimeout(() => {
      updateActivity('idle');
    }, 5 * 60 * 1000);
  }, [userId, updateActivity]);

  // Setup activity listeners
  useEffect(() => {
    if (!userId) return;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, { passive: true });
    });

    // Initial activity
    handleUserActivity();

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity);
      });
      
      if (activityTimeout.current) {
        clearTimeout(activityTimeout.current);
      }
    };
  }, [userId, handleUserActivity]);

  // Handle page visibility changes
  useEffect(() => {
    if (!userId) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        updateActivity('away');
      } else {
        updateActivity('active');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [userId, updateActivity]);

  // Handle beforeunload to set user offline
  useEffect(() => {
    if (!userId) return;

    const handleBeforeUnload = () => {
      // Use sendBeacon for reliable offline status update
      if (navigator.sendBeacon) {
        // This would need a server endpoint to handle the beacon
        // For now, we'll use the regular API call
        UserStatusService.setUserOffline(userId).catch(console.error);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [userId]);

  // Setup realtime subscriptions for online status updates
  useEffect(() => {
    if (!userId) return;

    try {
      // Subscribe to user status updates
      const unsubscribe = RealtimeService.subscribeToOnlineStatus(
        [userId],
        (updatedUserId, isOnline) => {
          if (updatedUserId === userId) {
            setUserStatus(prev => prev ? { ...prev, isOnline } : null);
          }
        }
      );

      realtimeUnsubscribe.current = unsubscribe;
    } catch (error) {
      console.error('Failed to setup realtime status subscription:', error);
    }

    return () => {
      if (realtimeUnsubscribe.current) {
        realtimeUnsubscribe.current();
      }
    };
  }, [userId]);

  // Initialize user status and start heartbeat
  useEffect(() => {
    if (!userId) return;

    const initialize = async () => {
      await setOnline();
      await Promise.all([
        refreshStatus(),
        refreshOnlineUsers(),
        refreshActivities(),
        refreshStats(),
      ]);
      startHeartbeat();
    };

    initialize();

    return () => {
      stopHeartbeat();
      setOffline();
    };
  }, [userId, setOnline, setOffline, refreshStatus, refreshOnlineUsers, refreshActivities, refreshStats, startHeartbeat, stopHeartbeat]);

  // Computed values
  const isOnline = userStatus?.isOnline ?? false;
  const lastSeenAt = userStatus?.lastSeenAt ?? null;
  const currentActivity = userStatus?.currentActivity ?? null;
  const onlineCount = onlineUsers.length;

  return {
    // Current user status
    userStatus,
    isOnline,
    lastSeenAt,
    currentActivity,
    
    // Online users
    onlineUsers,
    onlineCount,
    
    // Activity tracking
    activities,
    activityStats,
    
    // Loading states
    loading,
    error,
    
    // Actions
    setOnline,
    setOffline,
    updateActivity,
    trackActivity,
    refreshStatus,
    refreshOnlineUsers,
    refreshActivities,
    refreshStats,
    
    // Utility
    clearError,
  };
};