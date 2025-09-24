'use client';

import { useState, useEffect, useCallback } from 'react';
import { pwaManager, PWAStatus, PWACapabilities } from '@/lib/pwa/pwa-manager';
import { offlineManager, OfflineStatus } from '@/lib/pwa/offline-manager';

export function usePWA() {
  const [pwaStatus, setPwaStatus] = useState<PWAStatus>(pwaManager.getStatus());
  const [capabilities, setCapabilities] = useState<PWACapabilities>(pwaManager.getCapabilities());
  const [isInstalling, setIsInstalling] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // Listen for PWA status changes
    const unsubscribe = pwaManager.addStatusListener(setPwaStatus);

    // Listen for updates
    const handleUpdateAvailable = () => setUpdateAvailable(true);
    window.addEventListener('pwa-update-available', handleUpdateAvailable);

    // Update capabilities on mount
    setCapabilities(pwaManager.getCapabilities());

    return () => {
      unsubscribe();
      window.removeEventListener('pwa-update-available', handleUpdateAvailable);
    };
  }, []);

  const install = useCallback(async () => {
    if (!pwaStatus.installPromptAvailable) {
      throw new Error('Install prompt not available');
    }

    setIsInstalling(true);
    try {
      const success = await pwaManager.showInstallPrompt();
      return success;
    } finally {
      setIsInstalling(false);
    }
  }, [pwaStatus.installPromptAvailable]);

  const applyUpdate = useCallback(async () => {
    await pwaManager.applyUpdate();
    setUpdateAvailable(false);
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    return await pwaManager.requestNotificationPermission();
  }, []);

  const subscribeToPushNotifications = useCallback(async () => {
    return await pwaManager.subscribeToPushNotifications();
  }, []);

  const share = useCallback(async (data: {
    title?: string;
    text?: string;
    url?: string;
    files?: File[];
  }) => {
    return await pwaManager.share(data);
  }, []);

  const getInstallInstructions = useCallback(async () => {
    return await pwaManager.generateInstallInstructions();
  }, []);

  return {
    // Status
    pwaStatus,
    capabilities,
    isInstalling,
    updateAvailable,
    
    // Actions
    install,
    applyUpdate,
    requestNotificationPermission,
    subscribeToPushNotifications,
    share,
    getInstallInstructions,
    
    // Utilities
    canInstall: pwaStatus.installPromptAvailable,
    isInstalled: pwaStatus.isInstalled,
    isStandalone: pwaStatus.isStandalone,
    canShare: pwaManager.canShare.bind(pwaManager)
  };
}

