'use client';

import { useState } from 'react';
import { Bell, Mail, Smartphone, MessageSquare, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useNotifications } from '@/hooks/useNotifications';
import type { NotificationPreferences, NotificationType } from '@/lib/types/notification.types';

interface NotificationPreferencesProps {
  userId: string;
}

const notificationTypeLabels: Record<NotificationType, { label: string; description: string }> = {
  new_interest: {
    label: 'New Interests',
    description: 'When someone sends you an interest or proposal',
  },
  interest_accepted: {
    label: 'Interest Accepted',
    description: 'When someone accepts your interest',
  },
  interest_declined: {
    label: 'Interest Declined',
    description: 'When someone declines your interest',
  },
  new_match: {
    label: 'New Matches',
    description: 'When you have a mutual interest with someone',
  },
  profile_view: {
    label: 'Profile Views',
    description: 'When someone views your profile',
  },
  verification_update: {
    label: 'Verification Updates',
    description: 'Updates about your verification status',
  },
  system_announcement: {
    label: 'System Announcements',
    description: 'Important updates and announcements',
  },
  profile_incomplete: {
    label: 'Profile Reminders',
    description: 'Reminders to complete your profile',
  },
  subscription_expiry: {
    label: 'Subscription Alerts',
    description: 'Alerts about subscription expiry',
  },
};

export function NotificationPreferences({ userId }: NotificationPreferencesProps) {
  const {
    preferences,
    loading,
    error,
    updatePreferences,
    refreshPreferences,
  } = useNotifications(userId);

  const [localPreferences, setLocalPreferences] = useState<NotificationPreferences | null>(null);
  const [saving, setSaving] = useState(false);

  // Use local preferences if available, otherwise use fetched preferences
  const currentPreferences = localPreferences || preferences;

  const handleChannelChange = (channel: 'email' | 'push' | 'sms', enabled: boolean) => {
    if (!currentPreferences) return;

    const updated = {
      ...currentPreferences,
      [channel]: enabled,
    };
    setLocalPreferences(updated);
  };

  const handleTypeChange = (type: NotificationType, enabled: boolean) => {
    if (!currentPreferences) return;

    const updated = {
      ...currentPreferences,
      types: {
        ...currentPreferences.types,
        [type]: enabled,
      },
    };
    setLocalPreferences(updated);
  };

  const handleSave = async () => {
    if (!localPreferences) return;

    setSaving(true);
    try {
      await updatePreferences(localPreferences);
      setLocalPreferences(null); // Reset local state
      toast.success('Notification preferences updated successfully');
    } catch (err) {
      toast.error('Failed to update notification preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setLocalPreferences(null);
    refreshPreferences();
  };

  const hasChanges = localPreferences !== null;

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={refreshPreferences} variant="outline">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (loading || !currentPreferences) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">Loading preferences...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <CardTitle>Notification Preferences</CardTitle>
          </div>
          
          {hasChanges && (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleReset}>
                Reset
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Notification Channels */}
        <div>
          <h3 className="text-lg font-medium mb-4">Notification Channels</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-gray-500" />
                <div>
                  <Label htmlFor="email-notifications" className="text-sm font-medium">
                    Email Notifications
                  </Label>
                  <p className="text-xs text-gray-500">
                    Receive notifications via email
                  </p>
                </div>
              </div>
              <Switch
                id="email-notifications"
                checked={currentPreferences.email}
                onCheckedChange={(checked) => handleChannelChange('email', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-gray-500" />
                <div>
                  <Label htmlFor="push-notifications" className="text-sm font-medium">
                    Push Notifications
                  </Label>
                  <p className="text-xs text-gray-500">
                    Receive browser push notifications
                  </p>
                </div>
              </div>
              <Switch
                id="push-notifications"
                checked={currentPreferences.push}
                onCheckedChange={(checked) => handleChannelChange('push', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-gray-500" />
                <div>
                  <Label htmlFor="sms-notifications" className="text-sm font-medium">
                    SMS Notifications
                  </Label>
                  <p className="text-xs text-gray-500">
                    Receive notifications via SMS (premium feature)
                  </p>
                </div>
              </div>
              <Switch
                id="sms-notifications"
                checked={currentPreferences.sms}
                onCheckedChange={(checked) => handleChannelChange('sms', checked)}
              />
            </div>
          </div>
        </div>
        
        <Separator />
        
        {/* Notification Types */}
        <div>
          <h3 className="text-lg font-medium mb-4">Notification Types</h3>
          <div className="space-y-4">
            {Object.entries(notificationTypeLabels).map(([type, { label, description }]) => (
              <div key={type} className="flex items-center justify-between">
                <div>
                  <Label htmlFor={`type-${type}`} className="text-sm font-medium">
                    {label}
                  </Label>
                  <p className="text-xs text-gray-500">
                    {description}
                  </p>
                </div>
                <Switch
                  id={`type-${type}`}
                  checked={currentPreferences.types[type as NotificationType]}
                  onCheckedChange={(checked) => handleTypeChange(type as NotificationType, checked)}
                />
              </div>
            ))}
          </div>
        </div>
        
        {/* Quick Actions */}
        <Separator />
        
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium">Quick Actions</h4>
            <p className="text-xs text-gray-500">
              Quickly enable or disable all notifications
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const allEnabled = {
                  ...currentPreferences,
                  email: true,
                  push: true,
                  types: Object.keys(currentPreferences.types).reduce(
                    (acc, type) => ({ ...acc, [type]: true }),
                    {} as Record<NotificationType, boolean>
                  ),
                };
                setLocalPreferences(allEnabled);
              }}
            >
              Enable All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const allDisabled = {
                  ...currentPreferences,
                  email: false,
                  push: false,
                  sms: false,
                  types: Object.keys(currentPreferences.types).reduce(
                    (acc, type) => ({ ...acc, [type]: false }),
                    {} as Record<NotificationType, boolean>
                  ),
                };
                setLocalPreferences(allDisabled);
              }}
            >
              Disable All
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}