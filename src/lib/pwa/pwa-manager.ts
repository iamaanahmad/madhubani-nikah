'use client';

export interface PWAInstallPrompt {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface PWAStatus {
  isInstallable: boolean;
  isInstalled: boolean;
  isStandalone: boolean;
  supportsPWA: boolean;
  installPromptAvailable: boolean;
}

export interface PWACapabilities {
  serviceWorker: boolean;
  webAppManifest: boolean;
  pushNotifications: boolean;
  backgroundSync: boolean;
  offlineStorage: boolean;
  installPrompt: boolean;
}

export class PWAManager {
  private installPrompt: PWAInstallPrompt | null = null;
  private listeners: Array<(status: PWAStatus) => void> = [];
  private notificationPermission: NotificationPermission = 'default';

  constructor() {
    this.initializePWA();
    this.setupEventListeners();
  }

  private async initializePWA(): Promise<void> {
    // Register service worker
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });
        
        console.log('Service Worker registered:', registration);
        
        // Handle service worker updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker is available
                this.notifyServiceWorkerUpdate();
              }
            });
          }
        });
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }

    // Check notification permission
    if ('Notification' in window) {
      this.notificationPermission = Notification.permission;
    }
  }

  private setupEventListeners(): void {
    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      this.installPrompt = event as any;
      this.notifyListeners();
    });

    // Listen for app installed
    window.addEventListener('appinstalled', () => {
      this.installPrompt = null;
      this.notifyListeners();
    });

    // Listen for visibility changes
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.checkForUpdates();
      }
    });
  }

  // Installation methods
  async showInstallPrompt(): Promise<boolean> {
    if (!this.installPrompt) {
      throw new Error('Install prompt not available');
    }

    try {
      await this.installPrompt.prompt();
      const choice = await this.installPrompt.userChoice;
      
      if (choice.outcome === 'accepted') {
        this.installPrompt = null;
        this.notifyListeners();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Install prompt failed:', error);
      return false;
    }
  }

  canInstall(): boolean {
    return this.installPrompt !== null;
  }

  isInstalled(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true ||
           document.referrer.includes('android-app://');
  }

  isStandalone(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches;
  }

  // Notification methods
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('Notifications not supported');
    }

    if (Notification.permission === 'default') {
      this.notificationPermission = await Notification.requestPermission();
    } else {
      this.notificationPermission = Notification.permission;
    }

    return this.notificationPermission;
  }

  async subscribeToPushNotifications(): Promise<PushSubscription | null> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      throw new Error('Push notifications not supported');
    }

    const registration = await navigator.serviceWorker.ready;
    
    if (!registration.pushManager) {
      throw new Error('Push manager not available');
    }

    try {
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
        )
      });

      return subscription;
    } catch (error) {
      console.error('Push subscription failed:', error);
      return null;
    }
  }

  async unsubscribeFromPushNotifications(): Promise<boolean> {
    if (!('serviceWorker' in navigator)) {
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager?.getSubscription();
    
    if (subscription) {
      return await subscription.unsubscribe();
    }
    
    return true;
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Update methods
  async checkForUpdates(): Promise<boolean> {
    if (!('serviceWorker' in navigator)) {
      return false;
    }

    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.update();
      return registration.waiting !== null;
    }
    
    return false;
  }

  async applyUpdate(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    const registration = await navigator.serviceWorker.getRegistration();
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      
      // Reload the page to activate the new service worker
      window.location.reload();
    }
  }

  private notifyServiceWorkerUpdate(): void {
    // Notify the app that a new version is available
    const event = new CustomEvent('pwa-update-available');
    window.dispatchEvent(event);
  }

  // Capabilities detection
  getCapabilities(): PWACapabilities {
    return {
      serviceWorker: 'serviceWorker' in navigator,
      webAppManifest: 'onbeforeinstallprompt' in window,
      pushNotifications: 'Notification' in window && 'PushManager' in window,
      backgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
      offlineStorage: 'indexedDB' in window,
      installPrompt: this.installPrompt !== null
    };
  }

  getStatus(): PWAStatus {
    return {
      isInstallable: this.canInstall(),
      isInstalled: this.isInstalled(),
      isStandalone: this.isStandalone(),
      supportsPWA: this.supportsPWA(),
      installPromptAvailable: this.installPrompt !== null
    };
  }

  private supportsPWA(): boolean {
    const capabilities = this.getCapabilities();
    return capabilities.serviceWorker && capabilities.webAppManifest;
  }

  // Storage management
  async getStorageEstimate(): Promise<{
    quota: number;
    usage: number;
    usagePercentage: number;
    available: number;
  }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const quota = estimate.quota || 0;
      const usage = estimate.usage || 0;
      
      return {
        quota,
        usage,
        usagePercentage: quota > 0 ? (usage / quota) * 100 : 0,
        available: quota - usage
      };
    }
    
    return {
      quota: 0,
      usage: 0,
      usagePercentage: 0,
      available: 0
    };
  }

  async requestPersistentStorage(): Promise<boolean> {
    if ('storage' in navigator && 'persist' in navigator.storage) {
      return await navigator.storage.persist();
    }
    return false;
  }

  async isPersistentStorageGranted(): Promise<boolean> {
    if ('storage' in navigator && 'persisted' in navigator.storage) {
      return await navigator.storage.persisted();
    }
    return false;
  }

  // App shortcuts (for installed PWAs)
  async updateAppShortcuts(shortcuts: Array<{
    name: string;
    short_name?: string;
    description?: string;
    url: string;
    icons?: Array<{ src: string; sizes: string; type?: string }>;
  }>): Promise<void> {
    if ('navigator' in window && 'setAppBadge' in navigator) {
      // This would update dynamic shortcuts if supported
      console.log('Updating app shortcuts:', shortcuts);
    }
  }

  async setAppBadge(count?: number): Promise<void> {
    if ('navigator' in window && 'setAppBadge' in navigator) {
      try {
        await (navigator as any).setAppBadge(count);
      } catch (error) {
        console.error('Failed to set app badge:', error);
      }
    }
  }

  async clearAppBadge(): Promise<void> {
    if ('navigator' in window && 'clearAppBadge' in navigator) {
      try {
        await (navigator as any).clearAppBadge();
      } catch (error) {
        console.error('Failed to clear app badge:', error);
      }
    }
  }

  // Share API
  async share(data: {
    title?: string;
    text?: string;
    url?: string;
    files?: File[];
  }): Promise<boolean> {
    if ('navigator' in window && 'share' in navigator) {
      try {
        await (navigator as any).share(data);
        return true;
      } catch (error) {
        console.error('Share failed:', error);
        return false;
      }
    }
    
    // Fallback to clipboard or other sharing methods
    if (data.url) {
      try {
        await navigator.clipboard.writeText(data.url);
        return true;
      } catch (error) {
        console.error('Clipboard write failed:', error);
      }
    }
    
    return false;
  }

  canShare(data?: { files?: File[] }): boolean {
    if ('navigator' in window && 'share' in navigator) {
      if (data?.files && 'canShare' in navigator) {
        return (navigator as any).canShare(data);
      }
      return true;
    }
    return false;
  }

  // Event listeners
  addStatusListener(listener: (status: PWAStatus) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    const status = this.getStatus();
    this.listeners.forEach(listener => listener(status));
  }

  // Utility methods
  async generateInstallInstructions(): Promise<{
    platform: string;
    instructions: string[];
  }> {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
      return {
        platform: 'Chrome',
        instructions: [
          'Click the install button in the address bar',
          'Or click the three dots menu → Install Madhubani Nikah',
          'The app will be added to your home screen'
        ]
      };
    } else if (userAgent.includes('firefox')) {
      return {
        platform: 'Firefox',
        instructions: [
          'Click the three lines menu',
          'Select "Install" or "Add to Home Screen"',
          'Follow the prompts to install'
        ]
      };
    } else if (userAgent.includes('safari')) {
      return {
        platform: 'Safari',
        instructions: [
          'Tap the share button',
          'Scroll down and tap "Add to Home Screen"',
          'Tap "Add" to install the app'
        ]
      };
    } else {
      return {
        platform: 'Browser',
        instructions: [
          'Look for an install or "Add to Home Screen" option in your browser menu',
          'Follow your browser\'s installation prompts'
        ]
      };
    }
  }
}

// Global PWA manager instance
export const pwaManager = new PWAManager();