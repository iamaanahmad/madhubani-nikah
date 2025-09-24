import { describe, it, expect } from 'vitest'

// Basic utility functions for testing
function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

function validatePhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false
  const cleanPhone = phone.replace(/\D/g, '')
  return cleanPhone.length >= 10 && cleanPhone.length <= 12
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function calculateAge(birthDate: string): number {
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  
  return age
}

function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

describe('Basic Utils', () => {
  describe('validateEmail', () => {
    it('should validate correct email formats', () => {
      expect(validateEmail('test@example.com')).toBe(true)
      expect(validateEmail('user.name@domain.co.in')).toBe(true)
      expect(validateEmail('test123@gmail.com')).toBe(true)
    })

    it('should reject invalid email formats', () => {
      expect(validateEmail('invalid-email')).toBe(false)
      expect(validateEmail('test@')).toBe(false)
      expect(validateEmail('@domain.com')).toBe(false)
      expect(validateEmail('test.domain.com')).toBe(false)
    })

    it('should handle empty or null values', () => {
      expect(validateEmail('')).toBe(false)
      expect(validateEmail(null as any)).toBe(false)
      expect(validateEmail(undefined as any)).toBe(false)
    })
  })

  describe('validatePhone', () => {
    it('should validate Indian phone numbers', () => {
      expect(validatePhone('+919876543210')).toBe(true)
      expect(validatePhone('9876543210')).toBe(true)
      expect(validatePhone('919876543210')).toBe(true)
    })

    it('should reject invalid phone numbers', () => {
      expect(validatePhone('123456789')).toBe(false) // Too short
      expect(validatePhone('12345678901234')).toBe(false) // Too long
      expect(validatePhone('abcdefghij')).toBe(false) // Non-numeric
    })

    it('should handle empty or null values', () => {
      expect(validatePhone('')).toBe(false)
      expect(validatePhone(null as any)).toBe(false)
      expect(validatePhone(undefined as any)).toBe(false)
    })
  })

  describe('formatFileSize', () => {
    it('should format file sizes correctly', () => {
      expect(formatFileSize(1024)).toBe('1 KB')
      expect(formatFileSize(1024 * 1024)).toBe('1 MB')
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB')
    })

    it('should handle bytes', () => {
      expect(formatFileSize(512)).toBe('512 Bytes')
      expect(formatFileSize(0)).toBe('0 Bytes')
    })

    it('should handle decimal places', () => {
      expect(formatFileSize(1536)).toBe('1.5 KB') // 1.5 KB
      expect(formatFileSize(2.5 * 1024 * 1024)).toBe('2.5 MB') // 2.5 MB
    })
  })

  describe('calculateAge', () => {
    it('should calculate age correctly', () => {
      const birthDate = '1995-01-01'
      const age = calculateAge(birthDate)
      expect(age).toBeGreaterThan(25)
      expect(age).toBeLessThan(35)
    })

    it('should handle recent birth dates', () => {
      const recentDate = new Date()
      recentDate.setFullYear(recentDate.getFullYear() - 25)
      const age = calculateAge(recentDate.toISOString().split('T')[0])
      expect(age).toBe(25)
    })

    it('should handle birthday not yet occurred this year', () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() - 25)
      futureDate.setMonth(futureDate.getMonth() + 1) // Next month
      const age = calculateAge(futureDate.toISOString().split('T')[0])
      expect(age).toBe(24) // Should be 24 if birthday hasn't occurred yet
    })
  })

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId()
      const id2 = generateId()
      
      expect(id1).not.toBe(id2)
      expect(typeof id1).toBe('string')
      expect(typeof id2).toBe('string')
      expect(id1.length).toBeGreaterThan(0)
      expect(id2.length).toBeGreaterThan(0)
    })

    it('should generate IDs with expected format', () => {
      const id = generateId()
      expect(id).toMatch(/^[a-z0-9]+$/)
      expect(id.length).toBe(9)
    })
  })
})