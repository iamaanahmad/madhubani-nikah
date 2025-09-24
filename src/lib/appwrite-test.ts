// Test script to verify Appwrite configuration
import { databases, storage } from './appwrite';
import { DATABASE_ID, COLLECTION_IDS, BUCKET_IDS } from './appwrite-config';
import { AppwriteServiceManager } from './services';

export async function testAppwriteConnection(): Promise<{
  success: boolean;
  results: {
    database: boolean;
    collections: Record<string, boolean>;
    storage: boolean;
    buckets: Record<string, boolean>;
  };
  errors: string[];
}> {
  const results = {
    database: false,
    collections: {} as Record<string, boolean>,
    storage: false,
    buckets: {} as Record<string, boolean>
  };
  const errors: string[] = [];

  try {
    // Test database connection
    console.log('Testing database connection...');
    await databases.get(DATABASE_ID);
    results.database = true;
    console.log('✓ Database connection successful');
  } catch (error) {
    results.database = false;
    errors.push(`Database connection failed: ${error}`);
    console.error('✗ Database connection failed:', error);
  }

  // Test collections
  for (const [name, id] of Object.entries(COLLECTION_IDS)) {
    try {
      console.log(`Testing collection: ${name} (${id})`);
      await databases.getCollection(DATABASE_ID, id);
      results.collections[name] = true;
      console.log(`✓ Collection ${name} accessible`);
    } catch (error) {
      results.collections[name] = false;
      errors.push(`Collection ${name} failed: ${error}`);
      console.error(`✗ Collection ${name} failed:`, error);
    }
  }

  try {
    // Test storage connection
    console.log('Testing storage connection...');
    await storage.listBuckets();
    results.storage = true;
    console.log('✓ Storage connection successful');
  } catch (error) {
    results.storage = false;
    errors.push(`Storage connection failed: ${error}`);
    console.error('✗ Storage connection failed:', error);
  }

  // Test buckets
  for (const [name, id] of Object.entries(BUCKET_IDS)) {
    try {
      console.log(`Testing bucket: ${name} (${id})`);
      await storage.getBucket(id);
      results.buckets[name] = true;
      console.log(`✓ Bucket ${name} accessible`);
    } catch (error) {
      results.buckets[name] = false;
      errors.push(`Bucket ${name} failed: ${error}`);
      console.error(`✗ Bucket ${name} failed:`, error);
    }
  }

  const success = results.database && 
                  Object.values(results.collections).every(Boolean) && 
                  results.storage && 
                  Object.values(results.buckets).every(Boolean);

  return { success, results, errors };
}

// Service manager test
export async function testServiceManager(): Promise<boolean> {
  try {
    console.log('Testing service manager initialization...');
    const serviceManager = AppwriteServiceManager.getInstance();
    const initialized = await serviceManager.initialize();
    
    if (initialized) {
      console.log('✓ Service manager initialized successfully');
      
      const health = await serviceManager.healthCheck();
      console.log('Health check results:', health);
      
      return true;
    } else {
      console.error('✗ Service manager initialization failed');
      return false;
    }
  } catch (error) {
    console.error('✗ Service manager test failed:', error);
    return false;
  }
}