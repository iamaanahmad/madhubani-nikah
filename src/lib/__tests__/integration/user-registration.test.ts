import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock user registration workflow
interface User {
  id: string
  email: string
  name: string
  phone?: string
  isVerified: boolean
  createdAt: string
}

interface Profile {
  userId: string
  name: string
  age: number
  gender: 'male' | 'female'
  district: string
  isComplete: boolean
  createdAt: string
}

interface AuthResult {
  success: boolean
  user?: User
  session?: { id: string; userId: string }
  error?: string
}

interface ProfileResult {
  success: boolean
  profile?: Profile
  error?: string
}

// Mock services for integration testing
class MockAuthService {
  private users: User[] = []
  private sessions: { id: string; userId: string }[] = []

  async registerWithEmail(email: string, password: string, name: string): Promise<AuthResult> {
    // Simulate validation
    if (!email || !password || !name) {
      return { success: false, error: 'Missing required fields' }
    }

    if (this.users.find(u => u.email === email)) {
      return { success: false, error: 'User already exists' }
    }

    const user: User = {
      id: `user_${Date.now()}`,
      email,
      name,
      isVerified: false,
      createdAt: new Date().toISOString()
    }

    const session = {
      id: `session_${Date.now()}`,
      userId: user.id
    }

    this.users.push(user)
    this.sessions.push(session)

    return { success: true, user, session }
  }

  async registerWithPhone(phone: string): Promise<{ success: boolean; userId?: string; secret?: string; error?: string }> {
    if (!phone) {
      return { success: false, error: 'Phone number required' }
    }

    const user: User = {
      id: `user_${Date.now()}`,
      email: '',
      name: '',
      phone,
      isVerified: false,
      createdAt: new Date().toISOString()
    }

    this.users.push(user)

    return { 
      success: true, 
      userId: user.id, 
      secret: 'mock_secret_123' 
    }
  }

  async verifyPhoneOTP(userId: string, secret: string, otp: string): Promise<AuthResult> {
    const user = this.users.find(u => u.id === userId)
    if (!user) {
      return { success: false, error: 'User not found' }
    }

    if (secret !== 'mock_secret_123' || otp !== '123456') {
      return { success: false, error: 'Invalid OTP' }
    }

    user.isVerified = true
    const session = {
      id: `session_${Date.now()}`,
      userId: user.id
    }

    this.sessions.push(session)

    return { success: true, user, session }
  }

  getUser(userId: string): User | undefined {
    return this.users.find(u => u.id === userId)
  }
}

class MockProfileService {
  private profiles: Profile[] = []

  async createProfile(userId: string, profileData: Partial<Profile>): Promise<ProfileResult> {
    const user = new MockAuthService().getUser(userId)
    if (!user) {
      return { success: false, error: 'User not found' }
    }

    if (this.profiles.find(p => p.userId === userId)) {
      return { success: false, error: 'Profile already exists' }
    }

    const profile: Profile = {
      userId,
      name: profileData.name || '',
      age: profileData.age || 0,
      gender: profileData.gender || 'male',
      district: profileData.district || '',
      isComplete: this.isProfileComplete(profileData),
      createdAt: new Date().toISOString()
    }

    this.profiles.push(profile)

    return { success: true, profile }
  }

  private isProfileComplete(profileData: Partial<Profile>): boolean {
    return !!(profileData.name && profileData.age && profileData.gender && profileData.district)
  }

  getProfile(userId: string): Profile | undefined {
    return this.profiles.find(p => p.userId === userId)
  }
}

// Integration test workflow
class UserRegistrationWorkflow {
  constructor(
    private authService: MockAuthService,
    private profileService: MockProfileService
  ) {}

  async registerUserWithEmail(email: string, password: string, name: string, profileData: Partial<Profile>) {
    // Step 1: Register user
    const authResult = await this.authService.registerWithEmail(email, password, name)
    if (!authResult.success) {
      return { success: false, error: authResult.error, step: 'authentication' }
    }

    // Step 2: Create profile
    const profileResult = await this.profileService.createProfile(authResult.user!.id, {
      ...profileData,
      name // Use name from registration
    })
    if (!profileResult.success) {
      return { success: false, error: profileResult.error, step: 'profile_creation' }
    }

    return {
      success: true,
      user: authResult.user,
      profile: profileResult.profile,
      session: authResult.session
    }
  }

  async registerUserWithPhone(phone: string, otp: string, name: string, profileData: Partial<Profile>) {
    // Step 1: Initiate phone registration
    const phoneResult = await this.authService.registerWithPhone(phone)
    if (!phoneResult.success) {
      return { success: false, error: phoneResult.error, step: 'phone_initiation' }
    }

    // Step 2: Verify OTP
    const otpResult = await this.authService.verifyPhoneOTP(phoneResult.userId!, phoneResult.secret!, otp)
    if (!otpResult.success) {
      return { success: false, error: otpResult.error, step: 'otp_verification' }
    }

    // Step 3: Create profile
    const profileResult = await this.profileService.createProfile(otpResult.user!.id, {
      ...profileData,
      name
    })
    if (!profileResult.success) {
      return { success: false, error: profileResult.error, step: 'profile_creation' }
    }

    return {
      success: true,
      user: otpResult.user,
      profile: profileResult.profile,
      session: otpResult.session
    }
  }
}

