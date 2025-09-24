export interface AdminUser {
  $id: string
  userId: string
  email: string
  name: string
  role: AdminRole
  permissions: AdminPermission[]
  isActive: boolean
  createdAt: string
  updatedAt: string
  lastLoginAt?: string
  createdBy?: string
}

export type AdminRole = 
  | 'super_admin'
  | 'admin'
  | 'moderator'
  | 'support'
  | 'content_manager'

export type AdminPermission = 
  | 'user_management'
  | 'profile_verification'
  | 'content_moderation'
  | 'report_handling'
  | 'platform_settings'
  | 'analytics_access'
  | 'admin_management'
  | 'system_announcements'
  | 'success_story_management'

export interface AdminSession {
  adminId: string
  userId: string
  role: AdminRole
  permissions: AdminPermission[]
  sessionToken: string
  expiresAt: string
}

export interface AdminLoginRequest {
  email: string
  password: string
  twoFactorCode?: string
}

export interface AdminLoginResponse {
  success: boolean
  admin?: AdminUser
  session?: AdminSession
  requiresTwoFactor?: boolean
  error?: string
}

export interface CreateAdminRequest {
  email: string
  name: string
  role: AdminRole
  permissions: AdminPermission[]
  temporaryPassword: string
}

export interface UpdateAdminRequest {
  name?: string
  role?: AdminRole
  permissions?: AdminPermission[]
  isActive?: boolean
}

export interface AdminPermissionCheck {
  hasPermission: boolean
  requiredPermission: AdminPermission
  userPermissions: AdminPermission[]
}

export const ROLE_PERMISSIONS: Record<AdminRole, AdminPermission[]> = {
  super_admin: [
    'user_management',
    'profile_verification',
    'content_moderation',
    'report_handling',
    'platform_settings',
    'analytics_access',
    'admin_management',
    'system_announcements',
    'success_story_management'
  ],
  admin: [
    'user_management',
    'profile_verification',
    'content_moderation',
    'report_handling',
    'platform_settings',
    'analytics_access',
    'system_announcements',
    'success_story_management'
  ],
  moderator: [
    'profile_verification',
    'content_moderation',
    'report_handling',
    'analytics_access'
  ],
  support: [
    'user_management',
    'report_handling',
    'analytics_access'
  ],
  content_manager: [
    'content_moderation',
    'success_story_management',
    'system_announcements'
  ]
}