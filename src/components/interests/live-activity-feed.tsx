'use client';

import { useState, useEffect, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { 
  Activity, 
  Heart, 
  UserCheck, 
  UserX, 
  Eye, 
  Users, 
  Bell,
  Filter,
  RefreshCw,
  Pause,
  Play
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useRealtimeInterests } from '@/hooks/useRealtimeInterests';
import { useAuth } from '@/hooks/useAuth';
import type { LiveActivityFeed } from '@/lib/services/realtime-interest.service';

interface LiveActivityFeedProps {
  className?: string;
  maxItems?: number;
  showFilters?: boolean;
  autoScroll?: boolean;
}

type ActivityFilter = 'all' | 'interest_sent' | 'interest_received' | 'interest_accepted' | 'interest_declined' | 'mutual_match' | 'profile_view';

export function LiveActivityFeedComponent({
  className = '',
  maxItems = 50,
  showFilters = true,
  autoScroll = true
}: LiveActivityFeedProps) {
  const { user } = useAuth();
  const {
    activityFeed,
    isConnected,
    loading,
    error,
    clearActivityFeed
  } = useRealtimeInterests(user?.$id);

  const [filter, setFilter] = useState<ActivityFilter>('all');
  const [isPaused, setIsPaused] = useState(false);
  const [showPublicOnly, setShowPublicOnly] = useState(false);
  const [pausedActivities, setPausedActivities] = useState<LiveActivityFeed[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Handle pausing/resuming activity feed
  useEffect(() => {
    if (isPaused && activityFeed.length > 0) {
      // Store new activities while paused
      const newActivities = activityFeed.filter(activity => 
        !pausedActivities.some(paused => 
          paused.timestamp === activity.timestamp && 
          paused.userId === activity.userId
        )
      );
      if (newActivities.length > 0) {
        setPausedActivities(prev => [...newActivities, ...prev]);
      }
    }
  }, [activityFeed, isPaused, pausedActivities]);

  // Auto-scroll to bottom when new activities arrive
  useEffect(() => {
    if (autoScroll && !isPaused && scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [activityFeed, autoScroll, isPaused]);

  if (!user) {
    return null;
  }

  const getActivityIcon = (activity: LiveActivityFeed) => {
    switch (activity.activityType) {
      case 'interest_sent':
        return <Heart className="h-4 w-4 text-pink-500" />;
      case 'interest_received':
        return <Bell className="h-4 w-4 text-blue-500" />;
      case 'interest_accepted':
        return <UserCheck className="h-4 w-4 text-green-500" />;
      case 'interest_declined':
        return <UserX className="h-4 w-4 text-red-500" />;
      case 'mutual_match':
        return <Users className="h-4 w-4 text-purple-500" />;
      case 'profile_view':
        return <Eye className="h-4 w-4 text-gray-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActivityMessage = (activity: LiveActivityFeed) => {
    const activityData = activity.activityData;
    
    switch (activity.activityType) {
      case 'interest_sent':
        return 'You sent an interest';
      case 'interest_received':
        return 'You received an interest';
      case 'interest_accepted':
        return 'You accepted an interest';
      case 'interest_declined':
        return 'You declined an interest';
      case 'mutual_match':
        return 'New mutual match!';
      case 'profile_view':
        return 'Your profile was viewed';
      default:
        return 'Activity occurred';
    }
  };

  const getActivityColor = (activity: LiveActivityFeed) => {
    switch (activity.activityType) {
      case 'interest_sent':
        return 'border-l-pink-500';
      case 'interest_received':
        return 'border-l-blue-500';
      case 'interest_accepted':
        return 'border-l-green-500';
      case 'interest_declined':
        return 'border-l-red-500';
      case 'mutual_match':
        return 'border-l-purple-500';
      case 'profile_view':
        return 'border-l-gray-500';
      default:
        return 'border-l-gray-300';
    }
  };

  const filteredActivities = (isPaused ? pausedActivities : activityFeed)
    .filter(activity => {
      if (filter !== 'all' && activity.activityType !== filter) return false;
      if (showPublicOnly && !activity.isPublic) return false;
      return true;
    })
    .slice(0, maxItems);

  const handleResume = () => {
    setIsPaused(false);
    setPausedActivities([]);
  };

  const handleRefresh = () => {
    if (isPaused) {
      setPausedActivities([]);
    }
    // The activity feed will automatically refresh through the real-time connection
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Live Activity Feed
            {isConnected && !isPaused && (
              <Badge variant="outline" className="text-green-600 border-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse" />
                Live
              </Badge>
            )}
            {isPaused && (
              <Badge variant="outline" className="text-orange-600 border-orange-600">
                Paused
              </Badge>
            )}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsPaused(!isPaused)}
            >
              {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {showFilters && (
          <div className="flex flex-wrap items-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <Select value={filter} onValueChange={(value) => setFilter(value as ActivityFilter)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Activities</SelectItem>
                  <SelectItem value="interest_sent">Interests Sent</SelectItem>
                  <SelectItem value="interest_received">Interests Received</SelectItem>
                  <SelectItem value="interest_accepted">Accepted</SelectItem>
                  <SelectItem value="interest_declined">Declined</SelectItem>
                  <SelectItem value="mutual_match">Mutual Matches</SelectItem>
                  <SelectItem value="profile_view">Profile Views</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="public-only"
                checked={showPublicOnly}
                onCheckedChange={setShowPublicOnly}
              />
              <Label htmlFor="public-only" className="text-sm">
                Public only
              </Label>
            </div>

            {filteredActivities.length > 0 && (
              <Button variant="outline" size="sm" onClick={clearActivityFeed}>
                Clear All
              </Button>
            )}
          </div>
        )}

        {isPaused && pausedActivities.length > 0 && (
          <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-orange-700">
                {pausedActivities.length} new activities while paused
              </span>
              <Button size="sm" onClick={handleResume}>
                Resume
              </Button>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <ScrollArea className="h-96" ref={scrollAreaRef}>
          {filteredActivities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No activities to show</p>
              <p className="text-sm">
                {filter === 'all' 
                  ? 'Your activities will appear here in real-time'
                  : `No ${filter.replace('_', ' ')} activities found`
                }
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredActivities.map((activity, index) => (
                <div 
                  key={`${activity.userId}-${activity.timestamp}-${index}`} 
                  className={`flex items-start gap-3 p-3 rounded-lg border-l-4 bg-card ${getActivityColor(activity)}`}
                >
                  {getActivityIcon(activity)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">
                        {getActivityMessage(activity)}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {activity.activityType.replace('_', ' ')}
                      </Badge>
                      {activity.isPublic && (
                        <Badge variant="outline" className="text-xs">
                          Public
                        </Badge>
                      )}
                    </div>

                    {activity.activityData && Object.keys(activity.activityData).length > 0 && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        {activity.activityData.interestType && (
                          <span>Type: {activity.activityData.interestType}</span>
                        )}
                        {activity.activityData.interestStatus && (
                          <span className="ml-2">Status: {activity.activityData.interestStatus}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Connection Status */}
        {!isConnected && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-700">
                Reconnecting to live updates...
              </span>
            </div>
          </div>
        )}

        {loading && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-600 animate-spin" />
              <span className="text-sm text-blue-700">
                Loading activities...
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}