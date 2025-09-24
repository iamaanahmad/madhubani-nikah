import { Client, Account, Databases, Storage, Functions, AppwriteException } from 'appwrite';
import { AppwriteErrorHandler } from './appwrite-errors';

// Environment validation with fallbacks for build time
const validateEnvironment = () => {
  const requiredEnvVars = {
    NEXT_PUBLIC_APPWRITE_ENDPOINT: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1',
    NEXT_PUBLIC_APPWRITE_PROJECT_ID: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '68d239c10010fa85607e',
  };

  // Only validate in browser/runtime, not during build
  if (typeof window !== 'undefined') {
    const missingVars = Object.entries(requiredEnvVars)
      .filter(([_, value]) => !value || value.includes('undefined'))
      .map(([key]) => key);

    if (missingVars.length > 0) {
      console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
  }

  return requiredEnvVars;
};

// Validate environment
const env = validateEnvironment();

// Appwrite client configuration
const client = new Client();

try {
  client
    .setEndpoint(env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);
} catch (error) {
  console.error('Failed to initialize Appwrite client:', error);
  throw error;
}

// Initialize Appwrite services with error handling
export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const functions = new Functions(client);
// Note: Realtime will be implemented in task 4.2

// Service wrapper with error handling
export class AppwriteService {
  static async executeWithErrorHandling<T>(
    operation: () => Promise<T>,
    context?: string
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      const handledError = AppwriteErrorHandler.handleError(error as AppwriteException);
      
      // Log error for debugging
      console.error(`Appwrite operation failed${context ? ` (${context})` : ''}:`, {
        type: handledError.type,
        message: handledError.message,
        code: handledError.code,
        details: handledError.details
      });

      throw handledError;
    }
  }

  static async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    context?: string
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.executeWithErrorHandling(operation, context);
      } catch (error: any) {
        lastError = error;

        if (!AppwriteErrorHandler.isRetryableError(error) || attempt === maxRetries) {
          throw error;
        }

        const delay = AppwriteErrorHandler.getRetryDelay(attempt);
        console.warn(`Retrying operation (attempt ${attempt}/${maxRetries}) after ${delay}ms delay`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }
}

// Health check function
export const checkAppwriteConnection = async (): Promise<boolean> => {
  try {
    await AppwriteService.executeWithErrorHandling(
      () => account.get(),
      'health check'
    );
    return true;
  } catch (error) {
    // If user is not authenticated, that's still a successful connection
    if ((error as any).type === 'auth_error') {
      return true;
    }
    return false;
  }
};

// Export client for direct access when needed
export { client };

// Export environment configuration
export const appwriteConfig = {
  endpoint: env.NEXT_PUBLIC_APPWRITE_ENDPOINT!,
  projectId: env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!,
  databaseId: 'madhubani_nikah_db',
  collections: {
    profiles: 'profiles',
    interests: 'interests',
    notifications: 'notifications',
    verificationRequests: 'verification_requests',
    admins: 'admins',
    successStories: 'success_stories',
    userReports: 'user_reports',
    platformSettings: 'platform_settings',
    userStatus: 'user_status',
    userActivities: 'user_activities'
  },
  buckets: {
    profilePictures: 'profile_pictures',
    verificationDocuments: 'verification_documents',
    successStoryImages: 'success_story_images'
  }
} as const;