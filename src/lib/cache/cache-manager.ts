export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
  lastAccessed: number;
}

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of entries
  enableMetrics?: boolean;
}

export interface CacheMetrics {
  totalEntries: number;
  totalHits: number;
  totalMisses: number;
  hitRate: number;
  memoryUsage: number;
  oldestEntry: number;
  newestEntry: number;
}

export class CacheManager<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private defaultTTL: number;
  private maxSize: number;
  private enableMetrics: boolean;
  private totalHits = 0;
  private totalMisses = 0;

  constructor(options: CacheOptions = {}) {
    this.defaultTTL = options.ttl || 5 * 60 * 1000; // 5 minutes default
    this.maxSize = options.maxSize || 1000;
    this.enableMetrics = options.enableMetrics ?? true;

    // Cleanup expired entries periodically
    setInterval(() => this.cleanup(), 60 * 1000); // Every minute
  }

  set(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const entryTTL = ttl || this.defaultTTL;

    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      ttl: entryTTL,
      hits: 0,
      lastAccessed: now
    };

    this.cache.set(key, entry);
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      if (this.enableMetrics) this.totalMisses++;
      return null;
    }

    const now = Date.now();
    
    // Check if entry has expired
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      if (this.enableMetrics) this.totalMisses++;
      return null;
    }

    // Update access metrics
    entry.hits++;
    entry.lastAccessed = now;
    
    if (this.enableMetrics) this.totalHits++;
    
    return entry.data;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.totalHits = 0;
    this.totalMisses = 0;
  }

  invalidatePattern(pattern: RegExp): number {
    let deletedCount = 0;
    
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
        deletedCount++;
      }
    }
    
    return deletedCount;
  }

  getMetrics(): CacheMetrics {
    const entries = Array.from(this.cache.values());
    const totalRequests = this.totalHits + this.totalMisses;
    
    return {
      totalEntries: this.cache.size,
      totalHits: this.totalHits,
      totalMisses: this.totalMisses,
      hitRate: totalRequests > 0 ? this.totalHits / totalRequests : 0,
      memoryUsage: this.estimateMemoryUsage(),
      oldestEntry: entries.length > 0 ? Math.min(...entries.map(e => e.timestamp)) : 0,
      newestEntry: entries.length > 0 ? Math.max(...entries.map(e => e.timestamp)) : 0
    };
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  private estimateMemoryUsage(): number {
    // Rough estimation of memory usage in bytes
    let size = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      size += key.length * 2; // String characters are 2 bytes each
      size += JSON.stringify(entry.data).length * 2;
      size += 64; // Overhead for entry metadata
    }
    
    return size;
  }
}

// Specialized cache managers for different data types
export class ProfileCacheManager extends CacheManager<any> {
  constructor() {
    super({
      ttl: 10 * 60 * 1000, // 10 minutes for profiles
      maxSize: 500,
      enableMetrics: true
    });
  }

  cacheProfile(userId: string, profile: any): void {
    this.set(`profile:${userId}`, profile);
  }

  getProfile(userId: string): any | null {
    return this.get(`profile:${userId}`);
  }

  invalidateUserProfile(userId: string): void {
    this.delete(`profile:${userId}`);
    // Also invalidate related search results
    this.invalidatePattern(new RegExp(`search:.*`));
  }

  cacheSearchResults(searchKey: string, results: any): void {
    this.set(`search:${searchKey}`, results, 5 * 60 * 1000); // 5 minutes for search results
  }

  getSearchResults(searchKey: string): any | null {
    return this.get(`search:${searchKey}`);
  }
}

export class InterestCacheManager extends CacheManager<any> {
  constructor() {
    super({
      ttl: 2 * 60 * 1000, // 2 minutes for interests (more dynamic)
      maxSize: 1000,
      enableMetrics: true
    });
  }

  cacheSentInterests(userId: string, interests: any[]): void {
    this.set(`interests:sent:${userId}`, interests);
  }

  getSentInterests(userId: string): any[] | null {
    return this.get(`interests:sent:${userId}`);
  }

  cacheReceivedInterests(userId: string, interests: any[]): void {
    this.set(`interests:received:${userId}`, interests);
  }

  getReceivedInterests(userId: string): any[] | null {
    return this.get(`interests:received:${userId}`);
  }

  invalidateUserInterests(userId: string): void {
    this.delete(`interests:sent:${userId}`);
    this.delete(`interests:received:${userId}`);
  }

