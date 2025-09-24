export interface PlatformSettings {
  $id: string
  category: SettingsCategory
  key: string
  value: any
  type: SettingsType
  description: string
  isPublic: boolean
  updatedBy: string
  updatedAt: string
  createdAt: string
}

export type SettingsCategory = 
  | 'general'
  | 'user_limits'
  | 'matching'
  | 'notifications'
  | 'security'
  | 'content'
  | 'features'

export type SettingsType = 
  | 'string'
  | 'number'
  | 'boolean'
  | 'json'
  | 'array'

export interface SuccessStory {
  $id: string
  title: string
  content: string
  coupleNames: string
  location: string
  marriageDate: string
  imageUrl?: string
  isPublished: boolean
  isFeatured: boolean
  submittedBy?: string
  submitterEmail?: string
  approvedBy?: string
  publishedAt?: string
  createdAt: string
  updatedAt: string
  viewCount: number
  likes: number
}

export interface SystemAnnouncement {
  $id: string
  title: string
  content: string
  type: AnnouncementType
  priority: AnnouncementPriority
  targetAudience: TargetAudience
  isActive: boolean
  startDate: string
  endDate?: string
  createdBy: string
  createdAt: string
  updatedAt: string
  viewCount: number
  clickCount: number
}

export type AnnouncementType = 
  | 'maintenance'
  | 'feature_update'
  | 'policy_change'
  | 'celebration'
  | 'warning'
  | 'general'

export type AnnouncementPriority = 
  | 'low'
  | 'medium'
  | 'high'
  | 'critical'

export type TargetAudience = 
  | 'all_users'
  | 'verified_users'
  | 'premium_users'
  | 'new_users'
  | 'inactive_users'

export interface PlatformAnalytics {
  totalUsers: number
  activeUsers: number
  verifiedUsers: number
  totalProfiles: number
  totalInterests: number
  successfulMatches: number
  revenueThisMonth: number
  userGrowthRate: number
  engagementRate: number
  conversionRate: number
}

export interface CreateSuccessStoryRequest {
  title: string
  content: string
  coupleNames: string
  location: string
  marriageDate: string
  image?: File
  submitterEmail?: string
}

export interface UpdateSuccessStoryRequest {
  title?: string
  content?: string
  coupleNames?: string
  location?: string
  marriageDate?: string
  isPublished?: boolean
  isFeatured?: boolean
}

export interface CreateAnnouncementRequest {
  title: string
  content: string
  type: AnnouncementType
  priority: AnnouncementPriority
  targetAudience: TargetAudience
  startDate: string
  endDate?: string
}

export interface UpdateAnnouncementRequest {
  title?: string
  content?: string
  type?: AnnouncementType
  priority?: AnnouncementPriority
  targetAudience?: TargetAudience
  isActive?: boolean
  startDate?: string
  endDate?: string
}

export interface UpdateSettingsRequest {
  [key: string]: {
    value: any
    description?: string
  }
}

export const DEFAULT_PLATFORM_SETTINGS: Record<string, PlatformSettings> = {
  // General Settings
  'general.platform_name': {
    $id: '',
    category: 'general',
    key: 'platform_name',
    value: 'Madhubani Nikah',
    type: 'string',
    description: 'Name of the platform',
    isPublic: true,
    updatedBy: '',
    updatedAt: '',
    createdAt: ''
  },
  'general.maintenance_mode': {
    $id: '',
    category: 'general',
    key: 'maintenance_mode',
    value: false,
    type: 'boolean',
    description: 'Enable maintenance mode',
    isPublic: false,
    updatedBy: '',
    updatedAt: '',
    createdAt: ''
  },
  
  // User Limits
  'user_limits.daily_interests': {
    $id: '',
    category: 'user_limits',
    key: 'daily_interests',
    value: 10,
    type: 'number',
    description: 'Maximum interests a user can send per day',
    isPublic: false,
    updatedBy: '',
    updatedAt: '',
    createdAt: ''
  },
  'user_limits.profile_views_per_hour': {
    $id: '',
    category: 'user_limits',
    key: 'profile_views_per_hour',
    value: 100,
    type: 'number',
    description: 'Maximum profile views per hour',
    isPublic: false,
    updatedBy: '',
    updatedAt: '',
    createdAt: ''
  },
  
  // Matching Settings
  'matching.enable_ai_matching': {
    $id: '',
    category: 'matching',
    key: 'enable_ai_matching',
    value: true,
    type: 'boolean',
    description: 'Enable AI-powered matching',
    isPublic: false,
    updatedBy: '',
    updatedAt: '',
    createdAt: ''
  },
  'matching.default_search_radius': {
    $id: '',
    category: 'matching',
    key: 'default_search_radius',
    value: 50,
    type: 'number',
    description: 'Default search radius in kilometers',
    isPublic: false,
    updatedBy: '',
    updatedAt: '',
    createdAt: ''
  },
  
  // Security Settings
  'security.require_email_verification': {
    $id: '',
    category: 'security',
    key: 'require_email_verification',
    value: true,
    type: 'boolean',
    description: 'Require email verification for new accounts',
    isPublic: false,
    updatedBy: '',
    updatedAt: '',
    createdAt: ''
  },
  'security.enable_two_factor': {
    $id: '',
    category: 'security',
    key: 'enable_two_factor',
    value: false,
    type: 'boolean',
    description: 'Enable two-factor authentication',
    isPublic: false,
    updatedBy: '',
    updatedAt: '',
    createdAt: ''
  }
}