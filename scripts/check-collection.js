#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const sdk = require('node-appwrite');

const client = new sdk.Client();
client
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new sdk.Databases(client);

async function checkCollection() {
  try {
    const collection = await databases.getCollection('madhubani_nikah_db', 'islamic_content');
    console.log('Collection:', collection.name);
    console.log('Attributes:');
    collection.attributes.forEach(attr => {
      console.log(`- ${attr.key}: ${attr.type} (required: ${attr.required})`);
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkCollection();