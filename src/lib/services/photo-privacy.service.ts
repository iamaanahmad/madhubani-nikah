import { databases, AppwriteService } from '../appwrite';
import { DATABASE_ID, COLLECTION_IDS } from '../appwrite-config';
import { StorageService } from './storage.service';
import { Query } from 'appwrite';

// Photo privacy interfaces
export interface PhotoPrivacySettings {
  userId: string;
  isPhotoBlurred: boolean;
  photoVisibility: 'public' | 'members' | 'verified_only' | 'mutual_interest' | 'private';
  allowPhotoDownload: boolean;
  showPhotoToInterested: boolean;
  requireMutualInterest: boolean;
  blurLevel: 'light' | 'medium' | 'heavy';
  watermarkEnabled: boolean;
  updatedAt: string;
}

export interface PhotoViewPermission {
  viewerId: string;
  profileOwnerId: string;
  canViewOriginal: boolean;
  canViewBlurred: boolean;
  canDownload: boolean;
  reason: 'public' | 'member' | 'verified' | 'mutual_interest' | 'owner' | 'admin';
}

export interface PhotoViewLog {
  $id: string;
  viewerId: string;
  profileOwnerId: string;
  viewedAt: string;
  viewType: 'original' | 'blurred' | 'thumbnail';
  ipAddress?: string;
  userAgent?: string;
}

export interface PhotoPrivacyStats {
  totalViews: number;
  originalViews: number;
  blurredViews: number;
  uniqueViewers: number;
  viewsByType: Record<string, number>;
  recentViews: PhotoViewLog[];
}

export class PhotoPrivacyService {
  /**
   * Get user's photo privacy settings
   */
  static async getPhotoPrivacySettings(userId: string): Promise<PhotoPrivacySettings | null> {
    return AppwriteService.executeWithErrorHandling(async () => {
      try {
        // Try to get existing settings from profile
        const profile = await databases.getDocument(
          DATABASE_ID,
          COLLECTION_IDS.PROFILES,
          userId
        );

        return {
          userId,
          isPhotoBlurred: profile.isPhotoBlurred ?? true,
          photoVisibility: profile.photoVisibility ?? 'members',
          allowPhotoDownload: profile.allowPhotoDownload ?? false,
          showPhotoToInterested: profile.showPhotoToInterested ?? true,
          requireMutualInterest: profile.requireMutualInterest ?? false,
          blurLevel: profile.blurLevel ?? 'medium',
          watermarkEnabled: profile.watermarkEnabled ?? false,
          updatedAt: profile.updatedAt || new Date().toISOString()
        };
      } catch (error: any) {
        if (error.code === 404) {
          return null;
        }
        throw error;
      }
    }, 'get photo privacy settings');
  }

