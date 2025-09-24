import { ID, Models, Query } from 'appwrite';
import { databases, storage, AppwriteService } from '../appwrite';
import { AppwriteUtils } from '../appwrite-utils';
import { 
  DATABASE_ID, 
  COLLECTION_IDS, 
  BUCKET_IDS,
  PERMISSIONS,
  PROFILE_VISIBILITY,
  MADHUBANI_CONFIG,
  DEFAULTS
} from '../appwrite-config';

// Profile interfaces
export interface Profile {
  $id?: string;
  userId: string;
  name: string;
  age: number;
  dateOfBirth: string;
  gender: 'male' | 'female';
  email: string;
  phone?: string;
  
  // Geographical Information
  district: string;
  block: string;
  village?: string;
  nearbyDistricts?: string[];
  
  // Education & Career
  education: string;
  occupation: string;
  skills?: string[];
  
  // Religious & Cultural
  sect: 'Sunni' | 'Shia' | 'Other';
  subSect?: string;
  biradari?: string;
  religiousPractice: string;
  familyBackground: string;
  
  // Personal Details
  bio: string;
  familyType?: 'nuclear' | 'joint';
  maritalStatus: 'single' | 'divorced' | 'widowed';
  
  // Profile Settings
  profilePictureId?: string;
  profilePictureUrl?: string;
  isPhotoBlurred: boolean;
  isVerified: boolean;
  isProfileComplete: boolean;
  profileVisibility: 'public' | 'members' | 'private';
  
  // Preferences
  lookingFor?: PartnerPreferences;
  ageRangePreference?: string;
  locationPreference?: string[];
  educationPreference?: string[];
  
  // System Fields
  createdAt?: string;
  updatedAt?: string;
  lastActiveAt?: string;
  profileViewCount: number;
  isActive: boolean;
}

export interface PartnerPreferences {
  ageRange: { min: number; max: number };
  education: string[];
  occupation: string[];
  location: string[];
  sect: string[];
  maritalStatus: string[];
  familyType?: string[];
}

export interface CreateProfileData {
  name: string;
  dateOfBirth: string;
  gender: 'male' | 'female';
  district: string;
  block: string;
  village?: string;
  education: string;
  occupation: string;
  sect: 'Sunni' | 'Shia' | 'Other';
  religiousPractice: string;
  familyBackground: string;
  bio: string;
  maritalStatus?: 'single' | 'divorced' | 'widowed';
  familyType?: 'nuclear' | 'joint';
  skills?: string[];
  subSect?: string;
  biradari?: string;
}

export interface SearchFilters {
  gender?: string;
  ageMin?: number;
  ageMax?: number;
  district?: string;
  districts?: string[];
  education?: string;
  educationLevels?: string[];
  sect?: string;
  sects?: string[];
  occupation?: string;
  maritalStatus?: string;
  isVerified?: boolean;
  isActive?: boolean;
  hasPhoto?: boolean;
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  profiles: Profile[];
  total: number;
  hasMore: boolean;
}

export interface ProfileStats {
  viewCount: number;
  interestsSent: number;
  interestsReceived: number;
  profileCompletion: number;
  lastActive: string;
}

export interface VisibilitySettings {
  profileVisibility: 'public' | 'members' | 'private';
  isPhotoBlurred: boolean;
  showContactInfo: boolean;
  showLastActive: boolean;
}

