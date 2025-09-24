/**
 * Test file for compatibility scoring functionality
 * This file can be used to test the AI-powered compatibility scoring system
 */

import { CompatibilityService } from './services/compatibility.service';
import type { Profile } from './services/profile.service';
import type { UserPreferences } from './types/compatibility.types';

// Mock profiles for testing
const mockUserProfile: Profile = {
  $id: 'user1',
  userId: 'user1',
  name: 'Ahmed Khan',
  age: 28,
  dateOfBirth: '1995-05-15',
  gender: 'male',
  email: 'ahmed@example.com',
  district: 'Madhubani',
  block: 'Jainagar',
  village: 'Rajnagar',
  education: 'Bachelor\'s Degree',
  occupation: 'Engineer',
  sect: 'Sunni',
  religiousPractice: 'Regular prayers, follows Islamic principles',
  familyBackground: 'Respectable family with strong Islamic values. Father is a teacher, mother is homemaker.',
  bio: 'Looking for a life partner who shares similar values and beliefs. I enjoy reading, technology, and spending time with family.',
  maritalStatus: 'single',
  familyType: 'joint',
  skills: ['Programming', 'Reading', 'Cricket'],
  isPhotoBlurred: false,
  isVerified: true,
  isProfileComplete: true,
  profileVisibility: 'members',
  profileViewCount: 25,
  isActive: true,
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-20T15:30:00Z',
  lastActiveAt: '2024-01-22T09:15:00Z'
};

const mockCandidateProfile: Profile = {
  $id: 'candidate1',
  userId: 'candidate1',
  name: 'Fatima Begum',
  age: 25,
  dateOfBirth: '1998-08-20',
  gender: 'female',
  email: 'fatima@example.com',
  district: 'Madhubani',
  block: 'Madhubani',
  village: 'Benipatti',
  education: 'Master\'s Degree',
  occupation: 'Teacher',
  sect: 'Sunni',
  religiousPractice: 'Devout Muslim, regular prayers and fasting',
  familyBackground: 'Well-educated family with Islamic values. Father is a government officer, mother is a teacher.',
  bio: 'Seeking a caring and understanding life partner. I love teaching, reading Islamic literature, and helping in community work.',
  maritalStatus: 'single',
  familyType: 'nuclear',
  skills: ['Teaching', 'Quran Reading', 'Cooking'],
  isPhotoBlurred: true,
  isVerified: true,
  isProfileComplete: true,
  profileVisibility: 'members',
  profileViewCount: 18,
  isActive: true,
  createdAt: '2024-01-10T14:00:00Z',
  updatedAt: '2024-01-21T11:20:00Z',
  lastActiveAt: '2024-01-22T08:45:00Z'
};

const mockUserPreferences: UserPreferences = {
  ageRange: { min: 22, max: 30 },
  locationPreference: ['Madhubani', 'Darbhanga'],
  educationPreference: ['Bachelor\'s Degree', 'Master\'s Degree'],
  sectPreference: ['Sunni'],
  occupationPreference: ['Teacher', 'Doctor', 'Engineer'],
  maritalStatusPreference: ['single'],
  familyTypePreference: ['nuclear', 'joint'],
  mustHavePhoto: false,
  verifiedOnly: true
};

/**
 * Test compatibility calculation
 */
