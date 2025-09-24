export interface RateLimitRule {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (identifier: string, action: string) => string;
}

export interface RateLimitResult {
  allowed: boolean;
  remainingRequests: number;
  resetTime: number;
  retryAfter?: number;
}

export interface RateLimitEntry {
  count: number;
  resetTime: number;
  firstRequest: number;
}

export class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout;

  constructor(private defaultRule: RateLimitRule) {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  checkLimit(
    identifier: string,
    action: string = 'default',
    rule?: RateLimitRule
  ): RateLimitResult {
    const activeRule = rule || this.defaultRule;
    const key = activeRule.keyGenerator 
      ? activeRule.keyGenerator(identifier, action)
      : `${identifier}:${action}`;

    const now = Date.now();
    const entry = this.store.get(key);

    // If no entry exists or window has expired, create new entry
    if (!entry || now >= entry.resetTime) {
      const newEntry: RateLimitEntry = {
        count: 1,
        resetTime: now + activeRule.windowMs,
        firstRequest: now
      };
      this.store.set(key, newEntry);

      return {
        allowed: true,
        remainingRequests: activeRule.maxRequests - 1,
        resetTime: newEntry.resetTime
      };
    }

    // Check if limit exceeded
    if (entry.count >= activeRule.maxRequests) {
      return {
        allowed: false,
        remainingRequests: 0,
        resetTime: entry.resetTime,
        retryAfter: entry.resetTime - now
      };
    }

    // Increment counter
    entry.count++;
    this.store.set(key, entry);

    return {
      allowed: true,
      remainingRequests: activeRule.maxRequests - entry.count,
      resetTime: entry.resetTime
    };
  }

  reset(identifier: string, action: string = 'default'): void {
    const key = `${identifier}:${action}`;
    this.store.delete(key);
  }

  getStats(): {
    totalEntries: number;
    activeWindows: number;
    memoryUsage: number;
  } {
    const now = Date.now();
    let activeWindows = 0;

    for (const entry of this.store.values()) {
      if (now < entry.resetTime) {
        activeWindows++;
      }
    }

    return {
      totalEntries: this.store.size,
      activeWindows,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.store.entries()) {
      if (now >= entry.resetTime) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.store.delete(key));
  }

  private estimateMemoryUsage(): number {
    let size = 0;
    for (const [key, entry] of this.store.entries()) {
      size += key.length * 2; // String characters
      size += 32; // Entry object overhead
    }
    return size;
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store.clear();
  }
}

// Predefined rate limit configurations
export const RateLimitConfigs = {
  // Authentication limits
  LOGIN: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 login attempts per 15 minutes
  },
  REGISTER: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3, // 3 registration attempts per hour
  },
  PASSWORD_RESET: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3, // 3 password reset attempts per hour
  },
  OTP_REQUEST: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 3, // 3 OTP requests per 5 minutes
  },

  // Profile operations
  PROFILE_UPDATE: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5, // 5 profile updates per minute
  },
  PROFILE_SEARCH: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 searches per minute
  },

  // Interest operations
  SEND_INTEREST: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10, // 10 interests per hour
  },
  INTEREST_RESPONSE: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20, // 20 responses per minute
  },

  // File operations
  FILE_UPLOAD: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5, // 5 file uploads per minute
  },

  // General API
  API_GENERAL: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
  },

  // Admin operations
  ADMIN_ACTIONS: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 50, // 50 admin actions per minute
  }
};

// Global rate limiters
export const rateLimiters = {
  auth: new RateLimiter(RateLimitConfigs.LOGIN),
  profile: new RateLimiter(RateLimitConfigs.PROFILE_SEARCH),
  interest: new RateLimiter(RateLimitConfigs.SEND_INTEREST),
  fileUpload: new RateLimiter(RateLimitConfigs.FILE_UPLOAD),
  general: new RateLimiter(RateLimitConfigs.API_GENERAL),
  admin: new RateLimiter(RateLimitConfigs.ADMIN_ACTIONS)
};

