import { client } from '../appwrite';
import { DATABASE_ID, COLLECTION_IDS } from '../appwrite-config';
import { UserStatusService } from './user-status.service';
import type { 
  Notification, 
  RealtimeNotificationData 
} from '../types/notification.types';
import type { Interest } from '../types/interest.types';

// Define callback types
export type NotificationCallback = (data: RealtimeNotificationData) => void;
export type InterestCallback = (interest: Interest, action: 'created' | 'updated' | 'deleted') => void;
export type ProfileCallback = (profileId: string, action: 'updated' | 'deleted') => void;
export type OnlineStatusCallback = (userId: string, isOnline: boolean) => void;

// Notification sound and visual indicator types
export interface NotificationSoundOptions {
  enabled: boolean;
  volume: number; // 0-1
  soundType: 'default' | 'interest' | 'match' | 'system';
}

export interface NotificationVisualOptions {
  showBrowserNotification: boolean;
  showToast: boolean;
  showBadge: boolean;
  flashTitle: boolean;
}

// Define subscription types
interface RealtimeSubscription {
  unsubscribe: () => void;
}

export class RealtimeService {
  private static subscriptions: Map<string, RealtimeSubscription> = new Map();
  private static soundOptions: NotificationSoundOptions = {
    enabled: true,
    volume: 0.7,
    soundType: 'default'
  };
  private static visualOptions: NotificationVisualOptions = {
    showBrowserNotification: true,
    showToast: true,
    showBadge: true,
    flashTitle: true
  };
  private static audioContext: AudioContext | null = null;
  private static notificationSounds: Map<string, AudioBuffer> = new Map();
  private static originalTitle: string = document.title;
  private static titleFlashInterval: NodeJS.Timeout | null = null;

  /**
   * Subscribe to notifications for a user
   */
  static subscribeToNotifications(
    userId: string, 
    callback: NotificationCallback
  ): () => void {
    const subscriptionKey = `notifications_${userId}`;
    
    try {
      // Create subscription using Appwrite's realtime
      const unsubscribe = client.subscribe(
        `databases.${DATABASE_ID}.collections.${COLLECTION_IDS.NOTIFICATIONS}.documents`,
        (response) => {
          // Filter notifications for this user
          const payload = response.payload as any;
          
          if (payload.userId === userId) {
            const notificationData: RealtimeNotificationData = {
              notification: payload as Notification,
              action: this.mapEventToAction(response.events[0]),
              timestamp: new Date().toISOString(),
            };
            
            // Handle notification sound and visual indicators
            if (notificationData.action === 'created') {
              this.handleNotificationIndicators(notificationData.notification);
            }
            
            callback(notificationData);
          }
        }
      );

      // Store subscription for cleanup
      this.subscriptions.set(subscriptionKey, { unsubscribe });

      // Return cleanup function
      return () => {
        unsubscribe();
        this.subscriptions.delete(subscriptionKey);
      };
    } catch (error) {
      console.error('Failed to subscribe to notifications:', error);
      // Return a no-op function if subscription fails
      return () => {};
    }
  }

  /**
   * Subscribe to interest updates for a user
   */
  static subscribeToInterests(
    userId: string,
    callback: InterestCallback
  ): () => void {
    const subscriptionKey = `interests_${userId}`;
    
    try {
      const unsubscribe = client.subscribe(
        `databases.${DATABASE_ID}.collections.${COLLECTION_IDS.INTERESTS}.documents`,
        (response) => {
          const payload = response.payload as any;
          
          // Filter interests for this user (either sender or receiver)
          if (payload.senderId === userId || payload.receiverId === userId) {
            const action = this.mapEventToAction(response.events[0]);
            callback(payload as Interest, action);
          }
        }
      );

      this.subscriptions.set(subscriptionKey, { unsubscribe });

      return () => {
        unsubscribe();
        this.subscriptions.delete(subscriptionKey);
      };
    } catch (error) {
      console.error('Failed to subscribe to interests:', error);
      return () => {};
    }
  }

  /**
   * Subscribe to profile updates
   */
  static subscribeToProfileUpdates(
    userId: string,
    callback: ProfileCallback
  ): () => void {
    const subscriptionKey = `profile_${userId}`;
    
    try {
      const unsubscribe = client.subscribe(
        `databases.${DATABASE_ID}.collections.${COLLECTION_IDS.PROFILES}.documents`,
        (response) => {
          const payload = response.payload as any;
          
          // Filter for this user's profile
          if (payload.userId === userId) {
            const action = this.mapEventToAction(response.events[0]);
            if (action === 'updated' || action === 'deleted') {
              callback(payload.$id, action);
            }
          }
        }
      );

      this.subscriptions.set(subscriptionKey, { unsubscribe });

      return () => {
        unsubscribe();
        this.subscriptions.delete(subscriptionKey);
      };
    } catch (error) {
      console.error('Failed to subscribe to profile updates:', error);
      return () => {};
    }
  }

