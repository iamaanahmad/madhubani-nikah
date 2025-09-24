import { describe, it, expect, beforeEach } from 'vitest'

// Mock profile search workflow
interface Profile {
  id: string
  userId: string
  name: string
  age: number
  gender: 'male' | 'female'
  district: string
  block: string
  education: string
  occupation: string
  sect: 'Sunni' | 'Shia' | 'Other'
  maritalStatus: 'single' | 'divorced' | 'widowed'
  isActive: boolean
  isVerified: boolean
  lastActiveAt: string
  createdAt: string
}

interface SearchFilters {
  gender?: 'male' | 'female'
  ageMin?: number
  ageMax?: number
  district?: string
  education?: string
  sect?: string
  maritalStatus?: string
  isVerified?: boolean
}

interface SearchResult {
  profiles: Profile[]
  total: number
  page: number
  limit: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

// Mock search service
class MockSearchService {
  private profiles: Profile[] = []

  constructor() {
    this.seedProfiles()
  }

  private seedProfiles() {
    this.profiles = [
      {
        id: 'profile1',
        userId: 'user1',
        name: 'Ahmed Khan',
        age: 25,
        gender: 'male',
        district: 'Madhubani',
        block: 'Sadar',
        education: 'Graduate',
        occupation: 'Engineer',
        sect: 'Sunni',
        maritalStatus: 'single',
        isActive: true,
        isVerified: true,
        lastActiveAt: new Date().toISOString(),
        createdAt: '2024-01-01T00:00:00Z'
      },
      {
        id: 'profile2',
        userId: 'user2',
        name: 'Fatima Ali',
        age: 23,
        gender: 'female',
        district: 'Madhubani',
        block: 'Jhanjharpur',
        education: 'Graduate',
        occupation: 'Teacher',
        sect: 'Sunni',
        maritalStatus: 'single',
        isActive: true,
        isVerified: true,
        lastActiveAt: new Date().toISOString(),
        createdAt: '2024-01-02T00:00:00Z'
      },
      {
        id: 'profile3',
        userId: 'user3',
        name: 'Mohammad Hassan',
        age: 30,
        gender: 'male',
        district: 'Darbhanga',
        block: 'Sadar',
        education: 'Post Graduate',
        occupation: 'Doctor',
        sect: 'Shia',
        maritalStatus: 'single',
        isActive: true,
        isVerified: false,
        lastActiveAt: new Date().toISOString(),
        createdAt: '2024-01-03T00:00:00Z'
      },
      {
        id: 'profile4',
        userId: 'user4',
        name: 'Zainab Sheikh',
        age: 27,
        gender: 'female',
        district: 'Madhubani',
        block: 'Benipatti',
        education: 'Post Graduate',
        occupation: 'Software Engineer',
        sect: 'Sunni',
        maritalStatus: 'divorced',
        isActive: true,
        isVerified: true,
        lastActiveAt: new Date().toISOString(),
        createdAt: '2024-01-04T00:00:00Z'
      },
      {
        id: 'profile5',
        userId: 'user5',
        name: 'Ali Raza',
        age: 35,
        gender: 'male',
        district: 'Sitamarhi',
        block: 'Sadar',
        education: 'Graduate',
        occupation: 'Business',
        sect: 'Sunni',
        maritalStatus: 'widowed',
        isActive: false,
        isVerified: true,
        lastActiveAt: '2024-01-01T00:00:00Z',
        createdAt: '2024-01-05T00:00:00Z'
      }
    ]
  }

  async searchProfiles(filters: SearchFilters, page: number = 1, limit: number = 10): Promise<SearchResult> {
    let filteredProfiles = this.profiles.filter(profile => {
      // Only show active profiles
      if (!profile.isActive) return false

      // Apply filters
      if (filters.gender && profile.gender !== filters.gender) return false
      if (filters.ageMin && profile.age < filters.ageMin) return false
      if (filters.ageMax && profile.age > filters.ageMax) return false
      if (filters.district && profile.district !== filters.district) return false
      if (filters.education && profile.education !== filters.education) return false
      if (filters.sect && profile.sect !== filters.sect) return false
      if (filters.maritalStatus && profile.maritalStatus !== filters.maritalStatus) return false
      if (filters.isVerified !== undefined && profile.isVerified !== filters.isVerified) return false

      return true
    })

    // Sort by last active (most recent first)
    filteredProfiles.sort((a, b) => new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime())

    // Pagination
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedProfiles = filteredProfiles.slice(startIndex, endIndex)

    return {
      profiles: paginatedProfiles,
      total: filteredProfiles.length,
      page,
      limit,
      hasNextPage: endIndex < filteredProfiles.length,
      hasPreviousPage: page > 1
    }
  }

  async getRecommendedProfiles(userProfile: Profile, limit: number = 5): Promise<Profile[]> {
    const compatibleProfiles = this.profiles
      .filter(profile => {
        // Exclude self and inactive profiles
        if (profile.userId === userProfile.userId || !profile.isActive) return false
        
        // Opposite gender
        if (profile.gender === userProfile.gender) return false
        
        // Age compatibility (within 10 years)
        const ageDiff = Math.abs(profile.age - userProfile.age)
        if (ageDiff > 10) return false
        
        return true
      })
      .map(profile => ({
        ...profile,
        compatibilityScore: this.calculateCompatibilityScore(userProfile, profile)
      }))
      .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
      .slice(0, limit)

    return compatibleProfiles
  }

