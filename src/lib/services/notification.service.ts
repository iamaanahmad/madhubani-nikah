import { databases, AppwriteService } from '../appwrite';
import { DATABASE_ID, COLLECTION_IDS, QUERY_LIMITS, NOTIFICATION_TYPES } from '../appwrite-config';
import { Query, ID, Permission, Role } from 'appwrite';
import type {
  Notification,
  CreateNotificationData,
  NotificationFilters,
  NotificationHistory,
  NotificationPreferences,
  NotificationStats,
  NotificationType,
  NotificationPriority,
  InterestNotificationData,
  ProfileViewNotificationData,
  VerificationNotificationData,
  BulkNotificationData
} from '../types/notification.types';

export class NotificationService {
  /**
   * Create a new notification
   */
  static async createNotification(data: CreateNotificationData): Promise<Notification> {
    return AppwriteService.executeWithErrorHandling(async () => {
      const notificationDoc = {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        isRead: false,
        priority: data.priority || 'medium',
        createdAt: new Date().toISOString(),
        relatedUserId: data.relatedUserId,
        actionUrl: data.actionUrl,
        metadata: data.metadata || {},
        expiresAt: data.expiresAt,
      };

      const result = await databases.createDocument(
        DATABASE_ID,
        COLLECTION_IDS.NOTIFICATIONS,
        ID.unique(),
        notificationDoc,
        [
          Permission.read(Role.user(data.userId)),
          Permission.update(Role.user(data.userId)),
          Permission.delete(Role.user(data.userId)),
        ]
      );

      return result as unknown as Notification;
    }, 'createNotification');
  }

  /**
   * Create interest-related notification
   */
  static async createInterestNotification(
    type: 'new_interest' | 'interest_accepted' | 'interest_declined',
    data: InterestNotificationData
  ): Promise<Notification> {
    return AppwriteService.executeWithErrorHandling(async () => {
      let title: string;
      let message: string;
      let receiverId: string;

      switch (type) {
        case 'new_interest':
          title = 'New Interest Received';
          message = `${data.senderName} has sent you an interest${data.message ? `: "${data.message}"` : ''}`;
          receiverId = data.receiverId;
          break;
        case 'interest_accepted':
          title = 'Interest Accepted';
          message = `${data.senderName} has accepted your interest. You can now connect!`;
          receiverId = data.senderId;
          break;
        case 'interest_declined':
          title = 'Interest Response';
          message = `${data.senderName} has responded to your interest.`;
          receiverId = data.senderId;
          break;
        default:
          throw new Error('Invalid interest notification type');
      }

      const notificationData: CreateNotificationData = {
        userId: receiverId,
        type,
        title,
        message,
        priority: type === 'new_interest' ? 'high' : 'medium',
        relatedUserId: type === 'new_interest' ? data.senderId : data.receiverId,
        actionUrl: `/interests`,
        metadata: {
          interestId: data.interestId,
          interestType: data.interestType,
          senderAge: data.senderAge,
          senderLocation: data.senderLocation,
        },
      };

      return await this.createNotification(notificationData);
    }, 'createInterestNotification');
  }

  /**
   * Create profile view notification
   */
  static async createProfileViewNotification(
    profileOwnerId: string,
    viewData: ProfileViewNotificationData
  ): Promise<Notification> {
    return AppwriteService.executeWithErrorHandling(async () => {
      const notificationData: CreateNotificationData = {
        userId: profileOwnerId,
        type: 'profile_view',
        title: 'Profile Viewed',
        message: `${viewData.viewerName} viewed your profile`,
        priority: 'low',
        relatedUserId: viewData.viewerId,
        actionUrl: `/profile/${viewData.viewerId}`,
        metadata: {
          viewerAge: viewData.viewerAge,
          viewerLocation: viewData.viewerLocation,
          viewedAt: viewData.viewedAt,
        },
      };

      return await this.createNotification(notificationData);
    }, 'createProfileViewNotification');
  }

