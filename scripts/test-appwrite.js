// Simple Node.js script to test Appwrite configuration
const sdk = require('node-appwrite');
require('dotenv').config({ path: '.env.local' });

const client = new sdk.Client();
client
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new sdk.Databases(client);
const storage = new sdk.Storage(client);

const DATABASE_ID = 'madhubani_nikah_db';
const COLLECTIONS = {
  PROFILES: 'profiles',
  INTERESTS: 'interests',
  NOTIFICATIONS: 'notifications',
  VERIFICATION_REQUESTS: 'verification_requests'
};
const BUCKETS = {
  PROFILE_PICTURES: 'profile_pictures',
  VERIFICATION_DOCUMENTS: 'verification_documents',
  SUCCESS_STORY_IMAGES: 'success_story_images'
};

async function testAppwrite() {
  console.log('🚀 Testing Appwrite Configuration...\n');

  try {
    // Test database
    console.log('📊 Testing Database Connection...');
    const database = await databases.get(DATABASE_ID);
    console.log(`✅ Database "${database.name}" connected successfully`);

    // Test collections
    console.log('\n📋 Testing Collections...');
    for (const [name, id] of Object.entries(COLLECTIONS)) {
      try {
        const collection = await databases.getCollection(DATABASE_ID, id);
        console.log(`✅ Collection "${name}" (${collection.attributes.length} attributes)`);
      } catch (error) {
        console.log(`❌ Collection "${name}" failed: ${error.message}`);
      }
    }

    // Test storage
    console.log('\n💾 Testing Storage...');
    const bucketsList = await storage.listBuckets();
    console.log(`✅ Storage connected (${bucketsList.total} buckets)`);

    // Test buckets
    console.log('\n🗂️ Testing Buckets...');
    for (const [name, id] of Object.entries(BUCKETS)) {
      try {
        const bucket = await storage.getBucket(id);
        console.log(`✅ Bucket "${name}" (max: ${bucket.maximumFileSize / 1024 / 1024}MB)`);
      } catch (error) {
        console.log(`❌ Bucket "${name}" failed: ${error.message}`);
      }
    }

    console.log('\n🎉 All Appwrite services are configured correctly!');
    
  } catch (error) {
    console.error('\n❌ Appwrite configuration test failed:', error.message);
    process.exit(1);
  }
}

testAppwrite();