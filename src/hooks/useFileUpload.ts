import { useState, useCallback, useRef } from 'react';
import { StorageService, FileUploadResult, FileValidationResult } from '@/lib/services/storage.service';
import { validateFiles, FileUploadTracker } from '@/lib/utils/file.utils';

export interface UseFileUploadOptions {
  maxFiles?: number;
  maxSize?: number;
  allowedTypes?: string[];
  autoUpload?: boolean;
  compress?: boolean;
  onUploadComplete?: (results: FileUploadResult[]) => void;
  onUploadError?: (error: Error) => void;
  onValidationError?: (errors: string[]) => void;
}

export interface FileUploadState {
  files: File[];
  uploading: boolean;
  progress: Record<string, number>;
  results: FileUploadResult[];
  errors: string[];
  validationErrors: string[];
}

export interface UseFileUploadReturn {
  // State
  state: FileUploadState;
  
  // Actions
  selectFiles: (files: FileList | File[]) => void;
  uploadFiles: (userId: string, type: 'profile' | 'verification') => Promise<void>;
  removeFile: (index: number) => void;
  clearFiles: () => void;
  clearErrors: () => void;
  
  // Utilities
  validateFile: (file: File, type: 'image' | 'document') => FileValidationResult;
  getPreviewUrl: (file: File) => string;
  
  // File input ref
  fileInputRef: React.RefObject<HTMLInputElement>;
}

export const useFileUpload = (options: UseFileUploadOptions = {}): UseFileUploadReturn => {
  const {
    maxFiles = 1,
    maxSize = 5 * 1024 * 1024, // 5MB
    allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    autoUpload = false,
    compress = true,
    onUploadComplete,
    onUploadError,
    onValidationError
  } = options;

  const [state, setState] = useState<FileUploadState>({
    files: [],
    uploading: false,
    progress: {},
    results: [],
    errors: [],
    validationErrors: []
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadTrackerRef = useRef(new FileUploadTracker());

  // Select files handler
  const selectFiles = useCallback((fileList: FileList | File[]) => {
    const validation = validateFiles(fileList, {
      maxFiles,
      allowedTypes,
      maxSize,
      minSize: 1024 // 1KB minimum
    });

    if (!validation.isValid) {
      setState(prev => ({
        ...prev,
        validationErrors: validation.errors
      }));
      onValidationError?.(validation.errors);
      return;
    }

    setState(prev => ({
      ...prev,
      files: validation.validFiles,
      validationErrors: [],
      errors: [],
      results: []
    }));

    // Auto upload if enabled
    if (autoUpload && validation.validFiles.length > 0) {
      // Note: This would need userId and type to be provided somehow
      console.warn('Auto upload enabled but userId and type not available in selectFiles');
    }
  }, [maxFiles, allowedTypes, maxSize, autoUpload, onValidationError]);

  // Upload files handler
  const uploadFiles = useCallback(async (userId: string, type: 'profile' | 'verification') => {
    if (state.files.length === 0) return;

    setState(prev => ({ ...prev, uploading: true, errors: [], results: [] }));

    const uploadPromises = state.files.map(async (file, index) => {
      const uploadId = `${Date.now()}-${index}`;
      uploadTrackerRef.current.addUpload(uploadId);

      try {
        let result: FileUploadResult;

        if (type === 'profile') {
          result = await StorageService.uploadProfilePicture(file, userId, compress);
        } else {
          result = await StorageService.uploadVerificationDocument(file, userId);
        }

        uploadTrackerRef.current.updateProgress(uploadId, 100);
        uploadTrackerRef.current.removeUpload(uploadId);

        return result;
      } catch (error) {
        uploadTrackerRef.current.setError(uploadId);
        throw error;
      }
    });

    try {
      const results = await Promise.all(uploadPromises);
      
      setState(prev => ({
        ...prev,
        uploading: false,
        results,
        files: [] // Clear files after successful upload
      }));

      onUploadComplete?.(results);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      
      setState(prev => ({
        ...prev,
        uploading: false,
        errors: [errorMessage]
      }));

      onUploadError?.(error instanceof Error ? error : new Error(errorMessage));
    }
  }, [state.files, compress, onUploadComplete, onUploadError]);

  // Remove file handler
  const removeFile = useCallback((index: number) => {
    setState(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index),
      validationErrors: [],
      errors: []
    }));
  }, []);

  // Clear files handler
  const clearFiles = useCallback(() => {
    setState(prev => ({
      ...prev,
      files: [],
      results: [],
      errors: [],
      validationErrors: [],
      progress: {}
    }));

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Clear errors handler
  const clearErrors = useCallback(() => {
    setState(prev => ({
      ...prev,
      errors: [],
      validationErrors: []
    }));
  }, []);

  // Validate single file
  const validateFile = useCallback((file: File, type: 'image' | 'document'): FileValidationResult => {
    return StorageService.validateFile(file, type);
  }, []);

  // Get preview URL for file
  const getPreviewUrl = useCallback((file: File): string => {
    return URL.createObjectURL(file);
  }, []);

  return {
    state,
    selectFiles,
    uploadFiles,
    removeFile,
    clearFiles,
    clearErrors,
    validateFile,
    getPreviewUrl,
    fileInputRef
  };
};

// Specialized hooks for different upload types
export const useProfilePictureUpload = (options: Omit<UseFileUploadOptions, 'allowedTypes'> = {}) => {
  return useFileUpload({
    ...options,
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
    compress: true
  });
};

export const useVerificationDocumentUpload = (options: Omit<UseFileUploadOptions, 'allowedTypes'> = {}) => {
  return useFileUpload({
    ...options,
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'],
    maxFiles: 3,
    maxSize: 10 * 1024 * 1024, // 10MB
    compress: false
  });
};