export function useOffline() {
  const [offlineStatus, setOfflineStatus] = useState<OfflineStatus>(offlineManager.getStatus());
  const [storageUsage, setStorageUsage] = useState<{
    actions: number;
    cache: number;
    total: number;
  }>({ actions: 0, cache: 0, total: 0 });

  useEffect(() => {
    // Listen for offline status changes
    const unsubscribe = offlineManager.addStatusListener(setOfflineStatus);

    // Update storage usage
    const updateStorageUsage = async () => {
      const usage = await offlineManager.getStorageUsage();
      setStorageUsage(usage);
    };

    updateStorageUsage();
    const interval = setInterval(updateStorageUsage, 30000); // Update every 30 seconds

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const cacheData = useCallback(async (key: string, data: any, ttl?: number) => {
    await offlineManager.cacheData(key, data, ttl);
  }, []);

  const getCachedData = useCallback(async (key: string) => {
    return await offlineManager.getCachedData(key);
  }, []);

  const queueAction = useCallback(async (action: {
    type: 'create' | 'update' | 'delete';
    entity: 'profile' | 'interest' | 'notification' | 'message';
    data: any;
    maxRetries?: number;
  }) => {
    return await offlineManager.queueAction({
      ...action,
      maxRetries: action.maxRetries || 3
    });
  }, []);

  const clearCache = useCallback(async () => {
    await offlineManager.clearAllData();
  }, []);

  const setPreference = useCallback(async (key: string, value: any) => {
    await offlineManager.setPreference(key, value);
  }, []);

  const getPreference = useCallback(async (key: string) => {
    return await offlineManager.getPreference(key);
  }, []);

  return {
    // Status
    offlineStatus,
    storageUsage,
    
    // Data management
    cacheData,
    getCachedData,
    queueAction,
    clearCache,
    
    // Preferences
    setPreference,
    getPreference,
    
    // Utilities
    isOnline: offlineStatus.isOnline,
    hasPendingActions: offlineStatus.pendingActions > 0,
    isSyncing: offlineStatus.syncInProgress
  };
}

export function useInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installInstructions, setInstallInstructions] = useState<{
    platform: string;
    instructions: string[];
  } | null>(null);

  useEffect(() => {
    const checkInstallability = () => {
      const status = pwaManager.getStatus();
      setShowPrompt(status.installPromptAvailable && !status.isInstalled);
    };

    checkInstallability();
    const unsubscribe = pwaManager.addStatusListener(checkInstallability);

    // Get install instructions
    pwaManager.generateInstallInstructions().then(setInstallInstructions);

    return unsubscribe;
  }, []);

  const install = useCallback(async () => {
    setIsInstalling(true);
    try {
      const success = await pwaManager.showInstallPrompt();
      if (success) {
        setShowPrompt(false);
      }
      return success;
    } finally {
      setIsInstalling(false);
    }
  }, []);

  const dismiss = useCallback(() => {
    setShowPrompt(false);
    // Store dismissal in localStorage to avoid showing again soon
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  }, []);

  const shouldShow = useCallback(() => {
    if (!showPrompt) return false;
    
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const daysSinceDismissal = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
      return daysSinceDismissal > 7; // Show again after 7 days
    }
    
    return true;
  }, [showPrompt]);

  return {
    showPrompt: shouldShow(),
    isInstalling,
    installInstructions,
    install,
    dismiss
  };
}

export function useServiceWorker() {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(setRegistration);
      
      const handleUpdateAvailable = () => setUpdateAvailable(true);
      window.addEventListener('pwa-update-available', handleUpdateAvailable);
      
      return () => {
        window.removeEventListener('pwa-update-available', handleUpdateAvailable);
      };
    }
  }, []);

  const applyUpdate = useCallback(async () => {
    setIsUpdating(true);
    try {
      await pwaManager.applyUpdate();
      setUpdateAvailable(false);
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const checkForUpdates = useCallback(async () => {
    const hasUpdate = await pwaManager.checkForUpdates();
    setUpdateAvailable(hasUpdate);
    return hasUpdate;
  }, []);

  return {
    registration,
    updateAvailable,
    isUpdating,
    applyUpdate,
    checkForUpdates
  };
}

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }

    // Get current push subscription
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(async (registration) => {
        const currentSubscription = await registration.pushManager?.getSubscription();
        setSubscription(currentSubscription || null);
      });
    }
  }, []);

  const requestPermission = useCallback(async () => {
    const newPermission = await pwaManager.requestNotificationPermission();
    setPermission(newPermission);
    return newPermission;
  }, []);

  const subscribe = useCallback(async () => {
    const newSubscription = await pwaManager.subscribeToPushNotifications();
    setSubscription(newSubscription);
    return newSubscription;
  }, []);

  const unsubscribe = useCallback(async () => {
    const success = await pwaManager.unsubscribeFromPushNotifications();
    if (success) {
      setSubscription(null);
    }
    return success;
  }, []);

  const showNotification = useCallback(async (title: string, options?: NotificationOptions) => {
    if (permission !== 'granted') {
      throw new Error('Notification permission not granted');
    }

    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      return registration.showNotification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        ...options
      });
    } else {
      return new Notification(title, options);
    }
  }, [permission]);

  return {
    permission,
    subscription,
    isSubscribed: subscription !== null,
    canNotify: permission === 'granted',
    requestPermission,
    subscribe,
    unsubscribe,
    showNotification
  };
}