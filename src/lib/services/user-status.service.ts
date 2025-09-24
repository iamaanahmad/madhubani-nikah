import { databases, AppwriteService } from '../appwrite';
import { DATABASE_ID, COLLECTION_IDS, QUERY_LIMITS } from '../appwrite-config';
import { Query, ID, Permission, Role } from 'appwrite';

export interface UserStatus {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  userId: string;
  isOnline: boolean;
  lastSeenAt: string;
  currentActivity?: string;
  deviceInfo?: {
    type: 'desktop' | 'mobile' | 'tablet';
    browser?: string;
    os?: string;
  };
  sessionId?: string;
  location?: {
    country?: string;
    city?: string;
    timezone?: string;
  };
}

export interface UserActivity {
  $id: string;
  $createdAt: string;
  userId: string;
  activityType: 'login' | 'logout' | 'profile_view' | 'search' | 'interest_sent' | 'message_sent' | 'page_visit';
  activityData?: Record<string, any>;
  timestamp: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface OnlineUser {
  userId: string;
  name: string;
  profilePictureId?: string;
  lastSeenAt: string;
  isOnline: boolean;
  currentActivity?: string;
}

export interface ActivityStats {
  totalSessions: number;
  averageSessionDuration: number;
  lastLoginAt: string;
  mostActiveHour: number;
  totalActivities: number;
  activitiesByType: Record<string, number>;
}

export class UserStatusService {
  /**
   * Update user online status
   */
  static async updateOnlineStatus(
    userId: string, 
    isOnline: boolean, 
    activity?: string
  ): Promise<UserStatus> {
    return AppwriteService.executeWithErrorHandling(async () => {
      const now = new Date().toISOString();
      const deviceInfo = this.getDeviceInfo();
      const sessionId = this.getSessionId();

      // Try to get existing status
      let existingStatus: UserStatus | null = null;
      try {
        const result = await databases.listDocuments(
          DATABASE_ID,
          COLLECTION_IDS.USER_STATUS || 'user_status',
          [Query.equal('userId', userId), Query.limit(1)]
        );
        existingStatus = result.documents[0] as unknown as UserStatus;
      } catch (error) {
        // Status doesn't exist, will create new one
      }

      const statusData = {
        userId,
        isOnline,
        lastSeenAt: now,
        currentActivity: activity,
        deviceInfo,
        sessionId,
        location: await this.getLocationInfo(),
      };

      if (existingStatus) {
        // Update existing status
        const result = await databases.updateDocument(
          DATABASE_ID,
          COLLECTION_IDS.USER_STATUS || 'user_status',
          existingStatus.$id,
          statusData
        );
        return result as unknown as UserStatus;
      } else {
        // Create new status
        const result = await databases.createDocument(
          DATABASE_ID,
          COLLECTION_IDS.USER_STATUS || 'user_status',
          ID.unique(),
          statusData,
          [
            Permission.read(Role.any()),
            Permission.update(Role.user(userId)),
            Permission.delete(Role.user(userId)),
          ]
        );
        return result as unknown as UserStatus;
      }
    }, 'updateOnlineStatus');
  }

  /**
   * Get user status
   */
  static async getUserStatus(userId: string): Promise<UserStatus | null> {
    return AppwriteService.executeWithErrorHandling(async () => {
      const result = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_IDS.USER_STATUS || 'user_status',
        [Query.equal('userId', userId), Query.limit(1)]
      );

      return result.documents[0] as unknown as UserStatus || null;
    }, 'getUserStatus');
  }

