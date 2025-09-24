/**
 * Production Configuration
 * Security and performance settings for production deployment
 */

export const PRODUCTION_CONFIG = {
  // Security Settings
  security: {
    enableSecurityHeaders: process.env.ENABLE_SECURITY_HEADERS === 'true',
    enableCSP: process.env.CONTENT_SECURITY_POLICY_ENABLED === 'true',
    enableHSTS: true,
    enableXFrameOptions: true,
    enableXContentTypeOptions: true,
    enableReferrerPolicy: true,
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
  },

  // Rate Limiting
  rateLimiting: {
    enabled: process.env.RATE_LIMIT_ENABLED === 'true',
    requestsPerMinute: parseInt(process.env.RATE_LIMIT_REQUESTS_PER_MINUTE || '60'),
    requestsPerHour: parseInt(process.env.RATE_LIMIT_REQUESTS_PER_HOUR || '1000'),
    burstLimit: 10,
    windowMs: 60 * 1000, // 1 minute
  },

  // Performance Settings
  performance: {
    enableCompression: process.env.ENABLE_COMPRESSION === 'true',
    enableCaching: process.env.ENABLE_CACHING === 'true',
    cacheMaxAge: 86400, // 24 hours
    staticAssetsCacheMaxAge: 31536000, // 1 year
    enableImageOptimization: true,
    enableLazyLoading: true,
    enableServiceWorker: true,
  },

  // Monitoring
  monitoring: {
    enablePerformanceMonitoring: process.env.ENABLE_PERFORMANCE_MONITORING === 'true',
    enableErrorTracking: process.env.ENABLE_ERROR_TRACKING === 'true',
    logLevel: process.env.LOG_LEVEL || 'error',
    enableAnalytics: process.env.ENABLE_ANALYTICS === 'true',
    sentryDsn: process.env.SENTRY_DSN,
    googleAnalyticsId: process.env.GOOGLE_ANALYTICS_ID,
  },

  // Database
  database: {
    connectionPoolSize: 20,
    queryTimeout: 30000, // 30 seconds
    enableQueryLogging: false,
    enableSlowQueryLogging: true,
    slowQueryThreshold: 1000, // 1 second
  },

  // File Storage
  storage: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedDocumentTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    enableVirusScanning: true,
    enableImageCompression: true,
    compressionQuality: 80,
  },

  // Email Configuration
  email: {
    provider: 'smtp',
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    from: process.env.FROM_EMAIL || 'noreply@madhubaninikah.com',
    rateLimitPerHour: 100,
  },

  // SMS Configuration
  sms: {
    provider: process.env.SMS_PROVIDER || 'twilio',
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      phoneNumber: process.env.TWILIO_PHONE_NUMBER,
    },
    rateLimitPerHour: 50,
    otpExpiryMinutes: 10,
  },

  // Feature Flags
  features: {
    enableRealTimeFeatures: process.env.ENABLE_REAL_TIME_FEATURES === 'true',
    enableAIMatching: process.env.ENABLE_AI_MATCHING === 'true',
    enablePhotoVerification: process.env.ENABLE_PHOTO_VERIFICATION === 'true',
    enableAdminDashboard: process.env.ENABLE_ADMIN_DASHBOARD === 'true',
    enablePWA: true,
    enableOfflineMode: true,
  },

  // Backup Configuration
  backup: {
    enabled: process.env.ENABLE_AUTOMATED_BACKUPS === 'true',
    frequency: process.env.BACKUP_FREQUENCY || 'daily',
    retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30'),
    includeUserData: true,
    includeFiles: true,
    encryptBackups: true,
  },

  // CDN Configuration
  cdn: {
    enabled: !!process.env.CDN_URL,
    baseUrl: process.env.CDN_URL,
    enableImageCDN: true,
    enableStaticAssetCDN: true,
  },

  // API Configuration
  api: {
    timeout: 30000, // 30 seconds
    retryAttempts: 3,
    retryDelay: 1000, // 1 second
    enableRequestLogging: false,
    enableResponseCompression: true,
  },
} as const;

// Environment validation
export function validateProductionConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Required environment variables
  const requiredVars = [
    'NEXT_PUBLIC_APPWRITE_PROJECT_ID',
    'NEXT_PUBLIC_APPWRITE_ENDPOINT',
    'APPWRITE_API_KEY',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
  ];

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      errors.push(`Missing required environment variable: ${varName}`);
    }
  }

  // Validate URLs
  if (process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT && !process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT.startsWith('https://')) {
    errors.push('NEXT_PUBLIC_APPWRITE_ENDPOINT must use HTTPS in production');
  }

  if (process.env.NEXTAUTH_URL && !process.env.NEXTAUTH_URL.startsWith('https://')) {
    errors.push('NEXTAUTH_URL must use HTTPS in production');
  }

  // Validate security settings
  if (!process.env.NEXTAUTH_SECRET || process.env.NEXTAUTH_SECRET.length < 32) {
    errors.push('NEXTAUTH_SECRET must be at least 32 characters long');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Security headers for production
export const SECURITY_HEADERS = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://fra.cloud.appwrite.io https://www.google-analytics.com",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),
};

export default PRODUCTION_CONFIG;