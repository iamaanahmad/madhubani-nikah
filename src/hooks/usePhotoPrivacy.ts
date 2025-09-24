import { useState, useEffect, useCallback } from 'react';
import { 
  PhotoPrivacyService, 
  PhotoPrivacySettings, 
  PhotoViewPermission 
} from '@/lib/services/photo-privacy.service';

export interface UsePhotoPrivacyOptions {
  userId: string;
  autoLoad?: boolean;
}

export interface UsePhotoPrivacyReturn {
  // State
  settings: PhotoPrivacySettings | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  updateSettings: (updates: Partial<PhotoPrivacySettings>) => Promise<void>;
  loadSettings: () => Promise<void>;
  clearError: () => void;
  
  // Utilities
  checkViewPermission: (viewerId: string) => Promise<PhotoViewPermission | null>;
  getPhotoUrl: (viewerId: string, pictureId: string, options?: any) => Promise<any>;
}

export const usePhotoPrivacy = (options: UsePhotoPrivacyOptions): UsePhotoPrivacyReturn => {
  const { userId, autoLoad = true } = options;
  
  const [settings, setSettings] = useState<PhotoPrivacySettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load settings
  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const currentSettings = await PhotoPrivacyService.getPhotoPrivacySettings(userId);
      setSettings(currentSettings);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load privacy settings';
      setError(errorMessage);
      console.error('Failed to load photo privacy settings:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Update settings
  const updateSettings = useCallback(async (updates: Partial<PhotoPrivacySettings>) => {
    try {
      setLoading(true);
      setError(null);
      
      const updatedSettings = await PhotoPrivacyService.updatePhotoPrivacySettings(
        userId,
        updates
      );
      
      setSettings(updatedSettings);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update privacy settings';
      setError(errorMessage);
      console.error('Failed to update photo privacy settings:', err);
      throw err; // Re-throw to allow component to handle
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Check view permission
  const checkViewPermission = useCallback(async (viewerId: string): Promise<PhotoViewPermission | null> => {
    try {
      return await PhotoPrivacyService.checkPhotoViewPermission(viewerId, userId);
    } catch (err) {
      console.error('Failed to check view permission:', err);
      return null;
    }
  }, [userId]);

  // Get photo URL with privacy controls
  const getPhotoUrl = useCallback(async (
    viewerId: string, 
    pictureId: string, 
    options: any = {}
  ) => {
    try {
      return await PhotoPrivacyService.getPhotoUrl(userId, viewerId, pictureId, options);
    } catch (err) {
      console.error('Failed to get photo URL:', err);
      throw err;
    }
  }, [userId]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Auto-load settings on mount
  useEffect(() => {
    if (autoLoad && userId) {
      loadSettings();
    }
  }, [autoLoad, userId, loadSettings]);

  return {
    settings,
    loading,
    error,
    updateSettings,
    loadSettings,
    clearError,
    checkViewPermission,
    getPhotoUrl
  };
};

// Hook for checking if current user can view a photo
export interface UsePhotoViewPermissionOptions {
  profileOwnerId: string;
  viewerId: string;
  autoCheck?: boolean;
}

export interface UsePhotoViewPermissionReturn {
  permission: PhotoViewPermission | null;
  loading: boolean;
  error: string | null;
  checkPermission: () => Promise<void>;
  canViewOriginal: boolean;
  canViewBlurred: boolean;
  canDownload: boolean;
}

export const usePhotoViewPermission = (
  options: UsePhotoViewPermissionOptions
): UsePhotoViewPermissionReturn => {
  const { profileOwnerId, viewerId, autoCheck = true } = options;
  
  const [permission, setPermission] = useState<PhotoViewPermission | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkPermission = useCallback(async () => {
    if (!profileOwnerId || !viewerId) return;

    try {
      setLoading(true);
      setError(null);
      
      const result = await PhotoPrivacyService.checkPhotoViewPermission(
        viewerId,
        profileOwnerId
      );
      
      setPermission(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check permission';
      setError(errorMessage);
      console.error('Failed to check photo view permission:', err);
    } finally {
      setLoading(false);
    }
  }, [profileOwnerId, viewerId]);

  // Auto-check permission on mount or when IDs change
  useEffect(() => {
    if (autoCheck && profileOwnerId && viewerId) {
      checkPermission();
    }
  }, [autoCheck, profileOwnerId, viewerId, checkPermission]);

  return {
    permission,
    loading,
    error,
    checkPermission,
    canViewOriginal: permission?.canViewOriginal ?? false,
    canViewBlurred: permission?.canViewBlurred ?? false,
    canDownload: permission?.canDownload ?? false
  };
};

// Hook for managing photo URLs with privacy
export interface UsePrivatePhotoUrlOptions {
  profileOwnerId: string;
  viewerId: string;
  pictureId: string;
  width?: number;
  height?: number;
  quality?: number;
  autoLoad?: boolean;
}

export interface UsePrivatePhotoUrlReturn {
  photoData: {
    url: string;
    isBlurred: boolean;
    canDownload: boolean;
    watermarked: boolean;
  } | null;
  loading: boolean;
  error: string | null;
  loadPhoto: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const usePrivatePhotoUrl = (
  options: UsePrivatePhotoUrlOptions
): UsePrivatePhotoUrlReturn => {
  const {
    profileOwnerId,
    viewerId,
    pictureId,
    width = 400,
    height = 400,
    quality = 80,
    autoLoad = true
  } = options;

  const [photoData, setPhotoData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPhoto = useCallback(async () => {
    if (!profileOwnerId || !viewerId || !pictureId) return;

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
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load photo';
      setError(errorMessage);
      console.error('Failed to load private photo URL:', err);
    } finally {
      setLoading(false);
    }
  }, [profileOwnerId, viewerId, pictureId, width, height, quality]);

  const refresh = useCallback(async () => {
    await loadPhoto();
  }, [loadPhoto]);

  // Auto-load photo on mount or when dependencies change
  useEffect(() => {
    if (autoLoad) {
      loadPhoto();
    }
  }, [autoLoad, loadPhoto]);

  return {
    photoData,
    loading,
    error,
    loadPhoto,
    refresh
  };
};