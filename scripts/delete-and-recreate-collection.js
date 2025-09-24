#!/usr/bin/env node

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

async function deleteAndRecreateCollection() {
  console.log('🗑️ Deleting existing collection...');
  
  try {
    await databases.deleteCollection(DATABASE_ID, COLLECTION_ID);
    console.log('✅ Collection deleted');
  } catch (error) {
    console.log('⚠️ Collection might not exist:', error.message);
  }

  // Wait a moment for deletion to complete
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log('\n🕌 Creating Islamic Content Collection...');

  try {
    // Create the collection
    console.log('📝 Creating collection...');
    const collection = await databases.createCollection(
      DATABASE_ID,
      COLLECTION_ID,
      'Islamic Content',
      [
        'read("any")',
        'write("users")',
        'create("users")',
        'update("users")',
        'delete("users")'
      ]
    );

    console.log('✅ Collection created successfully');

    // Wait for collection to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Create attributes one by one with delays
    console.log('\n📋 Creating attributes...');

    await databases.createEnumAttribute(DATABASE_ID, COLLECTION_ID, 'type', ['Quran', 'Hadith', 'Quote'], true);
    console.log('✅ Created type attribute');
    await new Promise(resolve => setTimeout(resolve, 500));

    await databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, 'source', 255, true);
    console.log('✅ Created source attribute');
    await new Promise(resolve => setTimeout(resolve, 500));

    await databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, 'englishText', 2000, true);
    console.log('✅ Created englishText attribute');
    await new Promise(resolve => setTimeout(resolve, 500));

    await databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, 'arabicText', 2000, false);
    console.log('✅ Created arabicText attribute');
    await new Promise(resolve => setTimeout(resolve, 500));

    await databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, 'attribution', 255, false);
    console.log('✅ Created attribution attribute');
    await new Promise(resolve => setTimeout(resolve, 500));

    await databases.createIntegerAttribute(DATABASE_ID, COLLECTION_ID, 'displayOrder', true, 0, 1000);
    console.log('✅ Created displayOrder attribute');
    await new Promise(resolve => setTimeout(resolve, 500));

    await databases.createBooleanAttribute(DATABASE_ID, COLLECTION_ID, 'isActive', true);
    console.log('✅ Created isActive attribute');
    await new Promise(resolve => setTimeout(resolve, 500));

    await databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, 'category', 100, false);
    console.log('✅ Created category attribute');
    await new Promise(resolve => setTimeout(resolve, 500));

    await databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, 'tags', 50, false, undefined, true);
    console.log('✅ Created tags attribute');
    await new Promise(resolve => setTimeout(resolve, 500));

    await databases.createDatetimeAttribute(DATABASE_ID, COLLECTION_ID, 'createdAt', true);
    console.log('✅ Created createdAt attribute');
    await new Promise(resolve => setTimeout(resolve, 500));

    await databases.createDatetimeAttribute(DATABASE_ID, COLLECTION_ID, 'updatedAt', true);
    console.log('✅ Created updatedAt attribute');

    console.log('\n🎉 Islamic Content collection recreated successfully!');
    console.log('📝 You can now run: node scripts/seed-islamic-content.js seed');

  } catch (error) {
    console.error('\n❌ Failed to recreate collection:', error.message);
    process.exit(1);
  }
}

deleteAndRecreateCollection();