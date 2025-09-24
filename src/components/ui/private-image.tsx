import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Shield, Lock, Download } from 'lucide-react';
import { PhotoPrivacyService } from '@/lib/services/photo-privacy.service';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PrivateImageProps {
  profileOwnerId: string;
  viewerId: string;
  pictureId: string;
  className?: string;
  alt?: string;
  width?: number;
  height?: number;
  quality?: number;
  showControls?: boolean;
  showPrivacyBadge?: boolean;
  onClick?: () => void;
}

export const PrivateImage: React.FC<PrivateImageProps> = ({
  profileOwnerId,
  viewerId,
  pictureId,
  className,
  alt = 'Profile picture',
  width = 400,
  height = 400,
  quality = 80,
  showControls = false,
  showPrivacyBadge = true,
  onClick
}) => {
  const [photoData, setPhotoData] = useState<{
    url: string;
    isBlurred: boolean;
    canDownload: boolean;
    watermarked: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPhoto();
  }, [pictureId, profileOwnerId, viewerId, width, height, quality]);

  const loadPhoto = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await PhotoPrivacyService.getPhotoUrl(
        profileOwnerId,
        viewerId,
        pictureId,
        { width, height, quality }
      );
      
      setPhotoData(data);
    } catch (error) {
      setError('Failed to load image');
      console.error('Failed to load private image:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (photoData?.canDownload && photoData.url) {
      const link = document.createElement('a');
      link.href = photoData.url;
      link.download = `profile-${profileOwnerId}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center bg-gray-100', className)}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
      </div>
    );
  }

  if (error || !photoData) {
    return (
      <div className={cn('flex items-center justify-center bg-gray-100 text-gray-500', className)}>
        <Lock className="w-8 h-8" />
      </div>
    );
  }

  return (
    <div className={cn('relative group', className)}>
      <img
        src={photoData.url}
        alt={alt}
        className={cn(
          'w-full h-full object-cover',
          photoData.isBlurred && 'filter blur-sm',
          onClick && 'cursor-pointer'
        )}
        onClick={onClick}
      />

      {/* Privacy badges */}
      {showPrivacyBadge && (
        <div className="absolute top-2 left-2 flex space-x-1">
          {photoData.isBlurred && (
            <Badge variant="secondary" className="text-xs">
              <EyeOff className="w-3 h-3 mr-1" />
              Blurred
            </Badge>
          )}
          {photoData.watermarked && (
            <Badge variant="secondary" className="text-xs">
              <Shield className="w-3 h-3 mr-1" />
              Protected
            </Badge>
          )}
        </div>
      )}

      {/* Controls overlay */}
      {showControls && (
        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
          {photoData.canDownload && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDownload}
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          )}
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="secondary" size="sm">
                <Eye className="w-4 h-4 mr-2" />
                View
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Profile Picture</DialogTitle>
              </DialogHeader>
              <div className="flex justify-center">
                <PrivateImage
                  profileOwnerId={profileOwnerId}
                  viewerId={viewerId}
                  pictureId={pictureId}
                  width={600}
                  height={600}
                  className="max-w-full max-h-96"
                  showControls={false}
                  showPrivacyBadge={true}
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
};

// Gallery component for multiple private images
interface PrivateImageGalleryProps {
  images: Array<{
    id: string;
    profileOwnerId: string;
    alt?: string;
  }>;
  viewerId: string;
  className?: string;
  columns?: number;
}

export const PrivateImageGallery: React.FC<PrivateImageGalleryProps> = ({
  images,
  viewerId,
  className,
  columns = 3
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4'
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div className={cn('grid gap-4', gridCols[columns as keyof typeof gridCols] || 'grid-cols-3')}>
        {images.map((image) => (
          <PrivateImage
            key={image.id}
            profileOwnerId={image.profileOwnerId}
            viewerId={viewerId}
            pictureId={image.id}
            alt={image.alt}
            className="aspect-square rounded-lg overflow-hidden"
            showControls={true}
            onClick={() => setSelectedImage(image.id)}
          />
        ))}
      </div>

      {/* Full-size view dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Image View</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="flex justify-center overflow-auto">
              <PrivateImage
                profileOwnerId={images.find(img => img.id === selectedImage)?.profileOwnerId || ''}
                viewerId={viewerId}
                pictureId={selectedImage}
                width={800}
                height={800}
                className="max-w-full max-h-full"
                showControls={true}
                showPrivacyBadge={true}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Avatar component with privacy controls
interface PrivateAvatarProps {
  profileOwnerId: string;
  viewerId: string;
  pictureId?: string;
  fallbackText?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  showPrivacyIndicator?: boolean;
}

export const PrivateAvatar: React.FC<PrivateAvatarProps> = ({
  profileOwnerId,
  viewerId,
  pictureId,
  fallbackText = '?',
  size = 'md',
  className,
  showPrivacyIndicator = true
}) => {
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
    '2xl': 'w-20 h-20 text-2xl'
  };

  if (!pictureId) {
    return (
      <div className={cn(
        'rounded-full bg-gray-200 flex items-center justify-center font-medium text-gray-600',
        sizeClasses[size],
        className
      )}>
        {fallbackText.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <div className="relative">
      <PrivateImage
        profileOwnerId={profileOwnerId}
        viewerId={viewerId}
        pictureId={pictureId}
        className={cn('rounded-full', sizeClasses[size], className)}
        showPrivacyBadge={false}
      />
      
      {showPrivacyIndicator && (
        <div className="absolute -bottom-1 -right-1">
          <div className="w-4 h-4 bg-green-500 border-2 border-white rounded-full flex items-center justify-center">
            <Shield className="w-2 h-2 text-white" />
          </div>
        </div>
      )}
    </div>
  );
};