export class ProfileService {
  /**
   * Create a new profile
   */
  static async createProfile(userId: string, data: CreateProfileData): Promise<Profile> {
    return AppwriteService.executeWithErrorHandling(async () => {
      // Validate required fields
      this.validateProfileData(data);

      // Calculate age from date of birth
      const age = AppwriteUtils.calculateAge(data.dateOfBirth);
      
      if (age < 18 || age > 100) {
        throw new Error('Age must be between 18 and 100 years');
      }

      // Prepare profile data
      const profileData: Partial<Profile> = {
        userId,
        name: AppwriteUtils.sanitizeInput(data.name),
        age,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        district: data.district,
        block: data.block,
        village: data.village ? AppwriteUtils.sanitizeInput(data.village) : undefined,
        education: data.education,
        occupation: data.occupation,
        sect: data.sect,
        subSect: data.subSect,
        biradari: data.biradari ? AppwriteUtils.sanitizeInput(data.biradari) : undefined,
        religiousPractice: AppwriteUtils.sanitizeInput(data.religiousPractice),
        familyBackground: AppwriteUtils.sanitizeInput(data.familyBackground),
        bio: AppwriteUtils.sanitizeInput(data.bio),
        maritalStatus: data.maritalStatus || 'single',
        familyType: data.familyType,
        skills: data.skills?.map(skill => AppwriteUtils.sanitizeInput(skill)),
        
        // Default settings
        isPhotoBlurred: DEFAULTS.PROFILE_PICTURE_BLUR,
        profileVisibility: DEFAULTS.PROFILE_VISIBILITY,
        isVerified: false,
        isActive: true,
        profileViewCount: 0,
        
        // System fields
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString()
      };

      // Calculate profile completion
      profileData.isProfileComplete = this.calculateProfileCompletion(profileData) >= 80;

      // Create profile document
      const profile = await databases.createDocument(
        DATABASE_ID,
        COLLECTION_IDS.PROFILES,
        ID.unique(),
        profileData,
        PERMISSIONS.OWNER_ONLY
      );

      return profile as Profile;
    }, 'createProfile');
  }

  /**
   * Get profile by user ID
   */
  static async getProfile(userId: string): Promise<Profile | null> {
    return AppwriteService.executeWithErrorHandling(async () => {
      try {
        const profiles = await databases.listDocuments(
          DATABASE_ID,
          COLLECTION_IDS.PROFILES,
          [Query.equal('userId', userId)]
        );

        if (profiles.documents.length === 0) {
          return null;
        }

        const profile = profiles.documents[0] as Profile;
        
        // Add profile picture URL if exists
        if (profile.profilePictureId) {
          profile.profilePictureUrl = this.getProfilePictureUrl(profile.profilePictureId);
        }

        return profile;
      } catch (error: any) {
        if (error.code === 404) {
          return null;
        }
        throw error;
      }
    }, 'getProfile');
  }

  /**
   * Get profile by document ID
   */
  static async getProfileById(profileId: string): Promise<Profile | null> {
    return AppwriteService.executeWithErrorHandling(async () => {
      try {
        const profile = await databases.getDocument(
          DATABASE_ID,
          COLLECTION_IDS.PROFILES,
          profileId
        ) as Profile;

        // Add profile picture URL if exists
        if (profile.profilePictureId) {
          profile.profilePictureUrl = this.getProfilePictureUrl(profile.profilePictureId);
        }

        return profile;
      } catch (error: any) {
        if (error.code === 404) {
          return null;
        }
        throw error;
      }
    }, 'getProfileById');
  }

