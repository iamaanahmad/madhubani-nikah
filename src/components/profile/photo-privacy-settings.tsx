import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Shield, Users, Lock, Settings, Info } from 'lucide-react';
import { 
  PhotoPrivacyService, 
  PhotoPrivacySettings 
} from '@/lib/services/photo-privacy.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface PhotoPrivacySettingsProps {
  userId: string;
  onSettingsChange?: (settings: PhotoPrivacySettings) => void;
  className?: string;
}

export const PhotoPrivacySettingsComponent: React.FC<PhotoPrivacySettingsProps> = ({
  userId,
  onSettingsChange,
  className
}) => {
  const [settings, setSettings] = useState<PhotoPrivacySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load current settings
  useEffect(() => {
    loadSettings();
  }, [userId]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const currentSettings = await PhotoPrivacyService.getPhotoPrivacySettings(userId);
      setSettings(currentSettings || {
        userId,
        isPhotoBlurred: true,
        photoVisibility: 'members',
        allowPhotoDownload: false,
        showPhotoToInterested: true,
        requireMutualInterest: false,
        blurLevel: 'medium',
        watermarkEnabled: false,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      setError('Failed to load privacy settings');
      console.error('Failed to load privacy settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<PhotoPrivacySettings>) => {
    if (!settings) return;

    try {
      setSaving(true);
      setError(null);

      const updatedSettings = await PhotoPrivacyService.updatePhotoPrivacySettings(
        userId,
        updates
      );

      setSettings(updatedSettings);
      onSettingsChange?.(updatedSettings);
    } catch (error) {
      setError('Failed to update privacy settings');
      console.error('Failed to update privacy settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const getVisibilityDescription = (visibility: string) => {
    const descriptions = {
      public: 'Anyone can see your photo',
      members: 'Only registered members can see your photo',
      verified_only: 'Only verified members can see your photo',
      mutual_interest: 'Only users with mutual interest can see your photo',
      private: 'Your photo is hidden from everyone'
    };
    return descriptions[visibility as keyof typeof descriptions] || '';
  };

  const getBlurDescription = (level: string) => {
    const descriptions = {
      light: 'Slight blur effect',
      medium: 'Moderate blur effect',
      heavy: 'Strong blur effect'
    };
    return descriptions[level as keyof typeof descriptions] || '';
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center">Loading privacy settings...</div>
        </CardContent>
      </Card>
    );
  }

  if (!settings) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Failed to load privacy settings
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="w-5 h-5" />
          <span>Photo Privacy Settings</span>
        </CardTitle>
        <CardDescription>
          Control who can see your profile picture and how it's displayed
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Photo Visibility */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Photo Visibility</Label>
          <Select
            value={settings.photoVisibility}
            onValueChange={(value) => 
              updateSettings({ photoVisibility: value as any })
            }
            disabled={saving}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <div>
                    <div>Public</div>
                    <div className="text-xs text-gray-500">Anyone can see</div>
                  </div>
                </div>
              </SelectItem>
              <SelectItem value="members">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <div>
                    <div>Members Only</div>
                    <div className="text-xs text-gray-500">Registered users only</div>
                  </div>
                </div>
              </SelectItem>
              <SelectItem value="verified_only">
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4" />
                  <div>
                    <div>Verified Members</div>
                    <div className="text-xs text-gray-500">Only verified users</div>
                  </div>
                </div>
              </SelectItem>
              <SelectItem value="mutual_interest">
                <div className="flex items-center space-x-2">
                  <Eye className="w-4 h-4" />
                  <div>
                    <div>Mutual Interest</div>
                    <div className="text-xs text-gray-500">Only mutual matches</div>
                  </div>
                </div>
              </SelectItem>
              <SelectItem value="private">
                <div className="flex items-center space-x-2">
                  <Lock className="w-4 h-4" />
                  <div>
                    <div>Private</div>
                    <div className="text-xs text-gray-500">Hidden from everyone</div>
                  </div>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-gray-600">
            {getVisibilityDescription(settings.photoVisibility)}
          </p>
        </div>

        <Separator />

        {/* Photo Blur Settings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Blur Photo</Label>
              <p className="text-sm text-gray-600">
                Show a blurred version of your photo to maintain privacy
              </p>
            </div>
            <Switch
              checked={settings.isPhotoBlurred}
              onCheckedChange={(checked) => 
                updateSettings({ isPhotoBlurred: checked })
              }
              disabled={saving}
            />
          </div>

          {settings.isPhotoBlurred && (
            <div className="ml-4 space-y-3">
              <Label>Blur Intensity</Label>
              <Select
                value={settings.blurLevel}
                onValueChange={(value) => 
                  updateSettings({ blurLevel: value as any })
                }
                disabled={saving}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light Blur</SelectItem>
                  <SelectItem value="medium">Medium Blur</SelectItem>
                  <SelectItem value="heavy">Heavy Blur</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-600">
                {getBlurDescription(settings.blurLevel)}
              </p>
            </div>
          )}
        </div>

        <Separator />

        {/* Advanced Settings */}
        <div className="space-y-4">
          <Label className="text-base font-medium">Advanced Settings</Label>

          {/* Show to Interested Users */}
          <div className="flex items-center justify-between">
            <div>
              <Label>Show to Interested Users</Label>
              <p className="text-sm text-gray-600">
                Allow users who sent you an interest to see your photo
              </p>
            </div>
            <Switch
              checked={settings.showPhotoToInterested}
              onCheckedChange={(checked) => 
                updateSettings({ showPhotoToInterested: checked })
              }
              disabled={saving}
            />
          </div>

          {/* Require Mutual Interest */}
          <div className="flex items-center justify-between">
            <div>
              <Label>Require Mutual Interest</Label>
              <p className="text-sm text-gray-600">
                Only show photo when both users have expressed interest
              </p>
            </div>
            <Switch
              checked={settings.requireMutualInterest}
              onCheckedChange={(checked) => 
                updateSettings({ requireMutualInterest: checked })
              }
              disabled={saving}
            />
          </div>

          {/* Allow Photo Download */}
          <div className="flex items-center justify-between">
            <div>
              <Label>Allow Photo Download</Label>
              <p className="text-sm text-gray-600">
                Allow users to download your photo
              </p>
            </div>
            <Switch
              checked={settings.allowPhotoDownload}
              onCheckedChange={(checked) => 
                updateSettings({ allowPhotoDownload: checked })
              }
              disabled={saving}
            />
          </div>

          {/* Watermark */}
          <div className="flex items-center justify-between">
            <div>
              <Label>Add Watermark</Label>
              <p className="text-sm text-gray-600">
                Add a subtle watermark to protect your photo
              </p>
            </div>
            <Switch
              checked={settings.watermarkEnabled}
              onCheckedChange={(checked) => 
                updateSettings({ watermarkEnabled: checked })
              }
              disabled={saving}
            />
          </div>
        </div>

        {/* Privacy Tips */}
        <Alert>
          <Info className="w-4 h-4" />
          <AlertDescription>
            <strong>Privacy Tips:</strong>
            <ul className="mt-2 space-y-1 text-sm">
              <li>• Use blur settings to maintain privacy while still showing your photo</li>
              <li>• Verified-only visibility helps ensure genuine interactions</li>
              <li>• Mutual interest requirement provides maximum privacy control</li>
              <li>• Watermarks help protect against unauthorized use</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* Save Status */}
        {saving && (
          <div className="text-center text-sm text-gray-600">
            Saving settings...
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Simplified photo display component with privacy controls
interface PrivatePhotoDisplayProps {
  profileOwnerId: string;
  viewerId: string;
  pictureId?: string;
  pictureUrl?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  alt?: string;
  showBorder?: boolean;
  onClick?: () => void;
}

export const PrivatePhotoDisplay: React.FC<PrivatePhotoDisplayProps> = ({
  profileOwnerId,
  viewerId,
  pictureId,
  pictureUrl,
  size = 'md',
  className,
  alt = 'Profile',
  showBorder = true,
  onClick
}) => {
  const [photoData, setPhotoData] = useState<{
    url: string;
    isBlurred: boolean;
    canDownload: boolean;
    watermarked: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const sizeClasses = {
    xs: 'w-8 h-8',
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32'
  };

  useEffect(() => {
    if (pictureId) {
      loadPhotoWithPrivacy();
    } else {
      setLoading(false);
    }
  }, [pictureId, profileOwnerId, viewerId]);

  const loadPhotoWithPrivacy = async () => {
    if (!pictureId) return;

    try {
      const data = await PhotoPrivacyService.getPhotoUrl(
        profileOwnerId,
        viewerId,
        pictureId,
        { width: 200, height: 200, quality: 80 }
      );
      setPhotoData(data);
    } catch (error) {
      console.error('Failed to load photo with privacy controls:', error);
    } finally {
      setLoading(false);
    }
  };

  const displayUrl = photoData?.url || pictureUrl;

  return (
    <div 
      className={cn(
        'relative rounded-full overflow-hidden bg-gray-100 cursor-pointer',
        showBorder && 'border-2 border-gray-200',
        sizeClasses[size],
        className
      )}
      onClick={onClick}
    >
      {loading ? (
        <div className="w-full h-full flex items-center justify-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
        </div>
      ) : displayUrl ? (
        <>
          <img
            src={displayUrl}
            alt={alt}
            className={cn(
              'w-full h-full object-cover',
              photoData?.isBlurred && 'filter blur-sm'
            )}
          />
          
          {/* Privacy indicators */}
          {photoData?.isBlurred && (
            <div className="absolute top-1 right-1">
              <EyeOff className="w-3 h-3 text-white bg-black bg-opacity-50 rounded-full p-0.5" />
            </div>
          )}
          
          {photoData?.watermarked && (
            <div className="absolute bottom-1 right-1">
              <Shield className="w-3 h-3 text-white bg-black bg-opacity-50 rounded-full p-0.5" />
            </div>
          )}
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Eye className="w-1/2 h-1/2 text-gray-400" />
        </div>
      )}
    </div>
  );
};