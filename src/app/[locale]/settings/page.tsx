
import MainLayout from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { currentUser } from '@/lib/data';
import { Lock, User, Shield, Bell } from 'lucide-react';

export default function SettingsPage() {
  return (
    <MainLayout>
      <div className="container mx-auto p-4 md:p-8">
        <div className="mx-auto max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-headline text-3xl">
                <User className="h-8 w-8 text-primary" />
                Account Settings
              </CardTitle>
              <CardDescription>
                Manage your account, privacy, and notification settings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="account">
                <TabsList className="grid w-full grid-cols-1 md:grid-cols-3">
                  <TabsTrigger value="account">
                    <User className="mr-2" /> Account
                  </TabsTrigger>
                  <TabsTrigger value="security">
                    <Lock className="mr-2" /> Security
                  </TabsTrigger>
                  <TabsTrigger value="privacy">
                    <Shield className="mr-2" /> Privacy
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="account">
                  <div className="space-y-6 pt-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" defaultValue={currentUser.name} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" defaultValue={currentUser.email} disabled />
                      <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
                    </div>
                    <Button>Update Profile</Button>
                  </div>
                </TabsContent>

                <TabsContent value="security">
                  <div className="space-y-6 pt-6">
                    <h3 className="font-semibold text-lg">Change Password</h3>
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Current Password</Label>
                      <Input id="current-password" type="password" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input id="new-password" type="password" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input id="confirm-password" type="password" />
                    </div>
                    <Button>Change Password</Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="privacy">
                    <div className="space-y-6 pt-6">
                        <h3 className="font-semibold text-lg">Privacy Settings</h3>
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div>
                                <Label htmlFor="photo-blur" className="text-base">Blur My Photo</Label>
                                <p className="text-sm text-muted-foreground">
                                Hide your profile picture from public view. Other users will need to send a proposal to see your photo.
                                </p>
                            </div>
                             <Switch id="photo-blur" defaultChecked={currentUser.isPhotoBlurred} />
                        </div>
                    </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