  invalidateInterestPair(senderId: string, receiverId: string): void {
    this.invalidateUserInterests(senderId);
    this.invalidateUserInterests(receiverId);
  }
}

export class NotificationCacheManager extends CacheManager<any> {
  constructor() {
    super({
      ttl: 1 * 60 * 1000, // 1 minute for notifications (very dynamic)
      maxSize: 2000,
      enableMetrics: true
    });
  }

  cacheNotifications(userId: string, notifications: any[]): void {
    this.set(`notifications:${userId}`, notifications);
  }

  getNotifications(userId: string): any[] | null {
    return this.get(`notifications:${userId}`);
  }

  cacheUnreadCount(userId: string, count: number): void {
    this.set(`unread:${userId}`, count, 30 * 1000); // 30 seconds for unread count
  }

  getUnreadCount(userId: string): number | null {
    return this.get(`unread:${userId}`);
  }

  invalidateUserNotifications(userId: string): void {
    this.delete(`notifications:${userId}`);
    this.delete(`unread:${userId}`);
  }
}

// Global cache instances
export const profileCache = new ProfileCacheManager();
export const interestCache = new InterestCacheManager();
export const notificationCache = new NotificationCacheManager();

// Cache warming utilities
export class CacheWarmer {
  static async warmProfileCache(userIds: string[], profileService: any): Promise<void> {
    const promises = userIds.map(async (userId) => {
      try {
        if (!profileCache.has(`profile:${userId}`)) {
          const profile = await profileService.getProfile(userId);
          if (profile) {
            profileCache.cacheProfile(userId, profile);
          }
        }
      } catch (error) {
        console.warn(`Failed to warm cache for profile ${userId}:`, error);
      }
    });

    await Promise.allSettled(promises);
  }

  static async warmSearchCache(
    commonSearches: Array<{ key: string; filters: any }>,
    searchService: any
  ): Promise<void> {
    const promises = commonSearches.map(async ({ key, filters }) => {
      try {
        if (!profileCache.has(`search:${key}`)) {
          const results = await searchService.searchProfiles(filters);
          if (results) {
            profileCache.cacheSearchResults(key, results);
          }
        }
      } catch (error) {
        console.warn(`Failed to warm search cache for ${key}:`, error);
      }
    });

    await Promise.allSettled(promises);
  }
}

// Cache monitoring and reporting
export class CacheMonitor {
  static getAllMetrics(): {
    profiles: CacheMetrics;
    interests: CacheMetrics;
    notifications: CacheMetrics;
    totalMemoryUsage: number;
    overallHitRate: number;
  } {
    const profileMetrics = profileCache.getMetrics();
    const interestMetrics = interestCache.getMetrics();
    const notificationMetrics = notificationCache.getMetrics();

    const totalHits = profileMetrics.totalHits + interestMetrics.totalHits + notificationMetrics.totalHits;
    const totalMisses = profileMetrics.totalMisses + interestMetrics.totalMisses + notificationMetrics.totalMisses;
    const totalRequests = totalHits + totalMisses;

    return {
      profiles: profileMetrics,
      interests: interestMetrics,
      notifications: notificationMetrics,
      totalMemoryUsage: profileMetrics.memoryUsage + interestMetrics.memoryUsage + notificationMetrics.memoryUsage,
      overallHitRate: totalRequests > 0 ? totalHits / totalRequests : 0
    };
  }

  static generateReport(): string {
    const metrics = this.getAllMetrics();
    
    return `
Cache Performance Report
========================
Overall Hit Rate: ${(metrics.overallHitRate * 100).toFixed(2)}%
Total Memory Usage: ${(metrics.totalMemoryUsage / 1024 / 1024).toFixed(2)} MB

Profile Cache:
- Entries: ${metrics.profiles.totalEntries}
- Hit Rate: ${(metrics.profiles.hitRate * 100).toFixed(2)}%
- Memory: ${(metrics.profiles.memoryUsage / 1024).toFixed(2)} KB

Interest Cache:
- Entries: ${metrics.interests.totalEntries}
- Hit Rate: ${(metrics.interests.hitRate * 100).toFixed(2)}%
- Memory: ${(metrics.interests.memoryUsage / 1024).toFixed(2)} KB

Notification Cache:
- Entries: ${metrics.notifications.totalEntries}
- Hit Rate: ${(metrics.notifications.hitRate * 100).toFixed(2)}%
- Memory: ${(metrics.notifications.memoryUsage / 1024).toFixed(2)} KB
    `.trim();
  }
}