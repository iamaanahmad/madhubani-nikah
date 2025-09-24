import { describe, it, expect } from 'vitest'

// Data processing functions for testing
function filterProfiles(profiles: any[], filters: any) {
  return profiles.filter(profile => {
    if (filters.gender && profile.gender !== filters.gender) return false
    if (filters.ageMin && profile.age < filters.ageMin) return false
    if (filters.ageMax && profile.age > filters.ageMax) return false
    if (filters.district && profile.district !== filters.district) return false
    if (filters.education && profile.education !== filters.education) return false
    return true
  })
}

function calculateCompatibility(profile1: any, profile2: any): number {
  let score = 0
  let factors = 0

  // Age compatibility (max 25 points)
  const ageDiff = Math.abs(profile1.age - profile2.age)
  if (ageDiff <= 2) score += 25
  else if (ageDiff <= 5) score += 15
  else if (ageDiff <= 10) score += 5
  factors++

  // Location compatibility (max 25 points)
  if (profile1.district === profile2.district) {
    score += 25
    if (profile1.block === profile2.block) score += 5 // Bonus
  } else if (profile1.nearbyDistricts?.includes(profile2.district)) {
    score += 15
  }
  factors++

  // Education compatibility (max 25 points)
  if (profile1.education === profile2.education) score += 25
  else if (profile1.education === 'Graduate' && profile2.education === 'Post Graduate') score += 20
  else if (profile1.education === 'Post Graduate' && profile2.education === 'Graduate') score += 20
  factors++

  // Religious compatibility (max 25 points)
  if (profile1.sect === profile2.sect) score += 25
  else if (profile1.sect && profile2.sect) score += 10 // Different sects but both specified
  factors++

  return Math.min(100, score)
}

function sortProfilesByRelevance(profiles: any[], userProfile: any) {
  return profiles
    .map(profile => ({
      ...profile,
      compatibilityScore: calculateCompatibility(userProfile, profile)
    }))
    .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
}

function paginateResults(items: any[], page: number, limit: number) {
  const startIndex = (page - 1) * limit
  const endIndex = startIndex + limit
  
  return {
    items: items.slice(startIndex, endIndex),
    totalItems: items.length,
    totalPages: Math.ceil(items.length / limit),
    currentPage: page,
    hasNextPage: endIndex < items.length,
    hasPreviousPage: page > 1
  }
}

