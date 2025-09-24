import { describe, it, expect, beforeEach } from 'vitest'

// Mock interest workflow
interface Interest {
  id: string
  senderId: string
  receiverId: string
  status: 'pending' | 'accepted' | 'declined' | 'withdrawn'
  message?: string
  sentAt: string
  respondedAt?: string
  expiresAt: string
}

interface Notification {
  id: string
  userId: string
  type: 'new_interest' | 'interest_accepted' | 'interest_declined' | 'mutual_match'
  title: string
  message: string
  isRead: boolean
  createdAt: string
  relatedUserId?: string
}

interface User {
  id: string
  name: string
  isActive: boolean
  notificationPreferences: {
    emailNotifications: boolean
    pushNotifications: boolean
  }
}

// Mock services
class MockInterestService {
  private interests: Interest[] = []
  private dailyLimits: Map<string, { date: string; count: number }> = new Map()

  async sendInterest(senderId: string, receiverId: string, message?: string): Promise<{ success: boolean; interest?: Interest; error?: string }> {
    // Check daily limit
    const today = new Date().toISOString().split('T')[0]
    const userLimit = this.dailyLimits.get(senderId)
    
    if (userLimit && userLimit.date === today && userLimit.count >= 5) {
      return { success: false, error: 'Daily interest limit exceeded' }
    }

    // Check if interest already exists
    const existingInterest = this.interests.find(i => 
      i.senderId === senderId && 
      i.receiverId === receiverId && 
      i.status === 'pending'
    )

    if (existingInterest) {
      return { success: false, error: 'Interest already sent to this user' }
    }

    const interest: Interest = {
      id: `interest_${Date.now()}_${Math.random()}`,
      senderId,
      receiverId,
      status: 'pending',
      message,
      sentAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
    }

    this.interests.push(interest)

    // Update daily limit
    if (userLimit && userLimit.date === today) {
      userLimit.count++
    } else {
      this.dailyLimits.set(senderId, { date: today, count: 1 })
    }

    return { success: true, interest }
  }

  async respondToInterest(interestId: string, response: 'accepted' | 'declined'): Promise<{ success: boolean; interest?: Interest; error?: string }> {
    const interest = this.interests.find(i => i.id === interestId)
    
    if (!interest) {
      return { success: false, error: 'Interest not found' }
    }

    if (interest.status !== 'pending') {
      return { success: false, error: 'Interest has already been responded to' }
    }

    // Check if expired
    if (new Date() > new Date(interest.expiresAt)) {
      return { success: false, error: 'Interest has expired' }
    }

    interest.status = response
    interest.respondedAt = new Date().toISOString()

    return { success: true, interest }
  }

  async withdrawInterest(interestId: string): Promise<{ success: boolean; error?: string }> {
    const interest = this.interests.find(i => i.id === interestId)
    
    if (!interest) {
      return { success: false, error: 'Interest not found' }
    }

    if (interest.status !== 'pending') {
      return { success: false, error: 'Cannot withdraw interest that has been responded to' }
    }

    interest.status = 'withdrawn'

    return { success: true }
  }

  getInterestsByUser(userId: string, type: 'sent' | 'received'): Interest[] {
    if (type === 'sent') {
      return this.interests.filter(i => i.senderId === userId)
    } else {
      return this.interests.filter(i => i.receiverId === userId)
    }
  }

  getMutualInterests(userId: string): Interest[] {
    const sentAccepted = this.interests.filter(i => 
      i.senderId === userId && i.status === 'accepted'
    )
    
    const mutualInterests: Interest[] = []
    
    sentAccepted.forEach(sent => {
      const reciprocal = this.interests.find(i => 
        i.senderId === sent.receiverId && 
        i.receiverId === userId && 
        i.status === 'accepted'
      )
      
      if (reciprocal) {
        mutualInterests.push(sent)
      }
    })
    
    return mutualInterests
  }
}

class MockNotificationService {
  private notifications: Notification[] = []

  async createNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<Notification> {
    const newNotification: Notification = {
      ...notification,
      id: `notification_${Date.now()}_${Math.random()}`,
      createdAt: new Date().toISOString()
    }

    this.notifications.push(newNotification)
    return newNotification
  }

  getNotificationsByUser(userId: string): Notification[] {
    return this.notifications.filter(n => n.userId === userId)
  }

  async markAsRead(notificationId: string): Promise<boolean> {
    const notification = this.notifications.find(n => n.id === notificationId)
    if (notification) {
      notification.isRead = true
      return true
    }
    return false
  }
}

