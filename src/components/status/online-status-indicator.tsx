'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Circle, Clock, Eye, MessageCircle, Search, Heart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface OnlineStatusIndicatorProps {
  isOnline: boolean;
  lastSeenAt?: string;
  currentActivity?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  showActivity?: boolean;
  className?: string;
}

const activityIcons = {
  active: Circle,
  idle: Clock,
  away: Clock,
  profile_view: Eye,
  search: Search,
  interest_sent: Heart,
  message_sent: MessageCircle,
  login: Circle,
  logout: Circle,
};

const activityLabels = {
  active: 'Active',
  idle: 'Idle',
  away: 'Away',
  profile_view: 'Viewing profiles',
  search: 'Searching',
  interest_sent: 'Sending interest',
  message_sent: 'Messaging',
  login: 'Just logged in',
  logout: 'Logged out',
};

export function OnlineStatusIndicator({
  isOnline,
  lastSeenAt,
  currentActivity,
  size = 'md',
  showText = false,
  showActivity = false,
  className,
}: OnlineStatusIndicatorProps) {
  const [timeAgo, setTimeAgo] = useState<string>('');

  // Update time ago every minute
  useEffect(() => {
    if (!lastSeenAt) return;

    const updateTimeAgo = () => {
      setTimeAgo(formatDistanceToNow(new Date(lastSeenAt), { addSuffix: true }));
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [lastSeenAt]);

  const sizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const ActivityIcon = currentActivity && activityIcons[currentActivity as keyof typeof activityIcons] 
    ? activityIcons[currentActivity as keyof typeof activityIcons] 
    : Circle;

  const activityLabel = currentActivity && activityLabels[currentActivity as keyof typeof activityLabels]
    ? activityLabels[currentActivity as keyof typeof activityLabels]
    : currentActivity;

  const statusText = isOnline ? 'Online' : `Last seen ${timeAgo}`;
  const statusColor = isOnline ? 'bg-green-500' : 'bg-gray-400';

  if (showText || showActivity) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className="relative">
          <div className={cn('rounded-full', sizeClasses[size], statusColor)} />
          {isOnline && (
            <div className={cn('absolute inset-0 rounded-full animate-ping', statusColor, 'opacity-75')} />
          )}
        </div>
        
        <div className="flex flex-col">
          {showText && (
            <span className={cn('font-medium', textSizeClasses[size], isOnline ? 'text-green-600' : 'text-gray-500')}>
              {statusText}
            </span>
          )}
          
          {showActivity && currentActivity && isOnline && (
            <div className={cn('flex items-center gap-1', textSizeClasses[size], 'text-gray-500')}>
              <ActivityIcon className="h-3 w-3" />
              <span>{activityLabel}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn('relative', className)}>
            <div className={cn('rounded-full', sizeClasses[size], statusColor)} />
            {isOnline && (
              <div className={cn('absolute inset-0 rounded-full animate-ping', statusColor, 'opacity-75')} />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-center">
            <p className="font-medium">{statusText}</p>
            {showActivity && currentActivity && isOnline && (
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                <ActivityIcon className="h-3 w-3" />
                {activityLabel}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Badge variant for online status
interface OnlineStatusBadgeProps {
  isOnline: boolean;
  count?: number;
  className?: string;
}

export function OnlineStatusBadge({ isOnline, count, className }: OnlineStatusBadgeProps) {
  if (!isOnline && !count) return null;

  return (
    <Badge 
      variant={isOnline ? "default" : "secondary"} 
      className={cn(
        'flex items-center gap-1',
        isOnline ? 'bg-green-500 hover:bg-green-600' : '',
        className
      )}
    >
      <Circle className={cn('h-2 w-2', isOnline ? 'fill-current' : '')} />
      {count !== undefined ? `${count} online` : (isOnline ? 'Online' : 'Offline')}
    </Badge>
  );
}

// List of online users
interface OnlineUsersListProps {
  users: Array<{
    userId: string;
    name: string;
    profilePictureId?: string;
    isOnline: boolean;
    lastSeenAt: string;
    currentActivity?: string;
  }>;
  maxDisplay?: number;
  showActivity?: boolean;
  onUserClick?: (userId: string) => void;
  className?: string;
}

export function OnlineUsersList({
  users,
  maxDisplay = 10,
  showActivity = true,
  onUserClick,
  className,
}: OnlineUsersListProps) {
  const displayUsers = users.slice(0, maxDisplay);
  const remainingCount = users.length - maxDisplay;

  return (
    <div className={cn('space-y-2', className)}>
      {displayUsers.map((user) => (
        <div
          key={user.userId}
          className={cn(
            'flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50',
            onUserClick && 'cursor-pointer'
          )}
          onClick={() => onUserClick?.(user.userId)}
        >
          <div className="relative">
            {user.profilePictureId ? (
              <img
                src={`/api/files/${user.profilePictureId}`}
                alt={user.name}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-sm font-medium text-gray-600">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <OnlineStatusIndicator
              isOnline={user.isOnline}
              lastSeenAt={user.lastSeenAt}
              size="sm"
              className="absolute -bottom-1 -right-1"
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user.name}
            </p>
            {showActivity && user.currentActivity && user.isOnline && (
              <p className="text-xs text-gray-500 truncate">
                {activityLabels[user.currentActivity as keyof typeof activityLabels] || user.currentActivity}
              </p>
            )}
          </div>
        </div>
      ))}
      
      {remainingCount > 0 && (
        <div className="text-center py-2">
          <span className="text-sm text-gray-500">
            +{remainingCount} more online
          </span>
        </div>
      )}
    </div>
  );
}