'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Search, 
  Eye, 
  Heart, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Clock, 
  Target,
  Activity,
  BarChart3,
  PieChart as PieChartIcon,
  Lightbulb
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAnalytics } from '@/hooks/useAnalytics';
import type { SearchInsights, UserEngagement, MatchingEffectiveness } from '@/lib/types/analytics.types';

interface AnalyticsDashboardProps {
  userId: string;
  className?: string;
}

export function AnalyticsDashboard({ userId, className }: AnalyticsDashboardProps) {
  const {
    searchInsights,
    userEngagement,
    matchingEffectiveness,
    isLoading,
    error,
    getSearchInsights,
    getUserEngagement,
    getMatchingEffectiveness
  } = useAnalytics();

  // Load analytics data
  React.useEffect(() => {
    if (userId) {
      getSearchInsights(userId);
      getUserEngagement(userId, 30);
      getMatchingEffectiveness(userId, 'weekly');
    }
  }, [userId, getSearchInsights, getUserEngagement, getMatchingEffectiveness]);

  if (isLoading && !searchInsights) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <BarChart3 className="h-8 w-8 animate-pulse text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Loading analytics...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <p className="text-sm text-destructive mb-4">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-accent" />
        <h2 className="text-2xl font-bold">Your Analytics</h2>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="search">Search Insights</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="matching">Matching</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <OverviewTab
            searchInsights={searchInsights}
            userEngagement={userEngagement}
            matchingEffectiveness={matchingEffectiveness}
          />
        </TabsContent>

        <TabsContent value="search" className="space-y-4">
          <SearchInsightsTab searchInsights={searchInsights} />
        </TabsContent>

        <TabsContent value="engagement" className="space-y-4">
          <EngagementTab userEngagement={userEngagement} />
        </TabsContent>

        <TabsContent value="matching" className="space-y-4">
          <MatchingTab matchingEffectiveness={matchingEffectiveness} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface OverviewTabProps {
  searchInsights: SearchInsights | null;
  userEngagement: UserEngagement[];
  matchingEffectiveness: MatchingEffectiveness | null;
}

function OverviewTab({ searchInsights, userEngagement, matchingEffectiveness }: OverviewTabProps) {
  const totalEngagement = userEngagement.reduce((sum, day) => sum + day.engagementScore, 0);
  const avgEngagement = userEngagement.length > 0 ? totalEngagement / userEngagement.length : 0;

  const totalProfilesViewed = userEngagement.reduce((sum, day) => sum + day.metrics.profilesViewed, 0);
  const totalSearches = userEngagement.reduce((sum, day) => sum + day.metrics.searchesPerformed, 0);
  const totalInterests = userEngagement.reduce((sum, day) => sum + day.metrics.interestsSent, 0);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Key Metrics Cards */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Profiles Viewed</CardTitle>
          <Eye className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalProfilesViewed}</div>
          <p className="text-xs text-muted-foreground">Last 30 days</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Searches</CardTitle>
          <Search className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalSearches}</div>
          <p className="text-xs text-muted-foreground">Last 30 days</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Interests Sent</CardTitle>
          <Heart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalInterests}</div>
          <p className="text-xs text-muted-foreground">Last 30 days</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Engagement Score</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{Math.round(avgEngagement)}</div>
          <Progress value={avgEngagement} className="mt-2" />
        </CardContent>
      </Card>

      {/* Engagement Chart */}
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Daily Engagement</CardTitle>
          <CardDescription>Your activity over the last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={userEngagement}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="engagementScore" 
                stroke="#8884d8" 
                strokeWidth={2}
                name="Engagement Score"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

interface SearchInsightsTabProps {
  searchInsights: SearchInsights | null;
}