class MockUserService {
  private users: User[] = [
    {
      id: 'user1',
      name: 'Ahmed Khan',
      isActive: true,
      notificationPreferences: { emailNotifications: true, pushNotifications: true }
    },
    {
      id: 'user2',
      name: 'Fatima Ali',
      isActive: true,
      notificationPreferences: { emailNotifications: true, pushNotifications: false }
    },
    {
      id: 'user3',
      name: 'Mohammad Hassan',
      isActive: false,
      notificationPreferences: { emailNotifications: false, pushNotifications: false }
    }
  ]

  getUser(userId: string): User | undefined {
    return this.users.find(u => u.id === userId)
  }
}

// Integration workflow
class InterestWorkflow {
  constructor(
    private interestService: MockInterestService,
    private notificationService: MockNotificationService,
    private userService: MockUserService
  ) {}

  async sendInterestWithNotification(senderId: string, receiverId: string, message?: string) {
    // Step 1: Validate users exist and are active
    const sender = this.userService.getUser(senderId)
    const receiver = this.userService.getUser(receiverId)

    if (!sender || !receiver) {
      return { success: false, error: 'User not found', step: 'validation' }
    }

    if (!sender.isActive || !receiver.isActive) {
      return { success: false, error: 'User is not active', step: 'validation' }
    }

    // Step 2: Send interest
    const interestResult = await this.interestService.sendInterest(senderId, receiverId, message)
    if (!interestResult.success) {
      return { success: false, error: interestResult.error, step: 'interest_creation' }
    }

    // Step 3: Create notification
    const notification = await this.notificationService.createNotification({
      userId: receiverId,
      type: 'new_interest',
      title: 'New Interest Received',
      message: `${sender.name} has expressed interest in your profile`,
      isRead: false,
      relatedUserId: senderId
    })

    return {
      success: true,
      interest: interestResult.interest,
      notification
    }
  }

  async respondToInterestWithNotification(interestId: string, response: 'accepted' | 'declined') {
    // Step 1: Respond to interest
    const responseResult = await this.interestService.respondToInterest(interestId, response)
    if (!responseResult.success) {
      return { success: false, error: responseResult.error, step: 'interest_response' }
    }

    const interest = responseResult.interest!
    const sender = this.userService.getUser(interest.senderId)
    const receiver = this.userService.getUser(interest.receiverId)

    if (!sender || !receiver) {
      return { success: false, error: 'User not found', step: 'validation' }
    }

    // Step 2: Create notification for sender
    const notificationType = response === 'accepted' ? 'interest_accepted' : 'interest_declined'
    const notificationTitle = response === 'accepted' ? 'Interest Accepted!' : 'Interest Declined'
    const notificationMessage = response === 'accepted' 
      ? `${receiver.name} has accepted your interest`
      : `${receiver.name} has declined your interest`

    const notification = await this.notificationService.createNotification({
      userId: interest.senderId,
      type: notificationType,
      title: notificationTitle,
      message: notificationMessage,
      isRead: false,
      relatedUserId: interest.receiverId
    })

    // Step 3: Check for mutual match if accepted
    let mutualMatchNotifications: Notification[] = []
    if (response === 'accepted') {
      const mutualInterests = this.interestService.getMutualInterests(interest.senderId)
      const isMutualMatch = mutualInterests.some(mi => mi.receiverId === interest.receiverId)

      if (isMutualMatch) {
        // Create mutual match notifications for both users
        const senderNotification = await this.notificationService.createNotification({
          userId: interest.senderId,
          type: 'mutual_match',
          title: 'Mutual Match!',
          message: `You and ${receiver.name} have both expressed interest in each other`,
          isRead: false,
          relatedUserId: interest.receiverId
        })

        const receiverNotification = await this.notificationService.createNotification({
          userId: interest.receiverId,
          type: 'mutual_match',
          title: 'Mutual Match!',
          message: `You and ${sender.name} have both expressed interest in each other`,
          isRead: false,
          relatedUserId: interest.senderId
        })

        mutualMatchNotifications = [senderNotification, receiverNotification]
      }
    }

    return {
      success: true,
      interest: responseResult.interest,
      notification,
      mutualMatchNotifications,
      isMutualMatch: mutualMatchNotifications.length > 0
    }
  }

