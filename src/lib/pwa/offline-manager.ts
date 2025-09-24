'use client';

export interface OfflineAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'profile' | 'interest' | 'notification' | 'message';
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

export interface CachedData {
  key: string;
  data: any;
  timestamp: number;
  ttl: number;
  version: number;
}

export interface OfflineStatus {
  isOnline: boolean;
  lastOnline: number;
  pendingActions: number;
  syncInProgress: boolean;
}

export class OfflineManager {
  private db: IDBDatabase | null = null;
  private isOnline = navigator.onLine;
  private syncInProgress = false;
  private listeners: Array<(status: OfflineStatus) => void> = [];
  private syncQueue: OfflineAction[] = [];

  constructor() {
    this.initializeDB();
    this.setupEventListeners();
    this.startPeriodicSync();
  }

  private async initializeDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('MadhubaniNikahOffline', 2);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Actions store for offline operations
        if (!db.objectStoreNames.contains('actions')) {
          const actionsStore = db.createObjectStore('actions', { keyPath: 'id' });
          actionsStore.createIndex('timestamp', 'timestamp');
          actionsStore.createIndex('entity', 'entity');
          actionsStore.createIndex('type', 'type');
        }

        // Cache store for offline data
        if (!db.objectStoreNames.contains('cache')) {
          const cacheStore = db.createObjectStore('cache', { keyPath: 'key' });
          cacheStore.createIndex('timestamp', 'timestamp');
          cacheStore.createIndex('entity', 'entity');
        }

