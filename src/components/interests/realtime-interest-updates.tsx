'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Heart, UserCheck, UserX, Eye, TrendingUp, Activity, Bell, Users, Star, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRealtimeInterests } from '@/hooks/useRealtimeInterests';
import { useAuth } from '@/hooks/useAuth';
import type { 
  RealtimeInterestData, 
  MatchSuggestion, 
  LiveActivityFeed 
} from '@/lib/services/realtime-interest.service';

interface RealtimeInterestUpdatesProps {
  className?: string;
  showStats?: boolean;
  showMatchSuggestions?: boolean;
  showActivityFeed?: boolean;
  maxUpdates?: number;
}

export function RealtimeInterestUpdates({
  className = '',
  showStats = true,
  showMatchSuggestions = true,
  showActivityFeed = true,
  maxUpdates = 10
}: RealtimeInterestUpdatesProps) {
  const { user } = useAuth();
  const {
    liveUpdates,
    interestCounts,
    matchSuggestions,
    activityFeed,
    isConnected,
    loading,
    error,
    clearLiveUpdates,
    clearMatchSuggestions,
    clearActivityFeed,
    sendInterest
  } = useRealtimeInterests(user?.$id);

  const [selectedTab, setSelectedTab] = useState('updates');
  const [isMinimized, setIsMinimized] = useState(false);

  // Auto-scroll to new updates
  useEffect(() => {
    if (liveUpdates.length > 0) {
      const element = document.getElementById('live-updates-scroll');
      if (element) {
        element.scrollTop = 0;
      }
    }
  }, [liveUpdates]);

  if (!user) {
    return null;
  }

  const getUpdateIcon = (update: RealtimeInterestData) => {
    switch (update.action) {
      case 'created':
        return <Heart className="h-4 w-4 text-pink-500" />;
      case 'updated':
        if (update.interest.status === 'accepted') {
          return <UserCheck className="h-4 w-4 text-green-500" />;
        } else if (update.interest.status === 'declined') {
          return <UserX className="h-4 w-4 text-red-500" />;
        }
        return <Activity className="h-4 w-4 text-blue-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getUpdateMessage = (update: RealtimeInterestData) => {
    const { interest, action, senderInfo, receiverInfo } = update;
    const isCurrentUserSender = interest.senderId === user.$id;
    const otherUser = isCurrentUserSender ? receiverInfo : senderInfo;
    const otherUserName = otherUser?.name || 'Someone';

    switch (action) {
      case 'created':
        return isCurrentUserSender
          ? `You sent an interest to ${otherUserName}`
          : `${otherUserName} sent you an interest`;
      case 'updated':
        if (interest.status === 'accepted') {
          return isCurrentUserSender
            ? `${otherUserName} accepted your interest!`
            : `You accepted ${otherUserName}'s interest`;
        } else if (interest.status === 'declined') {
          return isCurrentUserSender
            ? `${otherUserName} declined your interest`
            : `You declined ${otherUserName}'s interest`;
        }
        return `Interest updated`;
      default:
        return 'Interest activity';
    }
  };

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

  const handleAcceptSuggestion = async (suggestion: MatchSuggestion) => {
    try {
      await sendInterest(suggestion.suggestedUserId, `Hi! We seem to be a great match based on our compatibility score of ${suggestion.matchScore}%.`);
    } catch (error) {
      console.error('Failed to send interest from suggestion:', error);
    }
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Real-time Updates
            {isConnected && (
              <Badge variant="outline" className="text-green-600 border-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse" />
                Live
              </Badge>
            )}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            {isMinimized ? 'Show' : 'Hide'}
          </Button>
        </div>
        
        {showStats && !isMinimized && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-pink-600">{interestCounts.sent}</div>
              <div className="text-sm text-muted-foreground">Sent</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{interestCounts.received}</div>
              <div className="text-sm text-muted-foreground">Received</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{interestCounts.unread}</div>
              <div className="text-sm text-muted-foreground">Unread</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{interestCounts.mutual}</div>
              <div className="text-sm text-muted-foreground">Mutual</div>
            </div>
          </div>
        )}
      </CardHeader>

      {!isMinimized && (
        <CardContent>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="updates" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Updates ({liveUpdates.length})
              </TabsTrigger>
              {showMatchSuggestions && (
                <TabsTrigger value="suggestions" className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Matches ({matchSuggestions.length})
                </TabsTrigger>
              )}
              {showActivityFeed && (
                <TabsTrigger value="activity" className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Activity ({activityFeed.length})
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="updates" className="mt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">Live Interest Updates</h3>
                {liveUpdates.length > 0 && (
                  <Button variant="outline" size="sm" onClick={clearLiveUpdates}>
                    Clear All
                  </Button>
                )}
              </div>

              <ScrollArea className="h-64" id="live-updates-scroll">
                {liveUpdates.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No recent updates</p>
                    <p className="text-sm">Interest activities will appear here in real-time</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {liveUpdates.slice(0, maxUpdates).map((update, index) => (
                      <div key={`${update.interest.$id}-${index}`} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                        {getUpdateIcon(update)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">
                            {getUpdateMessage(update)}
                          </p>
                          {update.interest.message && (
                            <p className="text-sm text-muted-foreground mt-1">
                              "{update.interest.message}"
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary" className="text-xs">
                              {update.interest.type}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(update.timestamp), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            {showMatchSuggestions && (
              <TabsContent value="suggestions" className="mt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium">AI Match Suggestions</h3>
                  {matchSuggestions.length > 0 && (
                    <Button variant="outline" size="sm" onClick={clearMatchSuggestions}>
                      Clear All
                    </Button>
                  )}
                </div>

                <ScrollArea className="h-64">
                  {matchSuggestions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Star className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No match suggestions</p>
                      <p className="text-sm">AI-powered matches will appear here</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {matchSuggestions.map((suggestion, index) => (
                        <div key={`${suggestion.suggestedUserId}-${index}`} className="p-3 rounded-lg border bg-card">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Star className="h-4 w-4 text-yellow-500" />
                              <span className="font-medium">New Match</span>
                            </div>
                            <Badge variant="outline" className="text-green-600">
                              {suggestion.matchScore}% match
                            </Badge>
                          </div>
                          
                          <Progress value={suggestion.matchScore} className="mb-2" />
                          
                          <p className="text-sm text-muted-foreground mb-2">
                            {suggestion.reason}
                          </p>
                          
                          {suggestion.commonInterests.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {suggestion.commonInterests.slice(0, 3).map((interest, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {interest}
                                </Badge>
                              ))}
                              {suggestion.commonInterests.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{suggestion.commonInterests.length - 3} more
                                </Badge>
                              )}
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(suggestion.timestamp), { addSuffix: true })}
                            </span>
                            <Button 
                              size="sm" 
                              onClick={() => handleAcceptSuggestion(suggestion)}
                              disabled={loading}
                            >
                              Send Interest
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            )}

            {showActivityFeed && (
              <TabsContent value="activity" className="mt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium">Live Activity Feed</h3>
                  {activityFeed.length > 0 && (
                    <Button variant="outline" size="sm" onClick={clearActivityFeed}>
                      Clear All
                    </Button>
                  )}
                </div>

                <ScrollArea className="h-64">
                  {activityFeed.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No recent activity</p>
                      <p className="text-sm">Your activity will appear here</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activityFeed.map((activity, index) => (
                        <div key={`${activity.userId}-${activity.timestamp}-${index}`} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                          {getActivityIcon(activity)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">
                              {activity.activityType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {activity.isPublic && (
                                <Badge variant="outline" className="text-xs">
                                  Public
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            )}
          </Tabs>

          {!isConnected && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-yellow-700">
                  Reconnecting to real-time updates...
                </span>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}