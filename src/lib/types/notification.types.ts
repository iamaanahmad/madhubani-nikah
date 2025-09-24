// Notification-related types and interfaces

export interface Notification {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  priority: NotificationPriority;
  createdAt: string;
  readAt?: string;
  relatedUserId?: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
  expiresAt?: string;
}

export type NotificationType = 
  | 'new_interest' 
  | 'interest_accepted' 
  | 'interest_declined' 
  | 'new_match' 
  | 'profile_view' 
  | 'verification_update' 
  | 'system_announcement'
  | 'profile_incomplete'
  | 'subscription_expiry';

export type NotificationPriority = 'low' | 'medium' | 'high';

export interface CreateNotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  priority?: NotificationPriority;
  relatedUserId?: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
  expiresAt?: string;
}

export interface NotificationFilters {
  type?: NotificationType[];
  isRead?: boolean;
  priority?: NotificationPriority[];
  dateRange?: {
    from: string;
    to: string;
  };
  limit?: number;
  offset?: number;
}

export interface NotificationHistory {
  notifications: Notification[];
  totalCount: number;
  unreadCount: number;
  hasMore: boolean;
  lastCursor?: string;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  types: {
    [K in NotificationType]: boolean;
  };
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: {
    [K in NotificationType]: number;
  };
  byPriority: {
    [K in NotificationPriority]: number;
  };
}

// Real-time notification data for WebSocket/Realtime
export interface RealtimeNotificationData {
  notification: Notification;
  action: 'created' | 'updated' | 'deleted';
  timestamp: string;
}

// Notification template data
export interface NotificationTemplate {
  type: NotificationType;
  titleTemplate: string;
  messageTemplate: string;
  defaultPriority: NotificationPriority;
  variables: string[];
}

// Bulk notification data
export interface BulkNotificationData {
  userIds: string[];
  type: NotificationType;
  title: string;
  message: string;
  priority?: NotificationPriority;
  metadata?: Record<string, any>;
}

// Interest-specific notification data
export interface InterestNotificationData {
  interestId: string;
  senderId: string;
  receiverId: string;
  senderName: string;
  senderAge?: number;
  senderLocation?: string;
  interestType: 'proposal' | 'favorite' | 'contact_request';
  message?: string;
}

// Profile view notification data
export interface ProfileViewNotificationData {
  viewerId: string;
  viewerName: string;
  viewerAge?: number;
  viewerLocation?: string;
  viewedAt: string;
}

// Verification notification data
export interface VerificationNotificationData {
  verificationType: 'profile' | 'document' | 'phone' | 'email';
  status: 'approved' | 'rejected' | 'pending';
  reason?: string;
  adminMessage?: string;
}

// Notification sound and visual options
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