// Rate limiting middleware for different operations
export class RateLimitManager {
  static checkAuthLimit(userId: string, action: 'login' | 'register' | 'reset' | 'otp'): RateLimitResult {
    const configs = {
      login: RateLimitConfigs.LOGIN,
      register: RateLimitConfigs.REGISTER,
      reset: RateLimitConfigs.PASSWORD_RESET,
      otp: RateLimitConfigs.OTP_REQUEST
    };

    return rateLimiters.auth.checkLimit(userId, action, configs[action]);
  }

  static checkProfileLimit(userId: string, action: 'update' | 'search'): RateLimitResult {
    const configs = {
      update: RateLimitConfigs.PROFILE_UPDATE,
      search: RateLimitConfigs.PROFILE_SEARCH
    };

    return rateLimiters.profile.checkLimit(userId, action, configs[action]);
  }

  static checkInterestLimit(userId: string, action: 'send' | 'respond'): RateLimitResult {
    const configs = {
      send: RateLimitConfigs.SEND_INTEREST,
      respond: RateLimitConfigs.INTEREST_RESPONSE
    };

    return rateLimiters.interest.checkLimit(userId, action, configs[action]);
  }

  static checkFileUploadLimit(userId: string): RateLimitResult {
    return rateLimiters.fileUpload.checkLimit(userId, 'upload');
  }

  static checkGeneralLimit(userId: string, action: string = 'api'): RateLimitResult {
    return rateLimiters.general.checkLimit(userId, action);
  }

  static checkAdminLimit(adminId: string, action: string): RateLimitResult {
    return rateLimiters.admin.checkLimit(adminId, action);
  }

  // Enhanced rate limiting with IP tracking
  static checkCombinedLimit(
    userId: string, 
    ipAddress: string, 
    action: string
  ): RateLimitResult {
    // Check both user-based and IP-based limits
    const userLimit = rateLimiters.general.checkLimit(userId, action);
    const ipLimit = rateLimiters.general.checkLimit(ipAddress, `ip:${action}`);

    // Return the more restrictive limit
    if (!userLimit.allowed || !ipLimit.allowed) {
      return {
        allowed: false,
        remainingRequests: Math.min(userLimit.remainingRequests, ipLimit.remainingRequests),
        resetTime: Math.max(userLimit.resetTime, ipLimit.resetTime),
        retryAfter: Math.max(userLimit.retryAfter || 0, ipLimit.retryAfter || 0)
      };
    }

    return {
      allowed: true,
      remainingRequests: Math.min(userLimit.remainingRequests, ipLimit.remainingRequests),
      resetTime: Math.max(userLimit.resetTime, ipLimit.resetTime)
    };
  }

  // Get comprehensive rate limit status
  static getRateLimitStatus(userId: string): {
    auth: { [key: string]: RateLimitResult };
    profile: { [key: string]: RateLimitResult };
    interest: { [key: string]: RateLimitResult };
    fileUpload: RateLimitResult;
    general: RateLimitResult;
  } {
    return {
      auth: {
        login: this.checkAuthLimit(userId, 'login'),
        register: this.checkAuthLimit(userId, 'register'),
        reset: this.checkAuthLimit(userId, 'reset'),
        otp: this.checkAuthLimit(userId, 'otp')
      },
      profile: {
        update: this.checkProfileLimit(userId, 'update'),
        search: this.checkProfileLimit(userId, 'search')
      },
      interest: {
        send: this.checkInterestLimit(userId, 'send'),
        respond: this.checkInterestLimit(userId, 'respond')
      },
      fileUpload: this.checkFileUploadLimit(userId),
      general: this.checkGeneralLimit(userId)
    };
  }

  // Reset all limits for a user (admin function)
  static resetUserLimits(userId: string): void {
    Object.values(rateLimiters).forEach(limiter => {
      limiter.reset(userId);
    });
  }

  // Get system-wide rate limiting statistics
  static getSystemStats(): {
    [key: string]: ReturnType<RateLimiter['getStats']>;
  } {
    return {
      auth: rateLimiters.auth.getStats(),
      profile: rateLimiters.profile.getStats(),
      interest: rateLimiters.interest.getStats(),
      fileUpload: rateLimiters.fileUpload.getStats(),
      general: rateLimiters.general.getStats(),
      admin: rateLimiters.admin.getStats()
    };
  }
}