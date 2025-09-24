import { useState, useEffect, useCallback } from 'react'
import { 
  AdminUser, 
  AdminSession, 
  AdminLoginRequest, 
  AdminPermission,
  AdminRole 
} from '@/lib/types/admin.types'
import { adminAuthService } from '@/lib/services/admin-auth.service'

interface UseAdminAuthReturn {
  admin: AdminUser | null
  session: AdminSession | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (credentials: AdminLoginRequest) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  hasPermission: (permission: AdminPermission) => boolean
  hasAnyPermission: (permissions: AdminPermission[]) => boolean
  checkAccess: (requiredPermissions?: AdminPermission[]) => Promise<boolean>
  refreshSession: () => Promise<void>
}

export function useAdminAuth(): UseAdminAuthReturn {
  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const [session, setSession] = useState<AdminSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isAuthenticated = !!session && !!admin

  /**
   * Initialize admin session on mount
   */
  useEffect(() => {
    initializeSession()
  }, [])

  const initializeSession = async () => {
    try {
      setIsLoading(true)
      const currentSession = await adminAuthService.getCurrentAdminSession()
      
      if (currentSession) {
        setSession(currentSession)
        const adminUser = await adminAuthService.getAdminByUserId(currentSession.userId)
        setAdmin(adminUser)
      }
    } catch (error) {
      console.error('Error initializing admin session:', error)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Login admin user
   */
  const login = useCallback(async (credentials: AdminLoginRequest) => {
    try {
      setIsLoading(true)
      const result = await adminAuthService.loginAdmin(credentials)
      
      if (result.success && result.admin && result.session) {
        setAdmin(result.admin)
        setSession(result.session)
        return { success: true }
      } else {
        return { 
          success: false, 
          error: result.error || 'Login failed' 
        }
      }
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'Login failed' 
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Logout admin user
   */
  const logout = useCallback(async () => {
    try {
      setIsLoading(true)
      await adminAuthService.logoutAdmin()
      setAdmin(null)
      setSession(null)
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Check if admin has specific permission
   */
  const hasPermission = useCallback((permission: AdminPermission): boolean => {
    if (!session) return false
    return session.permissions.includes(permission)
  }, [session])

  /**
   * Check if admin has any of the specified permissions
   */
  const hasAnyPermission = useCallback((permissions: AdminPermission[]): boolean => {
    if (!session) return false
    return adminAuthService.checkAnyPermission(session, permissions)
  }, [session])

  /**
   * Check access with required permissions
   */
  const checkAccess = useCallback(async (requiredPermissions?: AdminPermission[]): Promise<boolean> => {
    try {
      const result = await adminAuthService.validateAdminAccess(requiredPermissions)
      return result.isValid
    } catch (error) {
      console.error('Error checking access:', error)
      return false
    }
  }, [])

  /**
   * Refresh current session
   */
  const refreshSession = useCallback(async () => {
    await initializeSession()
  }, [])

  return {
    admin,
    session,
    isLoading,
    isAuthenticated,
    login,
    logout,
    hasPermission,
    hasAnyPermission,
    checkAccess,
    refreshSession
  }
}