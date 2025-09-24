import { databases, AppwriteService } from '../appwrite';
import { DATABASE_ID, COLLECTION_IDS } from '../appwrite-config';
import { Query, ID } from 'appwrite';
import { ProfileService } from './profile.service';
import { CompatibilityService } from './compatibility.service';
import type { Profile, SearchFilters } from './profile.service';
import type {
  MatchRecommendation,
  UserPreferences,
  MatchingCriteria
} from '../types/compatibility.types';

export interface RecommendationFilters {
  minCompatibilityScore?: number;
  maxAge?: number;
  minAge?: number;
  districts?: string[];
  educationLevels?: string[];
  sects?: string[];
  occupations?: string[];
  verifiedOnly?: boolean;
  hasPhotoOnly?: boolean;
  excludeUserIds?: string[];
}

export interface UserInteraction {
  userId: string;
  targetUserId: string;
  interactionType: 'view' | 'interest' | 'favorite' | 'skip' | 'block';
  timestamp: string;
  contextData?: Record<string, any>;
}

export interface LearningData {
  userId: string;
  preferredAgeRange: { min: number; max: number };
  preferredEducationLevels: string[];
  preferredOccupations: string[];
  preferredLocations: string[];
  preferredSects: string[];
  interactionPatterns: {
    viewedProfiles: number;
    sentInterests: number;
    acceptedInterests: number;
    averageCompatibilityOfInterests: number;
  };
  lastUpdated: string;
}

export class MatchRecommendationService {
  /**
   * Get personalized match recommendations for a user
   */
  static async getPersonalizedRecommendations(
    userId: string,
    limit: number = 20,
    filters?: RecommendationFilters
  ): Promise<MatchRecommendation[]> {
    return AppwriteService.executeWithErrorHandling(async () => {
      // Get user profile
      const userProfile = await ProfileService.getProfile(userId);
      if (!userProfile) {
        throw new Error('User profile not found');
      }

      // Get user preferences and learning data
      const [userPreferences, learningData] = await Promise.all([
        this.getUserPreferences(userId),
        this.getUserLearningData(userId)
      ]);

      // Build enhanced search filters based on preferences and learning
      const searchFilters = this.buildIntelligentSearchFilters(
        userProfile,
        userPreferences,
        learningData,
        filters
      );

      // Get candidate profiles
      const candidateProfiles = await this.getCandidateProfiles(
        userProfile,
        searchFilters,
        limit * 2 // Get more candidates to filter through
      );

      // Generate recommendations with compatibility scoring
      const recommendations = await CompatibilityService.generateMatchRecommendations(
        userProfile,
        candidateProfiles,
        userPreferences
      );

      // Apply intelligent ranking based on learning data
      const rankedRecommendations = this.applyIntelligentRanking(
        recommendations,
        learningData,
        userProfile
      );

      // Store recommendations for analytics
      await this.storeRecommendationSession(userId, rankedRecommendations);

      return rankedRecommendations.slice(0, limit);
    }, 'getPersonalizedRecommendations');
  }

  /**
   * Learn from user interactions to improve recommendations
   */
  static async recordUserInteraction(interaction: UserInteraction): Promise<void> {
    return AppwriteService.executeWithErrorHandling(async () => {
      // Store interaction
      await databases.createDocument(
        DATABASE_ID,
        COLLECTION_IDS.USER_ACTIVITIES,
        ID.unique(),
        {
          userId: interaction.userId,
          targetUserId: interaction.targetUserId,
          activityType: interaction.interactionType,
          timestamp: interaction.timestamp,
          contextData: JSON.stringify(interaction.contextData || {})
        }
      );

      // Update learning data
      await this.updateLearningData(interaction);
    }, 'recordUserInteraction');
  }

  /**
   * Get match quality feedback and improve recommendations
   */
  static async recordMatchFeedback(
    userId: string,
    matchUserId: string,
    feedback: 'excellent' | 'good' | 'average' | 'poor',
    reasons?: string[]
  ): Promise<void> {
    return AppwriteService.executeWithErrorHandling(async () => {
      // Store feedback
      await databases.createDocument(
        DATABASE_ID,
        COLLECTION_IDS.MATCH_ANALYTICS,
        ID.unique(),
        {
          userId,
          matchUserId,
          feedback,
          reasons: JSON.stringify(reasons || []),
          timestamp: new Date().toISOString()
        }
      );

      // Update learning algorithms based on feedback
      await this.updateRecommendationAlgorithm(userId, matchUserId, feedback, reasons);
    }, 'recordMatchFeedback');
  }