describe('User Registration Integration Tests', () => {
  let authService: MockAuthService
  let profileService: MockProfileService
  let workflow: UserRegistrationWorkflow

  beforeEach(() => {
    authService = new MockAuthService()
    profileService = new MockProfileService()
    workflow = new UserRegistrationWorkflow(authService, profileService)
  })

  describe('Email Registration Workflow', () => {
    it('should successfully register user with email and create profile', async () => {
      const result = await workflow.registerUserWithEmail(
        'test@example.com',
        'password123',
        'John Doe',
        {
          age: 25,
          gender: 'male',
          district: 'Madhubani'
        }
      )

      expect(result.success).toBe(true)
      expect(result.user).toBeDefined()
      expect(result.profile).toBeDefined()
      expect(result.session).toBeDefined()
      expect(result.user!.email).toBe('test@example.com')
      expect(result.user!.name).toBe('John Doe')
      expect(result.profile!.isComplete).toBe(true)
    })

    it('should fail when email already exists', async () => {
      // First registration
      await workflow.registerUserWithEmail(
        'test@example.com',
        'password123',
        'John Doe',
        { age: 25, gender: 'male', district: 'Madhubani' }
      )

      // Second registration with same email
      const result = await workflow.registerUserWithEmail(
        'test@example.com',
        'password456',
        'Jane Doe',
        { age: 23, gender: 'female', district: 'Madhubani' }
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('User already exists')
      expect(result.step).toBe('authentication')
    })

    it('should fail when required fields are missing', async () => {
      const result = await workflow.registerUserWithEmail(
        '',
        'password123',
        'John Doe',
        { age: 25, gender: 'male', district: 'Madhubani' }
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('Missing required fields')
      expect(result.step).toBe('authentication')
    })

    it('should create incomplete profile when profile data is missing', async () => {
      const result = await workflow.registerUserWithEmail(
        'test@example.com',
        'password123',
        'John Doe',
        { age: 25 } // Missing gender and district
      )

      expect(result.success).toBe(true)
      expect(result.profile!.isComplete).toBe(false)
    })
  })

  describe('Phone Registration Workflow', () => {
    it('should successfully register user with phone and create profile', async () => {
      const result = await workflow.registerUserWithPhone(
        '+919876543210',
        '123456',
        'John Doe',
        {
          age: 25,
          gender: 'male',
          district: 'Madhubani'
        }
      )

      expect(result.success).toBe(true)
      expect(result.user).toBeDefined()
      expect(result.profile).toBeDefined()
      expect(result.session).toBeDefined()
      expect(result.user!.phone).toBe('+919876543210')
      expect(result.user!.isVerified).toBe(true)
      expect(result.profile!.isComplete).toBe(true)
    })

    it('should fail with invalid OTP', async () => {
      const result = await workflow.registerUserWithPhone(
        '+919876543210',
        'wrong-otp',
        'John Doe',
        { age: 25, gender: 'male', district: 'Madhubani' }
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid OTP')
      expect(result.step).toBe('otp_verification')
    })

    it('should fail when phone number is missing', async () => {
      const result = await workflow.registerUserWithPhone(
        '',
        '123456',
        'John Doe',
        { age: 25, gender: 'male', district: 'Madhubani' }
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('Phone number required')
      expect(result.step).toBe('phone_initiation')
    })
  })

  describe('Profile Completion Validation', () => {
    it('should correctly identify complete profiles', async () => {
      const result = await workflow.registerUserWithEmail(
        'complete@example.com',
        'password123',
        'Complete User',
        {
          age: 25,
          gender: 'male',
          district: 'Madhubani'
        }
      )

      expect(result.success).toBe(true)
      expect(result.profile!.isComplete).toBe(true)
    })

    it('should correctly identify incomplete profiles', async () => {
      const result = await workflow.registerUserWithEmail(
        'incomplete@example.com',
        'password123',
        'Incomplete User',
        {
          age: 25
          // Missing gender and district
        }
      )

      expect(result.success).toBe(true)
      expect(result.profile!.isComplete).toBe(false)
    })
  })

  describe('Error Handling and Recovery', () => {
    it('should provide clear error messages for each step', async () => {
      // Test authentication error
      const authError = await workflow.registerUserWithEmail('', 'pass', 'name', {})
      expect(authError.step).toBe('authentication')
      expect(authError.error).toBeDefined()

      // Test OTP error
      const otpError = await workflow.registerUserWithPhone('+919876543210', 'wrong', 'name', {})
      expect(otpError.step).toBe('otp_verification')
      expect(otpError.error).toBeDefined()
    })

    it('should handle concurrent registrations', async () => {
      const promises = [
        workflow.registerUserWithEmail('user1@example.com', 'pass1', 'User 1', { age: 25, gender: 'male', district: 'Madhubani' }),
        workflow.registerUserWithEmail('user2@example.com', 'pass2', 'User 2', { age: 23, gender: 'female', district: 'Madhubani' }),
        workflow.registerUserWithPhone('+919876543210', '123456', 'User 3', { age: 27, gender: 'male', district: 'Darbhanga' })
      ]

      const results = await Promise.all(promises)

      results.forEach(result => {
        expect(result.success).toBe(true)
      })

      // Verify all users have unique IDs
      const userIds = results.map(r => r.user!.id)
      const uniqueIds = new Set(userIds)
      expect(uniqueIds.size).toBe(3)
    })
  })
})