function validateProfileData(profile: any) {
  const errors: string[] = []
  
  if (!profile.name || profile.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long')
  }
  
  if (!profile.age || profile.age < 18 || profile.age > 60) {
    errors.push('Age must be between 18 and 60')
  }
  
  if (!profile.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
    errors.push('Valid email is required')
  }
  
  if (!profile.district) {
    errors.push('District is required')
  }
  
  if (!profile.gender || !['male', 'female'].includes(profile.gender)) {
    errors.push('Valid gender is required')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

describe('Data Processing', () => {
  const sampleProfiles = [
    {
      id: '1',
      name: 'John Doe',
      age: 25,
      gender: 'male',
      district: 'Madhubani',
      block: 'Sadar',
      education: 'Graduate',
      sect: 'Sunni',
      email: 'john@example.com'
    },
    {
      id: '2',
      name: 'Jane Smith',
      age: 23,
      gender: 'female',
      district: 'Madhubani',
      block: 'Jhanjharpur',
      education: 'Graduate',
      sect: 'Sunni',
      email: 'jane@example.com'
    },
    {
      id: '3',
      name: 'Bob Johnson',
      age: 30,
      gender: 'male',
      district: 'Darbhanga',
      block: 'Sadar',
      education: 'Post Graduate',
      sect: 'Shia',
      email: 'bob@example.com'
    }
  ]

  describe('filterProfiles', () => {
    it('should filter profiles by gender', () => {
      const filtered = filterProfiles(sampleProfiles, { gender: 'female' })
      expect(filtered).toHaveLength(1)
      expect(filtered[0].name).toBe('Jane Smith')
    })

    it('should filter profiles by age range', () => {
      const filtered = filterProfiles(sampleProfiles, { ageMin: 24, ageMax: 26 })
      expect(filtered).toHaveLength(1)
      expect(filtered[0].name).toBe('John Doe')
    })

    it('should filter profiles by district', () => {
      const filtered = filterProfiles(sampleProfiles, { district: 'Madhubani' })
      expect(filtered).toHaveLength(2)
      expect(filtered.map(p => p.name)).toContain('John Doe')
      expect(filtered.map(p => p.name)).toContain('Jane Smith')
    })

    it('should apply multiple filters', () => {
      const filtered = filterProfiles(sampleProfiles, {
        gender: 'male',
        district: 'Madhubani',
        ageMax: 26
      })
      expect(filtered).toHaveLength(1)
      expect(filtered[0].name).toBe('John Doe')
    })

    it('should return empty array when no matches', () => {
      const filtered = filterProfiles(sampleProfiles, { gender: 'other' })
      expect(filtered).toHaveLength(0)
    })
  })

  describe('calculateCompatibility', () => {
    it('should give high score for perfect match', () => {
      const profile1 = sampleProfiles[0]
      const profile2 = { ...sampleProfiles[0], id: '4', name: 'Perfect Match' }
      
      const score = calculateCompatibility(profile1, profile2)
      expect(score).toBeGreaterThan(90)
    })

    it('should give lower score for poor match', () => {
      const profile1 = sampleProfiles[0] // 25, male, Madhubani, Graduate, Sunni
      const profile2 = sampleProfiles[2] // 30, male, Darbhanga, Post Graduate, Shia
      
      const score = calculateCompatibility(profile1, profile2)
      expect(score).toBeLessThan(70)
    })

    it('should consider age difference', () => {
      const profile1 = { age: 25, district: 'Same', education: 'Same', sect: 'Same' }
      const profile2Same = { age: 25, district: 'Same', education: 'Same', sect: 'Same' }
      const profile2Different = { age: 35, district: 'Same', education: 'Same', sect: 'Same' }
      
      const scoreSame = calculateCompatibility(profile1, profile2Same)
      const scoreDifferent = calculateCompatibility(profile1, profile2Different)
      
      expect(scoreSame).toBeGreaterThan(scoreDifferent)
    })
  })

  describe('sortProfilesByRelevance', () => {
    it('should sort profiles by compatibility score', () => {
      const userProfile = sampleProfiles[0]
      const sorted = sortProfilesByRelevance(sampleProfiles.slice(1), userProfile)
      
      expect(sorted).toHaveLength(2)
      expect(sorted[0].compatibilityScore).toBeGreaterThanOrEqual(sorted[1].compatibilityScore)
    })

    it('should add compatibility scores to profiles', () => {
      const userProfile = sampleProfiles[0]
      const sorted = sortProfilesByRelevance(sampleProfiles.slice(1), userProfile)
      
      sorted.forEach(profile => {
        expect(profile.compatibilityScore).toBeDefined()
        expect(typeof profile.compatibilityScore).toBe('number')
        expect(profile.compatibilityScore).toBeGreaterThanOrEqual(0)
        expect(profile.compatibilityScore).toBeLessThanOrEqual(100)
      })
    })
  })

  describe('paginateResults', () => {
    it('should paginate results correctly', () => {
      const result = paginateResults(sampleProfiles, 1, 2)
      
      expect(result.items).toHaveLength(2)
      expect(result.totalItems).toBe(3)
      expect(result.totalPages).toBe(2)
      expect(result.currentPage).toBe(1)
      expect(result.hasNextPage).toBe(true)
      expect(result.hasPreviousPage).toBe(false)
    })

    it('should handle last page correctly', () => {
      const result = paginateResults(sampleProfiles, 2, 2)
      
      expect(result.items).toHaveLength(1)
      expect(result.currentPage).toBe(2)
      expect(result.hasNextPage).toBe(false)
      expect(result.hasPreviousPage).toBe(true)
    })

    it('should handle empty results', () => {
      const result = paginateResults([], 1, 10)
      
      expect(result.items).toHaveLength(0)
      expect(result.totalItems).toBe(0)
      expect(result.totalPages).toBe(0)
      expect(result.hasNextPage).toBe(false)
      expect(result.hasPreviousPage).toBe(false)
    })
  })

  describe('validateProfileData', () => {
    it('should validate complete profile data', () => {
      const validProfile = {
        name: 'John Doe',
        age: 25,
        email: 'john@example.com',
        district: 'Madhubani',
        gender: 'male'
      }
      
      const result = validateProfileData(validProfile)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should identify missing required fields', () => {
      const incompleteProfile = {
        name: 'John Doe',
        age: 25
        // Missing email, district, gender
      }
      
      const result = validateProfileData(incompleteProfile)
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors).toContain('Valid email is required')
      expect(result.errors).toContain('District is required')
      expect(result.errors).toContain('Valid gender is required')
    })

    it('should identify invalid field values', () => {
      const invalidProfile = {
        name: 'J', // Too short
        age: 17, // Too young
        email: 'invalid-email',
        district: 'Madhubani',
        gender: 'invalid'
      }
      
      const result = validateProfileData(invalidProfile)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Name must be at least 2 characters long')
      expect(result.errors).toContain('Age must be between 18 and 60')
      expect(result.errors).toContain('Valid email is required')
      expect(result.errors).toContain('Valid gender is required')
    })
  })
})