function SearchInsightsTab({ searchInsights }: SearchInsightsTabProps) {
  if (!searchInsights) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">No search insights available yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Search Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Search Statistics</CardTitle>
          <CardDescription>Your search behavior insights</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm">Average Results per Search</span>
            <Badge variant="secondary">
              {Math.round(searchInsights.insights.averageResultsPerSearch)}
            </Badge>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm">Search to View Rate</span>
            <Badge variant="secondary">
              {Math.round(searchInsights.insights.searchToViewConversionRate * 100)}%
            </Badge>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm">View to Interest Rate</span>
            <Badge variant="secondary">
              {Math.round(searchInsights.insights.viewToInterestConversionRate * 100)}%
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Most Used Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Most Used Filters</CardTitle>
          <CardDescription>Your frequently used search criteria</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={searchInsights.insights.mostSearchedFilters.slice(0, 5)}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ filter, count }) => `${filter.split(':')[0]}: ${count}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {searchInsights.insights.mostSearchedFilters.slice(0, 5).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Search Time Patterns */}
      <Card>
        <CardHeader>
          <CardTitle>Search Time Patterns</CardTitle>
          <CardDescription>When you're most active</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={searchInsights.insights.preferredSearchTimes.slice(0, 12)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Recommendations
          </CardTitle>
          <CardDescription>Tips to improve your search experience</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {searchInsights.recommendations.map((recommendation, index) => (
              <li key={index} className="text-sm flex items-start gap-2">
                <Target className="h-3 w-3 text-accent mt-0.5 flex-shrink-0" />
                {recommendation}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

interface EngagementTabProps {
  userEngagement: UserEngagement[];
}

function EngagementTab({ userEngagement }: EngagementTabProps) {
  if (userEngagement.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">No engagement data available yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const recentEngagement = userEngagement.slice(-7); // Last 7 days

  return (
    <div className="space-y-4">
      {/* Engagement Metrics Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Engagement Trends</CardTitle>
          <CardDescription>Your activity patterns over the last 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={recentEngagement}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="metrics.profilesViewed" fill="#8884d8" name="Profiles Viewed" />
              <Bar dataKey="metrics.searchesPerformed" fill="#82ca9d" name="Searches" />
              <Bar dataKey="metrics.interestsSent" fill="#ffc658" name="Interests Sent" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Time Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(userEngagement.reduce((sum, day) => sum + day.metrics.totalTimeSpent, 0))}m
            </div>
            <p className="text-xs text-muted-foreground">Total minutes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userEngagement.reduce((sum, day) => sum + day.metrics.sessionsCount, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Total sessions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Avg. Session</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(
                userEngagement.reduce((sum, day) => sum + day.metrics.totalTimeSpent, 0) /
                Math.max(userEngagement.reduce((sum, day) => sum + day.metrics.sessionsCount, 0), 1)
              )}m
            </div>
            <p className="text-xs text-muted-foreground">Minutes per session</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface MatchingTabProps {
  matchingEffectiveness: MatchingEffectiveness | null;
}

function MatchingTab({ matchingEffectiveness }: MatchingTabProps) {
  if (!matchingEffectiveness) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">No matching data available yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
      case 'increasing':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'declining':
      case 'decreasing':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Matching Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{matchingEffectiveness.metrics.recommendationsShown}</div>
            <p className="text-xs text-muted-foreground">Shown this {matchingEffectiveness.period}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Viewed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{matchingEffectiveness.metrics.recommendationsViewed}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((matchingEffectiveness.metrics.recommendationsViewed / 
                Math.max(matchingEffectiveness.metrics.recommendationsShown, 1)) * 100)}% view rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Interests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{matchingEffectiveness.metrics.recommendationsInterested}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((matchingEffectiveness.metrics.recommendationsInterested / 
                Math.max(matchingEffectiveness.metrics.recommendationsViewed, 1)) * 100)}% interest rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Avg. Compatibility</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{matchingEffectiveness.metrics.averageCompatibilityScore}%</div>
            <Progress value={matchingEffectiveness.metrics.averageCompatibilityScore} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Matching Trends</CardTitle>
          <CardDescription>How your matching performance is evolving</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">Quality Trend</span>
            <div className="flex items-center gap-2">
              {getTrendIcon(matchingEffectiveness.trends.qualityTrend)}
              <Badge variant="secondary">
                {matchingEffectiveness.trends.qualityTrend}
              </Badge>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">Engagement Trend</span>
            <div className="flex items-center gap-2">
              {getTrendIcon(matchingEffectiveness.trends.engagementTrend)}
              <Badge variant="secondary">
                {matchingEffectiveness.trends.engagementTrend}
              </Badge>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">Improvement Rate</span>
            <Badge variant="default">
              +{matchingEffectiveness.trends.improvementRate}%
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Quality Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Match Quality</CardTitle>
          <CardDescription>Quality indicators for your matches</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">High Quality Matches (80%+ compatibility)</span>
            <Badge variant="default">
              {matchingEffectiveness.metrics.highQualityMatches}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">Successful Connections</span>
            <Badge variant="default">
              {matchingEffectiveness.metrics.successfulConnections}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">User Satisfaction Score</span>
            <div className="flex items-center gap-2">
              <Progress value={matchingEffectiveness.metrics.userSatisfactionScore} className="w-20" />
              <span className="text-sm font-medium">
                {matchingEffectiveness.metrics.userSatisfactionScore}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}