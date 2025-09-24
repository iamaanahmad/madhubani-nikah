#!/usr/bin/env node

/**
 * Seed Islamic Content Script
 * Populates the database with Islamic quotes and Hadiths
 */

require('dotenv').config({ path: '.env.local' });
const sdk = require('node-appwrite');
const { Client, Databases, ID } = sdk;

const islamicContent = [
  {
    type: 'Hadith',
    source: 'Mishkat al-Masabih',
    englishText: 'When a person marries, he has fulfilled half of his religion.',
    arabicText: 'إِذَا تَزَوَّجَ الْعَبْدُ فَقَدِ اسْتَكْمَلَ نِصْفَ الدِّينِ',
    attribution: 'Prophet Muhammad (Peace be upon him)',
    displayOrder: 1,
    isActive: true,
    category: 'marriage',
    tags: ['marriage', 'religion', 'completion']
  },
  {
    type: 'Hadith',
    source: 'Al-Bukhari',
    englishText: 'O young people! Those among you who can support a wife should marry, for it helps him lower his gaze and guard his modesty.',
    arabicText: 'يَا مَعْشَرَ الشَّبَابِ مَنِ اسْتَطَاعَ مِنْكُمُ الْبَاءَةَ فَلْيَتَزَوَّجْ فَإِنَّهُ أَغَضُّ لِلْبَصَرِ وَأَحْصَنُ لِلْفَرْجِ',
    attribution: 'Prophet Muhammad (Peace be upon him)',
    displayOrder: 2,
    isActive: true,
    category: 'youth',
    tags: ['youth', 'marriage', 'modesty', 'guidance']
  },
  {
    type: 'Quran',
    source: 'Surah Ar-Rum (30:21)',
    englishText: 'And among His signs is this: that He created for you mates from among yourselves, that you may dwell in tranquility with them, and He has put love and mercy between your hearts.',
    arabicText: 'وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَاجًا لِّتَسْكُنُوا إِلَيْهَا وَجَعَلَ بَيْنَكُم مَّوَدَّةً وَرَحْمَةً',
    attribution: 'Allah (SWT)',
    displayOrder: 3,
    isActive: true,
    category: 'divine_signs',
    tags: ['love', 'mercy', 'tranquility', 'companionship']
  },
  {
    type: 'Quran',
    source: 'Surah An-Nur (24:32)',
    englishText: 'And marry the unmarried among you and the righteous among your male slaves and female slaves.',
    arabicText: 'وَأَنكِحُوا الْأَيَامَىٰ مِنكُمْ وَالصَّالِحِينَ مِنْ عِبَادِكُمْ وَإِمَائِكُمْ',
    attribution: 'Allah (SWT)',
    displayOrder: 4,
    isActive: true,
    category: 'commandment',
    tags: ['marriage', 'righteousness', 'community']
  },
  {
    type: 'Hadith',
    source: 'Ibn Majah',
    englishText: 'Marriage is part of my Sunnah. Whoever does not follow my Sunnah has nothing to do with me.',
    arabicText: 'النِّكَاحُ مِنْ سُنَّتِي فَمَنْ لَمْ يَعْمَلْ بِسُنَّتِي فَلَيْسَ مِنِّي',
    attribution: 'Prophet Muhammad (Peace be upon him)',
    displayOrder: 5,
    isActive: true,
    category: 'sunnah',
    tags: ['sunnah', 'marriage', 'following']
  },
  {
    type: 'Quote',
    source: 'Islamic Teaching',
    englishText: 'Nikah is not just a contract; it is a sacred bond founded on love, respect, and commitment in Islam.',
    attribution: 'Islamic Wisdom',
    displayOrder: 6,
    isActive: true,
    category: 'wisdom',
    tags: ['nikah', 'sacred', 'love', 'respect', 'commitment']
  }
];

class IslamicContentSeeder {
  constructor() {
    this.client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY); // Use API key for server-side operations
    
