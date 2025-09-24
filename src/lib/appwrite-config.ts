// Appwrite Database and Collection IDs
export const DATABASE_ID = 'madhubani_nikah_db';

export const COLLECTION_IDS = {
  PROFILES: 'profiles',
  INTERESTS: 'interests',
  NOTIFICATIONS: 'notifications',
  VERIFICATION_REQUESTS: 'verification_requests',
  ADMINS: 'admins',
  SUCCESS_STORIES: 'success_stories',
  USER_REPORTS: 'user_reports',
  PLATFORM_SETTINGS: 'platform_settings',
  USER_STATUS: 'user_status',
  USER_ACTIVITIES: 'user_activities',
  COMPATIBILITY_SCORES: 'compatibility_scores',
  MATCH_RECOMMENDATIONS: 'match_recommendations',
  MATCH_ANALYTICS: 'match_analytics',
  ISLAMIC_CONTENT: 'islamic_content',
} as const;

// Storage Bucket IDs
export const BUCKET_IDS = {
  PROFILE_PICTURES: 'profile_pictures',
  VERIFICATION_DOCUMENTS: 'verification_documents',
  SUCCESS_STORY_IMAGES: 'success_story_images',
} as const;

// Function IDs (for future use)
export const FUNCTION_IDS = {
  AI_MATCHING: 'ai_matching',
  NOTIFICATION_SENDER: 'notification_sender',
  IMAGE_PROCESSOR: 'image_processor',
} as const;

// Permission templates
export const PERMISSIONS = {
  // Anyone can read, only authenticated users can write
  PUBLIC_READ_USER_WRITE: [
    'read("any")',
    'write("users")',
    'update("users")',
    'delete("users")'
  ],
  
  // Only authenticated users can read and write
  USER_ONLY: [
    'read("users")',
    'write("users")',
    'update("users")',
    'delete("users")'
  ],
  
  // Only the document owner can access
  OWNER_ONLY: [
    'read("user:self")',
    'write("user:self")',
    'update("user:self")',
    'delete("user:self")'
  ],
  
  // Admin only access
  ADMIN_ONLY: [
    'read("role:admin")',
    'write("role:admin")',
    'update("role:admin")',
    'delete("role:admin")'
  ],

  // Public read, owner write
  PUBLIC_READ_OWNER_WRITE: [
    'read("any")',
    'write("user:self")',
    'update("user:self")',
    'delete("user:self")'
  ]
} as const;

// File size limits (in bytes)
export const FILE_LIMITS = {
  PROFILE_PICTURE_MAX_SIZE: 5 * 1024 * 1024, // 5MB
  VERIFICATION_DOCUMENT_MAX_SIZE: 10 * 1024 * 1024, // 10MB
  SUCCESS_STORY_IMAGE_MAX_SIZE: 5 * 1024 * 1024, // 5MB
} as const;

// Allowed file extensions
export const ALLOWED_EXTENSIONS = {
  IMAGES: ['jpg', 'jpeg', 'png', 'webp'],
  DOCUMENTS: ['jpg', 'jpeg', 'png', 'pdf'],
} as const;

// MIME types for validation
export const ALLOWED_MIME_TYPES = {
  IMAGES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  DOCUMENTS: ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'],
} as const;

// Query limits
export const QUERY_LIMITS = {
  DEFAULT_PAGE_SIZE: 25,
  MAX_PAGE_SIZE: 100,
  SEARCH_RESULTS_LIMIT: 50,
  NOTIFICATION_LIMIT: 20,
  INTEREST_HISTORY_LIMIT: 50,
} as const;

// Rate limiting constants
export const RATE_LIMITS = {
  INTEREST_SEND_DAILY_LIMIT: 10,
  PROFILE_VIEW_HOURLY_LIMIT: 100,
  SEARCH_HOURLY_LIMIT: 50,
  FILE_UPLOAD_DAILY_LIMIT: 20,
} as const;

// Cache durations (in seconds)
export const CACHE_DURATIONS = {
  PROFILE_DATA: 300, // 5 minutes
  SEARCH_RESULTS: 180, // 3 minutes
  USER_SESSION: 3600, // 1 hour
  STATIC_DATA: 86400, // 24 hours
} as const;

// Notification types
export const NOTIFICATION_TYPES = {
  NEW_INTEREST: 'new_interest',
  INTEREST_ACCEPTED: 'interest_accepted',
  INTEREST_DECLINED: 'interest_declined',
  NEW_MATCH: 'new_match',
  PROFILE_VIEW: 'profile_view',
  VERIFICATION_UPDATE: 'verification_update',
  SYSTEM_ANNOUNCEMENT: 'system_announcement',
  PROFILE_INCOMPLETE: 'profile_incomplete',
  SUBSCRIPTION_EXPIRY: 'subscription_expiry',
} as const;

// Interest status types
export const INTEREST_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  WITHDRAWN: 'withdrawn',
  EXPIRED: 'expired',
} as const;

// Profile visibility options
export const PROFILE_VISIBILITY = {
  PUBLIC: 'public',
  MEMBERS: 'members',
  PRIVATE: 'private',
} as const;

// Verification status types
export const VERIFICATION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
} as const;

// User roles
export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  SUPER_ADMIN: 'super_admin',
} as const;

// Madhubani-specific constants
export const MADHUBANI_CONFIG = {
  DISTRICTS: ['Madhubani', 'Darbhanga', 'Sitamarhi', 'Samastipur', 'Muzaffarpur'],
  BLOCKS: [
    'Madhubani', 'Jainagar', 'Phulparas', 'Pandaul', 'Rajnagar',
    'Benipatti', 'Khajauli', 'Babubarhi', 'Ladania', 'Ghoghardiha',
    'Bisfi', 'Harlakhi', 'Kaluahi', 'Laukaha', 'Laukahi'
  ],
  SECTS: ['Sunni', 'Shia', 'Other'],
  EDUCATION_LEVELS: [
    'High School', 'Intermediate', 'Graduate', 'Post Graduate',
    'Professional Degree', 'Doctorate', 'Diploma', 'Other'
  ],
  OCCUPATIONS: [
    'Student', 'Teacher', 'Engineer', 'Doctor', 'Business',
    'Government Job', 'Private Job', 'Farmer', 'Homemaker', 'Other'
  ],
} as const;

// Default values
export const DEFAULTS = {
  PROFILE_PICTURE_BLUR: true,
  PROFILE_VISIBILITY: PROFILE_VISIBILITY.MEMBERS,
  NOTIFICATION_PREFERENCES: {
    email: true,
    push: true,
    sms: false,
  },
  SEARCH_RADIUS: 50, // km
  AGE_RANGE: { min: 18, max: 35 },
} as const;