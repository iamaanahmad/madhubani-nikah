#!/usr/bin/env node

/**
 * Create Islamic Content Collection Script
 * Creates the islamic_content collection in Appwrite with proper attributes
 */

require('dotenv').config({ path: '.env.local' });
const sdk = require('node-appwrite');

const client = new sdk.Client();
client
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new sdk.Databases(client);

const DATABASE_ID = 'madhubani_nikah_db';
const COLLECTION_ID = 'islamic_content';

async function createIslamicContentCollection() {
  console.log('🕌 Creating Islamic Content Collection...\n');

  try {
    // Check if collection already exists
    try {
      const existingCollection = await databases.getCollection(DATABASE_ID, COLLECTION_ID);
      console.log('✅ Collection already exists:', existingCollection.name);
      return;
    } catch (error) {
      if (error.code !== 404) {
        throw error;
      }
      // Collection doesn't exist, continue with creation
    }

    // Create the collection
    console.log('📝 Creating collection...');
    const collection = await databases.createCollection(
      DATABASE_ID,
      COLLECTION_ID,
      'Islamic Content',
      [
        // Anyone can read, only authenticated users can write (we'll handle admin checks in code)
        'read("any")',
        'write("users")',
        'create("users")',
        'update("users")',
        'delete("users")'
      ]
    );

    console.log('✅ Collection created successfully');

    // Create attributes
    console.log('\n📋 Creating attributes...');

    // Type attribute (Quran, Hadith, Quote)
    await databases.createEnumAttribute(
      DATABASE_ID,
      COLLECTION_ID,
      'type',
      ['Quran', 'Hadith', 'Quote'],
      true // required
    );
    console.log('✅ Created type attribute');

    // Source attribute
    await databases.createStringAttribute(
      DATABASE_ID,
      COLLECTION_ID,
      'source',
      255,
      true // required
    );
    console.log('✅ Created source attribute');

    // English text attribute
    await databases.createStringAttribute(
      DATABASE_ID,
      COLLECTION_ID,
      'englishText',
      2000,
      true // required
    );
    console.log('✅ Created englishText attribute');

    // Arabic text attribute (optional)
    await databases.createStringAttribute(
      DATABASE_ID,
      COLLECTION_ID,
      'arabicText',
      2000,
      false // optional
    );
    console.log('✅ Created arabicText attribute');

    // Attribution attribute (optional)
    await databases.createStringAttribute(
      DATABASE_ID,
      COLLECTION_ID,
      'attribution',
      255,
      false // optional
    );
    console.log('✅ Created attribution attribute');

    // Display order attribute
    await databases.createIntegerAttribute(
      DATABASE_ID,
      COLLECTION_ID,
      'displayOrder',
      true, // required
      0,    // min
      1000  // max
    );
    console.log('✅ Created displayOrder attribute');

    // Is active attribute
    await databases.createBooleanAttribute(
      DATABASE_ID,
      COLLECTION_ID,
      'isActive',
      true // required
    );
    console.log('✅ Created isActive attribute');

    // Category attribute (optional)
    await databases.createStringAttribute(
      DATABASE_ID,
      COLLECTION_ID,
      'category',
      100,
      false // optional
    );
    console.log('✅ Created category attribute');

    // Tags attribute (optional array)
    await databases.createStringAttribute(
      DATABASE_ID,
      COLLECTION_ID,
      'tags',
      50,
      false, // optional
      undefined, // default
      true // array
    );
    console.log('✅ Created tags attribute');

    // Created at attribute
    await databases.createDatetimeAttribute(
      DATABASE_ID,
      COLLECTION_ID,
      'createdAt',
      true // required
    );
    console.log('✅ Created createdAt attribute');

    // Updated at attribute
    await databases.createDatetimeAttribute(
      DATABASE_ID,
      COLLECTION_ID,
      'updatedAt',
      true // required
    );
    console.log('✅ Created updatedAt attribute');

    // Create indexes for better performance
    console.log('\n🔍 Creating indexes...');

    // Index for active content
    await databases.createIndex(
      DATABASE_ID,
      COLLECTION_ID,
      'idx_active',
      'key',
      ['isActive']
    );
    console.log('✅ Created isActive index');

    // Index for display order
    await databases.createIndex(
      DATABASE_ID,
      COLLECTION_ID,
      'idx_display_order',
      'key',
      ['displayOrder']
    );
    console.log('✅ Created displayOrder index');

    // Index for type
    await databases.createIndex(
      DATABASE_ID,
      COLLECTION_ID,
      'idx_type',
      'key',
      ['type']
    );
    console.log('✅ Created type index');

    console.log('\n🎉 Islamic Content collection created successfully!');
    console.log('📝 You can now run: node scripts/seed-islamic-content.js seed');

  } catch (error) {
    console.error('\n❌ Failed to create collection:', error.message);
    if (error.response) {
      console.error('Response:', error.response);
    }
    process.exit(1);
  }
}

createIslamicContentCollection();