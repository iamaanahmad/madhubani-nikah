import { Client, Account, Databases, Query, ID } from 'appwrite'
import { client, account, databases } from '@/lib/appwrite'
import { 
  AdminUser, 
  AdminSession, 
  AdminLoginRequest, 
  AdminLoginResponse,
  CreateAdminRequest,
  UpdateAdminRequest,
  AdminRole,
  AdminPermission,
  ROLE_PERMISSIONS,
  AdminPermissionCheck
} from '@/lib/types/admin.types'
import { DATABASE_ID, COLLECTION_IDS } from '@/lib/appwrite-config'

class AdminAuthService {
  private client: Client
  private account: Account
  private databases: Databases

  constructor() {
    this.client = client
    this.account = account
    this.databases = databases
  }

  /**
   * Authenticate admin user with email and password
   */
  async loginAdmin(credentials: AdminLoginRequest): Promise<AdminLoginResponse> {
    try {
      // First authenticate with Appwrite Auth
      const session = await this.account.createEmailSession(
        credentials.email,
        credentials.password
      )

      // Get current user
      const user = await this.account.get()

      // Check if user is an admin
      const adminUser = await this.getAdminByUserId(user.$id)
      
      if (!adminUser) {
        await this.account.deleteSession('current')
        return {
          success: false,
          error: 'Access denied. Admin privileges required.'
        }
      }

      if (!adminUser.isActive) {
        await this.account.deleteSession('current')
        return {
          success: false,
          error: 'Admin account is deactivated.'
        }
      }

      // Update last login time
      await this.updateAdminLastLogin(adminUser.$id)

      const adminSession: AdminSession = {
        adminId: adminUser.$id,
        userId: user.$id,
        role: adminUser.role,
        permissions: adminUser.permissions,
        sessionToken: session.$id,
        expiresAt: session.expire
      }

      return {
        success: true,
        admin: adminUser,
        session: adminSession
      }
    } catch (error: any) {
      console.error('Admin login error:', error)
      return {
        success: false,
        error: error.message || 'Login failed'
      }
    }
  }

  /**
   * Get admin user by user ID
   */
  async getAdminByUserId(userId: string): Promise<AdminUser | null> {
    try {
      const response = await this.databases.listDocuments(
        DATABASE_ID,
        COLLECTION_IDS.ADMINS,
        [Query.equal('userId', userId)]
      )

      if (response.documents.length === 0) {
        return null
      }

      return response.documents[0] as AdminUser
    } catch (error) {
      console.error('Error fetching admin user:', error)
      return null
    }
  }

  /**
   * Get current admin session
   */
  async getCurrentAdminSession(): Promise<AdminSession | null> {
    try {
      const session = await this.account.getSession('current')
      const user = await this.account.get()
      const adminUser = await this.getAdminByUserId(user.$id)

      if (!adminUser || !adminUser.isActive) {
        return null
      }

      return {
        adminId: adminUser.$id,
        userId: user.$id,
        role: adminUser.role,
        permissions: adminUser.permissions,
        sessionToken: session.$id,
        expiresAt: session.expire
      }
    } catch (error) {
      console.error('Error getting admin session:', error)
      return null
    }
  }

  /**
   * Logout admin user
   */
  async logoutAdmin(): Promise<void> {
    try {
      await this.account.deleteSession('current')
    } catch (error) {
      console.error('Admin logout error:', error)
      throw error
    }
  }

  /**
   * Create new admin user
   */
  async createAdmin(adminData: CreateAdminRequest, createdBy: string): Promise<AdminUser> {
    try {
      // First create Appwrite Auth user
      const authUser = await this.account.create(
        ID.unique(),
        adminData.email,
        adminData.temporaryPassword,
        adminData.name
      )

      // Create admin document
      const adminDoc = await this.databases.createDocument(
        DATABASE_ID,
        COLLECTION_IDS.ADMINS,
        ID.unique(),
        {
          userId: authUser.$id,
          email: adminData.email,
          name: adminData.name,
          role: adminData.role,
          permissions: adminData.permissions,
          isActive: true,
          createdBy,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      )

      return adminDoc as AdminUser
    } catch (error) {
      console.error('Error creating admin:', error)
      throw error
    }
  }

  /**
   * Update admin user
   */
  async updateAdmin(adminId: string, updates: UpdateAdminRequest): Promise<AdminUser> {
    try {
      const updatedDoc = await this.databases.updateDocument(
        DATABASE_ID,
        COLLECTION_IDS.ADMINS,
        adminId,
        {
          ...updates,
          updatedAt: new Date().toISOString()
        }
      )

      return updatedDoc as AdminUser
    } catch (error) {
      console.error('Error updating admin:', error)
      throw error
    }
  }

  /**
   * Get all admin users
   */
  async getAllAdmins(): Promise<AdminUser[]> {
    try {
      const response = await this.databases.listDocuments(
        DATABASE_ID,
        COLLECTION_IDS.ADMINS,
        [Query.orderDesc('createdAt')]
      )

      return response.documents as AdminUser[]
    } catch (error) {
      console.error('Error fetching admins:', error)
      throw error
    }
  }

  /**
   * Delete admin user
   */
  async deleteAdmin(adminId: string): Promise<void> {
    try {
      await this.databases.deleteDocument(
        DATABASE_ID,
        COLLECTION_IDS.ADMINS,
        adminId
      )
    } catch (error) {
      console.error('Error deleting admin:', error)
      throw error
    }
  }

  /**
   * Check if admin has specific permission
   */
  checkPermission(adminSession: AdminSession, requiredPermission: AdminPermission): AdminPermissionCheck {
    const hasPermission = adminSession.permissions.includes(requiredPermission)
    
    return {
      hasPermission,
      requiredPermission,
      userPermissions: adminSession.permissions
    }
  }

  /**
   * Check if admin has any of the specified permissions
   */
  checkAnyPermission(adminSession: AdminSession, permissions: AdminPermission[]): boolean {
    return permissions.some(permission => adminSession.permissions.includes(permission))
  }

  /**
   * Get permissions for a role
   */
  getRolePermissions(role: AdminRole): AdminPermission[] {
    return ROLE_PERMISSIONS[role] || []
  }

  /**
   * Update admin last login time
   */
  private async updateAdminLastLogin(adminId: string): Promise<void> {
    try {
      await this.databases.updateDocument(
        DATABASE_ID,
        COLLECTION_IDS.ADMINS,
        adminId,
        {
          lastLoginAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      )
    } catch (error) {
      console.error('Error updating last login:', error)
    }
  }

  /**
   * Validate admin session and permissions
   */
  async validateAdminAccess(requiredPermissions: AdminPermission[] = []): Promise<{
    isValid: boolean
    session?: AdminSession
    missingPermissions?: AdminPermission[]
  }> {
    try {
      const session = await this.getCurrentAdminSession()
      
      if (!session) {
        return { isValid: false }
      }

      if (requiredPermissions.length === 0) {
        return { isValid: true, session }
      }

      const missingPermissions = requiredPermissions.filter(
        permission => !session.permissions.includes(permission)
      )

      if (missingPermissions.length > 0) {
        return { 
          isValid: false, 
          session, 
          missingPermissions 
        }
      }

      return { isValid: true, session }
    } catch (error) {
      console.error('Error validating admin access:', error)
      return { isValid: false }
    }
  }
}

export const adminAuthService = new AdminAuthService()