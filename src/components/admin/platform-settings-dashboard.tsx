'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Settings, 
  Save, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  Heart,
  Megaphone,
  BarChart3,
  Users,
  TrendingUp,
  Calendar,
  Star,
  Loader2,
  Upload,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'
import { 
  PlatformSettings,
  SuccessStory,
  SystemAnnouncement,
  PlatformAnalytics,
  CreateSuccessStoryRequest,
  CreateAnnouncementRequest,
  UpdateSettingsRequest,
  SettingsCategory
} from '@/lib/types/platform-settings.types'
import { platformSettingsService } from '@/lib/services/platform-settings.service'
import { useAdminAuth } from '@/hooks/useAdminAuth'

export function PlatformSettingsDashboard() {
  const [settings, setSettings] = useState<Record<string, PlatformSettings>>({})
  const [successStories, setSuccessStories] = useState<SuccessStory[]>([])
  const [announcements, setAnnouncements] = useState<SystemAnnouncement[]>([])
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('settings')
  const [isSaving, setIsSaving] = useState(false)
  const [pendingChanges, setPendingChanges] = useState<UpdateSettingsRequest>({})
  
  const { session, hasPermission } = useAdminAuth()
  const canManageSettings = hasPermission('platform_settings')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [settingsData, storiesData, announcementsData, analyticsData] = await Promise.all([
        platformSettingsService.getAllSettings(),
        platformSettingsService.getAllSuccessStories(),
        platformSettingsService.getAllAnnouncements(),
        platformSettingsService.getPlatformAnalytics()
      ])

      setSettings(settingsData)
      setSuccessStories(storiesData)
      setAnnouncements(announcementsData)
      setAnalytics(analyticsData)
    } catch (error: any) {
      setError(error.message || 'Failed to load platform data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSettingChange = (key: string, value: any, description?: string) => {
    setPendingChanges({
      ...pendingChanges,
      [key]: { value, description }
    })
  }

  const saveSettings = async () => {
    if (!session || Object.keys(pendingChanges).length === 0) return

    try {
      setIsSaving(true)
      await platformSettingsService.updateSettings(pendingChanges, session.adminId)
      setPendingChanges({})
      await loadData()
    } catch (error: any) {
      setError(error.message || 'Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  const renderSettingInput = (setting: PlatformSettings, fullKey: string) => {
    const pendingValue = pendingChanges[fullKey]?.value ?? setting.value

    switch (setting.type) {
      case 'boolean':
        return (
          <Switch
            checked={pendingValue}
            onCheckedChange={(checked) => handleSettingChange(fullKey, checked)}
            disabled={!canManageSettings}
          />
        )
      case 'number':
        return (
          <Input
            type="number"
            value={pendingValue}
            onChange={(e) => handleSettingChange(fullKey, parseInt(e.target.value))}
            disabled={!canManageSettings}
            className="w-32"
          />
        )
      case 'string':
        return (
          <Input
            value={pendingValue}
            onChange={(e) => handleSettingChange(fullKey, e.target.value)}
            disabled={!canManageSettings}
          />
        )
      default:
        return (
          <Textarea
            value={typeof pendingValue === 'object' ? JSON.stringify(pendingValue, null, 2) : pendingValue}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value)
                handleSettingChange(fullKey, parsed)
              } catch {
                handleSettingChange(fullKey, e.target.value)
              }
            }}
            disabled={!canManageSettings}
            rows={3}
          />
        )
    }
  }

  const groupSettingsByCategory = (settings: Record<string, PlatformSettings>) => {
    const grouped: Record<SettingsCategory, PlatformSettings[]> = {
      general: [],
      user_limits: [],
      matching: [],
      notifications: [],
      security: [],
      content: [],
      features: []
    }

    Object.values(settings).forEach(setting => {
      if (grouped[setting.category]) {
        grouped[setting.category].push(setting)
      }
    })

    return grouped
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const groupedSettings = groupSettingsByCategory(settings)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Platform Management</h2>
          <p className="text-gray-600">Manage platform settings, content, and analytics</p>
        </div>
        {Object.keys(pendingChanges).length > 0 && canManageSettings && (
          <Button onClick={saveSettings} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes ({Object.keys(pendingChanges).length})
              </>
            )}
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="settings">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="stories">
            <Heart className="mr-2 h-4 w-4" />
            Success Stories
          </TabsTrigger>
          <TabsTrigger value="announcements">
            <Megaphone className="mr-2 h-4 w-4" />
            Announcements
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="mr-2 h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          {Object.entries(groupedSettings).map(([category, categorySettings]) => {
            if (categorySettings.length === 0) return null

            return (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="capitalize">
                    {category.replace('_', ' ')} Settings
                  </CardTitle>
                  <CardDescription>
                    Configure {category.replace('_', ' ').toLowerCase()} related settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {categorySettings.map(setting => {
                      const fullKey = `${setting.category}.${setting.key}`
                      const hasChanges = pendingChanges[fullKey] !== undefined

                      return (
                        <div key={fullKey} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Label className="font-medium">
                                {setting.key.replace('_', ' ').toUpperCase()}
                              </Label>
                              {hasChanges && (
                                <Badge variant="outline" className="text-orange-600">
                                  Modified
                                </Badge>
                              )}
                              {setting.isPublic && (
                                <Badge variant="outline" className="text-blue-600">
                                  <Eye className="mr-1 h-3 w-3" />
                                  Public
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {setting.description}
                            </p>
                          </div>
                          <div className="ml-4">
                            {renderSettingInput(setting, fullKey)}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </TabsContent>

        <TabsContent value="stories" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Success Stories</h3>
              <p className="text-gray-600">Manage platform success stories</p>
            </div>
            {canManageSettings && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Story
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add Success Story</DialogTitle>
                    <DialogDescription>
                      Create a new success story to inspire users
                    </DialogDescription>
                  </DialogHeader>
                  <SuccessStoryForm onSubmit={loadData} />
                </DialogContent>
              </Dialog>
            )}
          </div>

          <div className="grid gap-4">
            {successStories.map(story => (
              <Card key={story.$id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{story.title}</h4>
                        {story.isPublished ? (
                          <Badge variant="outline" className="text-green-600">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Published
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-600">
                            Draft
                          </Badge>
                        )}
                        {story.isFeatured && (
                          <Badge variant="outline" className="text-yellow-600">
                            <Star className="mr-1 h-3 w-3" />
                            Featured
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {story.coupleNames} • {story.location}
                      </p>
                      <p className="text-sm line-clamp-2">{story.content}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>{story.viewCount} views</span>
                        <span>{story.likes} likes</span>
                        <span>{new Date(story.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {canManageSettings && (
                      <div className="flex gap-2 ml-4">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="announcements" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">System Announcements</h3>
              <p className="text-gray-600">Manage platform announcements</p>
            </div>
            {canManageSettings && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    New Announcement
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create Announcement</DialogTitle>
                    <DialogDescription>
                      Create a new system announcement for users
                    </DialogDescription>
                  </DialogHeader>
                  <AnnouncementForm onSubmit={loadData} />
                </DialogContent>
              </Dialog>
            )}
          </div>

          <div className="grid gap-4">
            {announcements.map(announcement => (
              <Card key={announcement.$id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{announcement.title}</h4>
                        <Badge variant={announcement.isActive ? 'default' : 'secondary'}>
                          {announcement.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant="outline">
                          {announcement.priority.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm line-clamp-2 mb-2">{announcement.content}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Type: {announcement.type.replace('_', ' ')}</span>
                        <span>Target: {announcement.targetAudience.replace('_', ' ')}</span>
                        <span>{announcement.viewCount} views</span>
                        <span>{new Date(announcement.startDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {canManageSettings && (
                      <div className="flex gap-2 ml-4">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {analytics && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Users</p>
                        <p className="text-2xl font-bold">{analytics.totalUsers.toLocaleString()}</p>
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
                        <p className="text-2xl font-bold">{analytics.activeUsers.toLocaleString()}</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Successful Matches</p>
                        <p className="text-2xl font-bold">{analytics.successfulMatches.toLocaleString()}</p>
                      </div>
                      <Heart className="h-8 w-8 text-red-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Engagement Rate</p>
                        <p className="text-2xl font-bold">{analytics.engagementRate.toFixed(1)}%</p>
                      </div>
                      <BarChart3 className="h-8 w-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>User Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span>Verified Users</span>
                        <span className="font-semibold">{analytics.verifiedUsers.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Complete Profiles</span>
                        <span className="font-semibold">{analytics.totalProfiles.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Interests</span>
                        <span className="font-semibold">{analytics.totalInterests.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>User Growth Rate</span>
                        <span className="font-semibold">{analytics.userGrowthRate.toFixed(1)}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Platform Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span>Conversion Rate</span>
                        <span className="font-semibold">{analytics.conversionRate.toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Revenue This Month</span>
                        <span className="font-semibold">₹{analytics.revenueThisMonth.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Success Stories</span>
                        <span className="font-semibold">{successStories.filter(s => s.isPublished).length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Active Announcements</span>
                        <span className="font-semibold">{announcements.filter(a => a.isActive).length}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Success Story Form Component
function SuccessStoryForm({ onSubmit }: { onSubmit: () => void }) {
  const [formData, setFormData] = useState<CreateSuccessStoryRequest>({
    title: '',
    content: '',
    coupleNames: '',
    location: '',
    marriageDate: '',
    submitterEmail: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { session } = useAdminAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session) return

    try {
      setIsSubmitting(true)
      await platformSettingsService.createSuccessStory(formData, session.adminId)
      onSubmit()
    } catch (error) {
      console.error('Error creating success story:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="coupleNames">Couple Names</Label>
          <Input
            id="coupleNames"
            value={formData.coupleNames}
            onChange={(e) => setFormData({ ...formData, coupleNames: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="marriageDate">Marriage Date</Label>
          <Input
            id="marriageDate"
            type="date"
            value={formData.marriageDate}
            onChange={(e) => setFormData({ ...formData, marriageDate: e.target.value })}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="content">Story Content</Label>
        <Textarea
          id="content"
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          rows={4}
          required
        />
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating...
          </>
        ) : (
          'Create Success Story'
        )}
      </Button>
    </form>
  )
}

// Announcement Form Component
function AnnouncementForm({ onSubmit }: { onSubmit: () => void }) {
  const [formData, setFormData] = useState<CreateAnnouncementRequest>({
    title: '',
    content: '',
    type: 'general',
    priority: 'medium',
    targetAudience: 'all_users',
    startDate: new Date().toISOString().split('T')[0]
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { session } = useAdminAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session) return

    try {
      setIsSubmitting(true)
      await platformSettingsService.createAnnouncement(formData, session.adminId)
      onSubmit()
    } catch (error) {
      console.error('Error creating announcement:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="content">Content</Label>
        <Textarea
          id="content"
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          rows={3}
          required
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="type">Type</Label>
          <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="feature_update">Feature Update</SelectItem>
              <SelectItem value="policy_change">Policy Change</SelectItem>
              <SelectItem value="celebration">Celebration</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="priority">Priority</Label>
          <Select value={formData.priority} onValueChange={(value: any) => setFormData({ ...formData, priority: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="targetAudience">Target</Label>
          <Select value={formData.targetAudience} onValueChange={(value: any) => setFormData({ ...formData, targetAudience: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all_users">All Users</SelectItem>
              <SelectItem value="verified_users">Verified Users</SelectItem>
              <SelectItem value="premium_users">Premium Users</SelectItem>
              <SelectItem value="new_users">New Users</SelectItem>
              <SelectItem value="inactive_users">Inactive Users</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="startDate">Start Date</Label>
          <Input
            id="startDate"
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="endDate">End Date (Optional)</Label>
          <Input
            id="endDate"
            type="date"
            value={formData.endDate || ''}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value || undefined })}
          />
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating...
          </>
        ) : (
          'Create Announcement'
        )}
      </Button>
    </form>
  )
}