  /**
   * Create verification notification
   */
  static async createVerificationNotification(
    userId: string,
    verificationData: VerificationNotificationData
  ): Promise<Notification> {
    return AppwriteService.executeWithErrorHandling(async () => {
      let title: string;
      let message: string;
      let priority: NotificationPriority = 'medium';

      switch (verificationData.status) {
        case 'approved':
          title = 'Verification Approved';
          message = `Your ${verificationData.verificationType} verification has been approved!`;
          priority = 'high';
          break;
        case 'rejected':
          title = 'Verification Rejected';
          message = `Your ${verificationData.verificationType} verification was rejected${verificationData.reason ? `: ${verificationData.reason}` : ''}`;
          priority = 'high';
          break;
        case 'pending':
          title = 'Verification Pending';
          message = `Your ${verificationData.verificationType} verification is under review`;
          priority = 'medium';
          break;
        default:
          throw new Error('Invalid verification status');
      }

      const notificationData: CreateNotificationData = {
        userId,
        type: 'verification_update',
        title,
        message,
        priority,
        actionUrl: '/settings/verification',
        metadata: {
          verificationType: verificationData.verificationType,
          status: verificationData.status,
          reason: verificationData.reason,
          adminMessage: verificationData.adminMessage,
        },
      };

      return await this.createNotification(notificationData);
    }, 'createVerificationNotification');
  }