  /**
   * Get multiple user statuses
   */
  static async getMultipleUserStatuses(userIds: string[]): Promise<UserStatus[]> {
    return AppwriteService.executeWithErrorHandling(async () => {
      if (userIds.length === 0) return [];

      const result = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_IDS.USER_STATUS || 'user_status',
        [
          Query.equal('userId', userIds),
          Query.limit(Math.min(userIds.length, QUERY_LIMITS.MAX_PAGE_SIZE)),
        ]
      );

      return result.documents as unknown as UserStatus[];
    }, 'getMultipleUserStatuses');
  }

  /**
   * Get online users
   */
  static async getOnlineUsers(limit: number = 50): Promise<OnlineUser[]> {
    return AppwriteService.executeWithErrorHandling(async () => {
      const result = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_IDS.USER_STATUS || 'user_status',
        [
          Query.equal('isOnline', true),
          Query.orderDesc('lastSeenAt'),
          Query.limit(limit),
        ]
      );

      // Get profile information for online users
      const userStatuses = result.documents as unknown as UserStatus[];
      const onlineUsers: OnlineUser[] = [];

      for (const status of userStatuses) {
        try {
          // Get basic profile info
          const profile = await databases.getDocument(
            DATABASE_ID,
            COLLECTION_IDS.PROFILES,
            status.userId
          );

          onlineUsers.push({
            userId: status.userId,
            name: profile.name,
            profilePictureId: profile.profilePictureId,
            lastSeenAt: status.lastSeenAt,
            isOnline: status.isOnline,
            currentActivity: status.currentActivity,
          });
        } catch (error) {
          // Skip if profile not found
          console.warn(`Profile not found for user ${status.userId}`);
        }
      }

      return onlineUsers;
    }, 'getOnlineUsers');
  }

  /**
   * Track user activity
   */
  static async trackActivity(
    userId: string,
    activityType: UserActivity['activityType'],
    activityData?: Record<string, any>
  ): Promise<UserActivity> {
    return AppwriteService.executeWithErrorHandling(async () => {
      const now = new Date().toISOString();
      const sessionId = this.getSessionId();

      const activity = {
        userId,
        activityType,
        activityData: activityData || {},
        timestamp: now,
        sessionId,
        ipAddress: await this.getClientIP(),
        userAgent: navigator.userAgent,
      };

      const result = await databases.createDocument(
        DATABASE_ID,
        COLLECTION_IDS.USER_ACTIVITIES || 'user_activities',
        ID.unique(),
        activity,
        [
          Permission.read(Role.user(userId)),
          Permission.update(Role.user(userId)),
          Permission.delete(Role.user(userId)),
        ]
      );

      // Update user status with current activity
      await this.updateOnlineStatus(userId, true, activityType);

      return result as unknown as UserActivity;
    }, 'trackActivity');
  }

  /**
   * Get user activity history
   */
  static async getUserActivityHistory(
    userId: string,
    limit: number = 50,
    activityType?: UserActivity['activityType']
  ): Promise<UserActivity[]> {
    return AppwriteService.executeWithErrorHandling(async () => {
      const queries = [
        Query.equal('userId', userId),
        Query.orderDesc('timestamp'),
        Query.limit(limit),
      ];

      if (activityType) {
        queries.push(Query.equal('activityType', activityType));
      }

      const result = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_IDS.USER_ACTIVITIES || 'user_activities',
        queries
      );

      return result.documents as unknown as UserActivity[];
    }, 'getUserActivityHistory');
  }

  /**
   * Get user activity statistics
   */
  static async getUserActivityStats(userId: string): Promise<ActivityStats> {
    return AppwriteService.executeWithErrorHandling(async () => {
      // Get all activities for the user
      const activities = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_IDS.USER_ACTIVITIES || 'user_activities',
        [
          Query.equal('userId', userId),
          Query.limit(1000), // Get more for accurate stats
        ]
      );

      const userActivities = activities.documents as unknown as UserActivity[];

      // Calculate statistics
      const stats: ActivityStats = {
        totalSessions: 0,
        averageSessionDuration: 0,
        lastLoginAt: '',
        mostActiveHour: 0,
        totalActivities: userActivities.length,
        activitiesByType: {},
      };

      // Group activities by type
      const hourCounts: Record<number, number> = {};
      let lastLogin: UserActivity | null = null;

      userActivities.forEach(activity => {
        // Count by type
        stats.activitiesByType[activity.activityType] = 
          (stats.activitiesByType[activity.activityType] || 0) + 1;

        // Track login activities
        if (activity.activityType === 'login') {
          if (!lastLogin || activity.timestamp > lastLogin.timestamp) {
            lastLogin = activity;
          }
          stats.totalSessions++;
        }

        // Count activities by hour
        const hour = new Date(activity.timestamp).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      });

      // Find most active hour
      let maxCount = 0;
      Object.entries(hourCounts).forEach(([hour, count]) => {
        if (count > maxCount) {
          maxCount = count;
          stats.mostActiveHour = parseInt(hour);
        }
      });

      // Set last login
      if (lastLogin) {
        stats.lastLoginAt = lastLogin.timestamp;
      }

      // Calculate average session duration (simplified)
      if (stats.totalSessions > 0) {
        stats.averageSessionDuration = Math.floor(
          userActivities.length / stats.totalSessions * 30 // Rough estimate
        );
      }

      return stats;
    }, 'getUserActivityStats');
  }

  /**
   * Set user offline
   */
  static async setUserOffline(userId: string): Promise<void> {
    return AppwriteService.executeWithErrorHandling(async () => {
      await this.updateOnlineStatus(userId, false);
      await this.trackActivity(userId, 'logout');
    }, 'setUserOffline');
  }

  /**
   * Set user online
   */
  static async setUserOnline(userId: string): Promise<void> {
    return AppwriteService.executeWithErrorHandling(async () => {
      await this.updateOnlineStatus(userId, true);
      await this.trackActivity(userId, 'login');
    }, 'setUserOnline');
  }

  /**
   * Clean up old activities
   */
  static async cleanupOldActivities(daysToKeep: number = 30): Promise<number> {
    return AppwriteService.executeWithErrorHandling(async () => {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      const cutoffISO = cutoffDate.toISOString();

      const oldActivities = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_IDS.USER_ACTIVITIES || 'user_activities',
        [
          Query.lessThan('timestamp', cutoffISO),
          Query.limit(100), // Process in batches
        ]
      );

      let deletedCount = 0;
      for (const activity of oldActivities.documents) {
        await databases.deleteDocument(
          DATABASE_ID,
          COLLECTION_IDS.USER_ACTIVITIES || 'user_activities',
          activity.$id
        );
        deletedCount++;
      }

      return deletedCount;
    }, 'cleanupOldActivities');
  }

  /**
   * Get device information
   */
  private static getDeviceInfo(): UserStatus['deviceInfo'] {
    const userAgent = navigator.userAgent;
    
    let deviceType: 'desktop' | 'mobile' | 'tablet' = 'desktop';
    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
      deviceType = /iPad/.test(userAgent) ? 'tablet' : 'mobile';
    }

    let browser = 'Unknown';
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';

    let os = 'Unknown';
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iOS')) os = 'iOS';

    return { type: deviceType, browser, os };
  }

  /**
   * Get session ID
   */
  private static getSessionId(): string {
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  }

  /**
   * Get location information (simplified)
   */
  private static async getLocationInfo(): Promise<UserStatus['location']> {
    try {
      // This would typically use a geolocation service
      // For now, return basic timezone info
      return {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
    } catch (error) {
      return {};
    }
  }

  /**
   * Get client IP (simplified)
   */
  private static async getClientIP(): Promise<string> {
    try {
      // In a production environment, this would use a service to get the client IP
      // For security and privacy reasons, we return 'unknown' in this implementation
      return 'unknown';
    } catch (error) {
      return 'unknown';
    }
  }
}

// Export types
export type {
  UserStatus,
  UserActivity,
  OnlineUser,
  ActivityStats,
};