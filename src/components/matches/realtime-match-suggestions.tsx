'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { 
  Star, 
  Heart, 
  Users, 
  TrendingUp, 
  Sparkles, 
  RefreshCw,
  X,
  Check,
  Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useRealtimeInterests } from '@/hooks/useRealtimeInterests';
import { useAuth } from '@/hooks/useAuth';
import type { MatchSuggestion } from '@/lib/services/realtime-interest.service';

interface RealtimeMatchSuggestionsProps {
  className?: string;
  maxSuggestions?: number;
  showScores?: boolean;
  autoRefresh?: boolean;
}

export function RealtimeMatchSuggestions({
  className = '',
  maxSuggestions = 5,
  showScores = true,
  autoRefresh = true
}: RealtimeMatchSuggestionsProps) {
  const { user } = useAuth();
  const {
    matchSuggestions,
    isConnected,
    loading,
    error,
    sendInterest,
    clearMatchSuggestions
  } = useRealtimeInterests(user?.$id);

  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());
  const [sendingInterest, setSendingInterest] = useState<Set<string>>(new Set());

  if (!user) {
    return null;
  }

  const visibleSuggestions = matchSuggestions
    .filter(suggestion => !dismissedSuggestions.has(suggestion.suggestedUserId))
    .slice(0, maxSuggestions);

  const handleSendInterest = async (suggestion: MatchSuggestion) => {
    setSendingInterest(prev => new Set(prev).add(suggestion.suggestedUserId));
    
    try {
      const message = `Hi! We seem to be a great match with ${suggestion.matchScore}% compatibility. ${suggestion.reason}`;
      await sendInterest(suggestion.suggestedUserId, message);
      
      // Dismiss the suggestion after sending interest
      setDismissedSuggestions(prev => new Set(prev).add(suggestion.suggestedUserId));
    } catch (error) {
      console.error('Failed to send interest from suggestion:', error);
    } finally {
      setSendingInterest(prev => {
        const newSet = new Set(prev);
        newSet.delete(suggestion.suggestedUserId);
        return newSet;
      });
    }
  };

  const handleDismissSuggestion = (suggestion: MatchSuggestion) => {
    setDismissedSuggestions(prev => new Set(prev).add(suggestion.suggestedUserId));
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 80) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 70) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 90) return 'from-green-500 to-green-600';
    if (score >= 80) return 'from-blue-500 to-blue-600';
    if (score >= 70) return 'from-yellow-500 to-yellow-600';
    return 'from-gray-500 to-gray-600';
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI Match Suggestions
            {isConnected && (
              <Badge variant="outline" className="text-green-600 border-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse" />
                Live
              </Badge>
            )}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {visibleSuggestions.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearMatchSuggestions}
              >
                Clear All
              </Button>
            )}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Info className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>AI-powered match suggestions based on your preferences and activity</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <ScrollArea className="h-96">
          {visibleSuggestions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Star className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No match suggestions available</p>
              <p className="text-sm">
                AI-powered matches will appear here based on your activity and preferences
              </p>
              {autoRefresh && (
                <div className="flex items-center justify-center gap-2 mt-4 text-xs">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  <span>Generating new suggestions...</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {visibleSuggestions.map((suggestion, index) => (
                <div 
                  key={`${suggestion.suggestedUserId}-${index}`} 
                  className="relative p-4 rounded-lg border bg-gradient-to-r from-purple-50 to-pink-50 hover:shadow-md transition-shadow"
                >
                  {/* Dismiss button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 h-6 w-6 p-0"
                    onClick={() => handleDismissSuggestion(suggestion)}
                  >
                    <X className="h-3 w-3" />
                  </Button>

                  {/* Header with score */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-full bg-gradient-to-r ${getScoreGradient(suggestion.matchScore)}`}>
                        <Star className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Perfect Match Found!</h3>
                        <p className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(suggestion.timestamp), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    
                    {showScores && (
                      <Badge className={`${getScoreColor(suggestion.matchScore)} font-bold`}>
                        {suggestion.matchScore}% match
                      </Badge>
                    )}
                  </div>

                  {/* Match score progress */}
                  {showScores && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">Compatibility Score</span>
                        <span className="text-sm text-muted-foreground">{suggestion.matchScore}%</span>
                      </div>
                      <Progress 
                        value={suggestion.matchScore} 
                        className="h-2"
                      />
                    </div>
                  )}

                  {/* Reason */}
                  <p className="text-sm text-muted-foreground mb-3">
                    {suggestion.reason}
                  </p>

                  {/* Common interests */}
                  {suggestion.commonInterests.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium mb-2">Common Interests:</p>
                      <div className="flex flex-wrap gap-1">
                        {suggestion.commonInterests.slice(0, 5).map((interest, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {interest}
                          </Badge>
                        ))}
                        {suggestion.commonInterests.length > 5 && (
                          <Badge variant="secondary" className="text-xs">
                            +{suggestion.commonInterests.length - 5} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex items-center gap-2">
                    <Button 
                      onClick={() => handleSendInterest(suggestion)}
                      disabled={sendingInterest.has(suggestion.suggestedUserId) || loading}
                      className="flex-1"
                    >
                      {sendingInterest.has(suggestion.suggestedUserId) ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Heart className="h-4 w-4 mr-2" />
                          Send Interest
                        </>
                      )}
                    </Button>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDismissSuggestion(suggestion)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Dismiss this suggestion</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  {/* Match quality indicator */}
                  <div className="absolute top-4 left-4">
                    {suggestion.matchScore >= 90 && (
                      <div className="flex items-center gap-1 text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                        <TrendingUp className="h-3 w-3" />
                        Excellent Match
                      </div>
                    )}
                    {suggestion.matchScore >= 80 && suggestion.matchScore < 90 && (
                      <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                        <Users className="h-3 w-3" />
                        Great Match
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Connection status */}
        {!isConnected && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-700">
                Reconnecting to match suggestions...
              </span>
            </div>
          </div>
        )}

        {loading && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-600 animate-pulse" />
              <span className="text-sm text-blue-700">
                Generating AI-powered match suggestions...
              </span>
            </div>
          </div>
        )}

        {/* Statistics */}
        {matchSuggestions.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{matchSuggestions.length} suggestions generated</span>
              <span>{dismissedSuggestions.size} dismissed</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}