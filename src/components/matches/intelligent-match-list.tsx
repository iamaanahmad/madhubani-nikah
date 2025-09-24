'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Heart, 
  RefreshCw, 
  TrendingUp, 
  Sparkles, 
  MapPin, 
  GraduationCap,
  Briefcase,
  Clock,
  Star,
  ThumbsUp,
  ThumbsDown,
  MoreHorizontal
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useMatchRecommendations, useInteractionTracker } from '@/hooks/useMatchRecommendations';
import { CompatibilityScoreDisplay } from './compatibility-score-display';
import type { MatchRecommendation } from '@/lib/types/compatibility.types';
import type { Profile } from '@/lib/services/profile.service';

interface IntelligentMatchListProps {
  userId: string;
  className?: string;
  onProfileClick?: (profile: Profile) => void;
  onInterestSent?: (profileId: string) => void;
}

export function IntelligentMatchList({
  userId,
  className,
  onProfileClick,
  onInterestSent
}: IntelligentMatchListProps) {
  const {
    recommendations,
    trendingMatches,
    isLoading,
    error,
    getRecommendations,
    refreshRecommendations,
    getTrendingMatches,
    recordFeedback
  } = useMatchRecommendations();

  const {
    trackProfileView,
    trackInterestSent,
    trackProfileFavorite,
    trackProfileSkip
  } = useInteractionTracker(userId);

  const [activeTab, setActiveTab] = React.useState<'recommended' | 'trending'>('recommended');

  // Load initial recommendations
  React.useEffect(() => {
    if (userId) {
      getRecommendations(userId);
      getTrendingMatches(userId);
    }
  }, [userId, getRecommendations, getTrendingMatches]);

  const handleProfileClick = async (recommendation: MatchRecommendation) => {
    // Track profile view
    await trackProfileView(recommendation.profileId, {
      source: 'intelligent_recommendations',
      compatibilityScore: recommendation.compatibilityScore.overall,
      priority: recommendation.priority
    });

    // Call parent handler if provided
    if (onProfileClick) {
      // We need to get the full profile data - this is simplified
      // In a real implementation, you'd fetch the profile or pass it through
      onProfileClick({
        $id: recommendation.profileId,
        userId: recommendation.profileId
      } as Profile);
    }
  };

  const handleInterestSent = async (recommendation: MatchRecommendation) => {
    await trackInterestSent(recommendation.profileId, {
      source: 'intelligent_recommendations',
      compatibilityScore: recommendation.compatibilityScore.overall,
      priority: recommendation.priority
    });

    if (onInterestSent) {
      onInterestSent(recommendation.profileId);
    }
  };

  const handleFeedback = async (
    recommendation: MatchRecommendation,
    feedback: 'excellent' | 'good' | 'average' | 'poor'
  ) => {
    await recordFeedback(userId, recommendation.profileId, feedback);
  };

  const handleRefresh = async () => {
    await refreshRecommendations(userId);
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Star className="h-4 w-4 text-yellow-500" />;
      case 'medium':
        return <TrendingUp className="h-4 w-4 text-blue-500" />;
      default:
        return <Heart className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      high: 'default',
      medium: 'secondary',
      low: 'outline'
    } as const;

    return (
      <Badge variant={variants[priority as keyof typeof variants] || 'outline'} className="text-xs">
        {priority.charAt(0).toUpperCase() + priority.slice(1)} Match
      </Badge>
    );
  };

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            <CardTitle>Smart Matches</CardTitle>
          </div>
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={isLoading}
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
            Refresh
          </Button>
        </div>
        <CardDescription>
          AI-powered recommendations based on your preferences and activity
        </CardDescription>

        {/* Tab Navigation */}
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          <Button
            variant={activeTab === 'recommended' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('recommended')}
            className="flex-1"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Recommended ({recommendations.length})
          </Button>
          <Button
            variant={activeTab === 'trending' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('trending')}
            className="flex-1"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Trending ({trendingMatches.length})
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading && recommendations.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">Finding your perfect matches...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {activeTab === 'recommended' && (
              <>
                {recommendations.length === 0 ? (
                  <div className="text-center py-8">
                    <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">
                      No recommendations available yet. Complete your profile to get better matches!
                    </p>
                  </div>
                ) : (
                  recommendations.map((recommendation) => (
                    <RecommendationCard
                      key={recommendation.profileId}
                      recommendation={recommendation}
                      onProfileClick={() => handleProfileClick(recommendation)}
                      onInterestSent={() => handleInterestSent(recommendation)}
                      onFeedback={(feedback) => handleFeedback(recommendation, feedback)}
                    />
                  ))
                )}
              </>
            )}

            {activeTab === 'trending' && (
              <>
                {trendingMatches.length === 0 ? (
                  <div className="text-center py-8">
                    <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">
                      No trending matches available at the moment.
                    </p>
                  </div>
                ) : (
                  trendingMatches.map((profile) => (
                    <TrendingMatchCard
                      key={profile.$id}
                      profile={profile}
                      onProfileClick={() => onProfileClick?.(profile)}
                    />
                  ))
                )}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface RecommendationCardProps {
  recommendation: MatchRecommendation;
  onProfileClick: () => void;
  onInterestSent: () => void;
  onFeedback: (feedback: 'excellent' | 'good' | 'average' | 'poor') => void;
}

function RecommendationCard({
  recommendation,
  onProfileClick,
  onInterestSent,
  onFeedback
}: RecommendationCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Profile Avatar */}
          <Avatar className="h-16 w-16">
            <AvatarImage src="" alt="Profile" />
            <AvatarFallback>
              {recommendation.profileId.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {/* Profile Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold truncate">Profile {recommendation.profileId.slice(0, 8)}</h4>
                {getPriorityIcon(recommendation.priority)}
              </div>
              <div className="flex items-center gap-2">
                {getPriorityBadge(recommendation.priority)}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onFeedback('excellent')}>
                      <ThumbsUp className="h-4 w-4 mr-2" />
                      Excellent Match
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onFeedback('good')}>
                      <Star className="h-4 w-4 mr-2" />
                      Good Match
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onFeedback('average')}>
                      Average Match
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onFeedback('poor')}>
                      <ThumbsDown className="h-4 w-4 mr-2" />
                      Poor Match
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-3">
              {recommendation.recommendationReason}
            </p>

            {/* Compatibility Score */}
            <div className="mb-3">
              <CompatibilityScoreDisplay
                compatibilityScore={recommendation.compatibilityScore}
                compact
                showDetails={false}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button onClick={onProfileClick} variant="outline" size="sm" className="flex-1">
                View Profile
              </Button>
              <Button onClick={onInterestSent} size="sm" className="flex-1">
                <Heart className="h-4 w-4 mr-2" />
                Send Interest
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface TrendingMatchCardProps {
  profile: Profile;
  onProfileClick: () => void;
}

function TrendingMatchCard({ profile, onProfileClick }: TrendingMatchCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onProfileClick}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={profile.profilePictureUrl} alt={profile.name} />
            <AvatarFallback>
              {profile.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-semibold truncate">{profile.name}</h4>
              <Badge variant="secondary" className="text-xs">
                <TrendingUp className="h-3 w-3 mr-1" />
                Trending
              </Badge>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
              <span>{profile.age} years</span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {profile.district}
              </span>
              <span className="flex items-center gap-1">
                <GraduationCap className="h-3 w-3" />
                {profile.education}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              Active recently
              {profile.isVerified && (
                <>
                  <Separator orientation="vertical" className="h-3" />
                  <span className="text-green-600">Verified</span>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}