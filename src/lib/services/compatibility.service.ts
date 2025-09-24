import { databases, AppwriteService } from '../appwrite';
import { DATABASE_ID, COLLECTION_IDS } from '../appwrite-config';
import { Query, ID } from 'appwrite';
import { calculateCompatibility } from '@/ai/flows/compatibility-scoring';
import type { Profile } from './profile.service';
import type {
  CompatibilityScore,
  CompatibilityBreakdown,
  MatchRecommendation,
  UserPreferences,
  MatchingCriteria,
  MatchAnalytics,
  LocationCompatibility,
  EducationCompatibility,
  ReligiousCompatibility,
  FamilyCompatibility,
  LifestyleCompatibility,
  PersonalityCompatibility
} from '../types/compatibility.types';

export class CompatibilityService {
  /**
   * Calculate compatibility score between two profiles using AI
   */
  static async calculateProfileCompatibility(
    userProfile: Profile,
    candidateProfile: Profile,
    userPreferences?: UserPreferences
  ): Promise<CompatibilityScore> {
    return AppwriteService.executeWithErrorHandling(async () => {
      // Prepare input for AI analysis
      const aiInput = {
        userProfile: JSON.stringify(userProfile),
        candidateProfile: JSON.stringify(candidateProfile),
        userPreferences: userPreferences ? JSON.stringify(userPreferences) : undefined,
        culturalContext: 'madhubani' as const
      };

      // Get AI analysis
      const aiResult = await calculateCompatibility(aiInput);

      // Build detailed compatibility breakdown
      const breakdown: CompatibilityBreakdown = {
        location: this.buildLocationCompatibility(userProfile, candidateProfile, aiResult.locationScore),
        education: this.buildEducationCompatibility(userProfile, candidateProfile, aiResult.educationScore),
        religious: this.buildReligiousCompatibility(userProfile, candidateProfile, aiResult.religiousScore),
        family: this.buildFamilyCompatibility(userProfile, candidateProfile, aiResult.familyScore),
        lifestyle: this.buildLifestyleCompatibility(userProfile, candidateProfile, aiResult.lifestyleScore),
        personality: this.buildPersonalityCompatibility(userProfile, candidateProfile, aiResult.personalityScore)
      };

      // Determine confidence level based on score and data completeness
      const confidenceLevel = this.calculateConfidenceLevel(userProfile, candidateProfile, aiResult.compatibilityScore);

      const compatibilityScore: CompatibilityScore = {
        overall: aiResult.compatibilityScore,
        breakdown,
        explanation: aiResult.explanation,
        matchReasons: aiResult.matchReasons,
        potentialConcerns: aiResult.potentialConcerns,
        confidenceLevel
      };

      // Store compatibility result for analytics
      await this.storeCompatibilityResult(userProfile.userId, candidateProfile.userId, compatibilityScore);

      return compatibilityScore;
    }, 'calculateProfileCompatibility');
  }

  /**
   * Get cached compatibility score if available
   */
  static async getCachedCompatibility(
    userId: string,
    candidateUserId: string
  ): Promise<CompatibilityScore | null> {
    return AppwriteService.executeWithErrorHandling(async () => {
      try {
        const results = await databases.listDocuments(
          DATABASE_ID,
          COLLECTION_IDS.COMPATIBILITY_SCORES,
          [
            Query.equal('userId', userId),
            Query.equal('candidateUserId', candidateUserId),
            Query.greaterThan('expiresAt', new Date().toISOString()),
            Query.limit(1)
          ]
        );

        if (results.documents.length > 0) {
          const doc = results.documents[0];
          return JSON.parse(doc.scoreData) as CompatibilityScore;
        }

        return null;
      } catch (error) {
        console.warn('Failed to get cached compatibility:', error);
        return null;
      }
    }, 'getCachedCompatibility');
  }

