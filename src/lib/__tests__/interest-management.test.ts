import { describe, it, expect } from 'vitest'

// Interest management functions for testing
interface Interest {
  id: string
  senderId: string
  receiverId: string
  status: 'pending' | 'accepted' | 'declined' | 'withdrawn'
  sentAt: string
  respondedAt?: string
  message?: string
}

function calculateInterestStats(interests: Interest[]) {
  const total = interests.length
  const pending = interests.filter(i => i.status === 'pending').length
  const accepted = interests.filter(i => i.status === 'accepted').length
  const declined = interests.filter(i => i.status === 'declined').length
  const withdrawn = interests.filter(i => i.status === 'withdrawn').length
  
  const successRate = total > 0 ? (accepted / total) * 100 : 0
  const responseRate = total > 0 ? ((accepted + declined) / total) * 100 : 0
  
  return {
    total,
    pending,
    accepted,
    declined,
    withdrawn,
    successRate: Math.round(successRate * 100) / 100,
    responseRate: Math.round(responseRate * 100) / 100
  }
}

function isInterestExpired(interest: Interest, expiryDays: number = 30): boolean {
  if (interest.status !== 'pending') return false
  
  const sentDate = new Date(interest.sentAt)
  const now = new Date()
  const daysDiff = (now.getTime() - sentDate.getTime()) / (1000 * 60 * 60 * 24)
  
  return daysDiff > expiryDays
}

function canSendInterest(sentInterests: Interest[], dailyLimit: number = 5): boolean {
  const today = new Date().toISOString().split('T')[0]
  const todayInterests = sentInterests.filter(interest => 
    interest.sentAt.startsWith(today)
  )
  
  return todayInterests.length < dailyLimit
}

function findMutualInterests(userInterests: Interest[], receivedInterests: Interest[]): string[] {
  const mutualMatches: string[] = []
  
  userInterests.forEach(sent => {
    if (sent.status === 'accepted') {
      const mutual = receivedInterests.find(received => 
        received.senderId === sent.receiverId && 
        received.status === 'accepted'
      )
      if (mutual) {
        mutualMatches.push(sent.receiverId)
      }
    }
  })
  
  return mutualMatches
}

function getInterestStatusColor(status: Interest['status']): string {
  switch (status) {
    case 'pending':
      return 'text-yellow-600 bg-yellow-50'
    case 'accepted':
      return 'text-green-600 bg-green-50'
    case 'declined':
      return 'text-red-600 bg-red-50'
    case 'withdrawn':
      return 'text-gray-600 bg-gray-50'
    default:
      return 'text-gray-600 bg-gray-50'
  }
}

function formatInterestMessage(message: string | null | undefined, maxLength: number = 100): string {
  if (!message) return ''
  
  if (message.length <= maxLength) return message
  
  return message.substring(0, maxLength - 3) + '...'
}

function groupInterestsByDate(interests: Interest[]) {
  const groups: { [key: string]: Interest[] } = {}
  
  interests.forEach(interest => {
    const date = interest.sentAt.split('T')[0]
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(interest)
  })
  
  return groups
}

