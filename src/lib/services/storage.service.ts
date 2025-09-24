import { storage, AppwriteService } from '../appwrite';
import { 
  BUCKET_IDS, 
  FILE_LIMITS, 
  ALLOWED_EXTENSIONS, 
  ALLOWED_MIME_TYPES 
} from '../appwrite-config';
import { ID, Permission } from 'appwrite';

// File validation result interface
export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

// File upload result interface
export interface FileUploadResult {
  fileId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  bucketId: string;
  previewUrl?: string;
  downloadUrl?: string;
}

// Preview options interface
export interface PreviewOptions {
  width?: number;
  height?: number;
  gravity?: 'center' | 'top-left' | 'top' | 'top-right' | 'left' | 'right' | 'bottom-left' | 'bottom' | 'bottom-right';
  quality?: number;
  borderWidth?: number;
  borderColor?: string;
  borderRadius?: number;
  opacity?: number;
  rotation?: number;
  background?: string;
  output?: 'jpg' | 'jpeg' | 'png' | 'gif' | 'webp';
}

// File compression options
export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

export class StorageService {
  /**
   * Validate file before upload
   */
  static validateFile(file: File, type: 'image' | 'document'): FileValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check file size
    const maxSize = type === 'image' 
      ? FILE_LIMITS.PROFILE_PICTURE_MAX_SIZE 
      : FILE_LIMITS.VERIFICATION_DOCUMENT_MAX_SIZE;
    
    if (file.size > maxSize) {
      errors.push(`File size exceeds ${Math.round(maxSize / (1024 * 1024))}MB limit`);
    }

    if (file.size === 0) {
      errors.push('File is empty');
    }

    // Check MIME type
    const allowedMimeTypes = type === 'image' 
      ? ALLOWED_MIME_TYPES.IMAGES 
      : ALLOWED_MIME_TYPES.DOCUMENTS;
    
    if (!allowedMimeTypes.includes(file.type)) {
      errors.push(`File type ${file.type} is not allowed`);
    }