  /**
   * Update profile
   */
  static async updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile> {
    return AppwriteService.executeWithErrorHandling(async () => {
      // Get existing profile
      const existingProfile = await this.getProfile(userId);
      if (!existingProfile) {
        throw new Error('Profile not found');
      }

      // Validate updates
      if (updates.dateOfBirth) {
        const age = AppwriteUtils.calculateAge(updates.dateOfBirth);
        if (age < 18 || age > 100) {
          throw new Error('Age must be between 18 and 100 years');
        }
        updates.age = age;
      }

      // Sanitize text fields
      const sanitizedUpdates: Partial<Profile> = { ...updates };
      
      if (updates.name) sanitizedUpdates.name = AppwriteUtils.sanitizeInput(updates.name);
      if (updates.village) sanitizedUpdates.village = AppwriteUtils.sanitizeInput(updates.village);
      if (updates.biradari) sanitizedUpdates.biradari = AppwriteUtils.sanitizeInput(updates.biradari);
      if (updates.religiousPractice) sanitizedUpdates.religiousPractice = AppwriteUtils.sanitizeInput(updates.religiousPractice);
      if (updates.familyBackground) sanitizedUpdates.familyBackground = AppwriteUtils.sanitizeInput(updates.familyBackground);
      if (updates.bio) sanitizedUpdates.bio = AppwriteUtils.sanitizeInput(updates.bio);
      if (updates.skills) sanitizedUpdates.skills = updates.skills.map(skill => AppwriteUtils.sanitizeInput(skill));

      // Update system fields
      sanitizedUpdates.updatedAt = new Date().toISOString();
      sanitizedUpdates.lastActiveAt = new Date().toISOString();

      // Recalculate profile completion
      const mergedProfile = { ...existingProfile, ...sanitizedUpdates };
      sanitizedUpdates.isProfileComplete = this.calculateProfileCompletion(mergedProfile) >= 80;

      // Update profile document
      const updatedProfile = await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_IDS.PROFILES,
        existingProfile.$id!,
        sanitizedUpdates
      );

      return updatedProfile as Profile;
    }, 'updateProfile');
  }

  /**
   * Delete profile
   */
  static async deleteProfile(userId: string): Promise<void> {
    return AppwriteService.executeWithErrorHandling(async () => {
      const profile = await this.getProfile(userId);
      if (!profile) {
        throw new Error('Profile not found');
      }

      // Delete profile picture if exists
      if (profile.profilePictureId) {
        try {
          await storage.deleteFile(BUCKET_IDS.PROFILE_PICTURES, profile.profilePictureId);
        } catch (error) {
          console.warn('Failed to delete profile picture:', error);
        }
      }

      // Delete profile document
      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTION_IDS.PROFILES,
        profile.$id!
      );
    }, 'deleteProfile');
  }

  /**
   * Upload profile picture
   */
  static async uploadProfilePicture(userId: string, file: File): Promise<string> {
    return AppwriteService.executeWithErrorHandling(async () => {
      // Validate file
      const validation = AppwriteUtils.validateFile(file, 'image');
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Get existing profile
      const profile = await this.getProfile(userId);
      if (!profile) {
        throw new Error('Profile not found');
      }

      // Delete existing profile picture if exists
      if (profile.profilePictureId) {
        try {
          await storage.deleteFile(BUCKET_IDS.PROFILE_PICTURES, profile.profilePictureId);
        } catch (error) {
          console.warn('Failed to delete existing profile picture:', error);
        }
      }

      // Generate unique filename
      const fileName = AppwriteUtils.generateFileName(file.name, userId);

      // Upload new file
      const uploadedFile = await storage.createFile(
        BUCKET_IDS.PROFILE_PICTURES,
        ID.unique(),
        file,
        PERMISSIONS.OWNER_ONLY
      );

      // Update profile with new picture ID
      await this.updateProfile(userId, {
        profilePictureId: uploadedFile.$id
      });

      return uploadedFile.$id;
    }, 'uploadProfilePicture');
  }

  /**
   * Delete profile picture
   */
  static async deleteProfilePicture(userId: string): Promise<void> {
    return AppwriteService.executeWithErrorHandling(async () => {
      const profile = await this.getProfile(userId);
      if (!profile || !profile.profilePictureId) {
        return;
      }

      // Delete file from storage
      await storage.deleteFile(BUCKET_IDS.PROFILE_PICTURES, profile.profilePictureId);

      // Update profile to remove picture ID
      await this.updateProfile(userId, {
        profilePictureId: undefined
      });
    }, 'deleteProfilePicture');
  }

  /**
   * Search profiles with filters
   */
  static async searchProfiles(filters: SearchFilters): Promise<SearchResult> {
    return AppwriteService.executeWithErrorHandling(async () => {
      try {
        const queries = this.buildAdvancedSearchQueries(filters);

        const result = await databases.listDocuments(
          DATABASE_ID,
          COLLECTION_IDS.PROFILES,
          queries
        );

        const profiles = result.documents.map(doc => {
          const profile = doc as Profile;
          
          // Add profile picture URL if exists
          if (profile.profilePictureId) {
            profile.profilePictureUrl = this.getProfilePictureUrl(profile.profilePictureId);
          }

          return profile;
        });

        return {
          profiles,
          total: result.total,
          hasMore: result.total > (filters.offset || 0) + profiles.length
        };
      } catch (error: any) {
        // If it's a permission error or collection doesn't exist, return empty results
        if (error.code === 401 || error.code === 403 || error.code === 404) {
          console.warn('Profile search failed due to permissions or missing collection:', error.message);
          return {
            profiles: [],
            total: 0,
            hasMore: false
          };
        }
        throw error;
      }
    }, 'searchProfiles');
  }

  /**
   * Build advanced search queries with compound filters
   */
  private static buildAdvancedSearchQueries(filters: SearchFilters): string[] {
    const queries: string[] = [];

    // Gender filter
    if (filters.gender) {
      queries.push(Query.equal('gender', filters.gender));
    }

    // Age range filter
    if (filters.ageMin !== undefined) {
      queries.push(Query.greaterThanEqual('age', filters.ageMin));
    }
    if (filters.ageMax !== undefined) {
      queries.push(Query.lessThanEqual('age', filters.ageMax));
    }

    // Location filters
    if (filters.district) {
      queries.push(Query.equal('district', filters.district));
    }
    
    if (filters.districts && filters.districts.length > 0) {
      queries.push(Query.equal('district', filters.districts));
    }

    // Education filters
    if (filters.education) {
      queries.push(Query.equal('education', filters.education));
    }
    
    if (filters.educationLevels && filters.educationLevels.length > 0) {
      queries.push(Query.equal('education', filters.educationLevels));
    }

    // Religious filters
    if (filters.sect) {
      queries.push(Query.equal('sect', filters.sect));
    }
    
    if (filters.sects && filters.sects.length > 0) {
      queries.push(Query.equal('sect', filters.sects));
    }

    // Occupation filter
    if (filters.occupation) {
      queries.push(Query.equal('occupation', filters.occupation));
    }

    // Marital status filter
    if (filters.maritalStatus) {
      queries.push(Query.equal('maritalStatus', filters.maritalStatus));
    }

    // Verification status
    if (filters.isVerified !== undefined) {
      queries.push(Query.equal('isVerified', filters.isVerified));
    }

    // Active status (default to true)
    queries.push(Query.equal('isActive', filters.isActive !== false));

    // Photo filter
    if (filters.hasPhoto !== undefined) {
      if (filters.hasPhoto) {
        queries.push(Query.isNotNull('profilePictureId'));
      } else {
        queries.push(Query.isNull('profilePictureId'));
      }
    }

    // Pagination
    const limit = Math.min(filters.limit || 20, 100); // Max 100 results per query
    queries.push(Query.limit(limit));

    if (filters.offset && filters.offset > 0) {
      queries.push(Query.offset(filters.offset));
    }

    // Default ordering by last active, then by creation date
    queries.push(Query.orderDesc('lastActiveAt'));
    queries.push(Query.orderDesc('createdAt'));

    return queries;
  }

  /**
   * Search profiles with text query
   */
  static async searchProfilesWithText(
    searchQuery: string, 
    filters?: Partial<SearchFilters>
  ): Promise<SearchResult> {
    return AppwriteService.executeWithErrorHandling(async () => {
      // For text search, we'll need to implement full-text search
      // For now, we'll search by name and bio using contains
      const queries: string[] = [];

      // Text search queries
      if (searchQuery.trim()) {
        // Search in name, bio, occupation, education
        queries.push(Query.search('name', searchQuery));
      }

      // Apply additional filters
      if (filters) {
        const additionalQueries = this.buildAdvancedSearchQueries(filters);
        queries.push(...additionalQueries);
      } else {
        // Default filters
        queries.push(Query.equal('isActive', true));
        queries.push(Query.limit(20));
        queries.push(Query.orderDesc('lastActiveAt'));
      }

      const result = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_IDS.PROFILES,
        queries
      );

      const profiles = result.documents.map(doc => {
        const profile = doc as Profile;
        
        if (profile.profilePictureId) {
          profile.profilePictureUrl = this.getProfilePictureUrl(profile.profilePictureId);
        }

        return profile;
      });

      return {
        profiles,
        total: result.total,
        hasMore: result.total > (filters?.offset || 0) + profiles.length
      };
    }, 'searchProfilesWithText');
  }

  /**
   * Get profiles by location proximity
   */
  static async getProfilesByLocation(
    district: string, 
    includeNearby: boolean = true,
    filters?: Partial<SearchFilters>
  ): Promise<SearchResult> {
    return AppwriteService.executeWithErrorHandling(async () => {
      const queries: string[] = [];

      if (includeNearby) {
        // Include nearby districts based on Madhubani geography
        const nearbyDistricts = this.getNearbyDistricts(district);
        queries.push(Query.equal('district', nearbyDistricts));
      } else {
        queries.push(Query.equal('district', district));
      }

      // Apply additional filters
      if (filters) {
        const additionalQueries = this.buildAdvancedSearchQueries({
          ...filters,
          district: undefined, // Remove district filter as we're handling it above
          districts: undefined
        });
        queries.push(...additionalQueries);
      } else {
        queries.push(Query.equal('isActive', true));
        queries.push(Query.limit(20));
      }

      queries.push(Query.orderDesc('lastActiveAt'));

      const result = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_IDS.PROFILES,
        queries
      );

      const profiles = result.documents.map(doc => {
        const profile = doc as Profile;
        
        if (profile.profilePictureId) {
          profile.profilePictureUrl = this.getProfilePictureUrl(profile.profilePictureId);
        }

        return profile;
      });

      return {
        profiles,
        total: result.total,
        hasMore: result.total > (filters?.offset || 0) + profiles.length
      };
    }, 'getProfilesByLocation');
  }

  /**
   * Get nearby districts for location-based search
   */
  private static getNearbyDistricts(district: string): string[] {
    const districtMap: Record<string, string[]> = {
      'Madhubani': ['Madhubani', 'Darbhanga', 'Sitamarhi', 'Samastipur'],
      'Darbhanga': ['Darbhanga', 'Madhubani', 'Samastipur', 'Muzaffarpur'],
      'Sitamarhi': ['Sitamarhi', 'Madhubani', 'Muzaffarpur'],
      'Samastipur': ['Samastipur', 'Madhubani', 'Darbhanga', 'Muzaffarpur'],
      'Muzaffarpur': ['Muzaffarpur', 'Darbhanga', 'Sitamarhi', 'Samastipur']
    };

    return districtMap[district] || [district];
  }

  /**
   * Get trending/popular profiles
   */
  static async getTrendingProfiles(limit: number = 10): Promise<Profile[]> {
    return AppwriteService.executeWithErrorHandling(async () => {
      const queries = [
        Query.equal('isActive', true),
        Query.greaterThan('profileViewCount', 5), // Profiles with some views
        Query.limit(limit),
        Query.orderDesc('profileViewCount'), // Order by view count
        Query.orderDesc('lastActiveAt') // Then by activity
      ];

      const result = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_IDS.PROFILES,
        queries
      );

      return result.documents.map(doc => {
        const profile = doc as Profile;
        
        if (profile.profilePictureId) {
          profile.profilePictureUrl = this.getProfilePictureUrl(profile.profilePictureId);
        }

        return profile;
      });
    }, 'getTrendingProfiles');
  }

  /**
   * Get recently active profiles
   */
  static async getRecentlyActiveProfiles(limit: number = 10): Promise<Profile[]> {
    return AppwriteService.executeWithErrorHandling(async () => {
      const queries = [
        Query.equal('isActive', true),
        Query.limit(limit),
        Query.orderDesc('lastActiveAt')
      ];

      const result = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_IDS.PROFILES,
        queries
      );

      return result.documents.map(doc => {
        const profile = doc as Profile;
        
        if (profile.profilePictureId) {
          profile.profilePictureUrl = this.getProfilePictureUrl(profile.profilePictureId);
        }

        return profile;
      });
    }, 'getRecentlyActiveProfiles');
  }

  /**
   * Get recommended matches for a user
   */
  static async getRecommendedMatches(userId: string, limit: number = 10): Promise<Profile[]> {
    return AppwriteService.executeWithErrorHandling(async () => {
      const userProfile = await this.getProfile(userId);
      if (!userProfile) {
        throw new Error('User profile not found');
      }

      // Build filters based on user preferences and profile
      const filters: SearchFilters = {
        gender: userProfile.gender === 'male' ? 'female' : 'male',
        isActive: true,
        limit
      };

      // Add age preference if available
      if (userProfile.lookingFor?.ageRange) {
        filters.ageMin = userProfile.lookingFor.ageRange.min;
        filters.ageMax = userProfile.lookingFor.ageRange.max;
      }

      // Add location preference
      if (userProfile.locationPreference?.length) {
        filters.districts = userProfile.locationPreference;
      } else {
        // Default to same district and nearby districts
        filters.districts = [userProfile.district, ...(userProfile.nearbyDistricts || [])];
      }

      // Add education preference
      if (userProfile.educationPreference?.length) {
        filters.educationLevels = userProfile.educationPreference;
      }

      const result = await this.searchProfiles(filters);
      return result.profiles;
    }, 'getRecommendedMatches');
  }

  /**
   * Update profile visibility settings
   */
  static async updateVisibilitySettings(userId: string, settings: VisibilitySettings): Promise<Profile> {
    return AppwriteService.executeWithErrorHandling(async () => {
      return await this.updateProfile(userId, {
        profileVisibility: settings.profileVisibility,
        isPhotoBlurred: settings.isPhotoBlurred
      });
    }, 'updateVisibilitySettings');
  }

  /**
   * Get profile statistics
   */
  static async getProfileStats(userId: string): Promise<ProfileStats> {
    return AppwriteService.executeWithErrorHandling(async () => {
      const profile = await this.getProfile(userId);
      if (!profile) {
        throw new Error('Profile not found');
      }

      // Get interests sent and received counts
      const [sentInterests, receivedInterests] = await Promise.all([
        databases.listDocuments(
          DATABASE_ID,
          COLLECTION_IDS.INTERESTS,
          [Query.equal('senderId', userId), Query.limit(1)]
        ),
        databases.listDocuments(
          DATABASE_ID,
          COLLECTION_IDS.INTERESTS,
          [Query.equal('receiverId', userId), Query.limit(1)]
        )
      ]);

      return {
        viewCount: profile.profileViewCount,
        interestsSent: sentInterests.total,
        interestsReceived: receivedInterests.total,
        profileCompletion: this.calculateProfileCompletion(profile),
        lastActive: profile.lastActiveAt || profile.updatedAt || profile.createdAt || ''
      };
    }, 'getProfileStats');
  }

  /**
   * Increment profile view count
   */
  static async incrementViewCount(profileId: string): Promise<void> {
    return AppwriteService.executeWithErrorHandling(async () => {
      const profile = await this.getProfileById(profileId);
      if (!profile) {
        return;
      }

      await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_IDS.PROFILES,
        profileId,
        {
          profileViewCount: profile.profileViewCount + 1,
          lastActiveAt: new Date().toISOString()
        }
      );
    }, 'incrementViewCount');
  }

  /**
   * Update last active timestamp
   */
  static async updateLastActive(userId: string): Promise<void> {
    return AppwriteService.executeWithErrorHandling(async () => {
      const profile = await this.getProfile(userId);
      if (!profile) {
        return;
      }

      await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_IDS.PROFILES,
        profile.$id!,
        {
          lastActiveAt: new Date().toISOString()
        }
      );
    }, 'updateLastActive');
  }

  // Private helper methods

  /**
   * Validate profile data
   */
  private static validateProfileData(data: CreateProfileData): void {
    if (!data.name || data.name.trim().length < 2) {
      throw new Error('Name must be at least 2 characters long');
    }

    if (!data.dateOfBirth) {
      throw new Error('Date of birth is required');
    }

    if (!['male', 'female'].includes(data.gender)) {
      throw new Error('Gender must be male or female');
    }

    if (!MADHUBANI_CONFIG.DISTRICTS.includes(data.district)) {
      throw new Error('Invalid district selection');
    }

    if (!MADHUBANI_CONFIG.BLOCKS.includes(data.block)) {
      throw new Error('Invalid block selection');
    }

    if (!MADHUBANI_CONFIG.EDUCATION_LEVELS.includes(data.education)) {
      throw new Error('Invalid education level');
    }

    if (!MADHUBANI_CONFIG.OCCUPATIONS.includes(data.occupation)) {
      throw new Error('Invalid occupation');
    }

    if (!MADHUBANI_CONFIG.SECTS.includes(data.sect)) {
      throw new Error('Invalid sect selection');
    }

    if (!data.bio || data.bio.trim().length < 50) {
      throw new Error('Bio must be at least 50 characters long');
    }

    if (!data.familyBackground || data.familyBackground.trim().length < 20) {
      throw new Error('Family background must be at least 20 characters long');
    }
  }

  /**
   * Calculate profile completion percentage
   */
  private static calculateProfileCompletion(profile: any): number {
    return AppwriteUtils.calculateProfileCompletion(profile);
  }

  /**
   * Get profile picture URL
   */
  private static getProfilePictureUrl(fileId: string): string {
    return storage.getFilePreview(
      BUCKET_IDS.PROFILE_PICTURES,
      fileId,
      300, // width
      300, // height
      'center', // gravity
      80 // quality
    ).href;
  }
}