        // User preferences store
        if (!db.objectStoreNames.contains('preferences')) {
          const prefsStore = db.createObjectStore('preferences', { keyPath: 'key' });
        }
      };
    });
  }

  private setupEventListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyListeners();
      this.syncPendingActions();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyListeners();
    });

    // Listen for service worker messages
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'SYNC_SUCCESS') {
          this.handleSyncSuccess(event.data.action);
        }
      });
    }
  }

  private startPeriodicSync(): void {
    // Attempt to sync every 30 seconds when online
    setInterval(() => {
      if (this.isOnline && !this.syncInProgress) {
        this.syncPendingActions();
      }
    }, 30000);
  }

  // Cache management
  async cacheData(key: string, data: any, ttl: number = 3600000): Promise<void> {
    if (!this.db) await this.initializeDB();

    const cachedData: CachedData = {
      key,
      data,
      timestamp: Date.now(),
      ttl,
      version: 1
    };

    const transaction = this.db!.transaction(['cache'], 'readwrite');
    const store = transaction.objectStore('cache');
    await store.put(cachedData);
  }

  async getCachedData(key: string): Promise<any | null> {
    if (!this.db) await this.initializeDB();

    const transaction = this.db!.transaction(['cache'], 'readonly');
    const store = transaction.objectStore('cache');
    const result = await store.get(key);

    if (!result) return null;

    // Check if data has expired
    if (Date.now() - result.timestamp > result.ttl) {
      await this.removeCachedData(key);
      return null;
    }

    return result.data;
  }

  async removeCachedData(key: string): Promise<void> {
    if (!this.db) await this.initializeDB();

    const transaction = this.db!.transaction(['cache'], 'readwrite');
    const store = transaction.objectStore('cache');
    await store.delete(key);
  }

  async clearExpiredCache(): Promise<void> {
    if (!this.db) await this.initializeDB();

    const transaction = this.db!.transaction(['cache'], 'readwrite');
    const store = transaction.objectStore('cache');
    const index = store.index('timestamp');
    const cursor = await index.openCursor();

    const now = Date.now();
    const keysToDelete: string[] = [];

    cursor?.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        const data = cursor.value as CachedData;
        if (now - data.timestamp > data.ttl) {
          keysToDelete.push(data.key);
        }
        cursor.continue();
      } else {
        // Delete expired keys
        keysToDelete.forEach(key => store.delete(key));
      }
    };
  }

  // Offline actions management
  async queueAction(action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>): Promise<string> {
    const fullAction: OfflineAction = {
      ...action,
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0
    };

    if (!this.db) await this.initializeDB();

    const transaction = this.db!.transaction(['actions'], 'readwrite');
    const store = transaction.objectStore('actions');
    await store.add(fullAction);

    this.syncQueue.push(fullAction);
    this.notifyListeners();

    // Try to sync immediately if online
    if (this.isOnline) {
      setTimeout(() => this.syncPendingActions(), 100);
    }

    return fullAction.id;
  }

  async getPendingActions(): Promise<OfflineAction[]> {
    if (!this.db) await this.initializeDB();

    const transaction = this.db!.transaction(['actions'], 'readonly');
    const store = transaction.objectStore('actions');
    return await store.getAll();
  }

  async removeAction(actionId: string): Promise<void> {
    if (!this.db) await this.initializeDB();

    const transaction = this.db!.transaction(['actions'], 'readwrite');
    const store = transaction.objectStore('actions');
    await store.delete(actionId);

    this.syncQueue = this.syncQueue.filter(action => action.id !== actionId);
    this.notifyListeners();
  }

  private async syncPendingActions(): Promise<void> {
    if (this.syncInProgress || !this.isOnline) return;

    this.syncInProgress = true;
    this.notifyListeners();

    try {
      const pendingActions = await this.getPendingActions();
      
      for (const action of pendingActions) {
        try {
          await this.executeAction(action);
          await this.removeAction(action.id);
        } catch (error) {
          console.error('Failed to sync action:', error);
          
          // Increment retry count
          action.retryCount++;
          
          if (action.retryCount >= action.maxRetries) {
            // Remove action if max retries exceeded
            await this.removeAction(action.id);
            console.error('Action removed after max retries:', action);
          } else {
            // Update retry count in database
            const transaction = this.db!.transaction(['actions'], 'readwrite');
            const store = transaction.objectStore('actions');
            await store.put(action);
          }
        }
      }
    } finally {
      this.syncInProgress = false;
      this.notifyListeners();
    }
  }

  private async executeAction(action: OfflineAction): Promise<void> {
    // This would integrate with your actual API services
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
    
    let url: string;
    let method: string;
    let body: any;

    switch (action.entity) {
      case 'profile':
        url = `${baseUrl}/api/profiles`;
        method = action.type === 'create' ? 'POST' : action.type === 'update' ? 'PUT' : 'DELETE';
        body = action.data;
        break;
      
      case 'interest':
        url = `${baseUrl}/api/interests`;
        method = action.type === 'create' ? 'POST' : action.type === 'update' ? 'PUT' : 'DELETE';
        body = action.data;
        break;
      
      default:
        throw new Error(`Unknown entity type: ${action.entity}`);
    }

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        // Add authentication headers here
      },
      body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  private handleSyncSuccess(action: any): void {
    // Handle successful sync from service worker
    this.removeAction(action.id);
  }

  // User preferences
  async setPreference(key: string, value: any): Promise<void> {
    if (!this.db) await this.initializeDB();

    const transaction = this.db!.transaction(['preferences'], 'readwrite');
    const store = transaction.objectStore('preferences');
    await store.put({ key, value });
  }

  async getPreference(key: string): Promise<any | null> {
    if (!this.db) await this.initializeDB();

    const transaction = this.db!.transaction(['preferences'], 'readonly');
    const store = transaction.objectStore('preferences');
    const result = await store.get(key);
    return result ? result.value : null;
  }

  // Status and listeners
  getStatus(): OfflineStatus {
    return {
      isOnline: this.isOnline,
      lastOnline: this.isOnline ? Date.now() : this.getLastOnlineTime(),
      pendingActions: this.syncQueue.length,
      syncInProgress: this.syncInProgress
    };
  }

  private getLastOnlineTime(): number {
    // This would be stored in preferences or localStorage
    return parseInt(localStorage.getItem('lastOnlineTime') || '0');
  }

  addStatusListener(listener: (status: OfflineStatus) => void): () => void {
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
  async getStorageUsage(): Promise<{
    actions: number;
    cache: number;
    total: number;
  }> {
    if (!this.db) await this.initializeDB();

    const actionsCount = await this.getStoreCount('actions');
    const cacheCount = await this.getStoreCount('cache');

    return {
      actions: actionsCount,
      cache: cacheCount,
      total: actionsCount + cacheCount
    };
  }

  private async getStoreCount(storeName: string): Promise<number> {
    const transaction = this.db!.transaction([storeName], 'readonly');
    const store = transaction.objectStore('cache');
    return await store.count();
  }

  async clearAllData(): Promise<void> {
    if (!this.db) await this.initializeDB();

    const transaction = this.db!.transaction(['actions', 'cache', 'preferences'], 'readwrite');
    
    await Promise.all([
      transaction.objectStore('actions').clear(),
      transaction.objectStore('cache').clear(),
      transaction.objectStore('preferences').clear()
    ]);

    this.syncQueue = [];
    this.notifyListeners();
  }
}

// Global offline manager instance
export const offlineManager = new OfflineManager();