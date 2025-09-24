'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Users, 
  Shield, 
  Flag, 
  Settings, 
  BarChart3, 
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Heart,
  Eye,
  UserCheck,
  Loader2
} from 'lucide-react'
import { AdminUserManagement } from './admin-user-management'
import { VerificationManagement } from './verification-management'
import { ModerationDashboard } from './moderation-dashboard'
import { PlatformSettingsDashboard } from './platform-settings-dashboard'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { verificationAdminService } from '@/lib/services/verification-admin.service'
import { moderationService } from '@/lib/services/moderation.service'
import { platformSettingsService } from '@/lib/services/platform-settings.service'

interface DashboardStats {
  pendingVerifications: number
  pendingReports: number
  totalUsers: number
  activeUsers: number
  todaySignups: number
  criticalIssues: number
}

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  
  const { admin, session, hasPermission } = useAdminAuth()

  useEffect(() => {
    loadDashboardStats()
  }, [])

  const loadDashboardStats = async () => {
    try {
      setIsLoading(true)
      const [verificationStats, moderationStats, platformAnalytics] = await Promise.all([
        verificationAdminService.getVerificationStats(),
        moderationService.getModerationStats(),
        platformSettingsService.getPlatformAnalytics()
      ])

      setStats({
        pendingVerifications: verificationStats.pendingRequests,
        pendingReports: moderationStats.pendingReports,
        totalUsers: platformAnalytics.totalUsers,
        activeUsers: platformAnalytics.activeUsers,
        todaySignups: verificationStats.todaySubmissions, // Using verification submissions as proxy
        criticalIssues: moderationStats.criticalReports
      })
    } catch (error) {
      console.error('Error loading dashboard stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-600">
            Welcome back, {admin?.name}. Here's what's happening on your platform.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-blue-600">
            <Shield className="mr-1 h-3 w-3" />
            {admin?.role.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">
            <BarChart3 className="mr-2 h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="users" disabled={!hasPermission('admin_management')}>
            <Users className="mr-2 h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="verification" disabled={!hasPermission('profile_verification')}>
            <UserCheck className="mr-2 h-4 w-4" />
            Verification
          </TabsTrigger>
          <TabsTrigger value="moderation" disabled={!hasPermission('content_moderation')}>
            <Flag className="mr-2 h-4 w-4" />
            Moderation
          </TabsTrigger>
          <TabsTrigger value="settings" disabled={!hasPermission('platform_settings')}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Quick Stats */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Users</p>
                      <p className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</p>
                      <p className="text-xs text-green-600">
                        +{stats.todaySignups} today
                      </p>
                    </div>
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Active Users</p>
                      <p className="text-2xl font-bold">{stats.activeUsers.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">
                        {((stats.activeUsers / stats.totalUsers) * 100).toFixed(1)}% of total
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Pending Verifications</p>
                      <p className="text-2xl font-bold text-yellow-600">{stats.pendingVerifications}</p>
                      <p className="text-xs text-gray-500">
                        Requires review
                      </p>
                    </div>
                    <Clock className="h-8 w-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Pending Reports</p>
                      <p className="text-2xl font-bold text-orange-600">{stats.pendingReports}</p>
                      <p className="text-xs text-gray-500">
                        Needs attention
                      </p>
                    </div>
                    <Flag className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Critical Issues</p>
                      <p className="text-2xl font-bold text-red-600">{stats.criticalIssues}</p>
                      <p className="text-xs text-gray-500">
                        Urgent action needed
                      </p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Platform Status</p>
                      <p className="text-lg font-bold text-green-600">Operational</p>
                      <p className="text-xs text-gray-500">
                        All systems running
                      </p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common administrative tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {hasPermission('profile_verification') && stats && stats.pendingVerifications > 0 && (
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col"
                    onClick={() => setActiveTab('verification')}
                  >
                    <UserCheck className="h-6 w-6 mb-2" />
                    <span>Review Verifications</span>
                    <Badge variant="secondary" className="mt-1">
                      {stats.pendingVerifications}
                    </Badge>
                  </Button>
                )}

                {hasPermission('content_moderation') && stats && stats.pendingReports > 0 && (
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col"
                    onClick={() => setActiveTab('moderation')}
                  >
                    <Flag className="h-6 w-6 mb-2" />
                    <span>Handle Reports</span>
                    <Badge variant="secondary" className="mt-1">
                      {stats.pendingReports}
                    </Badge>
                  </Button>
                )}

                {hasPermission('admin_management') && (
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col"
                    onClick={() => setActiveTab('users')}
                  >
                    <Users className="h-6 w-6 mb-2" />
                    <span>Manage Admins</span>
                  </Button>
                )}

                {hasPermission('platform_settings') && (
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col"
                    onClick={() => setActiveTab('settings')}
                  >
                    <Settings className="h-6 w-6 mb-2" />
                    <span>Platform Settings</span>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest platform activities and updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">New user registrations</p>
                    <p className="text-xs text-gray-600">
                      {stats?.todaySignups} new users joined today
                    </p>
                  </div>
                  <span className="text-xs text-gray-500">Today</span>
                </div>

                {stats && stats.pendingVerifications > 0 && (
                  <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                    <div className="w-2 h-2 bg-yellow-600 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Verification requests pending</p>
                      <p className="text-xs text-gray-600">
                        {stats.pendingVerifications} documents awaiting review
                      </p>
                    </div>
                    <span className="text-xs text-gray-500">Pending</span>
                  </div>
                )}

                {stats && stats.criticalIssues > 0 && (
                  <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                    <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Critical reports</p>
                      <p className="text-xs text-gray-600">
                        {stats.criticalIssues} high-priority issues need attention
                      </p>
                    </div>
                    <span className="text-xs text-gray-500">Urgent</span>
                  </div>
                )}

                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Platform operational</p>
                    <p className="text-xs text-gray-600">
                      All systems running smoothly
                    </p>
                  </div>
                  <span className="text-xs text-gray-500">Now</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <AdminUserManagement />
        </TabsContent>

        <TabsContent value="verification">
          <VerificationManagement />
        </TabsContent>

        <TabsContent value="moderation">
          <ModerationDashboard />
        </TabsContent>

        <TabsContent value="settings">
          <PlatformSettingsDashboard />
        </TabsContent>
      </Tabs>
    </div>
  )
}