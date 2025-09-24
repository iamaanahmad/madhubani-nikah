import React, { useState } from 'react';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
import { useProfilePictureUpload } from '@/hooks/useFileUpload';
import { FileUpload, FilePreview, FileUploadStatus } from '@/components/ui/file-upload';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { StorageService } from '@/lib/services/storage.service';
import { BUCKET_IDS } from '@/lib/appwrite-config';
import { cn } from '@/lib/utils';

interface ProfilePictureUploadProps {
  userId: string;
  currentPictureId?: string;
  currentPictureUrl?: string;
  onUploadComplete?: (fileId: string, previewUrl: string) => void;
  onUploadError?: (error: Error) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showUploadButton?: boolean;
  disabled?: boolean;
}

export const ProfilePictureUpload: React.FC<ProfilePictureUploadProps> = ({
  userId,
  currentPictureId,
  currentPictureUrl,
  onUploadComplete,
  onUploadError,
  className,
  size = 'md',
  showUploadButton = true,
  disabled = false
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isReplacing, setIsReplacing] = useState(false);

  const {
    state,
    selectFiles,
    uploadFiles,
    removeFile,
    clearFiles,
    clearErrors,
    getPreviewUrl,
    fileInputRef
  } = useProfilePictureUpload({
    onUploadComplete: (results) => {
      if (results.length > 0) {
        const result = results[0];
        onUploadComplete?.(result.fileId, result.previewUrl || '');
        setIsDialogOpen(false);
        clearFiles();
      }
    },
    onUploadError: (error) => {
      onUploadError?.(error);
    }
  });

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  };

  const handleUpload = async () => {
    if (state.files.length === 0) return;

    try {
      if (currentPictureId && isReplacing) {
        // Replace existing picture
        const file = state.files[0];
        const result = await StorageService.replaceProfilePicture(
          currentPictureId,
          file,
          userId,
          true
        );
        onUploadComplete?.(result.fileId, result.previewUrl || '');
        setIsDialogOpen(false);
        clearFiles();
      } else {
        // Upload new picture
        await uploadFiles(userId, 'profile');
      }
    } catch (error) {
      onUploadError?.(error instanceof Error ? error : new Error('Upload failed'));
    }
  };

  const handleRemoveCurrentPicture = async () => {
    if (!currentPictureId) return;

    try {
      await StorageService.deleteFile(BUCKET_IDS.PROFILE_PICTURES, currentPictureId);
      onUploadComplete?.('', '');
    } catch (error) {
      onUploadError?.(error instanceof Error ? error : new Error('Failed to remove picture'));
    }
  };

  const previewUrl = state.files.length > 0 
    ? getPreviewUrl(state.files[0])
    : currentPictureUrl;

  return (
    <div className={cn('flex flex-col items-center space-y-4', className)}>
      {/* Current/Preview Picture */}
      <div className={cn(
        'relative rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200',
        sizeClasses[size]
      )}>
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Profile"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Camera className="w-8 h-8 text-gray-400" />
          </div>
        )}

        {/* Upload overlay */}
        {!disabled && (
          <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <button className="p-2 text-white hover:text-gray-200">
                  <Camera className="w-6 h-6" />
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {currentPictureId ? 'Change Profile Picture' : 'Upload Profile Picture'}
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  {/* File selection */}
                  {state.files.length === 0 ? (
                    <FileUpload
                      onFilesSelected={(files) => {
                        selectFiles(files);
                        setIsReplacing(!!currentPictureId);
                      }}
                      accept="image/*"
                      maxSize={5 * 1024 * 1024}
                      dragText="Drag and drop your profile picture here"
                      browseText="or click to select from your device"
                    />
                  ) : (
                    <div className="space-y-3">
                      <FilePreview
                        file={state.files[0]}
                        onRemove={() => removeFile(0)}
                      />
                    </div>
                  )}

                  {/* Upload status */}
                  <FileUploadStatus
                    uploading={state.uploading}
                    errors={state.errors}
                    validationErrors={state.validationErrors}
                    results={state.results}
                  />

                  {/* Action buttons */}
                  <div className="flex justify-between">
                    <div>
                      {currentPictureId && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleRemoveCurrentPicture}
                          disabled={state.uploading}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Remove Current
                        </Button>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsDialogOpen(false);
                          clearFiles();
                          clearErrors();
                        }}
                        disabled={state.uploading}
                      >
                        Cancel
                      </Button>
                      
                      {state.files.length > 0 && (
                        <Button
                          onClick={handleUpload}
                          disabled={state.uploading}
                        >
                          {state.uploading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 mr-2" />
                              {isReplacing ? 'Replace' : 'Upload'}
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {/* Upload button (alternative to overlay) */}
      {showUploadButton && !disabled && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Camera className="w-4 h-4 mr-2" />
              {currentPictureId ? 'Change Picture' : 'Add Picture'}
            </Button>
          </DialogTrigger>
        </Dialog>
      )}
    </div>
  );
};

// Simplified version for inline use
interface ProfilePictureDisplayProps {
  pictureUrl?: string;
  pictureId?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  alt?: string;
  showBorder?: boolean;
  isBlurred?: boolean;
}

export const ProfilePictureDisplay: React.FC<ProfilePictureDisplayProps> = ({
  pictureUrl,
  pictureId,
  size = 'md',
  className,
  alt = 'Profile',
  showBorder = true,
  isBlurred = false
}) => {
  const sizeClasses = {
    xs: 'w-8 h-8',
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32'
  };

  // Generate preview URL if we have pictureId but no pictureUrl
  const displayUrl = pictureUrl || (pictureId 
    ? StorageService.getFilePreview(BUCKET_IDS.PROFILE_PICTURES, pictureId, {
        width: 200,
        height: 200,
        gravity: 'center',
        quality: 80
      })
    : null
  );

  return (
    <div className={cn(
      'relative rounded-full overflow-hidden bg-gray-100',
      showBorder && 'border-2 border-gray-200',
      sizeClasses[size],
      className
    )}>
      {displayUrl ? (
        <img
          src={displayUrl}
          alt={alt}
          className={cn(
            'w-full h-full object-cover',
            isBlurred && 'filter blur-sm'
          )}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Camera className="w-1/2 h-1/2 text-gray-400" />
        </div>
      )}
    </div>
  );
};