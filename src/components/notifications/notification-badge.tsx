'use client';

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NotificationBadgeProps {
  count: number;
  onClick?: () => void;
  showPulse?: boolean;
  maxCount?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'destructive' | 'outline';
  className?: string;
}

export function NotificationBadge({
  count,
  onClick,
  showPulse = true,
  maxCount = 99,
  size = 'md',
  variant = 'destructive',
  className,
}: NotificationBadgeProps) {
  const [isPulsing, setIsPulsing] = useState(false);
  const [previousCount, setPreviousCount] = useState(count);

  // Trigger pulse animation when count increases
  useEffect(() => {
    if (count > previousCount && showPulse) {
      setIsPulsing(true);
      const timer = setTimeout(() => setIsPulsing(false), 1000);
      return () => clearTimeout(timer);
    }
    setPreviousCount(count);
  }, [count, previousCount, showPulse]);

  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={onClick}
        className={cn(
          'relative rounded-full',
          sizeClasses[size],
          isPulsing && 'animate-pulse',
          className
        )}
      >
        <Bell className={cn(iconSizes[size], count > 0 && 'text-blue-600')} />
        
        {count > 0 && (
          <>
            {/* Badge */}
            <Badge
              variant={variant}
              className={cn(
                'absolute -top-1 -right-1 h-5 min-w-[20px] px-1 text-xs font-bold',
                'flex items-center justify-center rounded-full',
                isPulsing && 'animate-bounce'
              )}
            >
              {displayCount}
            </Badge>
            
            {/* Pulse ring animation */}
            {isPulsing && (
              <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-400 animate-ping opacity-75" />
            )}
          </>
        )}
      </Button>
      
      {/* Accessibility */}
      <span className="sr-only">
        {count === 0 
          ? 'No new notifications' 
          : `${count} new notification${count === 1 ? '' : 's'}`
        }
      </span>
    </div>
  );
}

// Enhanced notification badge with status indicator
interface NotificationBadgeWithStatusProps extends NotificationBadgeProps {
  isOnline?: boolean;
  hasHighPriority?: boolean;
  lastNotificationTime?: string;
}

export function NotificationBadgeWithStatus({
  count,
  onClick,
  isOnline = false,
  hasHighPriority = false,
  lastNotificationTime,
  showPulse = true,
  maxCount = 99,
  size = 'md',
  variant = 'destructive',
  className,
}: NotificationBadgeWithStatusProps) {
  return (
    <div className="relative">
      <NotificationBadge
        count={count}
        onClick={onClick}
        showPulse={showPulse}
        maxCount={maxCount}
        size={size}
        variant={hasHighPriority ? 'destructive' : variant}
        className={className}
      />
      
      {/* Online status indicator */}
      {isOnline && (
        <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 border-2 border-white rounded-full" />
      )}
      
      {/* High priority indicator */}
      {hasHighPriority && count > 0 && (
        <div className="absolute -top-2 -left-2 h-2 w-2 bg-red-500 rounded-full animate-pulse" />
      )}
    </div>
  );
}

// Notification badge for mobile/compact view
export function CompactNotificationBadge({
  count,
  onClick,
  className,
}: {
  count: number;
  onClick?: () => void;
  className?: string;
}) {
  if (count === 0) return null;

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative inline-flex items-center justify-center',
        'h-6 w-6 bg-red-500 text-white text-xs font-bold rounded-full',
        'hover:bg-red-600 transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2',
        className
      )}
    >
      {count > 99 ? '99+' : count}
      <span className="sr-only">{count} new notifications</span>
    </button>
  );
}