  /**
   * Update online status for a user
   */
  static async updateOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
    try {
      // Update user's online status in the database
      await UserStatusService.updateOnlineStatus(userId, isOnline);
      
      // In a real implementation, you might:
      // 1. Update a user status collection
      // 2. Use Appwrite Functions to broadcast status changes
      // 3. Implement presence detection with heartbeat
    } catch (error) {
      console.error('Failed to update online status:', error);
    }
  }

  /**
   * Subscribe to online status changes for multiple users
   */
  static subscribeToOnlineStatus(
    userIds: string[],
    callback: OnlineStatusCallback
  ): () => void {
    const subscriptionKey = `online_status_${userIds.join('_')}`;
    
    try {
      const unsubscribe = client.subscribe(
        `databases.${DATABASE_ID}.collections.${COLLECTION_IDS.USER_STATUS || 'user_status'}.documents`,
        (response) => {
          const payload = response.payload as any;
          
          // Filter for the specified users
          if (userIds.includes(payload.userId)) {
            const action = this.mapEventToAction(response.events[0]);
            if (action === 'updated' || action === 'created') {
              callback(payload.userId, payload.isOnline);
            }
          }
        }
      );

      this.subscriptions.set(subscriptionKey, { unsubscribe });

      return () => {
        unsubscribe();
        this.subscriptions.delete(subscriptionKey);
      };
    } catch (error) {
      console.error('Failed to subscribe to online status:', error);
      return () => {};
    }
  }

  /**
   * Subscribe to multiple channels at once
   */
  static subscribeToMultiple(subscriptions: {
    notifications?: { userId: string; callback: NotificationCallback };
    interests?: { userId: string; callback: InterestCallback };
    profile?: { userId: string; callback: ProfileCallback };
    onlineStatus?: { userIds: string[]; callback: OnlineStatusCallback };
  }): () => void {
    const unsubscribeFunctions: (() => void)[] = [];

    if (subscriptions.notifications) {
      const unsubscribe = this.subscribeToNotifications(
        subscriptions.notifications.userId,
        subscriptions.notifications.callback
      );
      unsubscribeFunctions.push(unsubscribe);
    }

    if (subscriptions.interests) {
      const unsubscribe = this.subscribeToInterests(
        subscriptions.interests.userId,
        subscriptions.interests.callback
      );
      unsubscribeFunctions.push(unsubscribe);
    }

    if (subscriptions.profile) {
      const unsubscribe = this.subscribeToProfileUpdates(
        subscriptions.profile.userId,
        subscriptions.profile.callback
      );
      unsubscribeFunctions.push(unsubscribe);
    }

    if (subscriptions.onlineStatus) {
      const unsubscribe = this.subscribeToOnlineStatus(
        subscriptions.onlineStatus.userIds,
        subscriptions.onlineStatus.callback
      );
      unsubscribeFunctions.push(unsubscribe);
    }

    // Return function to unsubscribe from all
    return () => {
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    };
  }

  /**
   * Unsubscribe from all subscriptions
   */
  static unsubscribeAll(): void {
    this.subscriptions.forEach(subscription => {
      subscription.unsubscribe();
    });
    this.subscriptions.clear();
  }

  /**
   * Get active subscription count
   */
  static getActiveSubscriptionCount(): number {
    return this.subscriptions.size;
  }

  /**
   * Check if realtime is available
   */
  static isRealtimeAvailable(): boolean {
    try {
      return !!client && typeof client.subscribe === 'function';
    } catch (error) {
      return false;
    }
  }

  /**
   * Map Appwrite event to action
   */
  private static mapEventToAction(event: string): 'created' | 'updated' | 'deleted' {
    if (event.includes('create')) return 'created';
    if (event.includes('update')) return 'updated';
    if (event.includes('delete')) return 'deleted';
    return 'updated'; // Default fallback
  }

  /**
   * Test realtime connection
   */
  static async testConnection(): Promise<boolean> {
    try {
      if (!this.isRealtimeAvailable()) {
        return false;
      }

      // Create a test subscription and immediately unsubscribe
      const unsubscribe = client.subscribe('account', () => {});
      unsubscribe();
      
      return true;
    } catch (error) {
      console.error('Realtime connection test failed:', error);
      return false;
    }
  }

  /**
   * Handle notification sound and visual indicators
   */
  private static async handleNotificationIndicators(notification: Notification): Promise<void> {
    try {
      // Play notification sound
      if (this.soundOptions.enabled) {
        await this.playNotificationSound(notification.type, notification.priority);
      }

      // Show browser notification
      if (this.visualOptions.showBrowserNotification) {
        await this.showBrowserNotification(notification);
      }

      // Flash page title
      if (this.visualOptions.flashTitle) {
        this.flashPageTitle(notification.title);
      }

      // Update badge count (handled by the component)
      if (this.visualOptions.showBadge) {
        this.updateNotificationBadge();
      }
    } catch (error) {
      console.error('Failed to handle notification indicators:', error);
    }
  }

  /**
   * Play notification sound
   */
  private static async playNotificationSound(
    notificationType: string, 
    priority: string
  ): Promise<void> {
    try {
      // Initialize audio context if needed
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      // Generate sound based on notification type and priority
      const frequency = this.getNotificationFrequency(notificationType, priority);
      const duration = priority === 'high' ? 800 : 400;

      // Create oscillator for notification sound
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(this.soundOptions.volume, this.audioContext.currentTime + 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration / 1000);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration / 1000);

    } catch (error) {
      console.error('Failed to play notification sound:', error);
    }
  }

  /**
   * Get notification frequency based on type and priority
   */
  private static getNotificationFrequency(type: string, priority: string): number {
    const baseFrequencies = {
      new_interest: 800,
      interest_accepted: 1000,
      interest_declined: 600,
      new_match: 1200,
      profile_view: 500,
      verification_update: 700,
      system_announcement: 400,
      default: 600
    };

    const priorityMultiplier = {
      high: 1.2,
      medium: 1.0,
      low: 0.8
    };

    const baseFreq = baseFrequencies[type as keyof typeof baseFrequencies] || baseFrequencies.default;
    const multiplier = priorityMultiplier[priority as keyof typeof priorityMultiplier] || 1.0;

    return baseFreq * multiplier;
  }

  /**
   * Show browser notification
   */
  private static async showBrowserNotification(notification: Notification): Promise<void> {
    try {
      // Request permission if not granted
      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }

      if (Notification.permission === 'granted') {
        const browserNotification = new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: notification.$id,
          requireInteraction: notification.priority === 'high',
          silent: false,
        });

        // Auto-close after 5 seconds for non-high priority notifications
        if (notification.priority !== 'high') {
          setTimeout(() => {
            browserNotification.close();
          }, 5000);
        }

        // Handle click to navigate to action URL
        browserNotification.onclick = () => {
          if (notification.actionUrl) {
            window.focus();
            window.location.href = notification.actionUrl;
          }
          browserNotification.close();
        };
      }
    } catch (error) {
      console.error('Failed to show browser notification:', error);
    }
  }

  /**
   * Flash page title
   */
  private static flashPageTitle(notificationTitle: string): void {
    try {
      // Clear existing flash interval
      if (this.titleFlashInterval) {
        clearInterval(this.titleFlashInterval);
      }

      let flashCount = 0;
      const maxFlashes = 6;
      const flashInterval = 1000;

      this.titleFlashInterval = setInterval(() => {
        if (flashCount >= maxFlashes) {
          document.title = this.originalTitle;
          clearInterval(this.titleFlashInterval!);
          this.titleFlashInterval = null;
          return;
        }

        document.title = flashCount % 2 === 0 
          ? `🔔 ${notificationTitle}` 
          : this.originalTitle;
        
        flashCount++;
      }, flashInterval);

      // Stop flashing when user focuses the window
      const handleFocus = () => {
        if (this.titleFlashInterval) {
          clearInterval(this.titleFlashInterval);
          this.titleFlashInterval = null;
          document.title = this.originalTitle;
          window.removeEventListener('focus', handleFocus);
        }
      };

      window.addEventListener('focus', handleFocus);
    } catch (error) {
      console.error('Failed to flash page title:', error);
    }
  }

  /**
   * Update notification badge (to be handled by components)
   */
  private static updateNotificationBadge(): void {
    // Dispatch custom event for components to listen to
    window.dispatchEvent(new CustomEvent('notification-badge-update'));
  }

  /**
   * Configure notification sound options
   */
  static configureSoundOptions(options: Partial<NotificationSoundOptions>): void {
    this.soundOptions = { ...this.soundOptions, ...options };
  }

  /**
   * Configure notification visual options
   */
  static configureVisualOptions(options: Partial<NotificationVisualOptions>): void {
    this.visualOptions = { ...this.visualOptions, ...options };
  }

  /**
   * Get current sound options
   */
  static getSoundOptions(): NotificationSoundOptions {
    return { ...this.soundOptions };
  }

  /**
   * Get current visual options
   */
  static getVisualOptions(): NotificationVisualOptions {
    return { ...this.visualOptions };
  }

  /**
   * Request notification permission
   */
  static async requestNotificationPermission(): Promise<NotificationPermission> {
    try {
      if ('Notification' in window) {
        return await Notification.requestPermission();
      }
      return 'denied';
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return 'denied';
    }
  }

  /**
   * Check if notifications are supported
   */
  static isNotificationSupported(): boolean {
    return 'Notification' in window;
  }

  /**
   * Check if audio is supported
   */
  static isAudioSupported(): boolean {
    return !!(window.AudioContext || (window as any).webkitAudioContext);
  }
}

// Export types (already exported above, no need to re-export)