  private calculateCompatibilityScore(profile1: Profile, profile2: Profile): number {
    let score = 0

    // Same district bonus
    if (profile1.district === profile2.district) score += 30
    
    // Same education level bonus
    if (profile1.education === profile2.education) score += 20
    
    // Same sect bonus
    if (profile1.sect === profile2.sect) score += 25
    
    // Age compatibility
    const ageDiff = Math.abs(profile1.age - profile2.age)
    if (ageDiff <= 3) score += 15
    else if (ageDiff <= 5) score += 10
    else if (ageDiff <= 7) score += 5
    
    // Verification bonus
    if (profile2.isVerified) score += 10

    return score
  }
}

// Integration test workflow
class ProfileSearchWorkflow {
  constructor(private searchService: MockSearchService) {}

  async performBasicSearch(filters: SearchFilters, page: number = 1) {
    return await this.searchService.searchProfiles(filters, page, 10)
  }

  async performAdvancedSearch(filters: SearchFilters, sortBy: 'recent' | 'age' | 'verified' = 'recent') {
    const result = await this.searchService.searchProfiles(filters, 1, 50)
    
    // Apply additional sorting
    switch (sortBy) {
      case 'age':
        result.profiles.sort((a, b) => a.age - b.age)
        break
      case 'verified':
        result.profiles.sort((a, b) => (b.isVerified ? 1 : 0) - (a.isVerified ? 1 : 0))
        break
      case 'recent':
      default:
        // Already sorted by lastActiveAt in service
        break
    }

    return result
  }

  async getMatchRecommendations(userProfile: Profile) {
    return await this.searchService.getRecommendedProfiles(userProfile, 5)
  }

