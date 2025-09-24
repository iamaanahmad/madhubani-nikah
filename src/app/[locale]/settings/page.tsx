
'use client';

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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Lock, User, Shield, Bell, Loader2, Upload, X } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { useProfile } from '@/hooks/useProfile';
import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { MADHUBANI_CONFIG } from '@/lib/appwrite-config';
import Image from 'next/image';

export default function SettingsPage() {
  const { user } = useAuth();
  const { profile, loading, updateProfile, uploadProfilePicture, deleteProfilePicture } = useProfile(user?.$id);
  const [updating, setUpdating] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    religiousPractice: '',
    familyBackground: '',
    village: '',
    education: '',
    occupation: '',
    sect: '' as 'Sunni' | 'Shia' | 'Other' | '',
    isPhotoBlurred: false,
    profileVisibility: 'public' as 'public' | 'members' | 'private'
  });

  // Update form data when profile loads
  useState(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        bio: profile.bio || '',
        religiousPractice: profile.religiousPractice || '',
        familyBackground: profile.familyBackground || '',
        village: profile.village || '',
        education: profile.education || '',
        occupation: profile.occupation || '',
        sect: profile.sect || 'Sunni',
        isPhotoBlurred: profile.isPhotoBlurred || false,
        profileVisibility: profile.profileVisibility || 'public'
      });
    }
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleUpdateProfile = async () => {
    if (!user || !profile) return;
    
    setUpdating(true);
    try {
      await updateProfile(formData);
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploadingPhoto(true);
    try {
      await uploadProfilePicture(file);
      toast.success('Profile picture uploaded successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload profile picture');
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeletePhoto = async () => {
    if (!user) return;

    setUploadingPhoto(true);
    try {
      await deleteProfilePicture();
      toast.success('Profile picture deleted successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete profile picture');
    } finally {
      setUploadingPhoto(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto p-4 md:p-8 flex items-center justify-center min-h-[50vh]">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading profile...</span>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!profile) {
    return (
      <MainLayout>
        <div className="container mx-auto p-4 md:p-8 text-center">
          <p className="text-muted-foreground">Profile not found. Please create your profile first.</p>
        </div>
      </MainLayout>
    );
  }

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
              <Tabs defaultValue="profile">
                <TabsList className="grid w-full grid-cols-1 md:grid-cols-3">
                  <TabsTrigger value="profile">
                    <User className="mr-2" /> Profile
                  </TabsTrigger>
                  <TabsTrigger value="privacy">
                    <Shield className="mr-2" /> Privacy
                  </TabsTrigger>
                  <TabsTrigger value="security">
                    <Lock className="mr-2" /> Security
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="profile">
                  <div className="space-y-6 pt-6">
                    {/* Profile Picture Section */}
                    <div className="space-y-4">
                      <Label>Profile Picture</Label>
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                          {profile.profilePictureUrl ? (
                            <Image
                              src={profile.profilePictureUrl}
                              alt="Profile"
                              width={80}
                              height={80}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <User className="h-8 w-8 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingPhoto}
                          >
                            {uploadingPhoto ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <Upload className="h-4 w-4 mr-2" />
                            )}
                            Upload
                          </Button>
                          {profile.profilePictureUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleDeletePhoto}
                              disabled={uploadingPhoto}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Remove
                            </Button>
                          )}
                        </div>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input 
                        id="name" 
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" value={user?.email || ''} disabled />
                      <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="village">Village</Label>
                      <Input 
                        id="village" 
                        value={formData.village}
                        onChange={(e) => handleInputChange('village', e.target.value)}
                        placeholder="Your village"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="education">Education</Label>
                        <Select value={formData.education} onValueChange={(value) => handleInputChange('education', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select education" />
                          </SelectTrigger>
                          <SelectContent>
                            {MADHUBANI_CONFIG.EDUCATION_LEVELS.map(edu => (
                              <SelectItem key={edu} value={edu}>{edu}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="occupation">Occupation</Label>
                        <Select value={formData.occupation} onValueChange={(value) => handleInputChange('occupation', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select occupation" />
                          </SelectTrigger>
                          <SelectContent>
                            {MADHUBANI_CONFIG.OCCUPATIONS.map(occ => (
                              <SelectItem key={occ} value={occ}>{occ}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sect">Sect</Label>
                      <Select value={formData.sect} onValueChange={(value) => handleInputChange('sect', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select sect" />
                        </SelectTrigger>
                        <SelectContent>
                          {MADHUBANI_CONFIG.SECTS.map(sect => (
                            <SelectItem key={sect} value={sect}>{sect}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="religiousPractice">Religious Practice</Label>
                      <Input 
                        id="religiousPractice" 
                        value={formData.religiousPractice}
                        onChange={(e) => handleInputChange('religiousPractice', e.target.value)}
                        placeholder="e.g., Prays 5 times a day, Fasts in Ramadan"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="familyBackground">Family Background</Label>
                      <Textarea 
                        id="familyBackground" 
                        value={formData.familyBackground}
                        onChange={(e) => handleInputChange('familyBackground', e.target.value)}
                        placeholder="Tell us about your family background"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">About Yourself</Label>
                      <Textarea 
                        id="bio" 
                        value={formData.bio}
                        onChange={(e) => handleInputChange('bio', e.target.value)}
                        placeholder="Tell us about yourself and what you're looking for"
                      />
                    </div>

                    <Button onClick={handleUpdateProfile} disabled={updating}>
                      {updating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        'Update Profile'
                      )}
                    </Button>
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
                      <Switch 
                        id="photo-blur" 
                        checked={formData.isPhotoBlurred}
                        onCheckedChange={(checked) => handleInputChange('isPhotoBlurred', checked)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="profileVisibility">Profile Visibility</Label>
                      <Select value={formData.profileVisibility} onValueChange={(value) => handleInputChange('profileVisibility', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">Public - Visible to everyone</SelectItem>
                          <SelectItem value="members">Members Only - Visible to registered users</SelectItem>
                          <SelectItem value="private">Private - Only visible to those you approve</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button onClick={handleUpdateProfile} disabled={updating}>
                      {updating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        'Save Privacy Settings'
                      )}
                    </Button>
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
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
