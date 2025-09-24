'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Circle, Clock, Eye, MessageCircle, Search, Heart, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { OnlineStatusIndicator } from '@/components/status/online-status-indicator';
import { UserStatusService } from '@/lib/services/user-status.service';
import { cn } from '@/lib/utils';
import type { UserStatus } from '@/lib/services/user-status.service';

interface ProfileActivityIndicatorProps {
  userId: string;
  showOnlineStatus?: boolean;
  showLastSeen?: boolean;
  showActivity?: boolean;
  compact?: boolean;
  className?: string;
}

export function ProfileActivityIndicator({
  userId,
  showOnlineStatus = true,
  showLastSeen = true,
  showActivity = false,
  compact = false,
  className,
}: ProfileActivityIndicatorProps) {
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user status
  useEffect(() => {
    const loadUserStatus = async () => {
      try {
        setLoading(true);
        const status = await UserStatusService.getUserStatus(userId);
        setUserStatus(status);
      } catch (error) {
        console.error('Failed to load user status:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserStatus();
  }, [userId]);

  if (loading) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className="h-3 w-3 bg-gray-200 rounded-full animate-pulse" />
        {!compact && <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />}
      </div>
    );
  }

  if (!userStatus) {
    return null;
  }

  const isOnline = userStatus.isOnline;
  const lastSeenAt = userStatus.lastSeenAt;
  const currentActivity = userStatus.currentActivity;

  if (compact) {
    return (
      <div className={cn('flex items-center gap-1', className)}>
        {showOnlineStatus && (
          <OnlineStatusIndicator
            isOnline={isOnline}
            lastSeenAt={lastSeenAt}
            currentActivity={currentActivity}
            size="sm"
            showActivity={showActivity}
          />
        )}
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {showOnlineStatus && (
        <OnlineStatusIndicator
          isOnline={isOnline}
          lastSeenAt={lastSeenAt}
          currentActivity={currentActivity}
          size="sm"
          showText={showLastSeen}
          showActivity={showActivity}
        />
      )}
    </div>
  );
}

// Enhanced profile card with activity indicators
interface ProfileCardWithActivityProps {
  profile: {
    userId: string;
    name: string;
    age: number;
    location: string;
    profilePictureId?: string;
  };
  showActivityIndicators?: boolean;
  onProfileClick?: (userId: string) => void;
  className?: string;
}

export function ProfileCardWithActivity({
  profile,
  showActivityIndicators = true,
  onProfileClick,
  className,
}: ProfileCardWithActivityProps) {
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);

  useEffect(() => {
    if (!showActivityIndicators) return;

    const loadUserStatus = async () => {
      try {
        const status = await UserStatusService.getUserStatus(profile.userId);
        setUserStatus(status);
      } catch (error) {
        console.error('Failed to load user status:', error);
      }
    };

    loadUserStatus();
  }, [profile.userId, showActivityIndicators]);

  return (
    <div
      className={cn(
        'relative bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow',
        onProfileClick && 'cursor-pointer',
        className
      )}
      onClick={() => onProfileClick?.(profile.userId)}
    >
      {/* Profile Picture */}
      <div className="relative">
        {profile.profilePictureId ? (
          <img
            src={`/api/files/${profile.profilePictureId}`}
            alt={profile.name}
            className="w-full h-48 object-cover"
          />
        ) : (
          <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
            <User className="h-16 w-16 text-gray-400" />
          </div>
        )}
        
        {/* Online Status Overlay */}
        {showActivityIndicators && userStatus && (
          <div className="absolute top-2 right-2">
            <OnlineStatusIndicator
              isOnline={userStatus.isOnline}
              lastSeenAt={userStatus.lastSeenAt}
              currentActivity={userStatus.currentActivity}
              size="md"
            />
          </div>
        )}
      </div>

      {/* Profile Info */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          {profile.name}, {profile.age}
        </h3>
        <p className="text-sm text-gray-600 mb-3">{profile.location}</p>

        {/* Activity Indicators */}
        {showActivityIndicators && userStatus && (
          <div className="flex items-center justify-between">
            <ProfileActivityIndicator
              userId={profile.userId}
              showOnlineStatus={true}
              showLastSeen={true}
              showActivity={true}
              compact={false}
            />
            
            {userStatus.isOnline && userStatus.currentActivity && (
              <Badge variant="outline" className="text-xs">
                {userStatus.currentActivity}
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Activity summary for profile details
interface ProfileActivitySummaryProps {
  userId: string;
  className?: string;
}

export function ProfileActivitySummary({ userId, className }: ProfileActivitySummaryProps) {
  const [activityStats, setActivityStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadActivityStats = async () => {
      try {
        setLoading(true);
        const stats = await UserStatusService.getUserActivityStats(userId);
        setActivityStats(stats);
      } catch (error) {
        console.error('Failed to load activity stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadActivityStats();
  }, [userId]);

  if (loading) {
    return (
      <div className={cn('space-y-2', className)}>
        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  if (!activityStats) {
    return null;
  }

  const lastLoginTime = activityStats.lastLoginAt 
    ? formatDistanceToNow(new Date(activityStats.lastLoginAt), { addSuffix: true })
    : 'Never';

  return (
    <div className={cn('space-y-2 text-sm text-gray-600', className)}>
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4" />
        <span>Last login: {lastLoginTime}</span>
      </div>
      
      <div className="flex items-center gap-2">
        <Eye className="h-4 w-4" />
        <span>Profile views: {activityStats.activitiesByType.profile_view || 0}</span>
      </div>
      
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4" />
        <span>Searches: {activityStats.activitiesByType.search || 0}</span>
      </div>
      
      <div className="flex items-center gap-2">
        <Heart className="h-4 w-4" />
        <span>Interests sent: {activityStats.activitiesByType.interest_sent || 0}</span>
      </div>
    </div>
  );
}