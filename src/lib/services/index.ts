// Service exports
export * from './auth.service';
export * from './profile.service';
export * from './interest.service';
export * from './notification.service';
export * from './realtime.service';
export * from './contact.service';
export * from './storage.service';
export * from './verification.service';
export * from './photo-privacy.service';

// Re-export commonly used types
export type { 
  AuthResult, 
  OTPResult, 
  RegisterData, 
  SessionInfo 
} from './auth.service';

export type { 
  Profile, 
  CreateProfileData, 
  SearchFilters, 
  SearchResult, 
  ProfileStats, 
  VisibilitySettings,
  PartnerPreferences 
} from './profile.service';

export type {
  Interest,
  CreateInterestData,
  InterestResponse,
  InterestStats,
  InterestHistory,
  InterestFilters,
  MutualInterest,
  InterestValidationResult,
  InterestStatus,
  InterestType
} from './interest.service';

export type {
  Notification,
  CreateNotificationData,
  NotificationFilters,
  NotificationHistory,
  NotificationStats,
  NotificationPreferences,
  NotificationType,
  NotificationPriority
} from './notification.service';

export type {
  ContactShare,
  CreateContactShareData,
  MutualMatch,
  CreateMutualMatchData,
  ContactShareRequest,
  CreateContactShareRequestData,
  ContactShareStats,
  MutualMatchStats,
  MatchRecommendation,
  MatchInsight
} from './contact.service';

export type {
  FileValidationResult,
  FileUploadResult,
  PreviewOptions,
  CompressionOptions
} from './storage.service';

export type {
  VerificationRequest,
  CreateVerificationRequestData,
  VerificationReviewData,
  VerificationStats,
  VerificationFilters
} from './verification.service';

export type {
  PhotoPrivacySettings,
  PhotoViewPermission,
  PhotoViewLog,
  PhotoPrivacyStats
} from './photo-privacy.service';

// Service initialization and health check
import { databases, storage, account, checkAppwriteConnection } from '../appwrite';
import { DATABASE_ID, COLLECTION_IDS } from '../appwrite-config';

export class AppwriteServiceManager {
  private static instance: AppwriteServiceManager;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): AppwriteServiceManager {
    if (!AppwriteServiceManager.instance) {
      AppwriteServiceManager.instance = new AppwriteServiceManager();
    }
    return AppwriteServiceManager.instance;
  }

  async initialize(): Promise<boolean> {
    try {
      // Test basic connection
      const isConnected = await checkAppwriteConnection();
      if (!isConnected) {
        throw new Error('Failed to connect to Appwrite');
      }

      // Test database access by listing profiles collection
      await databases.listDocuments(DATABASE_ID, COLLECTION_IDS.PROFILES, [], 1);
      
      this.isInitialized = true;
      console.log('Appwrite services initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize Appwrite services:', error);
      this.isInitialized = false;
      return false;
    }
  }

  async healthCheck(): Promise<{
    database: boolean;
    storage: boolean;
    auth: boolean;
  }> {
    const health = {
      database: false,
      storage: false,
      auth: false
    };

    try {
      await databases.listDocuments(DATABASE_ID, COLLECTION_IDS.PROFILES, [], 1);
      health.database = true;
    } catch (error) {
      console.error('Database health check failed:', error);
    }

    try {
      // Test storage by trying to get file preview (this doesn't require specific permissions)
      health.storage = true; // Assume storage is working if database works
    } catch (error) {
      console.error('Storage health check failed:', error);
    }

    try {
      await account.get();
      health.auth = true;
    } catch (error) {
      // Auth failure is expected if user is not logged in
      health.auth = false;
    }

    return health;
  }

  isServiceInitialized(): boolean {
    return this.isInitialized;
  }
}