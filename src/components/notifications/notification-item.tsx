'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Bell, Heart, UserCheck, UserX, Eye, Shield, Megaphone, AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Notification, NotificationType } from '@/lib/types/notification.types';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead?: (notificationId: string) => void;
  onDelete?: (notificationId: string) => void;
  onClick?: (notification: Notification) => void;
  showActions?: boolean;
  compact?: boolean;
}

const notificationIcons: Record<NotificationType, React.ComponentType<{ className?: string }>> = {
  new_interest: Heart,
  interest_accepted: UserCheck,
  interest_declined: UserX,
  new_match: Heart,
  profile_view: Eye,
  verification_update: Shield,
  system_announcement: Megaphone,
  profile_incomplete: AlertCircle,
  subscription_expiry: Clock,
};

const notificationColors: Record<NotificationType, string> = {
  new_interest: 'text-pink-600 bg-pink-50',
  interest_accepted: 'text-green-600 bg-green-50',
  interest_declined: 'text-red-600 bg-red-50',
  new_match: 'text-purple-600 bg-purple-50',
  profile_view: 'text-blue-600 bg-blue-50',
  verification_update: 'text-orange-600 bg-orange-50',
  system_announcement: 'text-indigo-600 bg-indigo-50',
  profile_incomplete: 'text-yellow-600 bg-yellow-50',
  subscription_expiry: 'text-gray-600 bg-gray-50',
};

const priorityColors = {
  low: 'border-l-gray-300',
  medium: 'border-l-blue-400',
  high: 'border-l-red-400',
};

export function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  onClick,
  showActions = true,
  compact = false,
}: NotificationItemProps) {
  const [isLoading, setIsLoading] = useState(false);

  const Icon = notificationIcons[notification.type];
  const iconColorClass = notificationColors[notification.type];
  const priorityColorClass = priorityColors[notification.priority];

  const handleMarkAsRead = async () => {
    if (notification.isRead || !onMarkAsRead) return;
    
    setIsLoading(true);
    try {
      await onMarkAsRead(notification.$id);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    
    setIsLoading(true);
    try {
      await onDelete(notification.$id);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClick = () => {
    if (onClick) {
      onClick(notification);
    }
    
    // Auto-mark as read when clicked
    if (!notification.isRead && onMarkAsRead) {
      handleMarkAsRead();
    }
  };

  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true });

  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-l-2',
          priorityColorClass,
          !notification.isRead && 'bg-blue-50/50'
        )}
        onClick={handleClick}
      >
        <div className={cn('p-2 rounded-full', iconColorClass)}>
          <Icon className="h-4 w-4" />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className={cn(
            'text-sm truncate',
            !notification.isRead ? 'font-semibold text-gray-900' : 'text-gray-700'
          )}>
            {notification.title}
          </p>
          <p className="text-xs text-gray-500 truncate">
            {notification.message}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {!notification.isRead && (
            <div className="w-2 h-2 bg-blue-500 rounded-full" />
          )}
          <span className="text-xs text-gray-400">{timeAgo}</span>
        </div>
      </div>
    );
  }

  return (
    <Card className={cn(
      'border-l-2 transition-colors',
      priorityColorClass,
      !notification.isRead && 'bg-blue-50/30',
      onClick && 'cursor-pointer hover:shadow-md'
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn('p-2 rounded-full flex-shrink-0', iconColorClass)}>
            <Icon className="h-5 w-5" />
          </div>
          
          <div className="flex-1 min-w-0" onClick={handleClick}>
            <div className="flex items-start justify-between gap-2">
              <h4 className={cn(
                'text-sm font-medium',
                !notification.isRead ? 'text-gray-900' : 'text-gray-700'
              )}>
                {notification.title}
              </h4>
              
              <div className="flex items-center gap-2 flex-shrink-0">
                {notification.priority === 'high' && (
                  <Badge variant="destructive" className="text-xs">
                    High
                  </Badge>
                )}
                {!notification.isRead && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                )}
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mt-1">
              {notification.message}
            </p>
            
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-gray-400">
                {timeAgo}
              </span>
              
              {notification.relatedUserId && (
                <Badge variant="outline" className="text-xs">
                  From user
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        {showActions && (
          <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t">
            {!notification.isRead && onMarkAsRead && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAsRead}
                disabled={isLoading}
                className="text-xs"
              >
                Mark as read
              </Button>
            )}
            
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={isLoading}
                className="text-xs text-red-600 hover:text-red-700"
              >
                Delete
              </Button>
            )}
            
            {notification.actionUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = notification.actionUrl!}
                className="text-xs"
              >
                View
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}