    // Check file extension
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const allowedExtensions = type === 'image' 
      ? ALLOWED_EXTENSIONS.IMAGES 
      : ALLOWED_EXTENSIONS.DOCUMENTS;
    
    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      errors.push(`File extension .${fileExtension} is not allowed`);
    }

    // File name validation
    if (file.name.length > 255) {
      errors.push('File name is too long (max 255 characters)');
    }

    // Check for potentially malicious file names
    const dangerousPatterns = [/\.\./g, /[<>:"|?*]/g, /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i];
    if (dangerousPatterns.some(pattern => pattern.test(file.name))) {
      errors.push('File name contains invalid characters');
    }

    // Warnings for optimization
    if (type === 'image' && file.size > 2 * 1024 * 1024) {
      warnings.push('Large image file - consider compressing for better performance');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Compress image file before upload
   */
  static async compressImage(file: File, options: CompressionOptions = {}): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        try {
          const { maxWidth = 1200, maxHeight = 1200, quality = 0.8, format = 'jpeg' } = options;

          // Calculate new dimensions
          let { width, height } = img;
          
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width *= ratio;
            height *= ratio;
          }

          canvas.width = width;
          canvas.height = height;

          // Draw and compress
          ctx?.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'));
                return;
              }

              const compressedFile = new File(
                [blob], 
                file.name.replace(/\.[^/.]+$/, `.${format}`),
                { 
                  type: `image/${format}`,
                  lastModified: Date.now()
                }
              );
              
              resolve(compressedFile);
            },
            `image/${format}`,
            quality
          );
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error('Failed to load image for compression'));
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Upload profile picture
   */
  static async uploadProfilePicture(
    file: File, 
    userId: string,
    compress: boolean = true
  ): Promise<FileUploadResult> {
    // Validate file
    const validation = this.validateFile(file, 'image');
    if (!validation.isValid) {
      throw new Error(`File validation failed: ${validation.errors.join(', ')}`);
    }

    let fileToUpload = file;

    // Compress image if requested and it's large
    if (compress && file.size > 1024 * 1024) { // 1MB threshold
      try {
        fileToUpload = await this.compressImage(file, {
          maxWidth: 800,
          maxHeight: 800,
          quality: 0.85,
          format: 'jpeg'
        });
      } catch (error) {
        console.warn('Image compression failed, uploading original:', error);
        // Continue with original file if compression fails
      }
    }

    return AppwriteService.executeWithErrorHandling(async () => {
      const fileId = ID.unique();
      
      const uploadedFile = await storage.createFile(
        BUCKET_IDS.PROFILE_PICTURES,
        fileId,
        fileToUpload,
        [
          Permission.read('any'), // Public read for profile pictures
          Permission.update(`user:${userId}`),
          Permission.delete(`user:${userId}`)
        ]
      );

      return {
        fileId: uploadedFile.$id,
        fileName: uploadedFile.name,
        fileSize: uploadedFile.sizeOriginal,
        mimeType: uploadedFile.mimeType,
        bucketId: uploadedFile.bucketId,
        previewUrl: this.getFilePreview(BUCKET_IDS.PROFILE_PICTURES, uploadedFile.$id, {
          width: 400,
          height: 400,
          gravity: 'center',
          quality: 80
        }),
        downloadUrl: this.getFileDownload(BUCKET_IDS.PROFILE_PICTURES, uploadedFile.$id)
      };
    }, 'upload profile picture');
  }

  /**
   * Upload verification document
   */
  static async uploadVerificationDocument(
    file: File, 
    userId: string
  ): Promise<FileUploadResult> {
    // Validate file
    const validation = this.validateFile(file, 'document');
    if (!validation.isValid) {
      throw new Error(`File validation failed: ${validation.errors.join(', ')}`);
    }

    return AppwriteService.executeWithErrorHandling(async () => {
      const fileId = ID.unique();
      
      const uploadedFile = await storage.createFile(
        BUCKET_IDS.VERIFICATION_DOCUMENTS,
        fileId,
        file,
        [
          Permission.read(`user:${userId}`), // Only user and admin can read
          Permission.read('role:admin'),
          Permission.update(`user:${userId}`),
          Permission.delete(`user:${userId}`)
        ]
      );

      return {
        fileId: uploadedFile.$id,
        fileName: uploadedFile.name,
        fileSize: uploadedFile.sizeOriginal,
        mimeType: uploadedFile.mimeType,
        bucketId: uploadedFile.bucketId,
        downloadUrl: this.getFileDownload(BUCKET_IDS.VERIFICATION_DOCUMENTS, uploadedFile.$id)
      };
    }, 'upload verification document');
  }

  /**
   * Get file preview URL
   */
  static getFilePreview(
    bucketId: string, 
    fileId: string, 
    options: PreviewOptions = {}
  ): string {
    const {
      width = 400,
      height = 400,
      gravity = 'center',
      quality = 80,
      borderWidth,
      borderColor,
      borderRadius,
      opacity,
      rotation,
      background,
      output = 'jpg'
    } = options;

    const params = new URLSearchParams({
      width: width.toString(),
      height: height.toString(),
      gravity,
      quality: quality.toString(),
      output
    });

    if (borderWidth) params.append('borderWidth', borderWidth.toString());
    if (borderColor) params.append('borderColor', borderColor);
    if (borderRadius) params.append('borderRadius', borderRadius.toString());
    if (opacity) params.append('opacity', opacity.toString());
    if (rotation) params.append('rotation', rotation.toString());
    if (background) params.append('background', background);

    return storage.getFilePreview(bucketId, fileId, width, height, gravity, quality, borderWidth, borderColor, borderRadius, opacity, rotation, background, output);
  }

  /**
   * Get file download URL
   */
  static getFileDownload(bucketId: string, fileId: string): string {
    return storage.getFileDownload(bucketId, fileId).href;
  }

  /**
   * Delete file
   */
  static async deleteFile(bucketId: string, fileId: string): Promise<void> {
    return AppwriteService.executeWithErrorHandling(async () => {
      await storage.deleteFile(bucketId, fileId);
    }, 'delete file');
  }

  /**
   * Get file information
   */
  static async getFile(bucketId: string, fileId: string) {
    return AppwriteService.executeWithErrorHandling(async () => {
      return await storage.getFile(bucketId, fileId);
    }, 'get file info');
  }

  /**
   * Replace existing profile picture
   */
  static async replaceProfilePicture(
    oldFileId: string,
    newFile: File,
    userId: string,
    compress: boolean = true
  ): Promise<FileUploadResult> {
    // Upload new file first
    const uploadResult = await this.uploadProfilePicture(newFile, userId, compress);

    // Delete old file if upload was successful
    try {
      await this.deleteFile(BUCKET_IDS.PROFILE_PICTURES, oldFileId);
    } catch (error) {
      console.warn('Failed to delete old profile picture:', error);
      // Don't fail the operation if old file deletion fails
    }

    return uploadResult;
  }

  /**
   * Cleanup orphaned files (files not referenced in database)
   */
  static async cleanupOrphanedFiles(bucketId: string, referencedFileIds: string[]): Promise<number> {
    return AppwriteService.executeWithErrorHandling(async () => {
      const files = await storage.listFiles(bucketId);
      let deletedCount = 0;

      for (const file of files.files) {
        if (!referencedFileIds.includes(file.$id)) {
          try {
            await this.deleteFile(bucketId, file.$id);
            deletedCount++;
          } catch (error) {
            console.warn(`Failed to delete orphaned file ${file.$id}:`, error);
          }
        }
      }

      return deletedCount;
    }, 'cleanup orphaned files');
  }

  /**
   * Get storage usage statistics
   */
  static async getStorageStats(bucketId: string) {
    return AppwriteService.executeWithErrorHandling(async () => {
      const files = await storage.listFiles(bucketId);
      
      const stats = {
        totalFiles: files.total,
        totalSize: files.files.reduce((sum, file) => sum + file.sizeOriginal, 0),
        averageSize: 0,
        fileTypes: {} as Record<string, number>
      };

      stats.averageSize = stats.totalFiles > 0 ? stats.totalSize / stats.totalFiles : 0;

      // Count file types
      files.files.forEach(file => {
        const extension = file.name.split('.').pop()?.toLowerCase() || 'unknown';
        stats.fileTypes[extension] = (stats.fileTypes[extension] || 0) + 1;
      });

      return stats;
    }, 'get storage stats');
  }
}