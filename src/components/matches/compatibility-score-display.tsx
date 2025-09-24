'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Heart, 
  MapPin, 
  GraduationCap, 
  Mosque, 
  Users, 
  Briefcase, 
  MessageCircle,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CompatibilityScore } from '@/lib/types/compatibility.types';

interface CompatibilityScoreDisplayProps {
  compatibilityScore: CompatibilityScore;
  showDetails?: boolean;
  compact?: boolean;
  className?: string;
}

export function CompatibilityScoreDisplay({
  compatibilityScore,
  showDetails = true,
  compact = false,
  className
}: CompatibilityScoreDisplayProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreVariant = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  const getConfidenceBadge = (level: string) => {
    const variants = {
      high: 'default',
      medium: 'secondary',
      low: 'outline'
    } as const;
    
    return (
      <Badge variant={variants[level as keyof typeof variants] || 'outline'}>
        {level.charAt(0).toUpperCase() + level.slice(1)} Confidence
      </Badge>
    );
  };

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className="flex items-center gap-1">
          <Heart className={cn('h-4 w-4', getScoreColor(compatibilityScore.overall))} />
          <span className={cn('font-semibold', getScoreColor(compatibilityScore.overall))}>
            {compatibilityScore.overall}%
          </span>
        </div>
        {getConfidenceBadge(compatibilityScore.confidenceLevel)}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className={cn('h-5 w-5', getScoreColor(compatibilityScore.overall))} />
            <CardTitle className="text-lg">Compatibility Score</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant={getScoreVariant(compatibilityScore.overall)}
              className="text-lg px-3 py-1"
            >
              {compatibilityScore.overall}%
            </Badge>
            {getConfidenceBadge(compatibilityScore.confidenceLevel)}
          </div>
        </div>
        <CardDescription>
          AI-powered compatibility analysis based on profile information
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Overall Compatibility</span>
            <span className={getScoreColor(compatibilityScore.overall)}>
              {compatibilityScore.overall}%
            </span>
          </div>
          <Progress 
            value={compatibilityScore.overall} 
            className="h-2"
          />
        </div>

        {showDetails && (
          <>
            <Separator />

            {/* Detailed Breakdown */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Compatibility Breakdown
              </h4>

              <div className="grid gap-3">
                {/* Location Compatibility */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Location</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={compatibilityScore.breakdown.location.score} 
                      className="w-20 h-2"
                    />
                    <span className={cn('text-sm font-medium', getScoreColor(compatibilityScore.breakdown.location.score))}>
                      {compatibilityScore.breakdown.location.score}%
                    </span>
                  </div>
                </div>

                {/* Education Compatibility */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Education</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={compatibilityScore.breakdown.education.score} 
                      className="w-20 h-2"
                    />
                    <span className={cn('text-sm font-medium', getScoreColor(compatibilityScore.breakdown.education.score))}>
                      {compatibilityScore.breakdown.education.score}%
                    </span>
                  </div>
                </div>

                {/* Religious Compatibility */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mosque className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Religious</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={compatibilityScore.breakdown.religious.score} 
                      className="w-20 h-2"
                    />
                    <span className={cn('text-sm font-medium', getScoreColor(compatibilityScore.breakdown.religious.score))}>
                      {compatibilityScore.breakdown.religious.score}%
                    </span>
                  </div>
                </div>

                {/* Family Compatibility */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Family</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={compatibilityScore.breakdown.family.score} 
                      className="w-20 h-2"
                    />
                    <span className={cn('text-sm font-medium', getScoreColor(compatibilityScore.breakdown.family.score))}>
                      {compatibilityScore.breakdown.family.score}%
                    </span>
                  </div>
                </div>

                {/* Lifestyle Compatibility */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Lifestyle</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={compatibilityScore.breakdown.lifestyle.score} 
                      className="w-20 h-2"
                    />
                    <span className={cn('text-sm font-medium', getScoreColor(compatibilityScore.breakdown.lifestyle.score))}>
                      {compatibilityScore.breakdown.lifestyle.score}%
                    </span>
                  </div>
                </div>

                {/* Personality Compatibility */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Personality</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={compatibilityScore.breakdown.personality.score} 
                      className="w-20 h-2"
                    />
                    <span className={cn('text-sm font-medium', getScoreColor(compatibilityScore.breakdown.personality.score))}>
                      {compatibilityScore.breakdown.personality.score}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Match Reasons */}
            {compatibilityScore.matchReasons.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <h4 className="font-semibold text-sm">Why This Match Works</h4>
                </div>
                <ul className="space-y-1">
                  {compatibilityScore.matchReasons.map((reason, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                      <TrendingUp className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Potential Concerns */}
            {compatibilityScore.potentialConcerns.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <h4 className="font-semibold text-sm">Points to Consider</h4>
                </div>
                <ul className="space-y-1">
                  {compatibilityScore.potentialConcerns.map((concern, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                      <Info className="h-3 w-3 text-yellow-600 mt-0.5 flex-shrink-0" />
                      {concern}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* AI Explanation */}
            {compatibilityScore.explanation && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">AI Analysis</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {compatibilityScore.explanation}
                  </p>
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}