  /**
   * Get match recommendations for a user
   */
  static async getMatchRecommendations(
    userId: string,
    limit: number = 10
  ): Promise<MatchRecommendation[]> {
    return AppwriteService.executeWithErrorHandling(async () => {
      const results = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_IDS.MATCH_RECOMMENDATIONS,
        [
          Query.equal('userId', userId),
          Query.greaterThan('expiresAt', new Date().toISOString()),
          Query.orderDesc('compatibilityScore'),
          Query.limit(limit)
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
    }, 'getMatchRecommendations');
  }

  /**
   * Generate fresh match recommendations for a user
   */
  static async generateMatchRecommendations(
    userProfile: Profile,
    candidateProfiles: Profile[],
    userPreferences?: UserPreferences
  ): Promise<MatchRecommendation[]> {
    return AppwriteService.executeWithErrorHandling(async () => {
      const recommendations: MatchRecommendation[] = [];

      // Calculate compatibility for each candidate
      for (const candidate of candidateProfiles) {
        try {
          const compatibilityScore = await this.calculateProfileCompatibility(
            userProfile,
            candidate,
            userPreferences
          );

          // Only include recommendations above threshold
          if (compatibilityScore.overall >= 60) {
            const recommendation: MatchRecommendation = {
              profileId: candidate.$id!,
              userId: userProfile.userId,
              compatibilityScore,
              recommendationReason: this.generateRecommendationReason(compatibilityScore),
              priority: this.determinePriority(compatibilityScore.overall),
              generatedAt: new Date().toISOString(),
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
            };

            recommendations.push(recommendation);

            // Store recommendation
            await this.storeMatchRecommendation(recommendation);
          }
        } catch (error) {
          console.warn(`Failed to calculate compatibility for profile ${candidate.$id}:`, error);
        }
      }

      // Sort by compatibility score
      return recommendations.sort((a, b) => b.compatibilityScore.overall - a.compatibilityScore.overall);
    }, 'generateMatchRecommendations');
  }

  /**
   * Get user's matching analytics
   */
  static async getUserMatchAnalytics(userId: string): Promise<MatchAnalytics> {
    return AppwriteService.executeWithErrorHandling(async () => {
      // Get all compatibility scores for this user
      const compatibilityResults = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_IDS.COMPATIBILITY_SCORES,
        [
          Query.equal('userId', userId),
          Query.limit(100)
        ]
      );

      const scores = compatibilityResults.documents.map(doc => 
        JSON.parse(doc.scoreData) as CompatibilityScore
      );

      const totalMatches = scores.length;
      const highCompatibilityMatches = scores.filter(s => s.overall >= 80).length;
      const averageCompatibilityScore = totalMatches > 0 
        ? scores.reduce((sum, s) => sum + s.overall, 0) / totalMatches 
        : 0;

      // Analyze top matching factors
      const allReasons = scores.flatMap(s => s.matchReasons);
      const reasonCounts = allReasons.reduce((acc, reason) => {
        acc[reason] = (acc[reason] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topMatchingFactors = Object.entries(reasonCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([reason]) => reason);

      // Generate improvement suggestions
      const improvementSuggestions = this.generateImprovementSuggestions(scores);

      const analytics: MatchAnalytics = {
        userId,
        totalMatches,
        highCompatibilityMatches,
        averageCompatibilityScore: Math.round(averageCompatibilityScore),
        topMatchingFactors,
        improvementSuggestions,
        lastAnalyzedAt: new Date().toISOString()
      };

      return analytics;
    }, 'getUserMatchAnalytics');
  }

  // Private helper methods

  private static buildLocationCompatibility(
    userProfile: Profile,
    candidateProfile: Profile,
    score: number
  ): LocationCompatibility {
    let distance: LocationCompatibility['distance'] = 'distant';
    let explanation = '';

    if (userProfile.village === candidateProfile.village) {
      distance = 'same_village';
      explanation = 'Both from the same village, ensuring close family proximity and cultural familiarity.';
    } else if (userProfile.block === candidateProfile.block) {
      distance = 'same_block';
      explanation = 'Both from the same block, providing good accessibility and shared local culture.';
    } else if (userProfile.district === candidateProfile.district) {
      distance = 'same_district';
      explanation = 'Both from Madhubani district, sharing regional culture and traditions.';
    } else {
      const nearbyDistricts = ['Darbhanga', 'Sitamarhi', 'Samastipur'];
      if (nearbyDistricts.includes(candidateProfile.district)) {
        distance = 'nearby_district';
        explanation = 'From nearby districts, manageable distance with similar cultural background.';
      } else {
        explanation = 'Different regions may require more planning for family visits and cultural adaptation.';
      }
    }

    return { score, distance, explanation };
  }

  private static buildEducationCompatibility(
    userProfile: Profile,
    candidateProfile: Profile,
    score: number
  ): EducationCompatibility {
    let levelMatch: EducationCompatibility['levelMatch'] = 'different';
    let explanation = '';

    if (userProfile.education === candidateProfile.education) {
      levelMatch = 'exact';
      explanation = 'Same educational background provides shared academic experiences and perspectives.';
    } else {
      // Define education hierarchy for compatibility
      const educationLevels = {
        'High School': 1,
        'Intermediate': 2,
        'Bachelor\'s Degree': 3,
        'Master\'s Degree': 4,
        'Professional Degree': 5,
        'Doctorate': 6
      };

      const userLevel = educationLevels[userProfile.education as keyof typeof educationLevels] || 0;
      const candidateLevel = educationLevels[candidateProfile.education as keyof typeof educationLevels] || 0;
      const levelDiff = Math.abs(userLevel - candidateLevel);

      if (levelDiff <= 1) {
        levelMatch = 'compatible';
        explanation = 'Similar educational levels support mutual understanding and shared goals.';
      } else if (levelDiff === 2) {
        levelMatch = 'complementary';
        explanation = 'Different but complementary educational backgrounds can bring diverse perspectives.';
      } else {
        explanation = 'Significant educational differences may require understanding and adaptation.';
      }
    }

    return { score, levelMatch, explanation };
  }

  private static buildReligiousCompatibility(
    userProfile: Profile,
    candidateProfile: Profile,
    score: number
  ): ReligiousCompatibility {
    const sectMatch = userProfile.sect === candidateProfile.sect;
    let practiceLevel: ReligiousCompatibility['practiceLevel'] = 'different';
    let explanation = '';

    if (sectMatch) {
      explanation = `Both follow ${userProfile.sect} sect, ensuring aligned religious practices and beliefs. `;
      
      // Analyze religious practice similarity (simplified analysis)
      const userPractice = userProfile.religiousPractice.toLowerCase();
      const candidatePractice = candidateProfile.religiousPractice.toLowerCase();
      
      if (userPractice === candidatePractice) {
        practiceLevel = 'very_similar';
        explanation += 'Very similar religious practice levels.';
      } else {
        practiceLevel = 'similar';
        explanation += 'Similar religious commitment with minor differences.';
      }
    } else {
      explanation = `Different sects (${userProfile.sect} vs ${candidateProfile.sect}) may require family discussions and mutual understanding.`;
      practiceLevel = 'different';
    }

    return { score, sectMatch, practiceLevel, explanation };
  }

  private static buildFamilyCompatibility(
    userProfile: Profile,
    candidateProfile: Profile,
    score: number
  ): FamilyCompatibility {
    let backgroundMatch: FamilyCompatibility['backgroundMatch'] = 'different';
    const familyTypeMatch = userProfile.familyType === candidateProfile.familyType;
    let explanation = '';

    // Analyze family background similarity (simplified)
    const userBg = userProfile.familyBackground.toLowerCase();
    const candidateBg = candidateProfile.familyBackground.toLowerCase();
    
    // Check for common keywords or themes
    const commonWords = userBg.split(' ').filter(word => 
      candidateBg.includes(word) && word.length > 3
    );

    if (commonWords.length > 3) {
      backgroundMatch = 'very_similar';
      explanation = 'Very similar family backgrounds and values. ';
    } else if (commonWords.length > 1) {
      backgroundMatch = 'similar';
      explanation = 'Similar family backgrounds with shared values. ';
    } else {
      backgroundMatch = 'complementary';
      explanation = 'Different but potentially complementary family backgrounds. ';
    }

    if (familyTypeMatch) {
      explanation += `Both prefer ${userProfile.familyType} family structure.`;
    } else {
      explanation += 'Different family type preferences may need discussion.';
    }

    return { score, backgroundMatch, familyTypeMatch, explanation };
  }

  private static buildLifestyleCompatibility(
    userProfile: Profile,
    candidateProfile: Profile,
    score: number
  ): LifestyleCompatibility {
    let occupationMatch: LifestyleCompatibility['occupationMatch'] = 'different';
    let explanation = '';

    if (userProfile.occupation === candidateProfile.occupation) {
      occupationMatch = 'same_field';
      explanation = 'Same occupation provides shared professional understanding. ';
    } else {
      // Define compatible occupation groups
      const professionalFields = ['Doctor', 'Engineer', 'Teacher', 'Lawyer'];
      const businessFields = ['Business', 'Entrepreneur', 'Trader'];
      const serviceFields = ['Government Job', 'Private Job', 'Banking'];

      const getUserField = (occupation: string) => {
        if (professionalFields.includes(occupation)) return 'professional';
        if (businessFields.includes(occupation)) return 'business';
        if (serviceFields.includes(occupation)) return 'service';
        return 'other';
      };

      const userField = getUserField(userProfile.occupation);
      const candidateField = getUserField(candidateProfile.occupation);

      if (userField === candidateField) {
        occupationMatch = 'compatible';
        explanation = 'Compatible professional fields with similar work cultures. ';
      } else {
        occupationMatch = 'complementary';
        explanation = 'Different but complementary professional backgrounds. ';
      }
    }

    // Calculate skills overlap
    const userSkills = userProfile.skills || [];
    const candidateSkills = candidateProfile.skills || [];
    const commonSkills = userSkills.filter(skill => candidateSkills.includes(skill));
    const skillsOverlap = userSkills.length > 0 
      ? (commonSkills.length / userSkills.length) * 100 
      : 0;

    if (skillsOverlap > 50) {
      explanation += 'Strong overlap in skills and interests.';
    } else if (skillsOverlap > 20) {
      explanation += 'Some shared skills and interests.';
    } else {
      explanation += 'Different skill sets can bring complementary strengths.';
    }

    return { score, occupationMatch, skillsOverlap: Math.round(skillsOverlap), explanation };
  }

  private static buildPersonalityCompatibility(
    userProfile: Profile,
    candidateProfile: Profile,
    score: number
  ): PersonalityCompatibility {
    // Simplified personality analysis based on bio content
    const userBio = userProfile.bio.toLowerCase();
    const candidateBio = candidateProfile.bio.toLowerCase();

    // Calculate bio similarity (simplified)
    const userWords = userBio.split(' ').filter(word => word.length > 3);
    const candidateWords = candidateBio.split(' ').filter(word => word.length > 3);
    const commonWords = userWords.filter(word => candidateWords.includes(word));
    const bioSimilarity = userWords.length > 0 
      ? (commonWords.length / userWords.length) * 100 
      : 0;

    let communicationStyle: PersonalityCompatibility['communicationStyle'] = 'neutral';
    let explanation = '';

    if (bioSimilarity > 30) {
      communicationStyle = 'very_compatible';
      explanation = 'Very similar communication styles and personality traits evident from profiles.';
    } else if (bioSimilarity > 15) {
      communicationStyle = 'compatible';
      explanation = 'Compatible communication styles with shared personality aspects.';
    } else if (bioSimilarity > 5) {
      communicationStyle = 'neutral';
      explanation = 'Neutral compatibility - different but potentially complementary personalities.';
    } else {
      communicationStyle = 'challenging';
      explanation = 'Different communication styles may require patience and understanding.';
    }

    return { 
      score, 
      bioSimilarity: Math.round(bioSimilarity), 
      communicationStyle, 
      explanation 
    };
  }

  private static calculateConfidenceLevel(
    userProfile: Profile,
    candidateProfile: Profile,
    score: number
  ): 'low' | 'medium' | 'high' {
    // Calculate profile completeness
    const userCompleteness = userProfile.isProfileComplete ? 1 : 0.5;
    const candidateCompleteness = candidateProfile.isProfileComplete ? 1 : 0.5;
    const avgCompleteness = (userCompleteness + candidateCompleteness) / 2;

    // Factor in verification status
    const verificationBonus = (userProfile.isVerified ? 0.1 : 0) + (candidateProfile.isVerified ? 0.1 : 0);
    
    const confidenceScore = avgCompleteness + verificationBonus;

    if (confidenceScore >= 0.9 && score >= 70) return 'high';
    if (confidenceScore >= 0.7 && score >= 50) return 'medium';
    return 'low';
  }

  private static async storeCompatibilityResult(
    userId: string,
    candidateUserId: string,
    compatibilityScore: CompatibilityScore
  ): Promise<void> {
    try {
      await databases.createDocument(
        DATABASE_ID,
        COLLECTION_IDS.COMPATIBILITY_SCORES,
        ID.unique(),
        {
          userId,
          candidateUserId,
          scoreData: JSON.stringify(compatibilityScore),
          overallScore: compatibilityScore.overall,
          confidenceLevel: compatibilityScore.confidenceLevel,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        }
      );
    } catch (error) {
      console.warn('Failed to store compatibility result:', error);
    }
  }

  private static async storeMatchRecommendation(recommendation: MatchRecommendation): Promise<void> {
    try {
      await databases.createDocument(
        DATABASE_ID,
        COLLECTION_IDS.MATCH_RECOMMENDATIONS,
        ID.unique(),
        {
          userId: recommendation.userId,
          profileId: recommendation.profileId,
          compatibilityData: JSON.stringify(recommendation.compatibilityScore),
          compatibilityScore: recommendation.compatibilityScore.overall,
          recommendationReason: recommendation.recommendationReason,
          priority: recommendation.priority,
          generatedAt: recommendation.generatedAt,
          expiresAt: recommendation.expiresAt
        }
      );
    } catch (error) {
      console.warn('Failed to store match recommendation:', error);
    }
  }

  private static generateRecommendationReason(compatibilityScore: CompatibilityScore): string {
    const topReasons = compatibilityScore.matchReasons.slice(0, 2);
    return `High compatibility (${compatibilityScore.overall}%) based on: ${topReasons.join(', ')}`;
  }

  private static determinePriority(score: number): 'high' | 'medium' | 'low' {
    if (score >= 85) return 'high';
    if (score >= 70) return 'medium';
    return 'low';
  }

  private static generateImprovementSuggestions(scores: CompatibilityScore[]): string[] {
    const suggestions: string[] = [];
    
    if (scores.length === 0) {
      return ['Complete your profile to get better match recommendations'];
    }

    // Analyze common concerns
    const allConcerns = scores.flatMap(s => s.potentialConcerns);
    const concernCounts = allConcerns.reduce((acc, concern) => {
      acc[concern] = (acc[concern] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topConcerns = Object.entries(concernCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([concern]) => concern);

    // Generate suggestions based on concerns
    topConcerns.forEach(concern => {
      if (concern.toLowerCase().includes('location')) {
        suggestions.push('Consider expanding your location preferences to nearby districts');
      } else if (concern.toLowerCase().includes('education')) {
        suggestions.push('Highlight your educational achievements and career goals more clearly');
      } else if (concern.toLowerCase().includes('religious')) {
        suggestions.push('Provide more details about your religious practices and beliefs');
      } else if (concern.toLowerCase().includes('family')) {
        suggestions.push('Add more information about your family background and values');
      }
    });

    // Average score analysis
    const avgScore = scores.reduce((sum, s) => sum + s.overall, 0) / scores.length;
    if (avgScore < 60) {
      suggestions.push('Complete your profile with more detailed information to improve match quality');
    }

    return suggestions.slice(0, 3); // Return top 3 suggestions
  }
}