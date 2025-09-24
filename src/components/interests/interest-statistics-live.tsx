'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Heart, Users, Eye, Clock, Activity, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useRealtimeInterests } from '@/hooks/useRealtimeInterests';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';

interface InterestStatisticsLiveProps {
  className?: string;
  showTrends?: boolean;
  showProgress?: boolean;
}

export function InterestStatisticsLive({
  className = '',
  showTrends = true,
  showProgress = true
}: InterestStatisticsLiveProps) {
  const { user } = useAuth();
  const {
    interestCounts,
    interestStats,
    isConnected,
    loading,
    error
  } = useRealtimeInterests(user?.$id);

  const [previousCounts, setPreviousCounts] = useState(interestCounts);
  const [trends, setTrends] = useState({
    sent: 0,
    received: 0,
    unread: 0,
    mutual: 0
  });

  // Calculate trends when counts change
  useEffect(() => {
    const newTrends = {
      sent: interestCounts.sent - previousCounts.sent,
      received: interestCounts.received - previousCounts.received,
      unread: interestCounts.unread - previousCounts.unread,
      mutual: interestCounts.mutual - previousCounts.mutual
    };

    setTrends(newTrends);
    setPreviousCounts(interestCounts);
  }, [interestCounts, previousCounts]);

  if (!user) {
    return null;
  }

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="h-3 w-3 text-green-500" />;
    if (trend < 0) return <TrendingUp className="h-3 w-3 text-red-500 rotate-180" />;
    return null;
  };

  const getTrendColor = (trend: number) => {
    if (trend > 0) return 'text-green-600';
    if (trend < 0) return 'text-red-600';
    return 'text-gray-500';
  };

  const calculateSuccessRate = () => {
    if (!interestStats || interestStats.totalSent === 0) return 0;
    return Math.round((interestStats.acceptedSent / interestStats.totalSent) * 100);
  };

  const calculateResponseRate = () => {
    if (!interestStats || interestStats.totalReceived === 0) return 0;
    const responded = interestStats.acceptedReceived + interestStats.declinedReceived;
    return Math.round((responded / interestStats.totalReceived) * 100);
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Live Interest Statistics
          {isConnected && (
            <Badge variant="outline" className="text-green-600 border-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse" />
              Live
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Main Statistics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-4 rounded-lg border bg-gradient-to-br from-pink-50 to-pink-100">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Heart className="h-5 w-5 text-pink-600" />
              {showTrends && getTrendIcon(trends.sent)}
            </div>
            <div className="text-2xl font-bold text-pink-600">{interestCounts.sent}</div>
            <div className="text-sm text-muted-foreground">Interests Sent</div>
            {showTrends && trends.sent !== 0 && (
              <div className={`text-xs ${getTrendColor(trends.sent)} mt-1`}>
                {trends.sent > 0 ? '+' : ''}{trends.sent} today
              </div>
            )}
          </div>

          <div className="text-center p-4 rounded-lg border bg-gradient-to-br from-blue-50 to-blue-100">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Eye className="h-5 w-5 text-blue-600" />
              {showTrends && getTrendIcon(trends.received)}
            </div>
            <div className="text-2xl font-bold text-blue-600">{interestCounts.received}</div>
            <div className="text-sm text-muted-foreground">Interests Received</div>
            {showTrends && trends.received !== 0 && (
              <div className={`text-xs ${getTrendColor(trends.received)} mt-1`}>
                {trends.received > 0 ? '+' : ''}{trends.received} today
              </div>
            )}
          </div>

          <div className="text-center p-4 rounded-lg border bg-gradient-to-br from-orange-50 to-orange-100">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-orange-600" />
              {showTrends && getTrendIcon(trends.unread)}
            </div>
            <div className="text-2xl font-bold text-orange-600">{interestCounts.unread}</div>
            <div className="text-sm text-muted-foreground">Unread</div>
            {showTrends && trends.unread !== 0 && (
              <div className={`text-xs ${getTrendColor(trends.unread)} mt-1`}>
                {trends.unread > 0 ? '+' : ''}{trends.unread} new
              </div>
            )}
          </div>

          <div className="text-center p-4 rounded-lg border bg-gradient-to-br from-purple-50 to-purple-100">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Users className="h-5 w-5 text-purple-600" />
              {showTrends && getTrendIcon(trends.mutual)}
            </div>
            <div className="text-2xl font-bold text-purple-600">{interestCounts.mutual}</div>
            <div className="text-sm text-muted-foreground">Mutual Interests</div>
            {showTrends && trends.mutual !== 0 && (
              <div className={`text-xs ${getTrendColor(trends.mutual)} mt-1`}>
                {trends.mutual > 0 ? '+' : ''}{trends.mutual} new
              </div>
            )}
          </div>
        </div>

        {/* Success Metrics */}
        {showProgress && interestStats && (
          <div className="space-y-4 mb-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Success Rate</span>
                <span className="text-sm text-muted-foreground">{calculateSuccessRate()}%</span>
              </div>
              <Progress value={calculateSuccessRate()} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {interestStats.acceptedSent} accepted out of {interestStats.totalSent} sent
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Response Rate</span>
                <span className="text-sm text-muted-foreground">{calculateResponseRate()}%</span>
              </div>
              <Progress value={calculateResponseRate()} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {interestStats.acceptedReceived + interestStats.declinedReceived} responses out of {interestStats.totalReceived} received
              </p>
            </div>
          </div>
        )}

        {/* Additional Stats */}
        {interestStats && (
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600">{interestStats.acceptedSent}</div>
              <div className="text-sm text-muted-foreground">Accepted</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-red-600">{interestStats.declinedSent}</div>
              <div className="text-sm text-muted-foreground">Declined</div>
            </div>
          </div>
        )}

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
                Loading statistics...
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}