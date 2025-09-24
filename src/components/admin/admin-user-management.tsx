'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Shield, 
  ShieldCheck, 
  ShieldX,
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react'
import { 
  AdminUser, 
  AdminRole, 
  AdminPermission, 
  CreateAdminRequest,
  UpdateAdminRequest,
  ROLE_PERMISSIONS 
} from '@/lib/types/admin.types'
import { adminAuthService } from '@/lib/services/admin-auth.service'
import { useAdminAuth } from '@/hooks/useAdminAuth'

export function AdminUserManagement() {
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null)
  
  const { session, hasPermission } = useAdminAuth()
  const canManageAdmins = hasPermission('admin_management')

  useEffect(() => {
    loadAdmins()
  }, [])

  const loadAdmins = async () => {
    try {
      setIsLoading(true)
      const adminList = await adminAuthService.getAllAdmins()
      setAdmins(adminList)
    } catch (error: any) {
      setError(error.message || 'Failed to load admins')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateAdmin = async (adminData: CreateAdminRequest) => {
    try {
      if (!session) return
      
      await adminAuthService.createAdmin(adminData, session.adminId)
      await loadAdmins()
      setIsCreateDialogOpen(false)
    } catch (error: any) {
      setError(error.message || 'Failed to create admin')
    }
  }

  const handleUpdateAdmin = async (adminId: string, updates: UpdateAdminRequest) => {
    try {
      await adminAuthService.updateAdmin(adminId, updates)
      await loadAdmins()
      setIsEditDialogOpen(false)
      setSelectedAdmin(null)
    } catch (error: any) {
      setError(error.message || 'Failed to update admin')
    }
  }

  const handleDeleteAdmin = async (adminId: string) => {
    if (!confirm('Are you sure you want to delete this admin user?')) return
    
    try {
      await adminAuthService.deleteAdmin(adminId)
      await loadAdmins()
    } catch (error: any) {
      setError(error.message || 'Failed to delete admin')
    }
  }

  const getRoleBadgeColor = (role: AdminRole) => {
    switch (role) {
      case 'super_admin': return 'bg-red-100 text-red-800'
      case 'admin': return 'bg-blue-100 text-blue-800'
      case 'moderator': return 'bg-green-100 text-green-800'
      case 'support': return 'bg-yellow-100 text-yellow-800'
      case 'content_manager': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Admin User Management</h2>
          <p className="text-gray-600">Manage admin users and their permissions</p>
        </div>
        {canManageAdmins && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Admin
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Admin</DialogTitle>
                <DialogDescription>
                  Add a new admin user to the system
                </DialogDescription>
              </DialogHeader>
              <CreateAdminForm onSubmit={handleCreateAdmin} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Admin Users</CardTitle>
          <CardDescription>
            {admins.length} admin user{admins.length !== 1 ? 's' : ''} in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map((admin) => (
                <TableRow key={admin.$id}>
                  <TableCell className="font-medium">{admin.name}</TableCell>
                  <TableCell>{admin.email}</TableCell>
                  <TableCell>
                    <Badge className={getRoleBadgeColor(admin.role)}>
                      {admin.role.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {admin.isActive ? (
                      <Badge variant="outline" className="text-green-600">
                        <ShieldCheck className="mr-1 h-3 w-3" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-red-600">
                        <ShieldX className="mr-1 h-3 w-3" />
                        Inactive
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {admin.lastLoginAt 
                      ? new Date(admin.lastLoginAt).toLocaleDateString()
                      : 'Never'
                    }
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      {canManageAdmins && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedAdmin(admin)
                              setIsEditDialogOpen(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteAdmin(admin.$id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Admin Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Admin User</DialogTitle>
            <DialogDescription>
              Update admin user details and permissions
            </DialogDescription>
          </DialogHeader>
          {selectedAdmin && (
            <EditAdminForm 
              admin={selectedAdmin}
              onSubmit={(updates) => handleUpdateAdmin(selectedAdmin.$id, updates)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Create Admin Form Component
function CreateAdminForm({ onSubmit }: { onSubmit: (data: CreateAdminRequest) => void }) {
  const [formData, setFormData] = useState<CreateAdminRequest>({
    email: '',
    name: '',
    role: 'moderator',
    permissions: [],
    temporaryPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)

  const handleRoleChange = (role: AdminRole) => {
    setFormData({
      ...formData,
      role,
      permissions: ROLE_PERMISSIONS[role]
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Role</Label>
        <Select value={formData.role} onValueChange={handleRoleChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="moderator">Moderator</SelectItem>
            <SelectItem value="support">Support</SelectItem>
            <SelectItem value="content_manager">Content Manager</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="super_admin">Super Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Temporary Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={formData.temporaryPassword}
            onChange={(e) => setFormData({ ...formData, temporaryPassword: e.target.value })}
            required
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Permissions</Label>
        <div className="grid grid-cols-2 gap-2">
          {formData.permissions.map((permission) => (
            <div key={permission} className="flex items-center space-x-2">
              <Checkbox checked disabled />
              <Label className="text-sm">
                {permission.replace('_', ' ').toUpperCase()}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <Button type="submit" className="w-full">
        Create Admin
      </Button>
    </form>
  )
}

// Edit Admin Form Component
function EditAdminForm({ 
  admin, 
  onSubmit 
}: { 
  admin: AdminUser
  onSubmit: (data: UpdateAdminRequest) => void 
}) {
  const [formData, setFormData] = useState<UpdateAdminRequest>({
    name: admin.name,
    role: admin.role,
    permissions: admin.permissions,
    isActive: admin.isActive
  })

  const handleRoleChange = (role: AdminRole) => {
    setFormData({
      ...formData,
      role,
      permissions: ROLE_PERMISSIONS[role]
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Role</Label>
        <Select value={formData.role} onValueChange={handleRoleChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="moderator">Moderator</SelectItem>
            <SelectItem value="support">Support</SelectItem>
            <SelectItem value="content_manager">Content Manager</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="super_admin">Super Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="isActive"
          checked={formData.isActive}
          onCheckedChange={(checked) => 
            setFormData({ ...formData, isActive: checked as boolean })
          }
        />
        <Label htmlFor="isActive">Active</Label>
      </div>

      <div className="space-y-2">
        <Label>Permissions</Label>
        <div className="grid grid-cols-2 gap-2">
          {formData.permissions?.map((permission) => (
            <div key={permission} className="flex items-center space-x-2">
              <Checkbox checked disabled />
              <Label className="text-sm">
                {permission.replace('_', ' ').toUpperCase()}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <Button type="submit" className="w-full">
        Update Admin
      </Button>
    </form>
  )
}