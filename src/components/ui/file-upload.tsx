import React, { useCallback, useState } from 'react';
import { Upload, X, Image, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatFileSize } from '@/lib/utils/file.utils';

interface FileUploadProps {
  onFilesSelected: (files: FileList | File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
  dragText?: string;
  browseText?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFilesSelected,
  accept = 'image/*',
  multiple = false,
  maxSize = 5 * 1024 * 1024, // 5MB
  disabled = false,
  className,
  children,
  dragText = 'Drag and drop files here',
  browseText = 'or click to browse'
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      onFilesSelected(files);
    }
  }, [disabled, onFilesSelected]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFilesSelected(files);
    }
  }, [onFilesSelected]);

  return (
    <div
      className={cn(
        'relative border-2 border-dashed rounded-lg p-6 transition-colors',
        isDragOver && !disabled
          ? 'border-primary bg-primary/5'
          : 'border-gray-300 hover:border-gray-400',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileSelect}
        disabled={disabled}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
      />
      
      {children || (
        <div className="text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-sm text-gray-600 mb-2">{dragText}</p>
          <p className="text-xs text-gray-500">{browseText}</p>
          {maxSize && (
            <p className="text-xs text-gray-400 mt-2">
              Max file size: {formatFileSize(maxSize)}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

interface FilePreviewProps {
  file: File;
  onRemove?: () => void;
  showSize?: boolean;
  className?: string;
}

export const FilePreview: React.FC<FilePreviewProps> = ({
  file,
  onRemove,
  showSize = true,
  className
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  React.useEffect(() => {
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  const isImage = file.type.startsWith('image/');

  return (
    <div className={cn('relative group', className)}>
      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
        {/* File icon or preview */}
        <div className="flex-shrink-0">
          {isImage && previewUrl ? (
            <img
              src={previewUrl}
              alt={file.name}
              className="w-12 h-12 object-cover rounded"
            />
          ) : isImage ? (
            <Image className="w-12 h-12 text-gray-400" />
          ) : (
            <FileText className="w-12 h-12 text-gray-400" />
          )}
        </div>

        {/* File info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {file.name}
          </p>
          {showSize && (
            <p className="text-xs text-gray-500">
              {formatFileSize(file.size)}
            </p>
          )}
        </div>

        {/* Remove button */}
        {onRemove && (
          <button
            onClick={onRemove}
            className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 transition-colors"
            type="button"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

interface FileUploadStatusProps {
  uploading: boolean;
  progress?: Record<string, number>;
  errors?: string[];
  validationErrors?: string[];
  results?: any[];
  className?: string;
}

export const FileUploadStatus: React.FC<FileUploadStatusProps> = ({
  uploading,
  progress = {},
  errors = [],
  validationErrors = [],
  results = [],
  className
}) => {
  const hasErrors = errors.length > 0 || validationErrors.length > 0;
  const hasSuccess = results.length > 0 && !uploading && !hasErrors;

  if (!uploading && !hasErrors && !hasSuccess) {
    return null;
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Upload progress */}
      {uploading && (
        <div className="flex items-center space-x-2 text-sm text-blue-600">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span>Uploading files...</span>
        </div>
      )}

      {/* Progress bars */}
      {Object.entries(progress).map(([id, percent]) => (
        <div key={id} className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
      ))}

      {/* Validation errors */}
      {validationErrors.length > 0 && (
        <div className="space-y-1">
          {validationErrors.map((error, index) => (
            <div key={index} className="flex items-center space-x-2 text-sm text-red-600">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          ))}
        </div>
      )}

      {/* Upload errors */}
      {errors.length > 0 && (
        <div className="space-y-1">
          {errors.map((error, index) => (
            <div key={index} className="flex items-center space-x-2 text-sm text-red-600">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          ))}
        </div>
      )}

      {/* Success message */}
      {hasSuccess && (
        <div className="flex items-center space-x-2 text-sm text-green-600">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>
            {results.length === 1 
              ? 'File uploaded successfully' 
              : `${results.length} files uploaded successfully`
            }
          </span>
        </div>
      )}
    </div>
  );
};