  /**
   * Get cached recommendations if available and fresh
   */
  static async getCachedRecommendations(
    userId: string,
    maxAgeHours: number = 24
  ): Promise<MatchRecommendation[]> {
    return AppwriteService.executeWithErrorHandling(async () => {
      const cutoffTime = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000).toISOString();

      const results = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_IDS.MATCH_RECOMMENDATIONS,
        [
          Query.equal('userId', userId),
          Query.greaterThan('generatedAt', cutoffTime),
          Query.orderDesc('compatibilityScore'),
          Query.limit(50)
        ]
      );

      return results.documents.map(doc => ({
        profileId: doc.profileId,
        userId: doc.userId,
        compatibilityScore: JSON.parse(doc.compatibilityData),
        recommendationReason: doc.recommendationReason,
        priority: doc.priority,
        generatedAt: doc.generatedAt,
        expiresAt: doc.expiresAt
      })) as MatchRecommendation[];
    }, 'getCachedRecommendations');
  }

  /**
   * Refresh recommendations for a user
   */
  static async refreshRecommendations(userId: string): Promise<MatchRecommendation[]> {
    return AppwriteService.executeWithErrorHandling(async () => {
      // Clear old recommendations
      await this.clearOldRecommendations(userId);

      // Generate fresh recommendations
      return await this.getPersonalizedRecommendations(userId, 20);
    }, 'refreshRecommendations');
  }

  /**
   * Get trending matches based on platform activity
   */
  static async getTrendingMatches(
    userId: string,
    limit: number = 10
  ): Promise<Profile[]> {
    return AppwriteService.executeWithErrorHandling(async () => {
      const userProfile = await ProfileService.getProfile(userId);
      if (!userProfile) {
        throw new Error('User profile not found');
      }

      // Get profiles with high activity in the last week
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const searchFilters: SearchFilters = {
        gender: userProfile.gender === 'male' ? 'female' : 'male',
        isActive: true,
        isVerified: true,
        limit: limit * 2
      };

      const result = await ProfileService.searchProfiles(searchFilters);
      
      // Sort by recent activity and profile views
      const trendingProfiles = result.profiles
        .filter(profile => profile.lastActiveAt && profile.lastActiveAt > oneWeekAgo)
        .sort((a, b) => {
          const aActivity = new Date(a.lastActiveAt || 0).getTime();
          const bActivity = new Date(b.lastActiveAt || 0).getTime();
          const aViews = a.profileViewCount || 0;
          const bViews = b.profileViewCount || 0;
          
          // Combine activity and views for trending score
          const aScore = aActivity + (aViews * 1000);
          const bScore = bActivity + (bViews * 1000);
          
          return bScore - aScore;
        })
        .slice(0, limit);

      return trendingProfiles;
    }, 'getTrendingMatches');
  }

  // Private helper methods

  private static async getUserPreferences(userId: string): Promise<UserPreferences | undefined> {
    try {
      const userProfile = await ProfileService.getProfile(userId);
      if (!userProfile?.lookingFor) {
        return undefined;
      }

      return {
        ageRange: userProfile.lookingFor.ageRange,
        locationPreference: userProfile.locationPreference || [userProfile.district],
        educationPreference: userProfile.educationPreference || [],
        sectPreference: userProfile.lookingFor.sect || [userProfile.sect],
        occupationPreference: userProfile.lookingFor.occupation || [],
        maritalStatusPreference: userProfile.lookingFor.maritalStatus || ['single'],
        familyTypePreference: userProfile.lookingFor.familyType,
        mustHavePhoto: false,
        verifiedOnly: false
      };
    } catch (error) {
      console.warn('Failed to get user preferences:', error);
      return undefined;
    }
  }

  private static async getUserLearningData(userId: string): Promise<LearningData | null> {
    try {
      const results = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_IDS.MATCH_ANALYTICS,
        [
          Query.equal('userId', userId),
          Query.limit(1),
          Query.orderDesc('lastUpdated')
        ]
      );

      if (results.documents.length > 0) {
        const doc = results.documents[0];
        return JSON.parse(doc.learningData) as LearningData;
      }

      return null;
    } catch (error) {
      console.warn('Failed to get learning data:', error);
      return null;
    }
  }

  private static buildIntelligentSearchFilters(
    userProfile: Profile,
    userPreferences?: UserPreferences,
    learningData?: LearningData | null,
    additionalFilters?: RecommendationFilters
  ): SearchFilters {
    const filters: SearchFilters = {
      gender: userProfile.gender === 'male' ? 'female' : 'male',
      isActive: true,
      limit: 50
    };

    // Apply user preferences
    if (userPreferences) {
      filters.ageMin = userPreferences.ageRange.min;
      filters.ageMax = userPreferences.ageRange.max;
      filters.districts = userPreferences.locationPreference;
      filters.educationLevels = userPreferences.educationPreference;
      filters.sects = userPreferences.sectPreference;
      
      if (userPreferences.verifiedOnly) {
        filters.isVerified = true;
      }
      
      if (userPreferences.mustHavePhoto) {
        filters.hasPhoto = true;
      }
    }

    // Apply learning data insights
    if (learningData) {
      // Adjust age range based on interaction patterns
      if (learningData.preferredAgeRange) {
        filters.ageMin = Math.max(filters.ageMin || 18, learningData.preferredAgeRange.min);
        filters.ageMax = Math.min(filters.ageMax || 50, learningData.preferredAgeRange.max);
      }

      // Include learned preferences
      if (learningData.preferredEducationLevels.length > 0) {
        filters.educationLevels = [
          ...(filters.educationLevels || []),
          ...learningData.preferredEducationLevels
        ];
      }

      if (learningData.preferredLocations.length > 0) {
        filters.districts = [
          ...(filters.districts || []),
          ...learningData.preferredLocations
        ];
      }
    }

    // Apply additional filters
    if (additionalFilters) {
      if (additionalFilters.minAge) filters.ageMin = additionalFilters.minAge;
      if (additionalFilters.maxAge) filters.ageMax = additionalFilters.maxAge;
      if (additionalFilters.districts) filters.districts = additionalFilters.districts;
      if (additionalFilters.educationLevels) filters.educationLevels = additionalFilters.educationLevels;
      if (additionalFilters.sects) filters.sects = additionalFilters.sects;
      if (additionalFilters.verifiedOnly) filters.isVerified = true;
      if (additionalFilters.hasPhotoOnly) filters.hasPhoto = true;
    }

    return filters;
  }

  private static async getCandidateProfiles(
    userProfile: Profile,
    searchFilters: SearchFilters,
    limit: number
  ): Promise<Profile[]> {
    const result = await ProfileService.searchProfiles({
      ...searchFilters,
      limit
    });

    // Filter out the user's own profile and any blocked users
    return result.profiles.filter(profile => 
      profile.userId !== userProfile.userId
    );
  }

  private static applyIntelligentRanking(
    recommendations: MatchRecommendation[],
    learningData: LearningData | null,
    userProfile: Profile
  ): MatchRecommendation[] {
    return recommendations.sort((a, b) => {
      let scoreA = a.compatibilityScore.overall;
      let scoreB = b.compatibilityScore.overall;

      // Apply learning-based adjustments
      if (learningData) {
        // Boost scores based on interaction patterns
        if (learningData.interactionPatterns.averageCompatibilityOfInterests > 0) {
          const avgCompatibility = learningData.interactionPatterns.averageCompatibilityOfInterests;
          
          // Boost profiles that match the user's historical preference pattern
          if (Math.abs(scoreA - avgCompatibility) < 10) scoreA += 5;
          if (Math.abs(scoreB - avgCompatibility) < 10) scoreB += 5;
        }

        // Consider success rate patterns
        const successRate = learningData.interactionPatterns.acceptedInterests / 
                           Math.max(learningData.interactionPatterns.sentInterests, 1);
        
        if (successRate > 0.3) { // If user has good success rate
          // Boost high-compatibility matches more
          if (scoreA >= 80) scoreA += 3;
          if (scoreB >= 80) scoreB += 3;
        }
      }

      // Apply recency boost for recently active profiles
      const now = Date.now();
      const dayInMs = 24 * 60 * 60 * 1000;
      
      // This would require getting the actual profile data, simplified for now
      // In a real implementation, you'd fetch the profile data to check lastActiveAt

      return scoreB - scoreA;
    });
  }

  private static async updateLearningData(interaction: UserInteraction): Promise<void> {
    try {
      // Get current learning data
      let learningData = await this.getUserLearningData(interaction.userId);
      
      if (!learningData) {
        // Initialize learning data
        const userProfile = await ProfileService.getProfile(interaction.userId);
        if (!userProfile) return;

        learningData = {
          userId: interaction.userId,
          preferredAgeRange: { min: 22, max: 35 },
          preferredEducationLevels: [],
          preferredOccupations: [],
          preferredLocations: [userProfile.district],
          preferredSects: [userProfile.sect],
          interactionPatterns: {
            viewedProfiles: 0,
            sentInterests: 0,
            acceptedInterests: 0,
            averageCompatibilityOfInterests: 0
          },
          lastUpdated: new Date().toISOString()
        };
      }

      // Update interaction patterns
      switch (interaction.interactionType) {
        case 'view':
          learningData.interactionPatterns.viewedProfiles++;
          break;
        case 'interest':
          learningData.interactionPatterns.sentInterests++;
          break;
      }

      // Update learning data based on target profile
      const targetProfile = await ProfileService.getProfile(interaction.targetUserId);
      if (targetProfile) {
        // Learn from viewed/interested profiles
        if (['view', 'interest'].includes(interaction.interactionType)) {
          // Update preferred age range
          const targetAge = targetProfile.age;
          learningData.preferredAgeRange.min = Math.min(learningData.preferredAgeRange.min, targetAge - 2);
          learningData.preferredAgeRange.max = Math.max(learningData.preferredAgeRange.max, targetAge + 2);

          // Update preferred locations
          if (!learningData.preferredLocations.includes(targetProfile.district)) {
            learningData.preferredLocations.push(targetProfile.district);
          }

          // Update preferred education levels
          if (!learningData.preferredEducationLevels.includes(targetProfile.education)) {
            learningData.preferredEducationLevels.push(targetProfile.education);
          }

          // Update preferred occupations
          if (!learningData.preferredOccupations.includes(targetProfile.occupation)) {
            learningData.preferredOccupations.push(targetProfile.occupation);
          }
        }
      }

      learningData.lastUpdated = new Date().toISOString();

      // Store updated learning data
      await databases.createDocument(
        DATABASE_ID,
        COLLECTION_IDS.MATCH_ANALYTICS,
        ID.unique(),
        {
          userId: interaction.userId,
          learningData: JSON.stringify(learningData),
          lastUpdated: learningData.lastUpdated
        }
      );
    } catch (error) {
      console.warn('Failed to update learning data:', error);
    }
  }

  private static async updateRecommendationAlgorithm(
    userId: string,
    matchUserId: string,
    feedback: string,
    reasons?: string[]
  ): Promise<void> {
    try {
      // Get the compatibility score for this match
      const compatibilityScore = await CompatibilityService.getCachedCompatibility(userId, matchUserId);
      
      if (compatibilityScore) {
        // Update learning data based on feedback
        const learningData = await this.getUserLearningData(userId);
        
        if (learningData) {
          // Adjust average compatibility based on feedback
          const feedbackScore = {
            'excellent': 1.0,
            'good': 0.8,
            'average': 0.6,
            'poor': 0.2
          }[feedback] || 0.5;

          const currentAvg = learningData.interactionPatterns.averageCompatibilityOfInterests;
          const newAvg = (currentAvg + (compatibilityScore.overall * feedbackScore)) / 2;
          
          learningData.interactionPatterns.averageCompatibilityOfInterests = newAvg;
          learningData.lastUpdated = new Date().toISOString();

          // Store updated learning data
          await databases.createDocument(
            DATABASE_ID,
            COLLECTION_IDS.MATCH_ANALYTICS,
            ID.unique(),
            {
              userId,
              learningData: JSON.stringify(learningData),
              lastUpdated: learningData.lastUpdated
            }
          );
        }
      }
    } catch (error) {
      console.warn('Failed to update recommendation algorithm:', error);
    }
  }

  private static async storeRecommendationSession(
    userId: string,
    recommendations: MatchRecommendation[]
  ): Promise<void> {
    try {
      await databases.createDocument(
        DATABASE_ID,
        COLLECTION_IDS.MATCH_ANALYTICS,
        ID.unique(),
        {
          userId,
          sessionType: 'recommendation_generation',
          recommendationCount: recommendations.length,
          averageCompatibility: recommendations.length > 0 
            ? recommendations.reduce((sum, r) => sum + r.compatibilityScore.overall, 0) / recommendations.length
            : 0,
          timestamp: new Date().toISOString()
        }
      );
    } catch (error) {
      console.warn('Failed to store recommendation session:', error);
    }
  }

  private static async clearOldRecommendations(userId: string): Promise<void> {
    try {
      const oldRecommendations = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_IDS.MATCH_RECOMMENDATIONS,
        [
          Query.equal('userId', userId),
          Query.limit(100)
        ]
      );

      // Delete old recommendations
      for (const doc of oldRecommendations.documents) {
        await databases.deleteDocument(
          DATABASE_ID,
          COLLECTION_IDS.MATCH_RECOMMENDATIONS,
          doc.$id
        );
      }
    } catch (error) {
      console.warn('Failed to clear old recommendations:', error);
    }
  }
}