  async getInterestSummary(userId: string) {
    const sentInterests = this.interestService.getInterestsByUser(userId, 'sent')
    const receivedInterests = this.interestService.getInterestsByUser(userId, 'received')
    const mutualInterests = this.interestService.getMutualInterests(userId)
    const notifications = this.notificationService.getNotificationsByUser(userId)

    return {
      sent: {
        total: sentInterests.length,
        pending: sentInterests.filter(i => i.status === 'pending').length,
        accepted: sentInterests.filter(i => i.status === 'accepted').length,
        declined: sentInterests.filter(i => i.status === 'declined').length,
        withdrawn: sentInterests.filter(i => i.status === 'withdrawn').length
      },
      received: {
        total: receivedInterests.length,
        pending: receivedInterests.filter(i => i.status === 'pending').length,
        accepted: receivedInterests.filter(i => i.status === 'accepted').length,
        declined: receivedInterests.filter(i => i.status === 'declined').length
      },
      mutual: mutualInterests.length,
      notifications: {
        total: notifications.length,
        unread: notifications.filter(n => !n.isRead).length
      }
    }
  }
}

describe('Interest Workflow Integration Tests', () => {
  let interestService: MockInterestService
  let notificationService: MockNotificationService
  let userService: MockUserService
  let workflow: InterestWorkflow

  beforeEach(() => {
    interestService = new MockInterestService()
    notificationService = new MockNotificationService()
    userService = new MockUserService()
    workflow = new InterestWorkflow(interestService, notificationService, userService)
  })

  describe('Sending Interest Workflow', () => {
    it('should successfully send interest and create notification', async () => {
      const result = await workflow.sendInterestWithNotification('user1', 'user2', 'Hello, I am interested in your profile')

      expect(result.success).toBe(true)
      expect(result.interest).toBeDefined()
      expect(result.notification).toBeDefined()
      expect(result.interest!.senderId).toBe('user1')
      expect(result.interest!.receiverId).toBe('user2')
      expect(result.interest!.status).toBe('pending')
      expect(result.notification!.userId).toBe('user2')
      expect(result.notification!.type).toBe('new_interest')
    })

    it('should fail when sender does not exist', async () => {
      const result = await workflow.sendInterestWithNotification('nonexistent', 'user2')

      expect(result.success).toBe(false)
      expect(result.error).toBe('User not found')
      expect(result.step).toBe('validation')
    })

    it('should fail when receiver is inactive', async () => {
      const result = await workflow.sendInterestWithNotification('user1', 'user3') // user3 is inactive

      expect(result.success).toBe(false)
      expect(result.error).toBe('User is not active')
      expect(result.step).toBe('validation')
    })

    it('should enforce daily interest limits', async () => {
      // Send 5 interests (daily limit)
      for (let i = 0; i < 5; i++) {
        await workflow.sendInterestWithNotification('user1', 'user2')
      }

      // 6th interest should fail
      const result = await workflow.sendInterestWithNotification('user1', 'user2')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Daily interest limit exceeded')
      expect(result.step).toBe('interest_creation')
    })

    it('should prevent duplicate interests', async () => {
      // Send first interest
      await workflow.sendInterestWithNotification('user1', 'user2')

      // Try to send another interest to same user
      const result = await workflow.sendInterestWithNotification('user1', 'user2')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Interest already sent to this user')
    })
  })

  describe('Responding to Interest Workflow', () => {
    it('should successfully accept interest and create notification', async () => {
      // First send an interest
      const sendResult = await workflow.sendInterestWithNotification('user1', 'user2')
      const interestId = sendResult.interest!.id

      // Then accept it
      const result = await workflow.respondToInterestWithNotification(interestId, 'accepted')

      expect(result.success).toBe(true)
      expect(result.interest!.status).toBe('accepted')
      expect(result.notification!.userId).toBe('user1') // Notification goes to sender
      expect(result.notification!.type).toBe('interest_accepted')
      expect(result.isMutualMatch).toBe(false) // No reciprocal interest yet
    })

    it('should successfully decline interest and create notification', async () => {
      // First send an interest
      const sendResult = await workflow.sendInterestWithNotification('user1', 'user2')
      const interestId = sendResult.interest!.id

      // Then decline it
      const result = await workflow.respondToInterestWithNotification(interestId, 'declined')

      expect(result.success).toBe(true)
      expect(result.interest!.status).toBe('declined')
      expect(result.notification!.userId).toBe('user1')
      expect(result.notification!.type).toBe('interest_declined')
      expect(result.isMutualMatch).toBe(false)
    })

    it('should detect mutual matches and create special notifications', async () => {
      // User1 sends interest to User2
      const sendResult1 = await workflow.sendInterestWithNotification('user1', 'user2')
      
      // User2 sends interest to User1
      const sendResult2 = await workflow.sendInterestWithNotification('user2', 'user1')
      
      // User2 accepts User1's interest (creating mutual match)
      const acceptResult = await workflow.respondToInterestWithNotification(sendResult1.interest!.id, 'accepted')

      expect(acceptResult.success).toBe(true)
      expect(acceptResult.isMutualMatch).toBe(true)
      expect(acceptResult.mutualMatchNotifications).toHaveLength(2)
      expect(acceptResult.mutualMatchNotifications![0].type).toBe('mutual_match')
      expect(acceptResult.mutualMatchNotifications![1].type).toBe('mutual_match')
    })

    it('should fail when interest does not exist', async () => {
      const result = await workflow.respondToInterestWithNotification('nonexistent', 'accepted')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Interest not found')
      expect(result.step).toBe('interest_response')
    })

    it('should fail when interest has already been responded to', async () => {
      // Send and accept interest
      const sendResult = await workflow.sendInterestWithNotification('user1', 'user2')
      await workflow.respondToInterestWithNotification(sendResult.interest!.id, 'accepted')

      // Try to respond again
      const result = await workflow.respondToInterestWithNotification(sendResult.interest!.id, 'declined')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Interest has already been responded to')
    })
  })

  describe('Interest Summary and Analytics', () => {
    it('should provide comprehensive interest summary', async () => {
      // Create some test data
      await workflow.sendInterestWithNotification('user1', 'user2')
      const sendResult = await workflow.sendInterestWithNotification('user2', 'user1')
      await workflow.respondToInterestWithNotification(sendResult.interest!.id, 'accepted')

      const summary = await workflow.getInterestSummary('user1')

      expect(summary.sent.total).toBe(1)
      expect(summary.sent.pending).toBe(1)
      expect(summary.received.total).toBe(1)
      expect(summary.received.accepted).toBe(1)
      expect(summary.notifications.total).toBeGreaterThan(0)
      expect(summary.notifications.unread).toBeGreaterThan(0)
    })

    it('should track mutual matches correctly', async () => {
      // Create mutual match scenario
      const send1 = await workflow.sendInterestWithNotification('user1', 'user2')
      const send2 = await workflow.sendInterestWithNotification('user2', 'user1')
      await workflow.respondToInterestWithNotification(send1.interest!.id, 'accepted')
      await workflow.respondToInterestWithNotification(send2.interest!.id, 'accepted')

      const summary1 = await workflow.getInterestSummary('user1')
      const summary2 = await workflow.getInterestSummary('user2')

      expect(summary1.mutual).toBe(1)
      expect(summary2.mutual).toBe(1)
    })
  })

  describe('Complex Workflow Scenarios', () => {
    it('should handle multiple concurrent interests', async () => {
      const promises = [
        workflow.sendInterestWithNotification('user1', 'user2'),
        workflow.sendInterestWithNotification('user2', 'user1'),
        workflow.sendInterestWithNotification('user1', 'user3')
      ]

      const results = await Promise.all(promises)

      // First two should succeed, third should fail (user3 is inactive)
      expect(results[0].success).toBe(true)
      expect(results[1].success).toBe(true)
      expect(results[2].success).toBe(false)
    })

    it('should handle interest expiration', async () => {
      // This would require mocking time, but we can test the logic
      const sendResult = await workflow.sendInterestWithNotification('user1', 'user2')
      
      // Manually expire the interest for testing
      const interest = sendResult.interest!
      interest.expiresAt = new Date(Date.now() - 1000).toISOString() // Expired 1 second ago

      const result = await workflow.respondToInterestWithNotification(interest.id, 'accepted')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Interest has expired')
    })

    it('should maintain data consistency across operations', async () => {
      // Send interest
      const sendResult = await workflow.sendInterestWithNotification('user1', 'user2')
      
      // Accept interest
      const acceptResult = await workflow.respondToInterestWithNotification(sendResult.interest!.id, 'accepted')
      
      // Verify data consistency
      const summary1 = await workflow.getInterestSummary('user1')
      const summary2 = await workflow.getInterestSummary('user2')

      expect(summary1.sent.accepted).toBe(1)
      expect(summary2.received.accepted).toBe(1)
      expect(summary1.notifications.total).toBeGreaterThan(0)
      expect(summary2.notifications.total).toBeGreaterThan(0)
    })
  })
})