  /**
   * Get notifications for a user
   */
  static async getUserNotifications(
    userId: string,
    filters?: NotificationFilters
  ): Promise<NotificationHistory> {
    return AppwriteService.executeWithErrorHandling(async () => {
      const queries = [
        Query.equal('userId', userId),
        Query.orderDesc('$createdAt'),
        Query.limit(filters?.limit || QUERY_LIMITS.NOTIFICATION_LIMIT),
      ];

      // Add type filter if provided
      if (filters?.type && filters.type.length > 0) {
        queries.push(Query.equal('type', filters.type));
      }

      // Add read status filter if provided
      if (filters?.isRead !== undefined) {
        queries.push(Query.equal('isRead', filters.isRead));
      }

      // Add priority filter if provided
      if (filters?.priority && filters.priority.length > 0) {
        queries.push(Query.equal('priority', filters.priority));
      }

      // Add date range filter if provided
      if (filters?.dateRange) {
        queries.push(Query.greaterThanEqual('createdAt', filters.dateRange.from));
        queries.push(Query.lessThanEqual('createdAt', filters.dateRange.to));
      }

      // Add offset if provided
      if (filters?.offset) {
        queries.push(Query.offset(filters.offset));
      }

      const result = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_IDS.NOTIFICATIONS,
        queries
      );

      // Get unread count
      const unreadResult = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_IDS.NOTIFICATIONS,
        [
          Query.equal('userId', userId),
          Query.equal('isRead', false),
          Query.limit(1), // We only need the count
        ]
      );

      return {
        notifications: result.documents as unknown as Notification[],
        totalCount: result.total,
        unreadCount: unreadResult.total,
        hasMore: result.documents.length === (filters?.limit || QUERY_LIMITS.NOTIFICATION_LIMIT),
      };
    }, 'getUserNotifications');
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(userId: string, notificationId: string): Promise<Notification> {
    return AppwriteService.executeWithErrorHandling(async () => {
      // Get the notification first to verify ownership
      const notification = await databases.getDocument(
        DATABASE_ID,
        COLLECTION_IDS.NOTIFICATIONS,
        notificationId
      ) as unknown as Notification;

      // Validate that the user owns this notification
      if (notification.userId !== userId) {
        throw new Error('You can only mark your own notifications as read');
      }

      // Update the notification
      const result = await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_IDS.NOTIFICATIONS,
        notificationId,
        {
          isRead: true,
          readAt: new Date().toISOString(),
        }
      );

      return result as unknown as Notification;
    }, 'markAsRead');
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: string): Promise<number> {
    return AppwriteService.executeWithErrorHandling(async () => {
      // Get all unread notifications
      const unreadNotifications = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_IDS.NOTIFICATIONS,
        [
          Query.equal('userId', userId),
          Query.equal('isRead', false),
          Query.limit(100), // Process in batches
        ]
      );

      let markedCount = 0;
      const readAt = new Date().toISOString();

      // Update each notification
      for (const notification of unreadNotifications.documents) {
        await databases.updateDocument(
          DATABASE_ID,
          COLLECTION_IDS.NOTIFICATIONS,
          notification.$id,
          {
            isRead: true,
            readAt,
          }
        );
        markedCount++;
      }

      return markedCount;
    }, 'markAllAsRead');
  }

  /**
   * Delete notification
   */
  static async deleteNotification(userId: string, notificationId: string): Promise<void> {
    return AppwriteService.executeWithErrorHandling(async () => {
      // Get the notification first to verify ownership
      const notification = await databases.getDocument(
        DATABASE_ID,
        COLLECTION_IDS.NOTIFICATIONS,
        notificationId
      ) as unknown as Notification;

      // Validate that the user owns this notification
      if (notification.userId !== userId) {
        throw new Error('You can only delete your own notifications');
      }

      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTION_IDS.NOTIFICATIONS,
        notificationId
      );
    }, 'deleteNotification');
  }

  /**
   * Get notification statistics for a user
   */
  static async getNotificationStats(userId: string): Promise<NotificationStats> {
    return AppwriteService.executeWithErrorHandling(async () => {
      // Get all notifications for the user
      const allNotifications = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_IDS.NOTIFICATIONS,
        [
          Query.equal('userId', userId),
          Query.limit(1000), // Get all for accurate stats
        ]
      );

      const notifications = allNotifications.documents as unknown as Notification[];

      // Initialize stats
      const stats: NotificationStats = {
        total: notifications.length,
        unread: 0,
        byType: {
          new_interest: 0,
          interest_accepted: 0,
          interest_declined: 0,
          new_match: 0,
          profile_view: 0,
          verification_update: 0,
          system_announcement: 0,
          profile_incomplete: 0,
          subscription_expiry: 0,
        },
        byPriority: {
          low: 0,
          medium: 0,
          high: 0,
        },
      };

      // Calculate stats
      notifications.forEach(notification => {
        if (!notification.isRead) {
          stats.unread++;
        }
        stats.byType[notification.type]++;
        stats.byPriority[notification.priority]++;
      });

      return stats;
    }, 'getNotificationStats');
  }

  /**
   * Get unread notifications count
   */
  static async getUnreadCount(userId: string): Promise<number> {
    return AppwriteService.executeWithErrorHandling(async () => {
      const result = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_IDS.NOTIFICATIONS,
        [
          Query.equal('userId', userId),
          Query.equal('isRead', false),
          Query.limit(1), // We only need the count
        ]
      );

      return result.total;
    }, 'getUnreadCount');
  }

  /**
   * Create bulk notifications (for admin use)
   */
  static async createBulkNotifications(data: BulkNotificationData): Promise<number> {
    return AppwriteService.executeWithErrorHandling(async () => {
      let createdCount = 0;

      for (const userId of data.userIds) {
        try {
          await this.createNotification({
            userId,
            type: data.type,
            title: data.title,
            message: data.message,
            priority: data.priority || 'medium',
            metadata: data.metadata,
          });
          createdCount++;
        } catch (error) {
          console.error(`Failed to create notification for user ${userId}:`, error);
        }
      }

      return createdCount;
    }, 'createBulkNotifications');
  }

  /**
   * Clean up expired notifications
   */
  static async cleanupExpiredNotifications(): Promise<number> {
    return AppwriteService.executeWithErrorHandling(async () => {
      const now = new Date().toISOString();
      const expiredNotifications = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_IDS.NOTIFICATIONS,
        [
          Query.lessThan('expiresAt', now),
          Query.limit(100), // Process in batches
        ]
      );

      let cleanedCount = 0;
      for (const notification of expiredNotifications.documents) {
        await databases.deleteDocument(
          DATABASE_ID,
          COLLECTION_IDS.NOTIFICATIONS,
          notification.$id
        );
        cleanedCount++;
      }

      return cleanedCount;
    }, 'cleanupExpiredNotifications');
  }

  /**
   * Get notification preferences for a user
   */
  static async getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    return AppwriteService.executeWithErrorHandling(async () => {
      // This would typically be stored in a separate collection or user profile
      // For now, return default preferences
      return {
        email: true,
        push: true,
        sms: false,
        types: {
          new_interest: true,
          interest_accepted: true,
          interest_declined: true,
          new_match: true,
          profile_view: true,
          verification_update: true,
          system_announcement: true,
          profile_incomplete: true,
          subscription_expiry: true,
        },
      };
    }, 'getNotificationPreferences');
  }

  /**
   * Update notification preferences for a user
   */
  static async updateNotificationPreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    return AppwriteService.executeWithErrorHandling(async () => {
      // This would typically update a user preferences document
      // For now, return the updated preferences
      const currentPreferences = await this.getNotificationPreferences(userId);
      
      return {
        ...currentPreferences,
        ...preferences,
        types: {
          ...currentPreferences.types,
          ...preferences.types,
        },
      };
    }, 'updateNotificationPreferences');
  }
}

// Export types for use in other modules
export type {
  Notification,
  CreateNotificationData,
  NotificationFilters,
  NotificationHistory,
  NotificationPreferences,
  NotificationStats,
  NotificationType,
  NotificationPriority,
  InterestNotificationData,
  ProfileViewNotificationData,
  VerificationNotificationData,
  BulkNotificationData
};