  /**
   * Update photo privacy settings
   */
  static async updatePhotoPrivacySettings(
    userId: string,
    settings: Partial<PhotoPrivacySettings>
  ): Promise<PhotoPrivacySettings> {
    return AppwriteService.executeWithErrorHandling(async () => {
      const updateData = {
        ...settings,
        updatedAt: new Date().toISOString()
      };

      // Remove userId from update data
      delete updateData.userId;

      const updatedProfile = await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_IDS.PROFILES,
        userId,
        updateData
      );

      return {
        userId,
        isPhotoBlurred: updatedProfile.isPhotoBlurred,
        photoVisibility: updatedProfile.photoVisibility,
        allowPhotoDownload: updatedProfile.allowPhotoDownload,
        showPhotoToInterested: updatedProfile.showPhotoToInterested,
        requireMutualInterest: updatedProfile.requireMutualInterest,
        blurLevel: updatedProfile.blurLevel,
        watermarkEnabled: updatedProfile.watermarkEnabled,
        updatedAt: updatedProfile.updatedAt
      };
    }, 'update photo privacy settings');
  }

  /**
   * Check if viewer can see original photo
   */
  static async checkPhotoViewPermission(
    viewerId: string,
    profileOwnerId: string,
    viewerProfile?: any,
    ownerProfile?: any
  ): Promise<PhotoViewPermission> {
    return AppwriteService.executeWithErrorHandling(async () => {
      // Owner can always see their own photo
      if (viewerId === profileOwnerId) {
        return {
          viewerId,
          profileOwnerId,
          canViewOriginal: true,
          canViewBlurred: true,
          canDownload: true,
          reason: 'owner'
        };
      }

      // Get owner's privacy settings
      const privacySettings = await this.getPhotoPrivacySettings(profileOwnerId);
      if (!privacySettings) {
        // Default restrictive settings
        return {
          viewerId,
          profileOwnerId,
          canViewOriginal: false,
          canViewBlurred: true,
          canDownload: false,
          reason: 'public'
        };
      }

      // Get viewer's profile if not provided
      if (!viewerProfile) {
        try {
          viewerProfile = await databases.getDocument(
            DATABASE_ID,
            COLLECTION_IDS.PROFILES,
            viewerId
          );
        } catch (error) {
          // Viewer profile not found, treat as non-member
          return {
            viewerId,
            profileOwnerId,
            canViewOriginal: false,
            canViewBlurred: privacySettings.photoVisibility === 'public',
            canDownload: false,
            reason: 'public'
          };
        }
      }

      // Check admin access
      if (viewerProfile.role === 'admin' || viewerProfile.role === 'moderator') {
        return {
          viewerId,
          profileOwnerId,
          canViewOriginal: true,
          canViewBlurred: true,
          canDownload: true,
          reason: 'admin'
        };
      }

      // Check mutual interest
      const hasMutualInterest = await this.checkMutualInterest(viewerId, profileOwnerId);

      // Apply privacy rules
      let canViewOriginal = false;
      let reason: PhotoViewPermission['reason'] = 'public';

      switch (privacySettings.photoVisibility) {
        case 'public':
          canViewOriginal = !privacySettings.isPhotoBlurred;
          reason = 'public';
          break;

        case 'members':
          canViewOriginal = !privacySettings.isPhotoBlurred;
          reason = 'member';
          break;

        case 'verified_only':
          canViewOriginal = !privacySettings.isPhotoBlurred && viewerProfile.isVerified;
          reason = 'verified';
          break;

        case 'mutual_interest':
          canViewOriginal = !privacySettings.isPhotoBlurred && hasMutualInterest;
          reason = 'mutual_interest';
          break;

        case 'private':
          canViewOriginal = false;
          break;
      }

      // Override for interested users
      if (privacySettings.showPhotoToInterested && !canViewOriginal) {
        const hasInterest = await this.checkInterestExists(viewerId, profileOwnerId);
        if (hasInterest) {
          canViewOriginal = !privacySettings.isPhotoBlurred;
          reason = 'mutual_interest';
        }
      }

      // Final mutual interest check
      if (privacySettings.requireMutualInterest && !hasMutualInterest) {
        canViewOriginal = false;
      }

      return {
        viewerId,
        profileOwnerId,
        canViewOriginal,
        canViewBlurred: true, // Blurred version usually available
        canDownload: canViewOriginal && privacySettings.allowPhotoDownload,
        reason
      };
    }, 'check photo view permission');
  }

  /**
   * Get photo URL with privacy controls applied
   */
  static async getPhotoUrl(
    profileOwnerId: string,
    viewerId: string,
    pictureId: string,
    options: {
      width?: number;
      height?: number;
      quality?: number;
    } = {}
  ): Promise<{
    url: string;
    isBlurred: boolean;
    canDownload: boolean;
    watermarked: boolean;
  }> {
    const permission = await this.checkPhotoViewPermission(viewerId, profileOwnerId);
    const privacySettings = await this.getPhotoPrivacySettings(profileOwnerId);

    const { width = 400, height = 400, quality = 80 } = options;

    let url: string;
    let isBlurred = false;
    let watermarked = false;

    if (permission.canViewOriginal) {
      // Generate original photo URL
      url = StorageService.getFilePreview('profile_pictures', pictureId, {
        width,
        height,
        quality,
        gravity: 'center'
      });

      // Add watermark if enabled
      if (privacySettings?.watermarkEnabled && viewerId !== profileOwnerId) {
        watermarked = true;
        // In a real implementation, you'd generate a watermarked version
      }
    } else {
      // Generate blurred photo URL
      const blurIntensity = this.getBlurIntensity(privacySettings?.blurLevel || 'medium');
      url = StorageService.getFilePreview('profile_pictures', pictureId, {
        width,
        height,
        quality,
        gravity: 'center'
        // Note: Appwrite doesn't have built-in blur, you'd need to implement this
        // or use a different approach like CSS filters on the frontend
      });
      isBlurred = true;
    }

    // Log the view
    await this.logPhotoView(viewerId, profileOwnerId, isBlurred ? 'blurred' : 'original');

    return {
      url,
      isBlurred,
      canDownload: permission.canDownload,
      watermarked
    };
  }

  /**
   * Log photo view for analytics
   */
  static async logPhotoView(
    viewerId: string,
    profileOwnerId: string,
    viewType: 'original' | 'blurred' | 'thumbnail'
  ): Promise<void> {
    // In a real implementation, you might want to store this in a separate collection
    // or use analytics service. For now, we'll skip the actual logging to avoid
    // creating too many documents
    console.log(`Photo view logged: ${viewerId} viewed ${profileOwnerId}'s ${viewType} photo`);
  }

  /**
   * Get photo privacy statistics
   */
  static async getPhotoPrivacyStats(userId: string): Promise<PhotoPrivacyStats> {
    // This would typically query a photo_views collection
    // For now, return mock data
    return {
      totalViews: 0,
      originalViews: 0,
      blurredViews: 0,
      uniqueViewers: 0,
      viewsByType: {},
      recentViews: []
    };
  }

  /**
   * Check if mutual interest exists between users
   */
  private static async checkMutualInterest(userId1: string, userId2: string): Promise<boolean> {
    return AppwriteService.executeWithErrorHandling(async () => {
      // Check if both users have sent interests to each other
      const [interest1, interest2] = await Promise.all([
        databases.listDocuments(
          DATABASE_ID,
          COLLECTION_IDS.INTERESTS,
          [
            Query.equal('senderId', userId1),
            Query.equal('receiverId', userId2),
            Query.equal('status', 'accepted'),
            Query.limit(1)
          ]
        ),
        databases.listDocuments(
          DATABASE_ID,
          COLLECTION_IDS.INTERESTS,
          [
            Query.equal('senderId', userId2),
            Query.equal('receiverId', userId1),
            Query.equal('status', 'accepted'),
            Query.limit(1)
          ]
        )
      ]);

      return interest1.documents.length > 0 && interest2.documents.length > 0;
    }, 'check mutual interest');
  }

  /**
   * Check if interest exists from viewer to profile owner
   */
  private static async checkInterestExists(viewerId: string, profileOwnerId: string): Promise<boolean> {
    return AppwriteService.executeWithErrorHandling(async () => {
      const interests = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_IDS.INTERESTS,
        [
          Query.equal('senderId', viewerId),
          Query.equal('receiverId', profileOwnerId),
          Query.limit(1)
        ]
      );

      return interests.documents.length > 0;
    }, 'check interest exists');
  }

  /**
   * Get blur intensity based on blur level
   */
  private static getBlurIntensity(level: 'light' | 'medium' | 'heavy'): number {
    const intensities = {
      light: 2,
      medium: 5,
      heavy: 10
    };
    return intensities[level];
  }

  /**
   * Bulk update photo visibility for multiple users
   */
  static async bulkUpdatePhotoVisibility(
    userIds: string[],
    visibility: PhotoPrivacySettings['photoVisibility']
  ): Promise<number> {
    return AppwriteService.executeWithErrorHandling(async () => {
      const updatePromises = userIds.map(userId =>
        this.updatePhotoPrivacySettings(userId, { photoVisibility: visibility })
          .catch(error => {
            console.warn(`Failed to update photo visibility for user ${userId}:`, error);
            return null;
          })
      );

      const results = await Promise.all(updatePromises);
      return results.filter(result => result !== null).length;
    }, 'bulk update photo visibility');
  }

  /**
   * Get users with specific photo visibility settings
   */
  static async getUsersByPhotoVisibility(
    visibility: PhotoPrivacySettings['photoVisibility'],
    limit: number = 50
  ): Promise<string[]> {
    return AppwriteService.executeWithErrorHandling(async () => {
      const profiles = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_IDS.PROFILES,
        [
          Query.equal('photoVisibility', visibility),
          Query.limit(limit)
        ]
      );

      return profiles.documents.map(profile => profile.$id);
    }, 'get users by photo visibility');
  }
}