  async performMultiStepSearch(initialFilters: SearchFilters, refinements: SearchFilters[]) {
    let currentResult = await this.searchService.searchProfiles(initialFilters)
    const searchHistory = [{ filters: initialFilters, resultCount: currentResult.total }]

    for (const refinement of refinements) {
      const combinedFilters = { ...initialFilters, ...refinement }
      currentResult = await this.searchService.searchProfiles(combinedFilters)
      searchHistory.push({ filters: combinedFilters, resultCount: currentResult.total })
    }

    return {
      finalResult: currentResult,
      searchHistory
    }
  }
}

describe('Profile Search Integration Tests', () => {
  let searchService: MockSearchService
  let workflow: ProfileSearchWorkflow

  beforeEach(() => {
    searchService = new MockSearchService()
    workflow = new ProfileSearchWorkflow(searchService)
  })

  describe('Basic Search Functionality', () => {
    it('should search profiles by gender', async () => {
      const result = await workflow.performBasicSearch({ gender: 'female' })

      expect(result.profiles).toHaveLength(2)
      expect(result.total).toBe(2)
      expect(result.profiles.every(p => p.gender === 'female')).toBe(true)
    })

    it('should search profiles by age range', async () => {
      const result = await workflow.performBasicSearch({ ageMin: 25, ageMax: 30 })

      expect(result.profiles).toHaveLength(3)
      expect(result.profiles.every(p => p.age >= 25 && p.age <= 30)).toBe(true)
    })

    it('should search profiles by district', async () => {
      const result = await workflow.performBasicSearch({ district: 'Madhubani' })

      expect(result.profiles).toHaveLength(3)
      expect(result.profiles.every(p => p.district === 'Madhubani')).toBe(true)
    })

    it('should search profiles by verification status', async () => {
      const result = await workflow.performBasicSearch({ isVerified: true })

      expect(result.profiles.every(p => p.isVerified === true)).toBe(true)
    })

    it('should combine multiple search filters', async () => {
      const result = await workflow.performBasicSearch({
        gender: 'female',
        district: 'Madhubani',
        isVerified: true
      })

      expect(result.profiles).toHaveLength(2)
      expect(result.profiles.every(p => 
        p.gender === 'female' && 
        p.district === 'Madhubani' && 
        p.isVerified === true
      )).toBe(true)
    })
  })

  describe('Advanced Search Features', () => {
    it('should sort results by age', async () => {
      const result = await workflow.performAdvancedSearch({ gender: 'male' }, 'age')

      expect(result.profiles).toHaveLength(2)
      expect(result.profiles[0].age).toBeLessThanOrEqual(result.profiles[1].age)
    })

    it('should prioritize verified profiles', async () => {
      const result = await workflow.performAdvancedSearch({}, 'verified')

      const verifiedCount = result.profiles.filter(p => p.isVerified).length
      const unverifiedCount = result.profiles.filter(p => !p.isVerified).length
      
      // Verified profiles should come first
      if (verifiedCount > 0 && unverifiedCount > 0) {
        const firstUnverifiedIndex = result.profiles.findIndex(p => !p.isVerified)
        const lastVerifiedIndex = result.profiles.map(p => p.isVerified).lastIndexOf(true)
        expect(lastVerifiedIndex).toBeLessThan(firstUnverifiedIndex)
      }
    })

    it('should handle empty search results', async () => {
      const result = await workflow.performBasicSearch({
        gender: 'female',
        ageMin: 50,
        ageMax: 60
      })

      expect(result.profiles).toHaveLength(0)
      expect(result.total).toBe(0)
      expect(result.hasNextPage).toBe(false)
    })
  })

  describe('Pagination', () => {
    it('should handle pagination correctly', async () => {
      const page1 = await workflow.performBasicSearch({}, 1)
      const page2 = await workflow.performBasicSearch({}, 2)

      expect(page1.page).toBe(1)
      expect(page1.hasPreviousPage).toBe(false)
      
      if (page1.total > page1.limit) {
        expect(page1.hasNextPage).toBe(true)
        expect(page2.page).toBe(2)
        expect(page2.hasPreviousPage).toBe(true)
      }
    })

    it('should calculate pagination metadata correctly', async () => {
      const result = await workflow.performBasicSearch({})

      expect(result.page).toBe(1)
      expect(result.limit).toBe(10)
      expect(typeof result.hasNextPage).toBe('boolean')
      expect(typeof result.hasPreviousPage).toBe('boolean')
      expect(result.total).toBeGreaterThanOrEqual(result.profiles.length)
    })
  })

  describe('Match Recommendations', () => {
    it('should provide relevant match recommendations', async () => {
      const userProfile: Profile = {
        id: 'user_profile',
        userId: 'current_user',
        name: 'Current User',
        age: 26,
        gender: 'male',
        district: 'Madhubani',
        block: 'Sadar',
        education: 'Graduate',
        occupation: 'Engineer',
        sect: 'Sunni',
        maritalStatus: 'single',
        isActive: true,
        isVerified: true,
        lastActiveAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      }

      const recommendations = await workflow.getMatchRecommendations(userProfile)

      expect(recommendations).toHaveLength(2) // Only 2 active female profiles
      expect(recommendations.every(p => p.gender === 'female')).toBe(true)
      expect(recommendations.every(p => p.isActive)).toBe(true)
    })

    it('should exclude same gender profiles from recommendations', async () => {
      const femaleUserProfile: Profile = {
        id: 'female_user',
        userId: 'female_current_user',
        name: 'Female User',
        age: 24,
        gender: 'female',
        district: 'Madhubani',
        block: 'Sadar',
        education: 'Graduate',
        occupation: 'Teacher',
        sect: 'Sunni',
        maritalStatus: 'single',
        isActive: true,
        isVerified: true,
        lastActiveAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      }

      const recommendations = await workflow.getMatchRecommendations(femaleUserProfile)

      expect(recommendations.every(p => p.gender === 'male')).toBe(true)
    })
  })

  describe('Multi-Step Search Refinement', () => {
    it('should track search refinement history', async () => {
      const initialFilters = { gender: 'female' as const }
      const refinements = [
        { district: 'Madhubani' },
        { isVerified: true },
        { ageMin: 25 }
      ]

      const result = await workflow.performMultiStepSearch(initialFilters, refinements)

      expect(result.searchHistory).toHaveLength(4) // Initial + 3 refinements
      expect(result.searchHistory[0].resultCount).toBeGreaterThanOrEqual(result.searchHistory[1].resultCount)
      expect(result.finalResult.profiles.every(p => 
        p.gender === 'female' && 
        p.district === 'Madhubani' && 
        p.isVerified === true && 
        p.age >= 25
      )).toBe(true)
    })

    it('should handle progressive filtering', async () => {
      const initialFilters = {}
      const refinements = [
        { gender: 'male' as const },
        { district: 'Madhubani' },
        { isVerified: true }
      ]

      const result = await workflow.performMultiStepSearch(initialFilters, refinements)

      // Each refinement should reduce or maintain the result count
      for (let i = 1; i < result.searchHistory.length; i++) {
        expect(result.searchHistory[i].resultCount).toBeLessThanOrEqual(result.searchHistory[i - 1].resultCount)
      }
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid age ranges', async () => {
      const result = await workflow.performBasicSearch({ ageMin: 50, ageMax: 20 })

      expect(result.profiles).toHaveLength(0)
      expect(result.total).toBe(0)
    })

    it('should filter out inactive profiles', async () => {
      const result = await workflow.performBasicSearch({})

      expect(result.profiles.every(p => p.isActive)).toBe(true)
    })

    it('should handle concurrent search requests', async () => {
      const searches = [
        workflow.performBasicSearch({ gender: 'male' }),
        workflow.performBasicSearch({ gender: 'female' }),
        workflow.performBasicSearch({ district: 'Madhubani' })
      ]

      const results = await Promise.all(searches)

      expect(results).toHaveLength(3)
      results.forEach(result => {
        expect(result.profiles).toBeDefined()
        expect(result.total).toBeGreaterThanOrEqual(0)
      })
    })
  })
})