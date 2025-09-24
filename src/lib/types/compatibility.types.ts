/**
 * Types for AI-powered compatibility scoring and matching system
 */

export interface CompatibilityScore {
  overall: number; // 0-100 overall compatibility score
  breakdown: CompatibilityBreakdown;
  explanation: string;
  matchReasons: string[];
  potentialConcerns: string[];
  confidenceLevel: 'low' | 'medium' | 'high';
}

export interface CompatibilityBreakdown {
  location: LocationCompatibility;
  education: EducationCompatibility;
  religious: ReligiousCompatibility;
  family: FamilyCompatibility;
  lifestyle: LifestyleCompatibility;
  personality: PersonalityCompatibility;
}

export interface LocationCompatibility {
  score: number; // 0-100
  distance: 'same_village' | 'same_block' | 'same_district' | 'nearby_district' | 'distant';
  explanation: string;
}

export interface EducationCompatibility {
  score: number; // 0-100
  levelMatch: 'exact' | 'compatible' | 'complementary' | 'different';
  explanation: string;
}

export interface ReligiousCompatibility {
  score: number; // 0-100
  sectMatch: boolean;
  practiceLevel: 'very_similar' | 'similar' | 'somewhat_different' | 'different';
  explanation: string;
}

export interface FamilyCompatibility {
  score: number; // 0-100
  backgroundMatch: 'very_similar' | 'similar' | 'complementary' | 'different';
  familyTypeMatch: boolean;
  explanation: string;
}

export interface LifestyleCompatibility {
  score: number; // 0-100
  occupationMatch: 'same_field' | 'compatible' | 'complementary' | 'different';
  skillsOverlap: number; // 0-100 percentage of overlapping skills/interests
  explanation: string;
}

export interface PersonalityCompatibility {
  score: number; // 0-100
  bioSimilarity: number; // 0-100 based on bio analysis
  communicationStyle: 'very_compatible' | 'compatible' | 'neutral' | 'challenging';
  explanation: string;
}

export interface MatchRecommendation {
  profileId: string;
  userId: string;
  compatibilityScore: CompatibilityScore;
  recommendationReason: string;
  priority: 'high' | 'medium' | 'low';
  generatedAt: string;
  expiresAt: string;
}

export interface UserPreferences {
  ageRange: { min: number; max: number };
  locationPreference: string[];
  educationPreference: string[];
  sectPreference: string[];
  occupationPreference: string[];
  maritalStatusPreference: string[];
  familyTypePreference?: string[];
  mustHavePhoto: boolean;
  verifiedOnly: boolean;
}

export interface MatchingCriteria {
  userId: string;
  preferences: UserPreferences;
  dealBreakers: string[];
  importanceWeights: {
    location: number; // 0-1
    education: number; // 0-1
    religious: number; // 0-1
    family: number; // 0-1
    lifestyle: number; // 0-1
    personality: number; // 0-1
  };
}

export interface AIMatchingInput {
  userProfile: string; // JSON string of user profile
  candidateProfile: string; // JSON string of candidate profile
  userPreferences?: UserPreferences;
  culturalContext: 'madhubani' | 'bihar' | 'general';
}

export interface AIMatchingOutput {
  compatibilityScore: number;
  explanation: string;
  matchReasons: string[];
  potentialConcerns: string[];
  recommendationLevel: 'highly_recommended' | 'recommended' | 'consider' | 'not_recommended';
}

export interface MatchAnalytics {
  userId: string;
  totalMatches: number;
  highCompatibilityMatches: number;
  averageCompatibilityScore: number;
  topMatchingFactors: string[];
  improvementSuggestions: string[];
  lastAnalyzedAt: string;
}

export interface CompatibilityTrends {
  userId: string;
  weeklyStats: {
    week: string;
    averageScore: number;
    matchCount: number;
    topFactors: string[];
  }[];
  monthlyImprovement: number;
  bestMatchingCriteria: string[];
}