'use client';

import { useState } from 'react';
import { 
  Heart, 
  TrendingUp, 
  Users, 
  Share2, 
  Filter,
  BarChart3,
  Lightbulb,
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { MutualMatchCard } from './mutual-match-card';
import { useMutualMatches } from '@/hooks/useMutualMatches';
import type { MutualMatchStatus, MatchQuality } from '@/lib/types/contact.types';

interface MutualMatchesDashboardProps {
  userId: string;
  onViewProfile?: (userId: string) => void;
}

export function MutualMatchesDashboard({ userId, onViewProfile }: MutualMatchesDashboardProps) {
  const {
    mutualMatches,
    stats,
    contactStats,
    recommendations,
    insights,
    loading,
    error,
    requestContactShare,
    updateMatchStatus,
    refreshMutualMatches,
    clearError,
  } = useMutualMatches(userId);

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [qualityFilter, setQualityFilter] = useState<string>('all');

  // Filter matches based on selected filters
  const filteredMatches = mutualMatches.filter(match => {
    if (statusFilter !== 'all' && match.status !== statusFilter) return false;
    if (qualityFilter !== 'all' && match.matchQuality !== qualityFilter) return false;
    return true;
  });

  const handleRequestContact = async (matchId: string) => {
    const match = mutualMatches.find(m => m.$id === matchId);
    if (!match) return;

    const otherUserId = match.user1Id === userId ? match.user2Id : match.user1Id;
    
    await requestContactShare({
      toUserId: otherUserId,
      mutualMatchId: matchId,
      message: 'Hi! I would like to share contact information with you.',
    });
  };

  const handleUpdateStatus = async (matchId: string, status: MutualMatchStatus) => {
    await updateMatchStatus(matchId, status);
  };

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
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-pink-500" />
              <div>
                <p className="text-2xl font-bold">{stats?.totalMatches || 0}</p>
                <p className="text-xs text-gray-500">Total Matches</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats?.activeMatches || 0}</p>
                <p className="text-xs text-gray-500">Active Matches</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{contactStats?.totalShared || 0}</p>
                <p className="text-xs text-gray-500">Contacts Shared</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">
                  {stats?.averageMatchScore ? Math.round(stats.averageMatchScore) : 0}%
                </p>
                <p className="text-xs text-gray-500">Avg Match Score</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="matches" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="matches">Matches</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="matches" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Your Mutual Matches</CardTitle>
                <div className="flex items-center gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={qualityFilter} onValueChange={setQualityFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Quality" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Quality</SelectItem>
                      <SelectItem value="excellent">Excellent</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="poor">Poor</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button variant="outline" size="sm" onClick={refreshMutualMatches}>
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Matches Grid */}
          {loading && filteredMatches.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading matches...</p>
            </div>
          ) : filteredMatches.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Heart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">No mutual matches yet</h3>
                <p className="text-gray-500 mb-4">
                  Keep sending interests to find your perfect match!
                </p>
                <Button onClick={() => window.location.href = '/profiles'}>
                  Browse Profiles
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMatches.map((match) => (
                <MutualMatchCard
                  key={match.$id}
                  match={match}
                  currentUserId={userId}
                  onRequestContact={handleRequestContact}
                  onUpdateStatus={handleUpdateStatus}
                  onViewProfile={onViewProfile}
                  showContactInfo={match.isContactShared}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Match Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recommendations.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No recommendations available at the moment.
                </p>
              ) : (
                <div className="space-y-4">
                  {recommendations.map((rec, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">Recommended Match</h4>
                        <Badge variant="outline">{rec.matchScore}% match</Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <Progress value={rec.overallCompatibility} className="h-2" />
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Location:</span>
                            <span className="ml-2">{rec.locationCompatibility}%</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Education:</span>
                            <span className="ml-2">{rec.educationCompatibility}%</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Religious:</span>
                            <span className="ml-2">{rec.religiousCompatibility}%</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Age:</span>
                            <span className="ml-2">{rec.ageCompatibility}%</span>
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Reasons:</p>
                          <div className="flex flex-wrap gap-1">
                            {rec.reasons.map((reason, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {reason}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <Button size="sm" className="w-full">
                          View Profile
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Match Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              {insights.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No insights available yet. Keep using the platform to get personalized insights!
                </p>
              ) : (
                <div className="space-y-4">
                  {insights.map((insight, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{insight.title}</h4>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold">{insight.value}%</span>
                          <TrendingUp className={`h-4 w-4 ${
                            insight.trend === 'up' ? 'text-green-500' : 
                            insight.trend === 'down' ? 'text-red-500' : 'text-gray-500'
                          }`} />
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">{insight.description}</p>
                      
                      {insight.recommendation && (
                        <div className="p-2 bg-blue-50 rounded text-sm text-blue-800">
                          <strong>Tip:</strong> {insight.recommendation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Match Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats && (
                <div className="space-y-6">
                  {/* Match Quality Breakdown */}
                  <div>
                    <h4 className="font-medium mb-3">Match Quality Distribution</h4>
                    <div className="space-y-2">
                      {Object.entries(stats.matchQualityBreakdown).map(([quality, count]) => (
                        <div key={quality} className="flex items-center justify-between">
                          <span className="capitalize text-sm">{quality}</span>
                          <div className="flex items-center gap-2">
                            <Progress 
                              value={stats.totalMatches > 0 ? (count / stats.totalMatches) * 100 : 0} 
                              className="w-20 h-2" 
                            />
                            <span className="text-sm w-8">{count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Contact Sharing Stats */}
                  {contactStats && (
                    <div>
                      <h4 className="font-medium mb-3">Contact Sharing</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Total Shared:</span>
                          <span className="ml-2 font-medium">{contactStats.totalShared}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Total Received:</span>
                          <span className="ml-2 font-medium">{contactStats.totalReceived}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Active Shares:</span>
                          <span className="ml-2 font-medium">{contactStats.activeShares}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Avg Access Count:</span>
                          <span className="ml-2 font-medium">{Math.round(contactStats.averageAccessCount)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}