    this.databases = new Databases(this.client);
  }

  async seedContent() {
    console.log('🌱 Starting Islamic content seeding...\n');

    try {
      const databaseId = 'madhubani_nikah_db';
      const collectionId = 'islamic_content';

      // Check if collection exists, if not create it
      await this.ensureCollectionExists(databaseId, collectionId);

      let successCount = 0;
      let errorCount = 0;

      for (const content of islamicContent) {
        try {
          const document = await this.databases.createDocument(
            databaseId,
            collectionId,
            ID.unique(),
            {
              type: content.type,
              source: content.source,
              englishText: content.englishText,
              arabicText: content.arabicText || '',
              attribution: content.attribution,
              displayOrder: content.displayOrder,
              isActive: content.isActive,
              category: content.category,
              tags: content.tags,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          );

          console.log(`✅ Added: ${content.type} - ${content.source}`);
          successCount++;
        } catch (error) {
          console.error(`❌ Failed to add ${content.source}:`, error.message);
          errorCount++;
        }
      }

      console.log(`\n📊 Seeding Summary:`);
      console.log(`   ✅ Successfully added: ${successCount} items`);
      console.log(`   ❌ Failed to add: ${errorCount} items`);
      console.log(`   📝 Total items: ${islamicContent.length}`);

      if (successCount > 0) {
        console.log('\n🎉 Islamic content seeding completed successfully!');
      }

    } catch (error) {
      console.error('❌ Seeding failed:', error.message);
      process.exit(1);
    }
  }

  async ensureCollectionExists(databaseId, collectionId) {
    try {
      // Try to list documents to check if collection exists
      await this.databases.listDocuments(databaseId, collectionId, []);
      console.log('✓ Islamic content collection exists');
    } catch (error) {
      if (error.code === 404) {
        console.log('⚠️  Islamic content collection not found. Please create it in Appwrite console with the following attributes:');
        console.log('   - type (string, required)');
        console.log('   - source (string, required)');
        console.log('   - englishText (string, required)');
        console.log('   - arabicText (string, optional)');
        console.log('   - attribution (string, optional)');
        console.log('   - displayOrder (integer, required)');
        console.log('   - isActive (boolean, required)');
        console.log('   - category (string, optional)');
        console.log('   - tags (string array, optional)');
        console.log('   - createdAt (datetime, required)');
        console.log('   - updatedAt (datetime, required)');
        throw new Error('Collection does not exist. Please create it first.');
      } else {
        throw error;
      }
    }
  }

  async clearExistingContent() {
    console.log('🧹 Clearing existing Islamic content...');
    
    try {
      const databaseId = 'madhubani_nikah_db';
      const collectionId = 'islamic_content';

      const response = await this.databases.listDocuments(databaseId, collectionId);
      
      for (const document of response.documents) {
        await this.databases.deleteDocument(databaseId, collectionId, document.$id);
        console.log(`🗑️  Deleted: ${document.source}`);
      }

      console.log(`✅ Cleared ${response.documents.length} existing items\n`);
    } catch (error) {
      console.warn('⚠️  Could not clear existing content:', error.message);
    }
  }
}

// CLI interface
if (require.main === module) {
  const seeder = new IslamicContentSeeder();
  const command = process.argv[2];

  switch (command) {
    case 'seed':
      seeder.seedContent().catch(console.error);
      break;
    case 'clear':
      seeder.clearExistingContent().catch(console.error);
      break;
    case 'reset':
      seeder.clearExistingContent()
        .then(() => seeder.seedContent())
        .catch(console.error);
      break;
    default:
      console.log('Usage:');
      console.log('  node seed-islamic-content.js seed    # Add Islamic content to database');
      console.log('  node seed-islamic-content.js clear   # Clear existing content');
      console.log('  node seed-islamic-content.js reset   # Clear and re-seed content');
      break;
  }
}

module.exports = IslamicContentSeeder;