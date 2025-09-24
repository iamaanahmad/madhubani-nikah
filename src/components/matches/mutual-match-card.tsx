'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Star, 
  MapPin, 
  GraduationCap,
  Users,
  Phone,
  Mail,
  MessageSquare,
  MoreVertical,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { MutualMatch, MatchQuality, MutualMatchStatus } from '@/lib/types/contact.types';

interface MutualMatchCardProps {
  match: MutualMatch;
  currentUserId: string;
  onRequestContact?: (matchId: string) => void;
  onUpdateStatus?: (matchId: string, status: MutualMatchStatus) => void;
  onViewProfile?: (userId: string) => void;
  showContactInfo?: boolean;
}

const qualityColors: Record<MatchQuality, string> = {
  excellent: 'text-green-600 bg-green-50 border-green-200',
  good: 'text-blue-600 bg-blue-50 border-blue-200',
  fair: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  poor: 'text-red-600 bg-red-50 border-red-200',
};

const statusColors: Record<MutualMatchStatus, string> = {
  active: 'text-green-600 bg-green-50',
  contacted: 'text-blue-600 bg-blue-50',
  inactive: 'text-gray-600 bg-gray-50',
  blocked: 'text-red-600 bg-red-50',
};

export function MutualMatchCard({
  match,
  currentUserId,
  onRequestContact,
  onUpdateStatus,
  onViewProfile,
  showContactInfo = false,
}: MutualMatchCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Determine the other user
  const otherUserId = match.user1Id === currentUserId ? match.user2Id : match.user1Id;
  
  // Mock user data (in real app, this would come from props or be fetched)
  const otherUser = {
    id: otherUserId,
    name: 'Sarah Ahmed',
    age: 26,
    location: 'Madhubani, Bihar',
    education: 'Masters in Computer Science',
    occupation: 'Software Engineer',
    profilePicture: undefined,
    isVerified: true,
  };

  const matchedAgo = formatDistanceToNow(new Date(match.matchedAt), { addSuffix: true });
  const qualityColorClass = qualityColors[match.matchQuality];
  const statusColorClass = statusColors[match.status];

  const handleRequestContact = async () => {
    if (!onRequestContact) return;
    
    setIsLoading(true);
    try {
      await onRequestContact(match.$id);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (status: MutualMatchStatus) => {
    if (!onUpdateStatus) return;
    
    setIsLoading(true);
    try {
      await onUpdateStatus(match.$id, status);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewProfile = () => {
    if (onViewProfile) {
      onViewProfile(otherUserId);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={otherUser.profilePicture} alt={otherUser.name} />
              <AvatarFallback>
                {otherUser.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">{otherUser.name}</h3>
                {otherUser.isVerified && (
                  <Badge variant="secondary" className="text-xs">
                    Verified
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-600">
                {otherUser.age} years • {otherUser.location}
              </p>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleViewProfile}>
                <Eye className="h-4 w-4 mr-2" />
                View Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleUpdateStatus('contacted')}>
                <MessageCircle className="h-4 w-4 mr-2" />
                Mark as Contacted
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleUpdateStatus('inactive')}>
                <EyeOff className="h-4 w-4 mr-2" />
                Mark as Inactive
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Match Quality and Score */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge className={cn('text-xs', qualityColorClass)}>
              {match.matchQuality} match
            </Badge>
            <Badge className={cn('text-xs', statusColorClass)}>
              {match.status}
            </Badge>
          </div>
          
          {match.aiMatchScore && (
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">{match.aiMatchScore}%</span>
            </div>
          )}
        </div>
        
        {/* Match Score Progress */}
        {match.aiMatchScore && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Compatibility Score</span>
              <span>{match.aiMatchScore}%</span>
            </div>
            <Progress value={match.aiMatchScore} className="h-2" />
          </div>
        )}
        
        {/* User Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <GraduationCap className="h-4 w-4" />
            <span>{otherUser.education}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="h-4 w-4" />
            <span>{otherUser.occupation}</span>
          </div>
        </div>
        
        {/* Common Interests */}
        {match.commonInterests && match.commonInterests.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">Common Interests</p>
            <div className="flex flex-wrap gap-1">
              {match.commonInterests.slice(0, 3).map((interest, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {interest}
                </Badge>
              ))}
              {match.commonInterests.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{match.commonInterests.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}
        
        {/* Contact Information (if shared) */}
        {showContactInfo && match.isContactShared && (
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm font-medium text-green-800 mb-2">Contact Information Shared</p>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-green-700">
                <Mail className="h-3 w-3" />
                <span>sarah.ahmed@email.com</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-green-700">
                <Phone className="h-3 w-3" />
                <span>+91 98765 43210</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Actions */}
        <div className="flex items-center gap-2 pt-2">
          {!match.isContactShared && match.status === 'active' && (
            <Button 
              onClick={handleRequestContact}
              disabled={isLoading}
              className="flex-1"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Request Contact
            </Button>
          )}
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex-1">
                <MessageSquare className="h-4 w-4 mr-2" />
                Send Message
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send Message to {otherUser.name}</DialogTitle>
                <DialogDescription>
                  Start a conversation with your mutual match.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  This feature will be available once contact information is shared.
                </p>
                <Button className="w-full" disabled>
                  Coming Soon
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Match Details */}
        <div className="text-xs text-gray-500 text-center pt-2 border-t">
          Matched {matchedAgo}
          {match.lastInteractionAt && (
            <span> • Last interaction {formatDistanceToNow(new Date(match.lastInteractionAt), { addSuffix: true })}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}