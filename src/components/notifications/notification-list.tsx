'use client';

import { useState, useEffect } from 'react';
import { Bell, Filter, MoreVertical, CheckCheck, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { NotificationItem } from './notification-item';
import { useNotifications } from '@/hooks/useNotifications';
import { useRealtimeNotifications } from './realtime-notification-provider';
import type { NotificationFilters, NotificationType } from '@/lib/types/notification.types';

interface NotificationListProps {
  userId: string;
  compact?: boolean;
  maxHeight?: string;
  showHeader?: boolean;
  showFilters?: boolean;
  onNotificationClick?: (notification: any) => void;
}

const notificationTypeLabels: Record<NotificationType, string> = {
  new_interest: 'New Interests',
  interest_accepted: 'Interest Accepted',
  interest_declined: 'Interest Declined',
  new_match: 'New Matches',
  profile_view: 'Profile Views',
  verification_update: 'Verification Updates',
  system_announcement: 'Announcements',
  profile_incomplete: 'Profile Incomplete',
  subscription_expiry: 'Subscription Expiry',
};

export function NotificationList({
  userId,
  compact = false,
  maxHeight = '400px',
  showHeader = true,
  showFilters = true,
  onNotificationClick,
}: NotificationListProps) {
  // Try to use realtime notifications first, fallback to regular hook
  let notifications, unreadCount, loading, error, isRealtimeConnected, markAsRead, markAllAsRead, deleteNotification, refreshNotifications, clearError;
  
  try {
    const realtimeContext = useRealtimeNotifications();
    notifications = realtimeContext.notifications;
    unreadCount = realtimeContext.unreadCount;
    isRealtimeConnected = realtimeContext.isConnected;
    markAsRead = realtimeContext.markAsRead;
    markAllAsRead = realtimeContext.markAllAsRead;
    loading = false;
    error = null;
    deleteNotification = async (id: string) => {
      // Implement delete functionality
      console.log('Delete notification:', id);
    };
    refreshNotifications = () => Promise.resolve();
    clearError = () => {};
  } catch {
    // Fallback to regular notifications hook
    const regularNotifications = useNotifications(userId);
    notifications = regularNotifications.notifications;
    unreadCount = regularNotifications.unreadCount;
    loading = regularNotifications.loading;
    error = regularNotifications.error;
    isRealtimeConnected = regularNotifications.isRealtimeConnected;
    markAsRead = regularNotifications.markAsRead;
    markAllAsRead = regularNotifications.markAllAsRead;
    deleteNotification = regularNotifications.deleteNotification;
    refreshNotifications = regularNotifications.refreshNotifications;
    clearError = regularNotifications.clearError;
  }

  const [filters, setFilters] = useState<NotificationFilters>({});
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Apply filters when they change
  useEffect(() => {
    const newFilters: NotificationFilters = {};
    
    if (selectedType !== 'all') {
      newFilters.type = [selectedType as NotificationType];
    }
    
    if (selectedStatus === 'unread') {
      newFilters.isRead = false;
    } else if (selectedStatus === 'read') {
      newFilters.isRead = true;
    }
    
    setFilters(newFilters);
    refreshNotifications(newFilters);
  }, [selectedType, selectedStatus, refreshNotifications]);

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleClearAll = async () => {
    // Delete all notifications (you might want to add confirmation)
    for (const notification of notifications) {
      await deleteNotification(notification.$id);
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (selectedType !== 'all' && notification.type !== selectedType) {
      return false;
    }
    
    if (selectedStatus === 'unread' && notification.isRead) {
      return false;
    }
    
    if (selectedStatus === 'read' && !notification.isRead) {
      return false;
    }
    
    return true;
  });

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={clearError} variant="outline">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {showHeader && (
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <CardTitle className="text-lg">Notifications</CardTitle>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {unreadCount}
                </Badge>
              )}
              {isRealtimeConnected && (
                <Badge variant="outline" className="text-xs">
                  Live
                </Badge>
              )}
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleMarkAllAsRead} disabled={unreadCount === 0}>
                  <CheckCheck className="h-4 w-4 mr-2" />
                  Mark all as read
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleClearAll} 
                  disabled={notifications.length === 0}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear all
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {showFilters && (
            <div className="flex items-center gap-2 mt-3">
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {Object.entries(notificationTypeLabels).map(([type, label]) => (
                    <SelectItem key={type} value={type}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refreshNotifications(filters)}
                disabled={loading}
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardHeader>
      )}
      
      <CardContent className="p-0">
        <ScrollArea style={{ height: maxHeight }}>
          {loading && notifications.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              Loading notifications...
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No notifications</p>
              <p className="text-sm">
                {selectedType !== 'all' || selectedStatus !== 'all'
                  ? 'No notifications match your filters'
                  : "You're all caught up!"
                }
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredNotifications.map((notification, index) => (
                <div key={notification.$id}>
                  <NotificationItem
                    notification={notification}
                    onMarkAsRead={markAsRead}
                    onDelete={deleteNotification}
                    onClick={onNotificationClick}
                    compact={compact}
                    showActions={!compact}
                  />
                  {!compact && index < filteredNotifications.length - 1 && (
                    <Separator />
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}