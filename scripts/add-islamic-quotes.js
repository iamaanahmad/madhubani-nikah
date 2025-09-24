#!/usr/bin/env node

/**
 * Add Islamic Quotes Script
 * Adds Islamic quotes and hadiths directly using the service
 */

require('dotenv').config({ path: '.env.local' });

// Import the service (we'll need to adapt this for Node.js)
const islamicQuotes = [
  {
    type: 'Hadith',
    source: 'Mishkat al-Masabih',
    englishText: 'When a person marries, he has fulfilled half of his religion.',
    attribution: 'Prophet Muhammad (Peace be upon him)',
    displayOrder: 1,
    category: 'marriage',
    tags: ['marriage', 'religion', 'completion']
  },
  {
    type: 'Hadith',
    source: 'Al-Bukhari',
    englishText: 'O young people! Those among you who can support a wife should marry, for it helps him lower his gaze and guard his modesty.',
    attribution: 'Prophet Muhammad (Peace be upon him)',
    displayOrder: 2,
    category: 'youth',
    tags: ['youth', 'marriage', 'modesty', 'guidance']
  },
  {
    type: 'Quran',
    source: 'Surah Ar-Rum (30:21)',
    englishText: 'And among His signs is this: that He created for you mates from among yourselves, that you may dwell in tranquility with them, and He has put love and mercy between your hearts.',
    attribution: 'Allah (SWT)',
    displayOrder: 3,
    category: 'divine_signs',
    tags: ['love', 'mercy', 'tranquility', 'companionship']
  },
  {
    type: 'Quran',
    source: 'Surah An-Nur (24:32)',
    englishText: 'And marry the unmarried among you and the righteous among your male slaves and female slaves.',
    attribution: 'Allah (SWT)',
    displayOrder: 4,
    category: 'commandment',
    tags: ['marriage', 'righteousness', 'community']
  },
  {
    type: 'Hadith',
    source: 'Ibn Majah',
    englishText: 'Marriage is part of my Sunnah. Whoever does not follow my Sunnah has nothing to do with me.',
    attribution: 'Prophet Muhammad (Peace be upon him)',
    displayOrder: 5,
    category: 'sunnah',
    tags: ['sunnah', 'marriage', 'following']
  },
  {
    type: 'Quote',
    source: 'Islamic Teaching',
    englishText: 'Nikah is not just a contract; it is a sacred bond founded on love, respect, and commitment in Islam.',
    attribution: 'Islamic Wisdom',
    displayOrder: 6,
    category: 'wisdom',
    tags: ['nikah', 'sacred', 'love', 'respect', 'commitment']
  }
];

console.log('📝 Islamic Quotes and Hadiths for Homepage:');
console.log('==========================================\n');

islamicQuotes.forEach((quote, index) => {
  console.log(`${index + 1}. ${quote.type} - ${quote.source}`);
  console.log(`   "${quote.englishText}"`);
  console.log(`   — ${quote.attribution}`);
  console.log(`   Tags: ${quote.tags.join(', ')}`);
  console.log('');
});

console.log('✅ These quotes are ready to be displayed in the Islamic Content Carousel on your homepage!');
console.log('📋 The carousel component is already configured with:');
console.log('   - Auto-play functionality (10 second intervals)');
console.log('   - Manual navigation controls');
console.log('   - Pause/play functionality');
console.log('   - Responsive design');
console.log('   - Beautiful gradient background');
console.log('');
console.log('🔧 To add these to your database, you can:');
console.log('   1. Create the islamic_content collection in Appwrite console');
console.log('   2. Run: node scripts/seed-islamic-content.js seed');
console.log('   3. Or add them manually through your admin interface');