#!/usr/bin/env node

/**
 * Appwrite Deployment Script for Madhubani Nikah
 * This script sets up the complete Appwrite backend according to our specification
 */

const { Client, Databases, Storage, Users, Functions } = require('node-appwrite');

// Configuration
const client = new Client();
client
  .setEndpoint('https://fra.cloud.appwrite.io/v1')
  .setProject('68d239c10010fa85607e')
  .setKey('standard_699dc1a53efa4758bd91b7e343c93e409fb58132352ec7d47c270e664dfe089835a6905f79cd1a189c2ad4f35c3821f6323974ebc5c65a1aceecd70ab1073676bd60277556a408f95d0a42aa250cda270ed2804c84242aa6021aba004c37413c5205d752280b1fd3364a76f6e434ac991401174b2043b710e3d751738fd8f115');

const databases = new Databases(client);
const storage = new Storage(client);

const DATABASE_ID = 'madhubani_nikah_db';

// Collection definitions based on our specification
const collections = [
  {
    id: 'profiles',
    name: 'User Profiles',
    permissions: ['read("any")', 'write("users")', 'update("users")', 'delete("users")'],
    attributes: [
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'name', type: 'string', size: 100, required: true },
      { key: 'age', type: 'integer', min: 18, max: 100, required: true },
      { key: 'gender', type: 'enum', elements: ['male', 'female'], required: true },
      { key: 'email', type: 'email', required: true },
      { key: 'district', type: 'string', size: 100, required: true },
      { key: 'block', type: 'string', size: 100, required: true },
      { key: 'village', type: 'string', size: 100, required: false },
      { key: 'education', type: 'string', size: 200, required: true },
      { key: 'occupation', type: 'string', size: 200, required: true },
      { key: 'sect', type: 'enum', elements: ['Sunni', 'Shia', 'Other'], required: true },
      { key: 'maritalStatus', type: 'enum', elements: ['single', 'divorced', 'widowed'], required: true },
      { key: 'isVerified', type: 'boolean', default: false },
    ]
  }
];

// Storage bucket definitions
const buckets = [
  {
    id: 'profile_pictures',
    name: 'Profile Pictures',
    permissions: ['read("any")', 'create("users")', 'update("users")', 'delete("users")'],
    fileSecurity: true,
    enabled: true,
    maximumFileSize: 5242880, // 5MB
    allowedFileExtensions: ['jpg', 'jpeg', 'png', 'webp']
  }
];

async function deployToAppwrite() {
  console.log('🚀 Starting Madhubani Nikah deployment to Appwrite...\n');

  try {
    // 1. Create database
    console.log('📊 Creating database...');
    try {
      await databases.create(DATABASE_ID, 'Madhubani Nikah DB');
      console.log('✅ Database created successfully');
    } catch (error) {
      if (error.code === 409) {
        console.log('ℹ️  Database already exists');
      } else {
        throw error;
      }
    }

    // 2. Create collections
    console.log('\n📝 Creating collections...');
    for (const collection of collections) {
      try {
        console.log(`Creating collection: ${collection.name}...`);
        
        await databases.createCollection(
          DATABASE_ID,
          collection.id,
          collection.name,
          collection.permissions
        );

        // Add attributes
        for (const attr of collection.attributes) {
          console.log(`  Adding attribute: ${attr.key} (${attr.type})`);
          
          if (attr.type === 'string') {
            await databases.createStringAttribute(
              DATABASE_ID,
              collection.id,
              attr.key,
              attr.size || 255,
              attr.required || false,
              attr.default,
              attr.array || false
            );
          } else if (attr.type === 'integer') {
            await databases.createIntegerAttribute(
              DATABASE_ID,
              collection.id,
              attr.key,
              attr.required || false,
              attr.min,
              attr.max,
              attr.default,
              attr.array || false
            );
          } else if (attr.type === 'boolean') {
            await databases.createBooleanAttribute(
              DATABASE_ID,
              collection.id,
              attr.key,
              attr.required || false,
              attr.default,
              attr.array || false
            );
          } else if (attr.type === 'enum') {
            await databases.createEnumAttribute(
              DATABASE_ID,
              collection.id,
              attr.key,
              attr.elements || [],
              attr.required || false,
              attr.default,
              attr.array || false
            );
          } else if (attr.type === 'email') {
            await databases.createEmailAttribute(
              DATABASE_ID,
              collection.id,
              attr.key,
              attr.required || false,
              attr.default,
              attr.array || false
            );
          }

          // Small delay to prevent rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));
        }

        console.log(`✅ Collection ${collection.name} created successfully`);
      } catch (error) {
        if (error.code === 409) {
          console.log(`ℹ️  Collection ${collection.name} already exists`);
        } else {
          console.error(`❌ Failed to create collection ${collection.name}:`, error.message);
        }
      }
    }

    // 3. Create storage buckets
    console.log('\n🗂️  Creating storage buckets...');
    for (const bucket of buckets) {
      try {
        console.log(`Creating bucket: ${bucket.name}...`);
        
        await storage.createBucket(
          bucket.id,
          bucket.name,
          bucket.permissions,
          bucket.fileSecurity,
          bucket.enabled,
          bucket.maximumFileSize,
          bucket.allowedFileExtensions
        );

        console.log(`✅ Bucket ${bucket.name} created successfully`);
      } catch (error) {
        if (error.code === 409) {
          console.log(`ℹ️  Bucket ${bucket.name} already exists`);
        } else {
          console.error(`❌ Failed to create bucket ${bucket.name}:`, error.message);
        }
      }
    }

    console.log('\n🎉 Madhubani Nikah deployment completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`✅ Database: ${DATABASE_ID}`);
    console.log(`✅ Collections: ${collections.length} created/verified`);
    console.log(`✅ Storage Buckets: ${buckets.length} created/verified`);
    console.log('\n🔗 Your Appwrite project is ready for the Madhubani Nikah application!');

  } catch (error) {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  }
}

// Run deployment
deployToAppwrite();