export async function testCompatibilityCalculation() {
  console.log('🧪 Testing Compatibility Calculation...');
  
  try {
    const compatibilityScore = await CompatibilityService.calculateProfileCompatibility(
      mockUserProfile,
      mockCandidateProfile,
      mockUserPreferences
    );

    console.log('✅ Compatibility Score Calculated:');
    console.log(`Overall Score: ${compatibilityScore.overall}%`);
    console.log(`Confidence Level: ${compatibilityScore.confidenceLevel}`);
    console.log('Breakdown:');
    console.log(`  - Location: ${compatibilityScore.breakdown.location.score}%`);
    console.log(`  - Education: ${compatibilityScore.breakdown.education.score}%`);
    console.log(`  - Religious: ${compatibilityScore.breakdown.religious.score}%`);
    console.log(`  - Family: ${compatibilityScore.breakdown.family.score}%`);
    console.log(`  - Lifestyle: ${compatibilityScore.breakdown.lifestyle.score}%`);
    console.log(`  - Personality: ${compatibilityScore.breakdown.personality.score}%`);
    
    console.log('\nMatch Reasons:');
    compatibilityScore.matchReasons.forEach((reason, index) => {
      console.log(`  ${index + 1}. ${reason}`);
    });

    if (compatibilityScore.potentialConcerns.length > 0) {
      console.log('\nPotential Concerns:');
      compatibilityScore.potentialConcerns.forEach((concern, index) => {
        console.log(`  ${index + 1}. ${concern}`);
      });
    }

    console.log(`\nAI Explanation: ${compatibilityScore.explanation}`);

    return compatibilityScore;
  } catch (error) {
    console.error('❌ Compatibility calculation failed:', error);
    throw error;
  }
}

/**
 * Test cached compatibility retrieval
 */
export async function testCachedCompatibility() {
  console.log('🧪 Testing Cached Compatibility...');
  
  try {
    const cached = await CompatibilityService.getCachedCompatibility(
      mockUserProfile.userId,
      mockCandidateProfile.userId
    );

    if (cached) {
      console.log('✅ Found cached compatibility score:', cached.overall);
    } else {
      console.log('ℹ️ No cached compatibility score found');
    }

    return cached;
  } catch (error) {
    console.error('❌ Cached compatibility test failed:', error);
    throw error;
  }
}

/**
 * Test match recommendations generation
 */
export async function testMatchRecommendations() {
  console.log('🧪 Testing Match Recommendations...');
  
  try {
    const candidateProfiles = [mockCandidateProfile];
    
    const recommendations = await CompatibilityService.generateMatchRecommendations(
      mockUserProfile,
      candidateProfiles,
      mockUserPreferences
    );

    console.log(`✅ Generated ${recommendations.length} recommendations:`);
    recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. Profile ${rec.profileId} - ${rec.compatibilityScore.overall}% (${rec.priority} priority)`);
      console.log(`     Reason: ${rec.recommendationReason}`);
    });

    return recommendations;
  } catch (error) {
    console.error('❌ Match recommendations test failed:', error);
    throw error;
  }
}

/**
 * Test user analytics
 */
export async function testUserAnalytics() {
  console.log('🧪 Testing User Analytics...');
  
  try {
    const analytics = await CompatibilityService.getUserMatchAnalytics(mockUserProfile.userId);

    console.log('✅ User Analytics:');
    console.log(`Total Matches: ${analytics.totalMatches}`);
    console.log(`High Compatibility Matches: ${analytics.highCompatibilityMatches}`);
    console.log(`Average Compatibility Score: ${analytics.averageCompatibilityScore}%`);
    console.log('Top Matching Factors:', analytics.topMatchingFactors);
    console.log('Improvement Suggestions:', analytics.improvementSuggestions);

    return analytics;
  } catch (error) {
    console.error('❌ User analytics test failed:', error);
    throw error;
  }
}

/**
 * Run all compatibility tests
 */
export async function runAllCompatibilityTests() {
  console.log('🚀 Running All Compatibility Tests...\n');
  
  try {
    // Test 1: Calculate compatibility
    await testCompatibilityCalculation();
    console.log('\n' + '='.repeat(50) + '\n');

    // Test 2: Check cached compatibility
    await testCachedCompatibility();
    console.log('\n' + '='.repeat(50) + '\n');

    // Test 3: Generate recommendations
    await testMatchRecommendations();
    console.log('\n' + '='.repeat(50) + '\n');

    // Test 4: Get user analytics
    await testUserAnalytics();
    console.log('\n' + '='.repeat(50) + '\n');

    console.log('✅ All compatibility tests completed successfully!');
  } catch (error) {
    console.error('❌ Compatibility tests failed:', error);
  }
}

// Export mock data for use in other tests
export {
  mockUserProfile,
  mockCandidateProfile,
  mockUserPreferences
};