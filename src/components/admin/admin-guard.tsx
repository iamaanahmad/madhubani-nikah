'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AdminPermission } from '@/lib/types/admin.types'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { Loader2, Shield, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface AdminGuardProps {
  children: React.ReactNode
  requiredPermissions?: AdminPermission[]
  fallback?: React.ReactNode
  redirectTo?: string
}

export function AdminGuard({ 
  children, 
  requiredPermissions = [], 
  fallback,
  redirectTo = '/admin/login'
}: AdminGuardProps) {
  const { isAuthenticated, isLoading, hasAnyPermission, session } = useAdminAuth()
  const [isChecking, setIsChecking] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAccess = async () => {
      if (isLoading) return

      if (!isAuthenticated) {
        router.push(redirectTo)
        return
      }

      if (requiredPermissions.length > 0 && !hasAnyPermission(requiredPermissions)) {
        setIsChecking(false)
        return
      }

      setIsChecking(false)
    }

    checkAccess()
  }, [isAuthenticated, isLoading, hasAnyPermission, requiredPermissions, router, redirectTo])

  // Show loading state
  if (isLoading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
          <p className="mt-2 text-sm text-gray-600">Verifying access...</p>
        </div>
      </div>
    )
  }

  // Show unauthorized if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="mx-auto h-12 w-12 text-red-500" />
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You need to be logged in as an admin to access this page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => router.push(redirectTo)}
              className="w-full"
            >
              Go to Admin Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show insufficient permissions
  if (requiredPermissions.length > 0 && !hasAnyPermission(requiredPermissions)) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500" />
            <CardTitle>Insufficient Permissions</CardTitle>
            <CardDescription>
              You don't have the required permissions to access this page.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-gray-600">
              <p><strong>Your role:</strong> {session?.role}</p>
              <p><strong>Required permissions:</strong></p>
              <ul className="list-disc list-inside mt-1">
                {requiredPermissions.map(permission => (
                  <li key={permission} className="text-xs">
                    {permission.replace('_', ' ').toUpperCase()}
                  </li>
                ))}
              </ul>
            </div>
            <Button 
              onClick={() => router.push('/admin/dashboard')}
              className="w-full"
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Render children if all checks pass
  return <>{children}</>
}

// Higher-order component for page-level protection
export function withAdminGuard<P extends object>(
  Component: React.ComponentType<P>,
  requiredPermissions?: AdminPermission[]
) {
  return function ProtectedComponent(props: P) {
    return (
      <AdminGuard requiredPermissions={requiredPermissions}>
        <Component {...props} />
      </AdminGuard>
    )
  }
}