/**
 * File utility functions for handling uploads, validation, and processing
 */

// File size formatting
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Get file extension
export const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || '';
};

// Generate safe filename
export const generateSafeFilename = (originalName: string, userId?: string): string => {
  const extension = getFileExtension(originalName);
  const baseName = originalName.replace(/\.[^/.]+$/, '');
  
  // Remove special characters and spaces
  const safeName = baseName
    .replace(/[^a-zA-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .substring(0, 50); // Limit length
  
  const timestamp = Date.now();
  const userPrefix = userId ? `${userId.substring(0, 8)}_` : '';
  
  return `${userPrefix}${safeName}_${timestamp}.${extension}`;
};

// Check if file is an image
export const isImageFile = (file: File): boolean => {
  return file.type.startsWith('image/');
};

// Check if file is a document
export const isDocumentFile = (file: File): boolean => {
  const documentTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg', 
    'image/png'
  ];
  return documentTypes.includes(file.type);
};

// Convert file to base64
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = error => reject(error);
  });
};

// Create image thumbnail
export const createImageThumbnail = (
  file: File, 
  maxWidth: number = 150, 
  maxHeight: number = 150,
  quality: number = 0.8
): Promise<File> => {
  return new Promise((resolve, reject) => {
    if (!isImageFile(file)) {
      reject(new Error('File is not an image'));
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate thumbnail dimensions
      let { width, height } = img;
      const ratio = Math.min(maxWidth / width, maxHeight / height);
      
      width *= ratio;
      height *= ratio;

      canvas.width = width;
      canvas.height = height;

      // Draw thumbnail
      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to create thumbnail'));
            return;
          }

          const thumbnailFile = new File(
            [blob],
            `thumb_${file.name}`,
            { type: file.type, lastModified: Date.now() }
          );

          resolve(thumbnailFile);
        },
        file.type,
        quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

// Validate image dimensions
export const validateImageDimensions = (
  file: File,
  minWidth?: number,
  minHeight?: number,
  maxWidth?: number,
  maxHeight?: number
): Promise<{ isValid: boolean; errors: string[]; dimensions: { width: number; height: number } }> => {
  return new Promise((resolve) => {
    if (!isImageFile(file)) {
      resolve({
        isValid: false,
        errors: ['File is not an image'],
        dimensions: { width: 0, height: 0 }
      });
      return;
    }

    const img = new Image();
    const errors: string[] = [];

    img.onload = () => {
      const { width, height } = img;

      if (minWidth && width < minWidth) {
        errors.push(`Image width must be at least ${minWidth}px (current: ${width}px)`);
      }

      if (minHeight && height < minHeight) {
        errors.push(`Image height must be at least ${minHeight}px (current: ${height}px)`);
      }

      if (maxWidth && width > maxWidth) {
        errors.push(`Image width must not exceed ${maxWidth}px (current: ${width}px)`);
      }

      if (maxHeight && height > maxHeight) {
        errors.push(`Image height must not exceed ${maxHeight}px (current: ${height}px)`);
      }

      resolve({
        isValid: errors.length === 0,
        errors,
        dimensions: { width, height }
      });
    };

    img.onerror = () => {
      resolve({
        isValid: false,
        errors: ['Failed to load image for dimension validation'],
        dimensions: { width: 0, height: 0 }
      });
    };

    img.src = URL.createObjectURL(file);
  });
};

// Extract EXIF data and rotate image if needed
export const normalizeImageOrientation = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    if (!isImageFile(file)) {
      resolve(file);
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // For now, just return the original file
      // In a production app, you'd want to handle EXIF orientation
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to normalize image orientation'));
            return;
          }

          const normalizedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now()
          });

          resolve(normalizedFile);
        },
        file.type,
        0.95
      );
    };

    img.onerror = () => resolve(file); // Return original if processing fails
    img.src = URL.createObjectURL(file);
  });
};

// Create file preview URL
export const createFilePreviewUrl = (file: File): string => {
  return URL.createObjectURL(file);
};

// Cleanup preview URL
export const cleanupPreviewUrl = (url: string): void => {
  URL.revokeObjectURL(url);
};

// Batch file validation
export const validateFiles = (
  files: FileList | File[],
  options: {
    maxFiles?: number;
    allowedTypes?: string[];
    maxSize?: number;
    minSize?: number;
  } = {}
): { isValid: boolean; errors: string[]; validFiles: File[] } => {
  const {
    maxFiles = 10,
    allowedTypes = [],
    maxSize = 10 * 1024 * 1024, // 10MB
    minSize = 0
  } = options;

  const fileArray = Array.from(files);
  const errors: string[] = [];
  const validFiles: File[] = [];

  // Check file count
  if (fileArray.length > maxFiles) {
    errors.push(`Too many files selected. Maximum allowed: ${maxFiles}`);
  }

  // Validate each file
  fileArray.forEach((file, index) => {
    const fileErrors: string[] = [];

    // Check file size
    if (file.size > maxSize) {
      fileErrors.push(`File ${index + 1} exceeds size limit (${formatFileSize(maxSize)})`);
    }

    if (file.size < minSize) {
      fileErrors.push(`File ${index + 1} is too small (minimum: ${formatFileSize(minSize)})`);
    }

    // Check file type
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      fileErrors.push(`File ${index + 1} has unsupported type: ${file.type}`);
    }

    // Check for empty files
    if (file.size === 0) {
      fileErrors.push(`File ${index + 1} is empty`);
    }

    if (fileErrors.length === 0) {
      validFiles.push(file);
    } else {
      errors.push(...fileErrors);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    validFiles
  };
};

// File upload progress tracker
export class FileUploadTracker {
  private uploads = new Map<string, { progress: number; status: 'pending' | 'uploading' | 'completed' | 'error' }>();
  private listeners = new Set<(uploads: Map<string, any>) => void>();

  addUpload(id: string): void {
    this.uploads.set(id, { progress: 0, status: 'pending' });
    this.notifyListeners();
  }

  updateProgress(id: string, progress: number): void {
    const upload = this.uploads.get(id);
    if (upload) {
      upload.progress = progress;
      upload.status = progress === 100 ? 'completed' : 'uploading';
      this.notifyListeners();
    }
  }

  setError(id: string): void {
    const upload = this.uploads.get(id);
    if (upload) {
      upload.status = 'error';
      this.notifyListeners();
    }
  }

  removeUpload(id: string): void {
    this.uploads.delete(id);
    this.notifyListeners();
  }

  subscribe(listener: (uploads: Map<string, any>) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(new Map(this.uploads)));
  }

  getUploads(): Map<string, any> {
    return new Map(this.uploads);
  }
}