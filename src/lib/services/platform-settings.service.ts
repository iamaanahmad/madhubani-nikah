import { Client, Databases, Storage, Query, ID } from 'appwrite'
import { 
  PlatformSettings,
  SuccessStory,
  SystemAnnouncement,
  PlatformAnalytics,
  CreateSuccessStoryRequest,
  UpdateSuccessStoryRequest,
  CreateAnnouncementRequest,
  UpdateAnnouncementRequest,
  UpdateSettingsRequest,
  SettingsCategory,
  DEFAULT_PLATFORM_SETTINGS
} from '@/lib/types/platform-settings.types'
import { appwriteConfig } from '@/lib/appwrite'

class PlatformSettingsService {
  private client: Client
  private databases: Databases
  private storage: Storage

  constructor() {
    this.client = new Client()
      .setEndpoint(appwriteConfig.endpoint)
      .setProject(appwriteConfig.projectId)
    
    this.databases = new Databases(this.client)
    this.storage = new Storage(this.client)
  }

  /**
   * Get all platform settings
   */
  async getAllSettings(): Promise<Record<string, PlatformSettings>> {
    try {
      const response = await this.databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.collections.platformSettings,
        [Query.orderAsc('category'), Query.orderAsc('key')]
      )

      const settings: Record<string, PlatformSettings> = {}
      response.documents.forEach((doc: any) => {
        const setting = doc as PlatformSettings
        settings[`${setting.category}.${setting.key}`] = setting
      })

      return settings
    } catch (error) {
      console.error('Error fetching platform settings:', error)
      return {}
    }
  }

  /**
   * Get settings by category
   */
  async getSettingsByCategory(category: SettingsCategory): Promise<PlatformSettings[]> {
    try {
      const response = await this.databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.collections.platformSettings,
        [
          Query.equal('category', category),
          Query.orderAsc('key')
        ]
      )

      return response.documents as PlatformSettings[]
    } catch (error) {
      console.error('Error fetching settings by category:', error)
      return []
    }
  }

  /**
   * Get specific setting value
   */
  async getSetting(category: SettingsCategory, key: string): Promise<any> {
    try {
      const response = await this.databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.collections.platformSettings,
        [
          Query.equal('category', category),
          Query.equal('key', key)
        ]
      )

      if (response.documents.length > 0) {
        return (response.documents[0] as PlatformSettings).value
      }

      // Return default value if setting doesn't exist
      const defaultSetting = DEFAULT_PLATFORM_SETTINGS[`${category}.${key}`]
      return defaultSetting?.value || null
    } catch (error) {
      console.error('Error fetching setting:', error)
      return null
    }
  }

  /**
   * Update platform settings
   */
  async updateSettings(updates: UpdateSettingsRequest, updatedBy: string): Promise<void> {
    try {
      const updatePromises = Object.entries(updates).map(async ([fullKey, data]) => {
        const [category, key] = fullKey.split('.')
        
        // Check if setting exists
        const existing = await this.databases.listDocuments(
          appwriteConfig.databaseId,
          appwriteConfig.collections.platformSettings,
          [
            Query.equal('category', category),
            Query.equal('key', key)
          ]
        )

        const settingData = {
          category,
          key,
          value: data.value,
          description: data.description || DEFAULT_PLATFORM_SETTINGS[fullKey]?.description || '',
          type: this.inferType(data.value),
          isPublic: DEFAULT_PLATFORM_SETTINGS[fullKey]?.isPublic || false,
          updatedBy,
          updatedAt: new Date().toISOString()
        }

        if (existing.documents.length > 0) {
          // Update existing setting
          return this.databases.updateDocument(
            appwriteConfig.databaseId,
            appwriteConfig.collections.platformSettings,
            existing.documents[0].$id,
            settingData
          )
        } else {
          // Create new setting
          return this.databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.collections.platformSettings,
            ID.unique(),
            {
              ...settingData,
              createdAt: new Date().toISOString()
            }
          )
        }
      })

      await Promise.all(updatePromises)
    } catch (error) {
      console.error('Error updating settings:', error)
      throw error
    }
  }

  /**
   * Initialize default settings
   */
  async initializeDefaultSettings(adminId: string): Promise<void> {
    try {
      const existingSettings = await this.getAllSettings()
      const settingsToCreate = []

      for (const [fullKey, defaultSetting] of Object.entries(DEFAULT_PLATFORM_SETTINGS)) {
        if (!existingSettings[fullKey]) {
          settingsToCreate.push({
            ...defaultSetting,
            updatedBy: adminId,
            updatedAt: new Date().toISOString(),
            createdAt: new Date().toISOString()
          })
        }
      }

      if (settingsToCreate.length > 0) {
        const createPromises = settingsToCreate.map(setting =>
          this.databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.collections.platformSettings,
            ID.unique(),
            setting
          )
        )

        await Promise.all(createPromises)
      }
    } catch (error) {
      console.error('Error initializing default settings:', error)
      throw error
    }
  }

  /**
   * Success Stories Management
   */
  async getAllSuccessStories(publishedOnly: boolean = false): Promise<SuccessStory[]> {
    try {
      const queries = [Query.orderDesc('createdAt')]
      
      if (publishedOnly) {
        queries.push(Query.equal('isPublished', true))
      }

      const response = await this.databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.collections.successStories,
        queries
      )

      return response.documents as SuccessStory[]
    } catch (error) {
      console.error('Error fetching success stories:', error)
      return []
    }
  }

  async createSuccessStory(storyData: CreateSuccessStoryRequest, adminId: string): Promise<SuccessStory> {
    try {
      let imageUrl = ''
      
      if (storyData.image) {
        const imageFile = await this.storage.createFile(
          appwriteConfig.buckets.successStoryImages,
          ID.unique(),
          storyData.image
        )
        imageUrl = imageFile.$id
      }

      const story = await this.databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.successStories,
        ID.unique(),
        {
          title: storyData.title,
          content: storyData.content,
          coupleNames: storyData.coupleNames,
          location: storyData.location,
          marriageDate: storyData.marriageDate,
          imageUrl,
          isPublished: false,
          isFeatured: false,
          submitterEmail: storyData.submitterEmail,
          approvedBy: adminId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          viewCount: 0,
          likes: 0
        }
      )

      return story as SuccessStory
    } catch (error) {
      console.error('Error creating success story:', error)
      throw error
    }
  }

  async updateSuccessStory(storyId: string, updates: UpdateSuccessStoryRequest): Promise<SuccessStory> {
    try {
      const updatedStory = await this.databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.successStories,
        storyId,
        {
          ...updates,
          updatedAt: new Date().toISOString(),
          ...(updates.isPublished && { publishedAt: new Date().toISOString() })
        }
      )

      return updatedStory as SuccessStory
    } catch (error) {
      console.error('Error updating success story:', error)
      throw error
    }
  }

  async deleteSuccessStory(storyId: string): Promise<void> {
    try {
      // Get story to delete associated image
      const story = await this.databases.getDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.successStories,
        storyId
      ) as SuccessStory

      // Delete image if exists
      if (story.imageUrl) {
        try {
          await this.storage.deleteFile(
            appwriteConfig.buckets.successStoryImages,
            story.imageUrl
          )
        } catch (error) {
          console.warn('Failed to delete story image:', error)
        }
      }

      // Delete story document
      await this.databases.deleteDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.successStories,
        storyId
      )
    } catch (error) {
      console.error('Error deleting success story:', error)
      throw error
    }
  }

  /**
   * System Announcements Management
   */
  async getAllAnnouncements(): Promise<SystemAnnouncement[]> {
    try {
      const response = await this.databases.listDocuments(
        appwriteConfig.databaseId,
        'system_announcements',
        [Query.orderDesc('createdAt')]
      )

      return response.documents as SystemAnnouncement[]
    } catch (error) {
      console.error('Error fetching announcements:', error)
      return []
    }
  }

  async getActiveAnnouncements(): Promise<SystemAnnouncement[]> {
    try {
      const now = new Date().toISOString()
      
      const response = await this.databases.listDocuments(
        appwriteConfig.databaseId,
        'system_announcements',
        [
          Query.equal('isActive', true),
          Query.lessThanEqual('startDate', now),
          Query.orderDesc('priority'),
          Query.orderDesc('createdAt')
        ]
      )

      // Filter out expired announcements
      const activeAnnouncements = response.documents.filter((doc: any) => {
        const announcement = doc as SystemAnnouncement
        return !announcement.endDate || announcement.endDate > now
      })

      return activeAnnouncements as SystemAnnouncement[]
    } catch (error) {
      console.error('Error fetching active announcements:', error)
      return []
    }
  }

  async createAnnouncement(announcementData: CreateAnnouncementRequest, createdBy: string): Promise<SystemAnnouncement> {
    try {
      const announcement = await this.databases.createDocument(
        appwriteConfig.databaseId,
        'system_announcements',
        ID.unique(),
        {
          ...announcementData,
          isActive: true,
          createdBy,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          viewCount: 0,
          clickCount: 0
        }
      )

      return announcement as SystemAnnouncement
    } catch (error) {
      console.error('Error creating announcement:', error)
      throw error
    }
  }

  async updateAnnouncement(announcementId: string, updates: UpdateAnnouncementRequest): Promise<SystemAnnouncement> {
    try {
      const updatedAnnouncement = await this.databases.updateDocument(
        appwriteConfig.databaseId,
        'system_announcements',
        announcementId,
        {
          ...updates,
          updatedAt: new Date().toISOString()
        }
      )

      return updatedAnnouncement as SystemAnnouncement
    } catch (error) {
      console.error('Error updating announcement:', error)
      throw error
    }
  }

  async deleteAnnouncement(announcementId: string): Promise<void> {
    try {
      await this.databases.deleteDocument(
        appwriteConfig.databaseId,
        'system_announcements',
        announcementId
      )
    } catch (error) {
      console.error('Error deleting announcement:', error)
      throw error
    }
  }

  /**
   * Platform Analytics
   */
  async getPlatformAnalytics(): Promise<PlatformAnalytics> {
    try {
      const [
        totalUsers,
        activeUsers,
        verifiedUsers,
        totalProfiles,
        totalInterests,
        successfulMatches
      ] = await Promise.all([
        this.databases.listDocuments(
          appwriteConfig.databaseId,
          appwriteConfig.collections.profiles,
          [Query.limit(1)]
        ),
        this.databases.listDocuments(
          appwriteConfig.databaseId,
          appwriteConfig.collections.profiles,
          [
            Query.greaterThan('lastActiveAt', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
            Query.limit(1)
          ]
        ),
        this.databases.listDocuments(
          appwriteConfig.databaseId,
          appwriteConfig.collections.profiles,
          [Query.equal('isVerified', true), Query.limit(1)]
        ),
        this.databases.listDocuments(
          appwriteConfig.databaseId,
          appwriteConfig.collections.profiles,
          [Query.equal('isProfileComplete', true), Query.limit(1)]
        ),
        this.databases.listDocuments(
          appwriteConfig.databaseId,
          appwriteConfig.collections.interests,
          [Query.limit(1)]
        ),
        this.databases.listDocuments(
          appwriteConfig.databaseId,
          appwriteConfig.collections.interests,
          [Query.equal('status', 'accepted'), Query.limit(1)]
        )
      ])

      // Calculate growth rate (simplified)
      const userGrowthRate = await this.calculateUserGrowthRate()
      const engagementRate = await this.calculateEngagementRate()
      const conversionRate = totalUsers.total > 0 ? (successfulMatches.total / totalUsers.total) * 100 : 0

      return {
        totalUsers: totalUsers.total,
        activeUsers: activeUsers.total,
        verifiedUsers: verifiedUsers.total,
        totalProfiles: totalProfiles.total,
        totalInterests: totalInterests.total,
        successfulMatches: successfulMatches.total,
        revenueThisMonth: 0, // Would be calculated from subscription data
        userGrowthRate,
        engagementRate,
        conversionRate
      }
    } catch (error) {
      console.error('Error fetching platform analytics:', error)
      return {
        totalUsers: 0,
        activeUsers: 0,
        verifiedUsers: 0,
        totalProfiles: 0,
        totalInterests: 0,
        successfulMatches: 0,
        revenueThisMonth: 0,
        userGrowthRate: 0,
        engagementRate: 0,
        conversionRate: 0
      }
    }
  }

  /**
   * Private helper methods
   */
  private inferType(value: any): 'string' | 'number' | 'boolean' | 'json' | 'array' {
    if (typeof value === 'string') return 'string'
    if (typeof value === 'number') return 'number'
    if (typeof value === 'boolean') return 'boolean'
    if (Array.isArray(value)) return 'array'
    return 'json'
  }

  private async calculateUserGrowthRate(): Promise<number> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()

      const [currentMonth, previousMonth] = await Promise.all([
        this.databases.listDocuments(
          appwriteConfig.databaseId,
          appwriteConfig.collections.profiles,
          [Query.greaterThan('createdAt', thirtyDaysAgo), Query.limit(1)]
        ),
        this.databases.listDocuments(
          appwriteConfig.databaseId,
          appwriteConfig.collections.profiles,
          [
            Query.greaterThan('createdAt', sixtyDaysAgo),
            Query.lessThan('createdAt', thirtyDaysAgo),
            Query.limit(1)
          ]
        )
      ])

      if (previousMonth.total === 0) return 100
      return ((currentMonth.total - previousMonth.total) / previousMonth.total) * 100
    } catch (error) {
      console.error('Error calculating user growth rate:', error)
      return 0
    }
  }

  private async calculateEngagementRate(): Promise<number> {
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

      const [totalUsers, activeUsers] = await Promise.all([
        this.databases.listDocuments(
          appwriteConfig.databaseId,
          appwriteConfig.collections.profiles,
          [Query.limit(1)]
        ),
        this.databases.listDocuments(
          appwriteConfig.databaseId,
          appwriteConfig.collections.profiles,
          [Query.greaterThan('lastActiveAt', sevenDaysAgo), Query.limit(1)]
        )
      ])

      if (totalUsers.total === 0) return 0
      return (activeUsers.total / totalUsers.total) * 100
    } catch (error) {
      console.error('Error calculating engagement rate:', error)
      return 0
    }
  }
}

export const platformSettingsService = new PlatformSettingsService()