describe('Interest Management', () => {
  const sampleInterests: Interest[] = [
    {
      id: '1',
      senderId: 'user1',
      receiverId: 'user2',
      status: 'pending',
      sentAt: '2024-01-01T10:00:00Z'
    },
    {
      id: '2',
      senderId: 'user1',
      receiverId: 'user3',
      status: 'accepted',
      sentAt: '2024-01-02T11:00:00Z',
      respondedAt: '2024-01-03T12:00:00Z'
    },
    {
      id: '3',
      senderId: 'user1',
      receiverId: 'user4',
      status: 'declined',
      sentAt: '2024-01-03T13:00:00Z',
      respondedAt: '2024-01-04T14:00:00Z'
    },
    {
      id: '4',
      senderId: 'user1',
      receiverId: 'user5',
      status: 'withdrawn',
      sentAt: '2024-01-04T15:00:00Z'
    }
  ]

  describe('calculateInterestStats', () => {
    it('should calculate interest statistics correctly', () => {
      const stats = calculateInterestStats(sampleInterests)
      
      expect(stats.total).toBe(4)
      expect(stats.pending).toBe(1)
      expect(stats.accepted).toBe(1)
      expect(stats.declined).toBe(1)
      expect(stats.withdrawn).toBe(1)
      expect(stats.successRate).toBe(25) // 1/4 * 100
      expect(stats.responseRate).toBe(50) // 2/4 * 100
    })

    it('should handle empty interest array', () => {
      const stats = calculateInterestStats([])
      
      expect(stats.total).toBe(0)
      expect(stats.pending).toBe(0)
      expect(stats.accepted).toBe(0)
      expect(stats.declined).toBe(0)
      expect(stats.withdrawn).toBe(0)
      expect(stats.successRate).toBe(0)
      expect(stats.responseRate).toBe(0)
    })

    it('should handle all pending interests', () => {
      const pendingInterests = sampleInterests.map(i => ({ ...i, status: 'pending' as const }))
      const stats = calculateInterestStats(pendingInterests)
      
      expect(stats.total).toBe(4)
      expect(stats.pending).toBe(4)
      expect(stats.accepted).toBe(0)
      expect(stats.declined).toBe(0)
      expect(stats.successRate).toBe(0)
      expect(stats.responseRate).toBe(0)
    })
  })

  describe('isInterestExpired', () => {
    it('should detect expired interests', () => {
      const oldDate = new Date()
      oldDate.setDate(oldDate.getDate() - 31) // 31 days ago
      
      const expiredInterest: Interest = {
        id: '1',
        senderId: 'user1',
        receiverId: 'user2',
        status: 'pending',
        sentAt: oldDate.toISOString()
      }
      
      expect(isInterestExpired(expiredInterest)).toBe(true)
    })

    it('should detect non-expired interests', () => {
      const recentDate = new Date()
      recentDate.setDate(recentDate.getDate() - 15) // 15 days ago
      
      const activeInterest: Interest = {
        id: '1',
        senderId: 'user1',
        receiverId: 'user2',
        status: 'pending',
        sentAt: recentDate.toISOString()
      }
      
      expect(isInterestExpired(activeInterest)).toBe(false)
    })

    it('should not consider accepted/declined interests as expired', () => {
      const oldDate = new Date()
      oldDate.setDate(oldDate.getDate() - 31) // 31 days ago
      
      const acceptedInterest: Interest = {
        id: '1',
        senderId: 'user1',
        receiverId: 'user2',
        status: 'accepted',
        sentAt: oldDate.toISOString()
      }
      
      expect(isInterestExpired(acceptedInterest)).toBe(false)
    })
  })

  describe('canSendInterest', () => {
    it('should allow sending interest when under daily limit', () => {
      const today = new Date().toISOString().split('T')[0]
      const todayInterests: Interest[] = [
        {
          id: '1',
          senderId: 'user1',
          receiverId: 'user2',
          status: 'pending',
          sentAt: `${today}T10:00:00Z`
        },
        {
          id: '2',
          senderId: 'user1',
          receiverId: 'user3',
          status: 'pending',
          sentAt: `${today}T11:00:00Z`
        }
      ]
      
      expect(canSendInterest(todayInterests, 5)).toBe(true)
    })

    it('should prevent sending interest when at daily limit', () => {
      const today = new Date().toISOString().split('T')[0]
      const todayInterests: Interest[] = Array.from({ length: 5 }, (_, i) => ({
        id: `${i + 1}`,
        senderId: 'user1',
        receiverId: `user${i + 2}`,
        status: 'pending' as const,
        sentAt: `${today}T${10 + i}:00:00Z`
      }))
      
      expect(canSendInterest(todayInterests, 5)).toBe(false)
    })

    it('should not count interests from previous days', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split('T')[0]
      
      const yesterdayInterests: Interest[] = Array.from({ length: 5 }, (_, i) => ({
        id: `${i + 1}`,
        senderId: 'user1',
        receiverId: `user${i + 2}`,
        status: 'pending' as const,
        sentAt: `${yesterdayStr}T${10 + i}:00:00Z`
      }))
      
      expect(canSendInterest(yesterdayInterests, 5)).toBe(true)
    })
  })

  describe('findMutualInterests', () => {
    it('should find mutual interests correctly', () => {
      const userInterests: Interest[] = [
        {
          id: '1',
          senderId: 'user1',
          receiverId: 'user2',
          status: 'accepted',
          sentAt: '2024-01-01T10:00:00Z'
        },
        {
          id: '2',
          senderId: 'user1',
          receiverId: 'user3',
          status: 'pending',
          sentAt: '2024-01-02T10:00:00Z'
        }
      ]
      
      const receivedInterests: Interest[] = [
        {
          id: '3',
          senderId: 'user2',
          receiverId: 'user1',
          status: 'accepted',
          sentAt: '2024-01-01T11:00:00Z'
        },
        {
          id: '4',
          senderId: 'user4',
          receiverId: 'user1',
          status: 'accepted',
          sentAt: '2024-01-03T10:00:00Z'
        }
      ]
      
      const mutualMatches = findMutualInterests(userInterests, receivedInterests)
      
      expect(mutualMatches).toHaveLength(1)
      expect(mutualMatches[0]).toBe('user2')
    })

    it('should handle empty interest arrays', () => {
      const mutualMatches = findMutualInterests([], [])
      expect(mutualMatches).toHaveLength(0)
    })

    it('should only consider accepted interests', () => {
      const userInterests: Interest[] = [
        {
          id: '1',
          senderId: 'user1',
          receiverId: 'user2',
          status: 'pending',
          sentAt: '2024-01-01T10:00:00Z'
        }
      ]
      
      const receivedInterests: Interest[] = [
        {
          id: '2',
          senderId: 'user2',
          receiverId: 'user1',
          status: 'accepted',
          sentAt: '2024-01-01T11:00:00Z'
        }
      ]
      
      const mutualMatches = findMutualInterests(userInterests, receivedInterests)
      expect(mutualMatches).toHaveLength(0)
    })
  })

  describe('getInterestStatusColor', () => {
    it('should return correct colors for different statuses', () => {
      expect(getInterestStatusColor('pending')).toContain('yellow')
      expect(getInterestStatusColor('accepted')).toContain('green')
      expect(getInterestStatusColor('declined')).toContain('red')
      expect(getInterestStatusColor('withdrawn')).toContain('gray')
    })

    it('should handle unknown status', () => {
      expect(getInterestStatusColor('unknown' as any)).toContain('gray')
    })
  })

  describe('formatInterestMessage', () => {
    it('should format interest message correctly', () => {
      const message = 'Hello, I am interested in your profile'
      const formatted = formatInterestMessage(message)
      
      expect(formatted).toBe(message)
    })

    it('should truncate long messages', () => {
      const longMessage = 'A'.repeat(150)
      const formatted = formatInterestMessage(longMessage, 100)
      
      expect(formatted.length).toBeLessThanOrEqual(100)
      expect(formatted).toContain('...')
    })

    it('should handle empty messages', () => {
      expect(formatInterestMessage('')).toBe('')
      expect(formatInterestMessage(null)).toBe('')
      expect(formatInterestMessage(undefined)).toBe('')
    })
  })

  describe('groupInterestsByDate', () => {
    it('should group interests by date correctly', () => {
      const grouped = groupInterestsByDate(sampleInterests)
      
      expect(Object.keys(grouped)).toHaveLength(4)
      expect(grouped['2024-01-01']).toHaveLength(1)
      expect(grouped['2024-01-02']).toHaveLength(1)
      expect(grouped['2024-01-03']).toHaveLength(1)
      expect(grouped['2024-01-04']).toHaveLength(1)
    })

    it('should handle empty interest array', () => {
      const grouped = groupInterestsByDate([])
      expect(Object.keys(grouped)).toHaveLength(0)
    })

    it('should handle multiple interests on same date', () => {
      const sameDate = '2024-01-01T'
      const interestsOnSameDate: Interest[] = [
        {
          id: '1',
          senderId: 'user1',
          receiverId: 'user2',
          status: 'pending',
          sentAt: `${sameDate}10:00:00Z`
        },
        {
          id: '2',
          senderId: 'user1',
          receiverId: 'user3',
          status: 'pending',
          sentAt: `${sameDate}11:00:00Z`
        }
      ]
      
      const grouped = groupInterestsByDate(interestsOnSameDate)
      
      expect(Object.keys(grouped)).toHaveLength(1)
      expect(grouped['2024-01-01']).toHaveLength(2)
    })
  })
})