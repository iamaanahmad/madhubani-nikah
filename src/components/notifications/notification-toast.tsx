'use client';

import { useState, useEffect } from 'react';
import { X, Bell, Heart, UserCheck, UserX, Eye, Shield, Megaphone, AlertCircle, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Notification, NotificationType } from '@/lib/types/notification.types';

interface NotificationToastProps {
  notification: Notification;
  onClose: () => void;
  onAction?: (notification: Notification) => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
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
  new_interest: 'border-l-pink-500 bg-pink-50',
  interest_accepted: 'border-l-green-500 bg-green-50',
  interest_declined: 'border-l-red-500 bg-red-50',
  new_match: 'border-l-purple-500 bg-purple-50',
  profile_view: 'border-l-blue-500 bg-blue-50',
  verification_update: 'border-l-orange-500 bg-orange-50',
  system_announcement: 'border-l-indigo-500 bg-indigo-50',
  profile_incomplete: 'border-l-yellow-500 bg-yellow-50',
  subscription_expiry: 'border-l-gray-500 bg-gray-50',
};

const positionClasses = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
};

export function NotificationToast({
  notification,
  onClose,
  onAction,
  autoClose = true,
  autoCloseDelay = 5000,
  position = 'top-right',
}: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const Icon = notificationIcons[notification.type];
  const colorClass = notificationColors[notification.type];
  const positionClass = positionClasses[position];

  // Show animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Auto-close functionality
  useEffect(() => {
    if (!autoClose) return;

    const timer = setTimeout(() => {
      handleClose();
    }, autoCloseDelay);

    return () => clearTimeout(timer);
  }, [autoClose, autoCloseDelay]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300); // Match animation duration
  };

  const handleAction = () => {
    if (onAction) {
      onAction(notification);
    }
    handleClose();
  };

  return (
    <div
      className={cn(
        'fixed z-50 w-80 transition-all duration-300 ease-in-out',
        positionClass,
        isVisible && !isClosing
          ? 'translate-x-0 opacity-100'
          : position.includes('right')
          ? 'translate-x-full opacity-0'
          : '-translate-x-full opacity-0'
      )}
    >
      <Card className={cn('border-l-4 shadow-lg', colorClass)}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <Icon className="h-5 w-5 text-gray-600" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-sm font-semibold text-gray-900 line-clamp-1">
                  {notification.title}
                </h4>
                
                <div className="flex items-center gap-1">
                  {notification.priority === 'high' && (
                    <Badge variant="destructive" className="text-xs">
                      High
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClose}
                    className="h-6 w-6 p-0 hover:bg-gray-200"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {notification.message}
              </p>
              
              {(notification.actionUrl || onAction) && (
                <div className="flex items-center gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAction}
                    className="text-xs"
                  >
                    View
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClose}
                    className="text-xs"
                  >
                    Dismiss
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          {/* Progress bar for auto-close */}
          {autoClose && (
            <div className="mt-3 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all ease-linear"
                style={{
                  animation: `shrink ${autoCloseDelay}ms linear`,
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>
      
      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}

// Toast container component for managing multiple toasts
interface NotificationToastContainerProps {
  notifications: Notification[];
  onClose: (notificationId: string) => void;
  onAction?: (notification: Notification) => void;
  maxToasts?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export function NotificationToastContainer({
  notifications,
  onClose,
  onAction,
  maxToasts = 3,
  position = 'top-right',
}: NotificationToastContainerProps) {
  // Show only the most recent notifications
  const visibleNotifications = notifications.slice(0, maxToasts);

  return (
    <>
      {visibleNotifications.map((notification, index) => (
        <div
          key={notification.$id}
          style={{
            [position.includes('top') ? 'top' : 'bottom']: `${16 + index * 100}px`,
          }}
        >
          <NotificationToast
            notification={notification}
            onClose={() => onClose(notification.$id)}
            onAction={onAction}
            position={position}
          />
        </div>
      ))}
    </>
  );
}